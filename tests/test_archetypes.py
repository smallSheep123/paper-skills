"""Build-time tests for the composite domestic archetypes.

These only check that each archetype produces a file with the expected text and
no exception — they say nothing about whether the page looks good. The point is
that "9 presets still build" never exercised these code paths at all.
"""
from __future__ import annotations

import shutil
import subprocess
import sys
import tempfile
import unittest
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

SCRIPT = r"""
const path = require('node:path');
const pptxgen = require('pptxgenjs');
const {loadTokens, PptxCanvas, drawSlide, writeDeck} = require(process.argv[1]);
const t = loadTokens('domestic');
const deck = new pptxgen();
deck.layout = t.slide.layout;
const fig = process.argv[2];
const specs = [
  {type: 'compare3', title: '对比页', figure: fig,
   items: [{body: '第一栏 [[红词]]'}, {body: '第二栏'}, {body: '第三栏'}], note: '收束句 [[红词]]'},
  {type: 'twoFigures', title: '双图页', items: [{file: fig, caption: '图 1 左'}, {file: fig, caption: '图 2 右'}], lead: '一句结论'},
  {type: 'metricGrid', title: '矩阵页', cells: [
    {figure: fig, caption: '图 3', head: '甲', body: '两句口径'},
    {figure: fig, caption: '图 4', head: '乙', body: '两句口径'},
    {figure: fig, caption: '图 5', head: '丙', body: '两句口径'},
    {figure: fig, caption: '图 6', head: '丁', body: '两句口径'}]},
  {type: 'formulaTable', title: '公式页', formula: 'C = A + B', formulaNote: '一句话解释',
   rows: [['边缘', '$1', '80%'], ['CDN', '$2', '20%']], total: '合计', bigNumber: '-35%', bigLabel: '降幅'},
  {type: 'section', number: '01', title: '章节页', subtitle: '一句核心问题', keys: ['甲', '乙', '丙']},
  {type: 'summary', title: '总结', conclusions: ['结论一'], limits: ['边界一'], takeaway: '收束', closing: '请指正'},
];
for (const spec of specs) {
  const slide = deck.addSlide();
  drawSlide(new PptxCanvas(slide, t), t, {...spec, page: deck.slides.length, footer: 'F'});
}
writeDeck(deck, process.argv[3]).then((r) => console.log(JSON.stringify(r)));
"""


class ArchetypeTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.node = shutil.which('node')
        if not cls.node:
            raise unittest.SkipTest('node is required for the JS archetypes')
        probe = subprocess.run([cls.node, '-e', 'require("pptxgenjs")'],
                               cwd=ROOT / 'paper-ppt', capture_output=True)
        if probe.returncode:
            raise unittest.SkipTest('install paper-ppt dependencies first')

    def test_composite_archetypes_build(self):
        from PIL import Image
        temp = tempfile.TemporaryDirectory()
        self.addCleanup(temp.cleanup)
        work = Path(temp.name)
        figure = work / 'figure.png'
        Image.new('RGB', (800, 450), '#DCE6F1').save(figure)
        deck = work / 'gallery.pptx'
        result = subprocess.run(
            [self.node, '-e', SCRIPT, str(ROOT / 'paper-ppt/assets/style-presets.js'), str(figure), str(deck)],
            capture_output=True, text=True, cwd=str(ROOT / 'paper-ppt'))
        self.assertEqual(result.returncode, 0, result.stderr[-1500:])

        with zipfile.ZipFile(deck) as z:
            slides = sorted(n for n in z.namelist() if n.startswith('ppt/slides/slide'))
            self.assertEqual(len(slides), 6)
            text = ''.join(z.read(n).decode('utf-8') for n in slides)
        for expected in ('收束句', '一句结论', '两句口径', 'C = A + B', '本节', '请指正'):
            self.assertIn(expected, text)
        # [[红词]] must become a real accent run, not literal brackets
        self.assertIn('C00000', text)
        self.assertNotIn('[[', text)


if __name__ == '__main__':
    unittest.main()
