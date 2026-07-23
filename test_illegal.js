const { JSDOM } = require('jsdom');
const dom = new JSDOM();
const win = dom.window;

const types = ['HTMLElement', 'Element', 'Node', 'EventTarget', 'Blob', 'File', 'Image', 'FileReader'];
for (const t of types) {
  try {
    new win[t]();
  } catch(e) {
    console.log(t, e.message);
  }
}
