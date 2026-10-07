"""Offline tests of tool plumbing only. Fixtures are NOT real vision reviews."""
from __future__ import annotations

import copy
import importlib.util
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch
import zipfile

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'paper-ppt/scripts'))
import bridge
import check_review


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
                self.assertTrue(any(n.startswith('ppt/notesSlides/notesSlide') for n in z.namelist()))


if __name__ == '__main__':
    unittest.main()
