"""Offline tests of tool plumbing only. Fixtures are NOT real vision reviews."""
from __future__ import annotations

import copy
import contextlib
import importlib.util
import io
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
lint_style = load('lint_style', ROOT / 'paper-ppt/scripts/lint_style.py')
diagram = load('diagram', ROOT / 'paper-ppt/scripts/diagram.py')


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
        # --help writes the whole usage block to stdout; swallow it or the test
        # run ends with a wall of argparse text that reads like a failure.
        with contextlib.redirect_stdout(io.StringIO()):
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

    def test_stylekit_markup_works_and_footer_is_not_hardcoded(self):
        """The six style-kit presets draw `[[x]]` as an accent run, like the rest.

        Two things this pins down. The inline markup lives in PptxCanvas.text, so
        every preset gets it — a deck moved from domestic to, say, folio must not
        start printing the brackets literally.

        And a page with no `footLeft` gets no footer. The presets used to fall back
        to 'SPARQ · OSDI 2026', the sample paper's name, so every deck built from
        them wore someone else's title on every page.
        """
        with tempfile.TemporaryDirectory() as td:
            pptx = Path(td) / 'kit.pptx'
            presets = str(ROOT / 'paper-ppt/assets/style-presets.js')
            code = """const pptxgen=require('pptxgenjs');
const {PptxCanvas,loadTokens,drawSlide,writeDeck}=require(process.argv[1]);
(async()=>{
 const deck=new pptxgen();
 const t1=loadTokens('graphite');
 drawSlide(new PptxCanvas(deck.addSlide(),t1),t1,{type:'statement',kicker:'PROBE',
   claim:'只有 [[强调]] 这两个字',claimNote:'note',metrics:[{v:'1',k:'a'}],page:1});
 const t2=loadTokens('folio');
 drawSlide(new PptxCanvas(deck.addSlide(),t2),t2,{type:'claim',kicker:'PROBE',title:'T',
   claim:'只有 [[强调]] 这两个字',claimNote:'note',metrics:[{v:'1',k:'a'}],
   footLeft:'页脚由调用方给',page:2});
 await writeDeck(deck,process.argv[2]);
})().catch(e=>{console.error(e);process.exitCode=1});"""
            result = subprocess.run([self.node, '-e', code, presets, str(pptx)],
                                    capture_output=True, text=True, cwd=str(ROOT / 'paper-ppt'))
            self.assertEqual(result.returncode, 0, result.stderr)
            with zipfile.ZipFile(pptx) as z:
                bare = z.read('ppt/slides/slide1.xml').decode('utf8')
                given = z.read('ppt/slides/slide2.xml').decode('utf8')
            for xml in (bare, given):
                self.assertNotIn('[[', xml, 'brackets printed literally')
                self.assertIn('<a:t>强调</a:t>', xml, 'marked word became its own run')
                self.assertNotIn('SPARQ', xml, 'a sample paper leaked into the preset')
            self.assertIn('C30037', bare, 'graphite accent not applied to the marked run')
            self.assertIn('页脚由调用方给', given, 'a supplied footer was dropped')

    def test_published_templates_match_their_presets(self):
        """`--check` rebuilds every template in a temp dir and diffs the tracked copies.

        The 15 styles/<name>/template.pptx are build artifacts. When a preset moves
        and nobody republishes, the shipped "fill-in base template" quietly describes
        an older design — which is exactly what had happened before this check existed.
        """
        script = str(ROOT / 'paper-ppt/assets/build-templates.js')
        result = subprocess.run([self.node, script, '--check'], capture_output=True,
                                text=True, cwd=str(ROOT / 'paper-ppt'))
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn('templates match the code', result.stdout)

    def test_template_check_sees_colour_and_typeface_drift(self):
        """The digest hashes whole parts, not four fields picked out of a slide.

        Recolouring an accent and swapping a typeface both leave shape name, offset,
        extent and text untouched, so a field-wise digest called those templates
        identical while the published file still showed the old design. Type size was
        only caught by luck: the title box is sized from it. These cases go through
        the CLI so the exit code and the page it names are covered too.
        """
        script = str(ROOT / 'paper-ppt/assets/build-templates.js')
        cwd = str(ROOT / 'paper-ppt')
        with tempfile.TemporaryDirectory() as td:
            built = Path(td) / 'built'
            result = subprocess.run([self.node, script, str(built)], capture_output=True,
                                    text=True, cwd=cwd)
            self.assertEqual(result.returncode, 0, result.stderr)
            check = [self.node, script, '--check', '--against', str(built)]

            clean = subprocess.run(check, capture_output=True, text=True, cwd=cwd)
            self.assertEqual(clean.returncode, 0, clean.stdout + clean.stderr)

            def tamper(page, old, new):
                """Rewrite one slide's XML in place, changing nothing but `old`."""
                path = built / 'international' / 'template.pptx'
                with zipfile.ZipFile(path) as z:
                    parts = {n: z.read(n) for n in z.namelist()}
                name = f'ppt/slides/slide{page}.xml'
                self.assertIn(old, parts[name], f'fixture moved: {old!r} is not on page {page}')
                parts[name] = parts[name].replace(old, new)
                with zipfile.ZipFile(path, 'w', zipfile.ZIP_DEFLATED) as z:
                    for n, data in parts.items():
                        z.writestr(n, data)

            for label, (page, old, new) in {
                'colour': (2, b'C0392B', b'00A651'),
                'typeface': (3, b'typeface="Arial"', b'typeface="Comic Sans MS"'),
            }.items():
                tamper(page, old, new)
                drift = subprocess.run(check, capture_output=True, text=True, cwd=cwd)
                self.assertEqual(drift.returncode, 1, f'{label} drift was not reported')
                self.assertIn(f'page(s) {page} differ', drift.stderr, label)
                self.assertNotIn('drift://n', drift.stderr, 'the drift header is still mangled')
                tamper(page, new, old)  # put it back for the next case
                restored = subprocess.run(check, capture_output=True, text=True, cwd=cwd)
                self.assertEqual(restored.returncode, 0, restored.stderr)

    def test_template_digest_is_stable_across_builds(self):
        """Two builds a second apart must hash the same, or `--check` cries wolf.

        pptxgenjs stamps docProps/core.xml with the second it ran, so a naive
        whole-package hash reports every template as drifted on every run. The
        normaliser blanks that clock; the sleep is what makes this test exercise the
        blanking instead of passing by landing in the same second by accident.
        """
        code = """
const bt = require(process.argv[1]);
const fs = require('node:fs'); const os = require('node:os'); const path = require('node:path');
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'same-'));
(async () => {
  const [a] = await bt.build(path.join(root, 'a'), {writeSvg: false, presets: ['international']});
  await new Promise((r) => setTimeout(r, 1100));
  const [b] = await bt.build(path.join(root, 'b'), {writeSvg: false, presets: ['international']});
  const diff = bt.diffDigests(await bt.packageDigest(a.file), await bt.packageDigest(b.file));
  fs.rmSync(root, {recursive: true, force: true});
  console.log(JSON.stringify(diff));
})().catch((e) => { console.error(e); process.exit(1); });
"""
        script = str(ROOT / 'paper-ppt/assets/build-templates.js')
        result = subprocess.run([self.node, '-e', code, script], capture_output=True, text=True,
                                cwd=str(ROOT / 'paper-ppt'))
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(json.loads(result.stdout), {'pages': [], 'parts': []})

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
            result = subprocess.run([self.node, '-e', code, str(target)], capture_output=True,
                                    text=True, cwd=str(ROOT / 'paper-ppt'))
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
               'dark-tech', 'editorial', 'defense-cn', 'jp-gothic',
               'graphite', 'violet', 'bandgrid', 'folio', 'nocturne', 'mosaic']

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


class StyleLintTests(unittest.TestCase):
    """Heuristics, not pixel truth: assert the rules fire, not the exact line count."""

    @staticmethod
    def shape(runs, x=0.6, y=1.6, w=4.0, h=0.5, size=18, colour='262626', spacing=None, font=None,
              name=None):
        if isinstance(runs, str):
            runs = [(runs, colour)]
        latin = f'<a:latin typeface="{font}"/>' if font else ''
        body = ''.join(
            f'<a:r><a:rPr lang="zh-CN" sz="{size * 100}"><a:solidFill><a:srgbClr val="{c}"/>'
            f'</a:solidFill>{latin}</a:rPr><a:t>{chunk}</a:t></a:r>'
            for chunk, c in runs
        )
        ppr = f'<a:pPr><a:lnSpc><a:spcPct val="{int(spacing * 100000)}"/></a:lnSpc></a:pPr>' if spacing else ''
        nv = (f'<p:nvSpPr><p:cNvPr id="2" name="{name}"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>'
              if name else '')
        return ('<p:sp>%s<p:spPr><a:xfrm><a:off x="%d" y="%d"/><a:ext cx="%d" cy="%d"/></a:xfrm></p:spPr>'
                '<p:txBody><a:bodyPr wrap="square"/><a:p>%s%s</a:p></p:txBody></p:sp>'
                % (nv, x * 914400, y * 914400, w * 914400, h * 914400, ppr, body))

    def deck(self, *shapes, per_slide=None):
        slides = per_slide or [shapes]
        with zipfile.ZipFile(self.target, 'w') as z:
            for index, group in enumerate(slides, 1):
                z.writestr(f'ppt/slides/slide{index}.xml',
                           '<p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" '
                           'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">'
                           '<p:cSld><p:spTree>' + ''.join(group) + '</p:spTree></p:cSld></p:sld>')
        return self.target

    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.target = Path(self.temp.name) / 'deck.pptx'

    def findings(self, report):
        return ' | '.join(report['warnings'] + report['errors'])

    def test_cjk_width_is_wider_than_latin(self):
        self.assertGreater(lint_style.text_width_em('中文中文'), lint_style.text_width_em('abcd'))

    def test_overflowing_box_is_flagged(self):
        path = self.deck(self.shape('这是一段很长的正文' * 12, w=3.0, h=0.6))
        report = lint_style.audit(path, 'domestic')
        self.assertTrue(any('text needs' in w for w in report['warnings'] + report['errors']),
                        self.findings(report))

    def test_roomy_box_is_not_flagged(self):
        path = self.deck(self.shape('短句', w=6.0, h=1.5))
        self.assertFalse(any('text needs' in w for w in lint_style.audit(path, 'domestic')['warnings']))

    def test_line_spacing_counts(self):
        plain = lint_style.estimate(
            ET.fromstring('<p:txBody xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" '
                          'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:p><a:r>'
                          '<a:rPr sz="1800"/><a:t>' + '测试文本' * 12 + '</a:t></a:r></a:p></p:txBody>'),
            3.0, 2.0, 18)
        loose = lint_style.estimate(
            ET.fromstring('<p:txBody xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" '
                          'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:p><a:pPr>'
                          '<a:lnSpc><a:spcPct val="150000"/></a:lnSpc></a:pPr><a:r><a:rPr sz="1800"/>'
                          '<a:t>' + '测试文本' * 12 + '</a:t></a:r></a:p></p:txBody>'),
            3.0, 2.0, 18)
        self.assertGreater(loose['needs_in'], plain['needs_in'])

    def test_line_starting_with_punctuation_is_an_error(self):
        path = self.deck(self.shape('，晚切就多付溢价。', w=6.0, h=1.0))
        report = lint_style.audit(path, 'domestic')
        self.assertTrue(any('行首标点' in e for e in report['errors']), self.findings(report))
        self.assertFalse(report['ok'])

    def test_leading_punctuation_reported_once(self):
        path = self.deck(self.shape('，晚切就多付溢价。', w=6.0, h=1.0))
        report = lint_style.audit(path, 'domestic')
        hits = [e for e in report['errors'] if '行首标点' in e or '手动断行' in e]
        self.assertEqual(len(hits), 1, self.findings(report))

    def test_long_red_run_is_flagged(self):
        path = self.deck(self.shape('保证任何情况下都能看', w=6.0, h=1.0, colour='C00000'))
        self.assertTrue(any('红色连续' in w for w in lint_style.audit(path, 'domestic')['warnings']))

    def test_short_red_run_is_not_flagged(self):
        path = self.deck(self.shape('可控可问责', w=6.0, h=1.0, colour='C00000'))
        self.assertFalse(any('红色连续' in w for w in lint_style.audit(path, 'domestic')['warnings']))

    def test_red_run_split_by_script_boundary_is_merged(self):
        # pptxgenjs emits one run per script change; 4+4 CJK must still count as 8.
        path = self.deck(self.shape([('这是一个很', 'C00000'), ('长的红字', 'C00000')], w=6.0, h=1.0))
        self.assertTrue(any('红色连续' in w for w in lint_style.audit(path, 'domestic')['warnings']))

    def test_two_red_runs_in_one_paragraph_are_counted(self):
        # The old rule counted distinct colours (a set), so it could never exceed 1.
        path = self.deck(self.shape([('攻击', 'C00000'), (' 与 ', '262626'), ('碰撞', 'C00000')], w=6.0, h=1.0))
        report = lint_style.audit(path, 'domestic')
        self.assertTrue(any('2 red runs' in w for w in report['warnings']), self.findings(report))

    def test_duplicate_figure_numbers_are_an_error(self):
        caption = self.shape('图 3 架构', x=0.6, y=5.6, w=6.0, h=0.4, size=12, colour='6B6B6B')
        report = lint_style.audit(self.deck(per_slide=[[caption], [caption]]), 'domestic')
        self.assertTrue(any('repeated' in e for e in report['errors']), self.findings(report))

    def test_body_reference_is_not_a_caption(self):
        body = self.shape('如图 3 所示，缓存命中率随热度变化。', x=0.6, y=2.0, w=6.0, h=1.0)
        report = lint_style.audit(self.deck(per_slide=[[body], [body]]), 'domestic')
        self.assertFalse(any('figure' in f for f in report['warnings'] + report['errors']), self.findings(report))

    def test_english_caption_is_counted(self):
        caption = self.shape('Figure 7  Impact of segment size', x=0.6, y=5.6, w=6.0, h=0.4, size=12,
                             colour='6B6B6B')
        report = lint_style.audit(self.deck(caption), 'domestic')
        self.assertEqual(report['stats']['figures'], [7])

    def test_clean_deck_reports_nothing(self):
        path = self.deck(self.shape('图 1 架构', x=0.6, y=5.6, w=6.0, h=0.4, size=12, colour='6B6B6B'),
                         self.shape('一句话结论。', w=6.0, h=1.0))
        report = lint_style.audit(path, 'domestic')
        self.assertEqual(report['warnings'], [])
        self.assertEqual(report['errors'], [])
        self.assertTrue(report['ok'])

    def test_strict_promotes_soft_warnings(self):
        # One frame, three long bullets: a soft "chars" warning by default,
        # fatal under --strict. Three separate shapes would not be a list frame.
        para = ('<a:p><a:r><a:rPr sz="1800"/><a:t>'
                '这是一条明显超过二十八个字上限的要点，用来触发字数警告的示例。</a:t></a:r></a:p>')
        frame = ('<p:sp><p:spPr><a:xfrm><a:off x="%d" y="%d"/><a:ext cx="%d" cy="%d"/></a:xfrm></p:spPr>'
                 '<p:txBody><a:bodyPr/>%s</p:txBody></p:sp>'
                 % (0.6 * 914400, 2.0 * 914400, 6.0 * 914400, 3.0 * 914400, para * 3))
        path = self.deck(frame)
        self.assertTrue(lint_style.audit(path, 'domestic')['ok'])
        self.assertFalse(lint_style.audit(path, 'domestic', strict=True)['ok'])

    # ---- frames of several paragraphs: list / code / bibliography / state ----

    @staticmethod
    def paragraph(text, size=18, colour='262626', font=None):
        latin = f'<a:latin typeface="{font}"/>' if font else ''
        return (f'<a:p><a:r><a:rPr lang="zh-CN" sz="{size * 100}"><a:solidFill>'
                f'<a:srgbClr val="{colour}"/></a:solidFill>{latin}</a:rPr>'
                f'<a:t>{text}</a:t></a:r></a:p>')

    def frame(self, *paras, x=0.6, y=2.0, w=7.0, h=3.2):
        return ('<p:sp><p:spPr><a:xfrm><a:off x="%d" y="%d"/><a:ext cx="%d" cy="%d"/></a:xfrm>'
                '</p:spPr><p:txBody><a:bodyPr/>%s</p:txBody></p:sp>'
                % (x * 914400, y * 914400, w * 914400, h * 914400, ''.join(paras)))

    def test_code_frame_is_not_a_bullet_list(self):
        # 45-character code lines are normal; counting them made every code slide fail.
        code = [self.paragraph('for (const t of tokens) r = router(t);   // 45 chars', font='Consolas')
                for _ in range(4)]
        report = lint_style.audit(self.deck(self.frame(*code)), 'systems-talk')
        self.assertFalse(any('lines >' in w or 'chars >' in w for w in report['warnings']),
                         self.findings(report))

    def test_bibliography_is_not_a_bullet_list(self):
        bib = [self.paragraph('[%d] B. Author et al. Early exit networks for cheap inference. Venue 2024.' % i)
               for i in (1, 2, 3)]
        report = lint_style.audit(self.deck(self.frame(*bib)), 'jp-gothic')
        self.assertFalse(any('chars >' in w or 'lines >' in w for w in report['warnings']),
                         self.findings(report))

    def test_english_bullet_is_measured_in_lines(self):
        # Width is the thing that matters: the same sentence is one line in a wide
        # frame and three in a narrow one, so a word count cannot express the rule.
        sentence = 'Easy tokens skip the deep path in almost every single case.'
        wide = [self.paragraph(sentence, font='Arial') for _ in range(3)]
        self.assertFalse(any('lines >' in w for w in lint_style.audit(
            self.deck(self.frame(*wide, w=11.0)), 'international')['warnings']))
        narrow = [self.paragraph(sentence, font='Arial') for _ in range(3)]
        report = lint_style.audit(self.deck(self.frame(*narrow, w=3.2)), 'international')
        self.assertTrue(any('lines >' in w for w in report['warnings']), self.findings(report))
        # A short bullet stays legal even in the narrow column.
        short = [self.paragraph('Easy tokens skip depth', font='Arial') for _ in range(3)]
        self.assertFalse(any('lines >' in w for w in lint_style.audit(
            self.deck(self.frame(*short, w=3.2)), 'international')['warnings']))

    def test_chinese_bullet_still_measured_in_characters(self):
        long = [self.paragraph('这是一条明显超过二十八个字上限的要点，用来触发字数警告的示例。')
                for _ in range(3)]
        report = lint_style.audit(self.deck(self.frame(*long)), 'domestic')
        self.assertTrue(any('chars >' in w for w in report['warnings']), self.findings(report))

    def test_declared_nav_label_is_a_state_mark(self):
        # A TOC highlights the current chapter with the accent: 9 CJK of accent is
        # state, not emphasis. The deck says so by naming the shape `nav:...`.
        accent = lint_style.load_tokens('defense-cn')['color']['accent']
        items = ['研究背景与意义', '热点感知的任务放置', '热点感知的数据放置', '总结与展望']
        shapes = [self.shape(text, x=2.9, y=1.55 + i * 0.9, w=9.0, h=0.8, size=22,
                             colour=accent if i == 1 else '6B6B6B', name='nav:toc-item')
                  for i, text in enumerate(items)]
        report = lint_style.audit(self.deck(*shapes), 'defense-cn')
        self.assertFalse(any('红色连续' in w for w in report['warnings']), self.findings(report))

    def test_same_column_without_the_name_is_not_exempt(self):
        # Geometry no longer decides: an evenly spaced column of short labels that
        # was never declared as navigation is body copy, and 9 red CJK is emphasis.
        accent = lint_style.load_tokens('defense-cn')['color']['accent']
        items = ['研究背景与意义', '热点感知的任务放置', '热点感知的数据放置', '总结与展望']
        shapes = [self.shape(text, x=2.9, y=1.55 + i * 0.9, w=9.0, h=0.8, size=22,
                             colour=accent if i == 1 else '6B6B6B')
                  for i, text in enumerate(items)]
        report = lint_style.audit(self.deck(*shapes), 'defense-cn')
        self.assertTrue(any('红色连续' in w for w in report['warnings']), self.findings(report))

    def test_red_label_outside_a_rail_is_still_flagged(self):
        accent = lint_style.load_tokens('defense-cn')['color']['accent']
        report = lint_style.audit(self.deck(self.shape('保证任何情况下都能看', x=2.9, y=1.6, w=9.0, h=0.8,
                                                      size=22, colour=accent)), 'defense-cn')
        self.assertTrue(any('红色连续' in w for w in report['warnings']), self.findings(report))

    def test_accent_phrase_inside_a_sentence_is_still_flagged(self):
        # Same colour, but inside a body sentence rather than a label list: emphasis.
        accent = lint_style.load_tokens('defense-cn')['color']['accent']
        mixed = [self.paragraph('这一节讨论的是延迟与精度之间那个不太好说的取舍，'), self.paragraph('本章讨论')]
        mixed.append('<a:p><a:r><a:rPr lang="zh-CN" sz="1800"><a:solidFill>'
                     f'<a:srgbClr val="{accent}"/></a:solidFill></a:rPr>'
                     '<a:t>保证任何情况下都能看</a:t></a:r></a:p>')
        report = lint_style.audit(self.deck(self.frame(*mixed)), 'defense-cn')
        self.assertTrue(any('红色连续' in w for w in report['warnings']), self.findings(report))


class DiagramTrimTests(unittest.TestCase):
    """trim_margins must crop the dead band whether or not alpha is in play."""

    def setUp(self):
        try:
            from PIL import Image          # noqa: F401
        except ImportError:
            raise unittest.SkipTest('Pillow is required for diagram.py trims')
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.dir = Path(self.temp.name)

    def _draw(self, path: Path, mode: str, background):
        from PIL import Image, ImageDraw
        im = Image.new(mode, (400, 300), background)
        ImageDraw.Draw(im).rectangle([20, 20, 120, 80], fill=(20, 40, 90) + ((255,) if mode == 'RGBA' else ()))
        im.save(path)
        return path

    def test_opaque_rgba_is_trimmed(self):
        # --transparent on a solid page yields RGBA with alpha 255 everywhere;
        # the alpha bbox is the whole canvas, so this used to report "already tight".
        path = self._draw(self.dir / 'opaque.png', 'RGBA', (255, 255, 255, 255))
        report = diagram.trim_margins(path, 0, transparent=True)
        self.assertTrue(report['applied'], report)
        self.assertLess(report['to'][1], 300)

    def test_transparent_background_is_trimmed_by_alpha(self):
        path = self._draw(self.dir / 'alpha.png', 'RGBA', (255, 255, 255, 0))
        report = diagram.trim_margins(path, 0, transparent=True)
        self.assertTrue(report['applied'], report)
        self.assertEqual(report['to'], [101, 61])   # PIL rectangles include both corners

    def test_blank_image_reports_nothing_drawn(self):
        from PIL import Image
        path = self.dir / 'blank.png'
        Image.new('RGB', (200, 200), (255, 255, 255)).save(path)
        self.assertEqual(diagram.trim_margins(path, 0, transparent=False)['reason'], 'nothing drawn')


class PdfSnapPathTests(unittest.TestCase):
    def test_missing_pdf_raises_value_error(self):
        # pymupdf's FileNotFoundError subclasses RuntimeError, not OSError: the
        # old generic handler never caught it and printed a traceback.
        with self.assertRaises(ValueError):
            pdf_snap.require_pdf(Path('does-not-exist.pdf'))

    def test_existing_pdf_passes_through(self):
        with tempfile.TemporaryDirectory() as tmp:
            pdf = Path(tmp) / 'a.pdf'
            pdf.write_bytes(b'%PDF-1.4\n')
            self.assertEqual(pdf_snap.require_pdf(pdf), pdf)

    def test_cli_reports_one_line_and_exits_2(self):
        with tempfile.TemporaryDirectory() as tmp:
            err = io.StringIO()
            with contextlib.redirect_stderr(err):
                code = pdf_snap.main(['pages', str(Path(tmp) / 'nope.pdf'), '--out', str(Path(tmp) / 'o')])
            self.assertEqual(code, 2)
            self.assertIn('PDF not found', err.getvalue())
            self.assertNotIn('Traceback', err.getvalue())


class InternationalTitleBoxTests(unittest.TestCase):
    """The title box must be measured, and the subtitle must follow its bottom."""

    NODE = r"""
const PptxGenJS = require('pptxgenjs');
const S = require(process.argv[1]);
const t = S.loadTokens('international');
const deck = new PptxGenJS();
deck.layout = t.slide.layout;
const specs = [
  {title: 'At equal compute ExampleNet is four point four points better', tag: '[Author+, Venue 2026]',
   subtitle: 'Q2 · Method'},
  {title: 'Short title', subtitle: 'Q1 · Intro'},
];
for (const spec of specs) {
  const canvas = new S.PptxCanvas(deck.addSlide(), t);
  S.PRESETS.international.title(canvas, t, spec);
}
S.writeDeck(deck, process.argv[2]).then(() => console.log('ok'));
"""

    @classmethod
    def setUpClass(cls):
        cls.node = shutil.which('node')
        if not cls.node:
            raise unittest.SkipTest('node is required for the JS presets')
        probe = subprocess.run([cls.node, '-e', 'require("pptxgenjs")'],
                               cwd=ROOT / 'paper-ppt', capture_output=True)
        if probe.returncode:
            raise unittest.SkipTest('install paper-ppt dependencies first')

    def boxes(self, path: Path):
        """[(text, x, y, w, h)] for every text shape, in inches."""
        out = []
        with zipfile.ZipFile(path) as z:
            for name in sorted(n for n in z.namelist() if n.startswith('ppt/slides/slide')):
                root = ET.fromstring(z.read(name))
                for sp in root.iter('{http://schemas.openxmlformats.org/presentationml/2006/main}sp'):
                    tx = sp.find('{http://schemas.openxmlformats.org/presentationml/2006/main}txBody')
                    if tx is None:
                        continue
                    text = ''.join(t.text or '' for t in tx.iter(
                        '{http://schemas.openxmlformats.org/drawingml/2006/main}t'))
                    off = sp.find('.//{http://schemas.openxmlformats.org/drawingml/2006/main}off')
                    ext = sp.find('.//{http://schemas.openxmlformats.org/drawingml/2006/main}ext')
                    out.append((text, int(off.get('x')) / 914400, int(off.get('y')) / 914400,
                                int(ext.get('cx')) / 914400, int(ext.get('cy')) / 914400))
        return out

    def build(self):
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        deck = Path(tmp.name) / 'title.pptx'
        subprocess.run([self.node, '-e', self.NODE, str(ROOT / 'paper-ppt/assets/style-presets.js'), str(deck)],
                       cwd=ROOT / 'paper-ppt', check=True, capture_output=True)
        return self.boxes(deck)

    def test_long_title_grows_the_box(self):
        shapes = self.build()
        long_title = next(s for s in shapes if s[0].startswith('At equal compute'))
        short_title = next(s for s in shapes if s[0] == 'Short title')
        self.assertGreater(long_title[4], 0.75)       # grew past the nominal height
        self.assertAlmostEqual(short_title[4], 0.75, places=3)  # short titles untouched
        # Symmetric growth: the optical centre stays where the preset put it.
        self.assertAlmostEqual(long_title[2] + long_title[4] / 2, 0.38 + 0.75 / 2, places=3)

    def test_subtitle_sits_below_the_grown_box(self):
        shapes = self.build()
        long_title = next(s for s in shapes if s[0].startswith('At equal compute'))
        subtitles = [s for s in shapes if s[0] in ('Q2 · Method', 'Q1 · Intro')]
        self.assertEqual(len(subtitles), 2)
        for sub in subtitles:
            title = long_title if sub[0] == 'Q2 · Method' else next(
                s for s in shapes if s[0] == 'Short title')
            self.assertGreaterEqual(sub[2] + 0.01, title[2] + title[4],
                                    'subtitle overlaps the title box: %r' % (shapes,))
