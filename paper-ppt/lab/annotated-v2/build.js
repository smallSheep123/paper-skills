const fs = require('node:fs'); const path = require('node:path');
const {Both} = require('./canvas');
const pptxgen = require(path.join(__dirname, '..', '..', 'node_modules', 'pptxgenjs'));
const styles = [...require('./styles-a'), ...require('./styles-b')];
const only = process.argv[2];
(async () => {
  const out = path.join(__dirname, 'out'); fs.mkdirSync(out, {recursive: true});
  for (const st of styles) {
    if (only && !only.split(',').includes(st.name)) continue;
    const deck = new pptxgen(); deck.layout = 'LAYOUT_WIDE'; deck.title = 'AgentPrune · ' + st.label;
    const dir = path.join(out, st.name); fs.mkdirSync(dir, {recursive: true});
    st.pages.forEach((fn, i) => { global.QA = []; const c = new Both(deck.addSlide()); fn(c); global.QA.forEach(q => console.log('QA', st.name, 'p' + (i + 1), q)); fs.writeFileSync(path.join(dir, `p${i + 1}.svg`), c.b.svg()); });
    await deck.writeFile({fileName: path.join(out, `${st.name}.pptx`)});
  }
  console.log('ok');
})().catch(e => { console.error(e); process.exit(1); });
