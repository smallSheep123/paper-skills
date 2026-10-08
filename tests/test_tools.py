"""Offline tests of tool plumbing only. Fixtures are NOT real vision reviews."""
from __future__ import annotations

import copy
import importlib.util
import json
import os
import shutil
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch
import zipfile
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'paper-ppt/scripts'))
import bridge
import check_review
import check_deck
import restore_chart_zeros
import math_assets


def load(name: str, path: Path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


fix = load('fix_pPr', ROOT / 'paper-ppt/assets/fix_pPr.py')
mineru_models = load('mineru_models', ROOT / 'paper-extract/scripts/mineru_models.py')
mineru_extract = load('mineru_extract', ROOT / 'paper-extract/scripts/mineru_extract.py')
pdf_snap = load('pdf_snap', ROOT / 'paper-extract/scripts/pdf_snap.py')


class ReviewTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.base = Path(self.temp.name)
        for name in ('deck.pptx', 'page.png', 'overview.png', 'source.png'):
            (self.base / name).write_bytes(('fixture:' + name).encode())
        def entry(name):
            return {'path': name, 'sha256': bridge.digest(self.base / name)}
        self.manifest = {'input': entry('deck.pptx'), 'pages': [entry('page.png')],
                         'overview': entry('overview.png')}
        self.reviews = []
        for stage in ('source', 'design', 'pilot', 'slides', 'deck'):
            name = 'overview.png' if stage == 'deck' else 'page.png' if stage == 'slides' else 'source.png'
            self.reviews.append({'stage': stage, 'reviewer': 'TEST FIXTURE, not a model',
                                 'call_ref': 'TEST ONLY', 'inputs': [entry(name)],
                                 'observation': 'Synthetic record for unit testing only',
                                 'decision': 'pass', 'issues': []})

    def check(self):
        mf, log = self.base / 'render.json', self.base / 'review-log.json'
        mf.write_text(json.dumps(self.manifest), encoding='utf-8')
        log.write_text(json.dumps({'reviews': self.reviews}), encoding='utf-8')
        return check_review.check(mf, log)

    def test_complete_records(self):
        self.assertEqual(self.check(), [])

    def test_empty_log_fails(self):
        self.reviews.clear()
        self.assertTrue(self.check())

    def test_missing_source_stage(self):
        self.reviews.pop(0)
        self.assertTrue(any('source' in e for e in self.check()))

    def test_missing_visual_call_reference(self):
        self.reviews[0]['call_ref'] = ''
        self.assertTrue(any('call_ref' in e for e in self.check()))

    def test_current_page_must_be_reviewed(self):
        self.reviews = [r for r in self.reviews if r['stage'] != 'slides']
        self.assertTrue(any('Current page' in e for e in self.check()))

    def test_changed_deck_fails(self):
        (self.base / 'deck.pptx').write_bytes(b'new version')
        self.assertTrue(self.check())

    def test_changed_page_fails(self):
        (self.base / 'page.png').write_bytes(b'new pixels')
        self.assertTrue(self.check())

    def test_new_page_hash_does_not_reuse_old_pass(self):
        (self.base / 'new.png').write_bytes(b'new pixels')
        self.manifest['pages'] = [{'path': 'new.png', 'sha256': bridge.digest(self.base / 'new.png')}]
        self.assertTrue(any('Current page' in e for e in self.check()))

    def test_final_overview_required(self):
        self.reviews[-1]['inputs'] = copy.deepcopy(self.manifest['pages'])
        self.assertTrue(any('overview' in e for e in self.check()))

    def test_cannot_pass_open_issues(self):
        self.reviews[3]['issues'] = ['Unreadable legend']
        self.assertTrue(self.check())

    def test_later_rejection_invalidates_pass(self):
        record = copy.deepcopy(self.reviews[3])
        record['decision'] = 'revise'
        record['issues'] = ['Missing label']
        self.reviews.append(record)
        self.assertTrue(self.check())

    def test_revision_can_be_resolved(self):
        record = copy.deepcopy(self.reviews[3])
        record['decision'] = 'revise'
        record['issues'] = ['Missing label']
        self.reviews.insert(3, record)
        self.assertEqual(self.check(), [])

    def test_duplicate_pages_fail(self):
        self.manifest['pages'] *= 2
        self.assertTrue(self.check())

    def test_malformed_manifest_fails(self):
        self.manifest = []
        self.assertTrue(self.check())


class RepairTests(unittest.TestCase):
    def xml(self, inner: bytes) -> bytes:
        return b'<root xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:p>' + inner + b'</a:p></root>'

    def test_identical_properties_removed(self):
        data = self.xml(b'<a:pPr marL="0"/><a:pPr marL="0"/><a:r><a:t>Text</a:t></a:r>')
        fixed, count = fix.repair_xml(data)
        self.assertEqual(count, 1)
        self.assertEqual(fixed.count(b'<a:pPr'), 1)
        self.assertIn(b'<a:t>Text</a:t>', fixed)
        self.assertIn(b'xmlns:a=', fixed)

    def test_paired_properties(self):
        data = self.xml(b'<a:pPr><a:buNone/></a:pPr><a:pPr><a:buNone/></a:pPr>')
        fixed, count = fix.repair_xml(data)
        self.assertEqual(count, 1)
        self.assertEqual(fixed.count(b'<a:buNone'), 1)

    def test_idempotent(self):
        data = self.xml(b'<a:pPr/><a:pPr/>')
        first, _ = fix.repair_xml(data)
        self.assertEqual(fix.repair_xml(first), (first, 0))

    def test_conflict_is_not_guessed(self):
        with self.assertRaises(ValueError):
            fix.repair_xml(self.xml(b'<a:pPr marL="0"/><a:pPr marL="10"/>'))

    def test_unaffected_xml_byte_identical(self):
        data = self.xml(b'<a:pPr/><a:r><a:t>Text</a:t></a:r>')
        self.assertEqual(fix.repair_xml(data), (data, 0))

    def test_preserve_original_and_zip_assets(self):
        with tempfile.TemporaryDirectory() as td:
            source, out = Path(td) / 'in.pptx', Path(td) / 'out.pptx'
            with zipfile.ZipFile(source, 'w') as z:
                z.writestr('ppt/slides/slide1.xml', self.xml(b'<a:pPr/><a:pPr/>'))
                z.writestr('ppt/media/image1.png', b'original image')
            original = source.read_bytes()
            self.assertEqual(fix.repair(source, out), 1)
            self.assertEqual(source.read_bytes(), original)
            with zipfile.ZipFile(out) as z:
                self.assertEqual(z.read('ppt/media/image1.png'), b'original image')
            with self.assertRaises(ValueError):
                fix.repair(source, source)
            with self.assertRaises(ValueError):
                fix.repair(source, out)

    def test_failed_repair_leaves_no_output(self):
        with tempfile.TemporaryDirectory() as td:
            source, out = Path(td) / 'in.pptx', Path(td) / 'out.pptx'
            with zipfile.ZipFile(source, 'w') as z:
                z.writestr('ppt/slides/slide1.xml', self.xml(b'<a:pPr marL="0"/><a:pPr marL="1"/>'))
            with self.assertRaises(ValueError):
                fix.repair(source, out)
            self.assertFalse(out.exists())
            self.assertEqual(list(Path(td).glob('*.pptx')), [source])


class BridgeTests(unittest.TestCase):
    def test_missing_input(self):
        with tempfile.TemporaryDirectory() as td, self.assertRaises(ValueError):
            bridge.render(Path(td) / 'absent.pptx', Path(td) / 'out')

    def test_existing_revision_rejected(self):
        with tempfile.TemporaryDirectory() as td:
            source = Path(td) / 'input.pdf'
            source.write_bytes(b'test')
            with self.assertRaises(ValueError):
                bridge.render(source, Path(td))

    def test_missing_renderer_fails(self):
        with tempfile.TemporaryDirectory() as td:
            source = Path(td) / 'input.pdf'
            source.write_bytes(b'test')
            with patch.object(bridge, 'executable', return_value=None), self.assertRaises(RuntimeError):
                bridge.render(source, Path(td) / 'out')
            self.assertFalse((Path(td) / 'out').exists())

    def test_subprocess_failure(self):
        with self.assertRaises(RuntimeError):
            bridge.run_tool([sys.executable, '-c', 'import sys;sys.exit(3)'], 5)

    def test_paths_with_spaces_are_not_shell_commands(self):
        bridge.run_tool([sys.executable, '-c', 'import sys;assert sys.argv[1]=="a b; c"', 'a b; c'], 5)

    def test_no_implicit_visual_readiness(self):
        self.assertIn('NOT_CHECKED', bridge.doctor()['visual_model'])

    def test_pdf_bridge_with_mocked_renderer(self):
        from PIL import Image
        with tempfile.TemporaryDirectory() as td:
            source, out = Path(td) / 'input with spaces.pdf', Path(td) / 'r01'
            source.write_bytes(b'fixture pdf')
            def fake_run(args, timeout):
                Image.new('RGB', (320, 180)).save(out / 'slide-1.png')
            with patch.object(bridge, 'executable', return_value='/fake/pdftoppm'), patch.object(bridge, 'run_tool', side_effect=fake_run):
                manifest = bridge.render(source, out)
            self.assertEqual(manifest['visual_review'], 'pending')
            self.assertEqual(len(manifest['pages']), 1)
            self.assertTrue((out / 'contact-sheet.png').exists())
            self.assertEqual(manifest['input']['sha256'], bridge.digest(source))


class ExtractionTests(unittest.TestCase):
    def test_model_download_command(self):
        cmd = mineru_models.build_download(
            "mineru-kit", "standard", "modelscope", None, None
        )
        self.assertEqual(
            cmd,
            ["mineru-kit", "models", "download", "--tier", "standard",
             "--source", "modelscope"],
        )

    def test_model_verify_command(self):
        cmd = mineru_models.build_verify(
            "mineru-kit", "standard", "onnx", "llama-cpp"
        )
        self.assertEqual(
            cmd,
            ["mineru-kit", "models", "verify", "--tier", "standard",
             "--small-backend", "onnx", "--vlm-engine", "llama-cpp"],
        )

    def test_extract_command_is_stateless(self):
        cmd = mineru_extract.build_command(
            "mineru-kit",
            Path("/tmp/paper.pdf"),
            Path("/tmp/out/paper.md"),
            "standard",
            "all",
            "ocr",
        )
        self.assertEqual(cmd[:2], ["mineru-kit", "parse"])
        self.assertIn("--tier", cmd)
        self.assertNotIn("mineru", cmd[:1])
        self.assertNotIn("server", cmd)

    def test_extract_help_without_mineru_installed(self):
        result = subprocess.run(
            [sys.executable,
             str(ROOT / "paper-extract/scripts/mineru_extract.py"),
             "--help"],
            capture_output=True,
        )
        self.assertEqual(result.returncode, 0)

    def test_models_help_without_mineru_installed(self):
        result = subprocess.run(
            [sys.executable,
             str(ROOT / "paper-extract/scripts/mineru_models.py"),
             "--help"],
            capture_output=True,
        )
        self.assertEqual(result.returncode, 0)



class NativeSourceTests(unittest.TestCase):
    def test_page_ranges(self):
        self.assertEqual(pdf_snap.parse_pages('1-3,5,3', 8), [1, 2, 3, 5])
        self.assertEqual(pdf_snap.parse_pages(None, 3), [1, 2, 3])
        self.assertEqual(pdf_snap.parse_pages('7-', 9), [7, 8, 9])
        with self.assertRaises(ValueError):
            pdf_snap.parse_pages('0-2', 5)

    def test_box_is_page_fraction(self):
        self.assertEqual(pdf_snap.parse_box('0.1,0.2,0.5,0.6'), (0.1, 0.2, 0.5, 0.6))
        for bad in ('0.5,0.2,0.1,0.6', '0,0,1.2,1', '0.1,0.2,0.3'):
            with self.assertRaises(ValueError):
                pdf_snap.parse_box(bad)

    def test_captions_split_layout_columns(self):
        page = ('Figure 4: Duration of hotspots.        Figure 5: Hotspots by rack type.\n'
                'As Figure 4 shows, most hotspots last hours.\n'
                'Table 1: Load-tolerance of benchmarks.\n')
        items = pdf_snap.find_captions([page, '图 2：系统结构\nFigure 4: duplicate'])
        self.assertEqual([(i['kind'], i['id'], i['page']) for i in items],
                         [('Figure', '2', 2), ('Figure', '4', 1), ('Figure', '5', 1), ('Table', '1', 1)])

    def test_in_text_mentions_are_not_captions(self):
        self.assertEqual(pdf_snap.find_captions(['Figure 12a shows p95 latency.\nFig. 3 depicts it.']), [])

    def test_help_without_tools(self):
        with self.assertRaises(SystemExit) as ctx:
            pdf_snap.main(['--help'])
        self.assertEqual(ctx.exception.code, 0)


class JavaScriptTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        import shutil
        cls.node = shutil.which('node')
        if not cls.node:
            raise unittest.SkipTest('Node is optional for Python-only tests')
        probe = subprocess.run([cls.node, '-e', 'require("pptxgenjs")'],
                               cwd=ROOT / 'paper-ppt', capture_output=True)
        if probe.returncode:
            raise unittest.SkipTest('Install paper-ppt/package.json dependencies to test drawing helpers')

    def test_helpers_have_no_generation_side_effects(self):
        helper = str(ROOT / 'paper-ppt/assets/ppt-helpers.js')
        code = "const h=require(process.argv[1]); const p=h.createDeck(); if(p.slides.length!==0)throw Error('side effect'); let rejected=false;try{h.addNotes(p.addSlide(),'')}catch(e){rejected=true}if(!rejected)throw Error('empty notes accepted')"
        result = subprocess.run([self.node, '-e', code, helper], capture_output=True, text=True)
        self.assertEqual(result.returncode, 0, result.stderr)

    def test_image_contain_api_and_notes(self):
        from PIL import Image
        with tempfile.TemporaryDirectory() as td:
            image, pptx = Path(td) / 'image with spaces.png', Path(td) / 'out.pptx'
            Image.new('RGB', (400, 200)).save(image)
            helper = str(ROOT / 'paper-ppt/assets/ppt-helpers.js')
            code = "const h=require(process.argv[1]);const p=h.createDeck();const s=p.addSlide();h.containImage(p,s,process.argv[2],{x:1,y:1,w:4,h:4},'fixture');h.addNotes(s,'Fixture only');p.writeFile({fileName:process.argv[3]}).catch(e=>{console.error(e);process.exitCode=1})"
            result = subprocess.run([self.node, '-e', code, helper, str(image), str(pptx)], capture_output=True, text=True)
            self.assertEqual(result.returncode, 0, result.stderr)
            with zipfile.ZipFile(pptx) as z:
                xml = z.read('ppt/slides/slide1.xml')
                self.assertIn(b'<p:pic>', xml)
                ns = {'a': 'http://schemas.openxmlformats.org/drawingml/2006/main',
                      'p': 'http://schemas.openxmlformats.org/presentationml/2006/main'}
                picture = ET.fromstring(xml).find('.//p:pic', ns)
                extent = picture.find('.//a:xfrm/a:ext', ns)
                offset = picture.find('.//a:xfrm/a:off', ns)
                # A landscape source in a square box remains 2:1 and centered.
                self.assertEqual(int(extent.get('cx')), 4 * 914400)
                self.assertEqual(int(extent.get('cy')), 2 * 914400)
                self.assertEqual(int(offset.get('cy') or offset.get('y')), 2 * 914400)
                self.assertTrue(any(n.startswith('ppt/notesSlides/notesSlide') for n in z.namelist()))
            self.assertEqual(check_deck.audit(pptx)['errors'], [])
            stretched = Path(td) / 'stretched.pptx'
            with zipfile.ZipFile(pptx) as src, zipfile.ZipFile(stretched, 'w') as out:
                for item in src.infolist():
                    content = src.read(item.filename)
                    if item.filename == 'ppt/slides/slide1.xml':
                        content = content.replace(b'cx="3657600"', b'cx="5486400"')
                    out.writestr(item, content)
            self.assertTrue(any('aspect ratio changed' in e for e in check_deck.audit(stretched)['errors']))

    def test_decorative_bleed_warns_but_off_canvas_text_fails(self):
        with tempfile.TemporaryDirectory() as td:
            target = Path(td) / 'bleed.pptx'
            code = """const pptxgen=require('pptxgenjs');const p=new pptxgen();
const s=p.addSlide();s.addShape(p.ShapeType.rect,{x:-0.1,y:0,w:1,h:1});
s.addText('Clipped text',{x:-0.1,y:2,w:1,h:1});s.addNotes('Boundary fixture');
p.writeFile({fileName:process.argv[1]}).catch(e=>{console.error(e);process.exitCode=1});"""
            result = subprocess.run([self.node, '-e', code, str(target)], capture_output=True, text=True)
            self.assertEqual(result.returncode, 0, result.stderr)
            report = check_deck.audit(target)
            self.assertEqual(len(report['warnings']), 1, report)
            self.assertIn('intentional bleed', report['warnings'][0])
            self.assertEqual(len(report['errors']), 1, report)
            self.assertIn('outside slide bounds', report['errors'][0])

    def test_preset_preserves_portrait_image_and_script_fonts(self):
        from PIL import Image
        with tempfile.TemporaryDirectory() as td:
            image, pptx = Path(td) / 'portrait.png', Path(td) / 'out.pptx'
            Image.new('RGB', (200, 400)).save(image)
            preset = str(ROOT / 'paper-ppt/assets/style-presets.js')
            code = """const pptxgen=require('pptxgenjs');
const {PptxCanvas,loadTokens}=require(process.argv[1]);
const deck=new pptxgen();const c=new PptxCanvas(deck.addSlide(),loadTokens('international'));
c.image(process.argv[2],{x:1,y:1,w:4,h:4});
c.text('English 中文 2026',{x:1,y:5,w:8,h:1,size:20,color:'111111'});
deck.writeFile({fileName:process.argv[3]}).catch(e=>{console.error(e);process.exitCode=1});"""
            result = subprocess.run([self.node, '-e', code, preset, str(image), str(pptx)],
                                    capture_output=True, text=True, cwd=str(ROOT / 'paper-ppt'))
            self.assertEqual(result.returncode, 0, result.stderr)
            ns = {'a': 'http://schemas.openxmlformats.org/drawingml/2006/main',
                  'p': 'http://schemas.openxmlformats.org/presentationml/2006/main'}
            with zipfile.ZipFile(pptx) as z:
                root = ET.fromstring(z.read('ppt/slides/slide1.xml'))
                extent = root.find('.//p:pic//a:xfrm/a:ext', ns)
                self.assertEqual(int(extent.get('cx')) / int(extent.get('cy')), 0.5)
                runs = {r.find('a:t', ns).text: r.find('a:rPr/a:latin', ns).get('typeface')
                        for r in root.findall('.//a:r', ns)}
                self.assertEqual(runs['English '], 'Arial')
                self.assertEqual(runs['中文'], 'Microsoft YaHei')
                self.assertEqual(runs[' 2026'], 'Arial')

    def test_audit_rejects_chart_cache_workbook_disagreement(self):
        with tempfile.TemporaryDirectory() as td:
            good, bad = Path(td) / 'good.pptx', Path(td) / 'bad.pptx'
            helper = str(ROOT / 'paper-ppt/assets/ppt-helpers.js')
            code = """const h=require(process.argv[1]);const p=h.createDeck();const s=p.addSlide();
s.addChart(p.ChartType.line,[{name:'Fixture',labels:['A','B'],values:[1,2]}],{x:1,y:1,w:6,h:4});
h.addNotes(s,'Synthetic fixture');p.writeFile({fileName:process.argv[2]});"""
            result = subprocess.run([self.node, '-e', code, helper, str(good)], capture_output=True, text=True)
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertEqual(check_deck.audit(good)['errors'], [])
            with zipfile.ZipFile(good) as src, zipfile.ZipFile(bad, 'w') as out:
                for item in src.infolist():
                    content = src.read(item.filename)
                    if item.filename == 'ppt/charts/chart1.xml':
                        self.assertIn(b'<c:v>2</c:v>', content)
                        content = content.replace(b'<c:v>2</c:v>', b'<c:v>3</c:v>')
                    out.writestr(item, content)
            self.assertTrue(any('cache/workbook mismatch' in e for e in check_deck.audit(bad)['errors']))

    def test_source_verified_zero_restoration_preserves_previous_file(self):
        with tempfile.TemporaryDirectory() as td:
            source, output = Path(td) / 'source.pptx', Path(td) / 'fixed.pptx'
            helper = str(ROOT / 'paper-ppt/assets/ppt-helpers.js')
            code = """const h=require(process.argv[1]);const p=h.createDeck();const s=p.addSlide();
s.addChart(p.ChartType.bar,[{name:'Fixture',labels:['A','B'],values:[1,0]}],{x:1,y:1,w:6,h:4});
h.addNotes(s,'Source verified zeros in this synthetic fixture');p.writeFile({fileName:process.argv[2]});"""
            result = subprocess.run([self.node, '-e', code, helper, str(source)], capture_output=True, text=True)
            self.assertEqual(result.returncode, 0, result.stderr)
            before = source.read_bytes()
            restore_chart_zeros.restore(source, output)
            self.assertEqual(check_deck.audit(output)['errors'], [])
            self.assertEqual(source.read_bytes(), before)
            with self.assertRaises(ValueError):
                restore_chart_zeros.restore(source, output)
            with self.assertRaises(ValueError):
                restore_chart_zeros.restore(source, source)


    def test_all_style_presets_build(self):
        with tempfile.TemporaryDirectory() as td:
            env = dict(os.environ, PATH=str(Path(self.node).parent), PAPER_PPT_PYTHON='intentionally-unavailable-python')
            result = subprocess.run([self.node, str(ROOT / 'paper-ppt/assets/build-style-samples.js'), td], capture_output=True, text=True, env=env)
            self.assertEqual(result.returncode, 0, result.stderr)
            names = sorted(p.name.replace('-sample.pptx', '') for p in Path(td).glob('*-sample.pptx'))
            styles = sorted(p.parent.name for p in (ROOT / 'paper-ppt/styles').glob('*/tokens.json'))
            self.assertEqual(names, styles)
            for name in names:
                self.assertTrue((ROOT / f'paper-ppt/styles/{name}/STYLE.md').exists(), name)
                with zipfile.ZipFile(Path(td) / f'{name}-sample.pptx') as z:
                    self.assertTrue(any(n.startswith('ppt/slides/slide') for n in z.namelist()))

    def test_concept_colour_markup(self):
        code = "const {parseRuns}=require(process.argv[1]);const r=parseRuns('a {{2:S}} [[b]] **c**');if(r[1].sym!==2||r[1].text!=='S'||!r[3].accent||!r[5].bold)throw Error(JSON.stringify(r))"
        result = subprocess.run([self.node, '-e', code, str(ROOT / 'paper-ppt/assets/style-presets.js')], capture_output=True, text=True)
        self.assertEqual(result.returncode, 0, result.stderr)

    def test_style_fonts_background_and_concept_colors_survive_shared_canvas(self):
        with tempfile.TemporaryDirectory() as td:
            output = Path(td) / 'styles.pptx'
            js = """const h=require(process.argv[1]),p=require(process.argv[2]);const d=h.createDeck();
for(const name of ['editorial','theory-beamer','dark-tech','jp-gothic']){
const t=p.loadTokens(name),s=d.addSlide(),c=new p.PptxCanvas(s,t);c.background(t.color.bg);
c.text('Heading',{x:1,y:1,w:10,h:1,size:28,color:t.color.text,heading:true});
c.text('Body {{2:S}}',{x:1,y:2,w:10,h:1,size:20,color:t.color.body});
c.text('Override',{x:1,y:3,w:10,h:1,size:20,color:t.color.body,font:'Georgia'});
h.addNotes(s,'Synthetic cross-style compatibility fixture');}
d.writeFile({fileName:process.argv[3]});"""
            result = subprocess.run([self.node, '-e', js, str(ROOT / 'paper-ppt/assets/ppt-helpers.js'),
                                     str(ROOT / 'paper-ppt/assets/style-presets.js'), str(output)], capture_output=True, text=True)
            self.assertEqual(result.returncode, 0, result.stderr)
            with zipfile.ZipFile(output) as z:
                for index, name in enumerate(['editorial', 'theory-beamer', 'dark-tech', 'jp-gothic'], 1):
                    tokens = json.loads((ROOT / f'paper-ppt/styles/{name}/tokens.json').read_text())
                    xml = z.read(f'ppt/slides/slide{index}.xml').decode()
                    self.assertIn(f'typeface="{tokens["fonts"]["heading"]}"', xml)
                    self.assertIn('typeface="Georgia"', xml)
                    self.assertIn(f'val="{tokens["color"]["bg"]}"', xml)
                    if tokens['color'].get('sym'):
                        self.assertIn(f'val="{tokens["color"]["sym"][1]}"', xml)


class MathTests(unittest.TestCase):
    def test_snippets_reject_document_or_file_commands(self):
        for source in (r'\input{secret}', r'\write18{command}', '$x^2$', r'\begin{document}x'):
            with self.subTest(source=source), self.assertRaises(ValueError):
                math_assets.validate_latex(source)
        math_assets.validate_latex(r'\begin{aligned}a&=b\\c&=d\end{aligned}')

    def test_native_conversion_keeps_fraction_root_and_scripts(self):
        if importlib.util.find_spec('latex2mathml') is None or importlib.util.find_spec('mathml2omml') is None:
            self.skipTest('Optional native math dependencies unavailable')
        native, reason = math_assets.native_math(r'\frac{x_i^2}{\sqrt{1+\beta_i^2}}', 28, '111111')
        self.assertIsNone(reason)
        root = ET.fromstring(native)
        for tag in ('f', 'rad', 'sSubSup', 'sub', 'sup'):
            self.assertIsNotNone(root.find(f'.//m:{tag}', math_assets.NS), tag)
        self.assertFalse(any(e.tag.startswith('{http://schemas.openxmlformats.org/wordprocessingml/') for e in root.iter()))
        self.assertEqual({e.get('sz') for e in root.findall('.//a:rPr', math_assets.NS)}, {'2800'})
        self.assertIn('Cambria Math', native)

    def test_complex_native_requests_are_not_flattened(self):
        native, reason = math_assets.native_math(r'\begin{cases}x,&x>0\\0,&x\leq0\end{cases}', 28, '111111')
        self.assertIsNone(native)
        self.assertTrue(reason)

    def test_math_geometry_rejects_overflow_and_does_not_stretch(self):
        node = shutil.which('node')
        if not node:
            self.skipTest('Node unavailable')
        js = """const m=require(process.argv[1]);const a={id:'fraction',representation:'svg',fontSize:28,widthIn:2,heightIn:1};
const g=m.equationGeometry(a,{x:1,y:2,w:5,h:3});
let rejected=0;for(const b of [{x:0,y:0,w:1,h:2},{x:0,y:0,w:3,h:.2}]){try{m.equationGeometry(a,b);}catch(e){rejected++;}}
console.log(JSON.stringify({g,rejected}));"""
        result = subprocess.run([node, '-e', js, str(ROOT / 'paper-ppt/assets/equations.js')], capture_output=True, text=True)
        self.assertEqual(result.returncode, 0, result.stderr)
        result = json.loads(result.stdout)
        self.assertEqual(result['rejected'], 2)
        self.assertEqual([result['g'][k] for k in ('x', 'y', 'w', 'h')], [2.5, 3, 2, 1])

    def test_math_patch_preserves_unrelated_xml_and_prefix_declarations(self):
        source = (f'<p:sld xmlns:p="{math_assets.NS["p"]}" xmlns:mc="{math_assets.NS["mc"]}" '
                  'xmlns:test="urn:preserved" mc:Ignorable="test">'
                  '<!-- retain comment --><p:cSld><p:spTree><p:sp/>'
                  '<p:pic><p:nvPicPr><p:cNvPr id="42"/></p:nvPicPr></p:pic>'
                  '</p:spTree></p:cSld></p:sld>').encode()
        replaced = math_assets.replace_math_pictures(source, {'42': b'<p:sp/>'})
        expected = source.replace(b'<p:pic><p:nvPicPr><p:cNvPr id="42"/></p:nvPicPr></p:pic>', b'<p:sp/>')
        self.assertEqual(replaced, expected)

    def test_exported_math_has_source_vector_and_native_fallback(self):
        node = shutil.which('node')
        if (not node or not shutil.which('pdflatex')
                or any(importlib.util.find_spec(name) is None for name in ('latex2mathml', 'mathml2omml', 'pymupdf'))):
            self.skipTest('Optional math dependencies unavailable')
        from PIL import Image
        # A real TeX render and actual PPTX export; no mock output.
        with tempfile.TemporaryDirectory() as td:
            td = Path(td)
            request, manifest = td / 'request.json', td / 'math.json'
            source = r'y_i=\frac{x_i^2}{\sqrt{1+\beta_i^2}}'
            request.write_text(json.dumps([{'id': 'response', 'latex': source, 'fontSize': 12, 'mode': 'native'}]), encoding='utf-8')
            assets = math_assets.prepare(request, manifest)
            asset = assets['response']
            with Image.open(asset['png']) as im:
                self.assertEqual(im.mode, 'RGBA')
                self.assertLess(abs(im.width / im.height / (asset['widthIn'] / asset['heightIn']) - 1), .01)
            self.assertIn('<path', Path(asset['svg']).read_text(encoding='utf-8'))
            raw, final = td / 'raw.pptx', td / 'final.pptx'
            js = """const h=require(process.argv[1]);const d=h.createDeck();const s=d.addSlide();
h.addEquation(s,h.loadEquations(process.argv[2]).response,{x:1,y:2,w:11,h:2});
h.addNotes(s,'Synthetic mathematical fixture');d.writeFile({fileName:process.argv[3]});"""
            result = subprocess.run([node, '-e', js, str(ROOT / 'paper-ppt/assets/ppt-helpers.js'), str(manifest), str(raw)], capture_output=True, text=True)
            self.assertEqual(result.returncode, 0, result.stderr)
            previous = raw.read_bytes()
            self.assertEqual(math_assets.finalize(raw, manifest, final), {'native': 1, 'svg': 0})
            self.assertEqual(raw.read_bytes(), previous)
            audit = check_deck.audit(final)
            self.assertEqual(audit['errors'], [])
            self.assertEqual(audit['native_equations'], 1)
            self.assertEqual(audit['math_sources'], 1)
            with zipfile.ZipFile(final) as z:
                root = ET.fromstring(z.read('ppt/slides/slide1.xml'))
                choice = root.find('.//mc:Choice', math_assets.NS)
                self.assertEqual(choice.get('Requires'), 'a14')
                self.assertIsNotNone(choice.find('.//m:f', math_assets.NS))
                fallback = root.find('.//mc:Fallback/p:sp', math_assets.NS)
                self.assertIsNotNone(fallback.find('.//asvg:svgBlip', math_assets.NS))
                descr = fallback.find('.//p:cNvPr', math_assets.NS).get('descr')
                self.assertEqual(json.loads(descr[len(math_assets.MARKER):])['latex'], source)
                self.assertTrue(z.read('[Content_Types].xml').startswith(b"<?xml"))
                self.assertNotIn(b'<ns0:Types', z.read('[Content_Types].xml'))
            with self.assertRaises(ValueError):
                math_assets.finalize(raw, manifest, final)
            with self.assertRaises(ValueError):
                math_assets.finalize(raw, manifest, raw)
            # A changed asset must not be silently embedded under stale metadata.
            Path(asset['svg']).write_text('<svg/>', encoding='utf-8')
            with self.assertRaises(ValueError):
                math_assets.finalize(raw, manifest, td / 'stale.pptx')



if __name__ == '__main__':
    unittest.main()


class TemplatesAndFontsTest(unittest.TestCase):
    PRESETS = ['international', 'domestic', 'keynote-minimal', 'systems-talk', 'theory-beamer',
               'dark-tech', 'editorial', 'defense-cn', 'jp-gothic']

    def test_every_preset_has_template_and_font_section(self):
        root = Path(__file__).resolve().parent.parent / 'paper-ppt' / 'styles'
        for p in self.PRESETS:
            self.assertTrue((root / p / 'template.pptx').stat().st_size > 10000, p)
            self.assertTrue((root / p / 'template-preview' / 'overview.png').exists(), p)
            self.assertIn('## 字体与基础模板', (root / p / 'STYLE.md').read_text(encoding='utf-8'), p)

    def test_check_fonts_json(self):
        import json as _json
        import subprocess as _sp
        import sys as _sys
        script = Path(__file__).resolve().parent.parent / 'paper-ppt' / 'scripts' / 'check_fonts.py'
        out = _sp.run([_sys.executable, str(script), '--json', 'domestic'], capture_output=True, text=True).stdout
        rep = _json.loads(out)[0]
        self.assertEqual(rep['preset'], 'domestic')
        self.assertIn('cjk', rep['roles'])
        self.assertEqual(rep['roles']['cjk']['wanted'], 'Microsoft YaHei')

    def test_skill_requires_intake_before_slides(self):
        skill = (Path(__file__).resolve().parent.parent / 'paper-ppt' / 'SKILL.md').read_text(encoding='utf-8')
        for key in ('开工前访谈', 'G1', 'G2', 'G3', 'intake.md', 'page-content-guide.md', 'fonts.md'):
            self.assertIn(key, skill)
