const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const dom = new JSDOM(html, {
  url: 'http://localhost/',
  pretendToBeVisual: true,
});

const { window } = dom;
const { document } = window;

global.window = window;
global.document = document;
global.HTMLElement = window.HTMLElement;
global.HTMLCanvasElement = window.HTMLCanvasElement;
global.Node = window.Node;

const downloads = [];
window.HTMLAnchorElement.prototype.click = function click() {
  downloads.push(this.download);
};

const savedPdfs = [];
class FakePDF {
  addImage() {}
  save(name) {
    savedPdfs.push(name);
  }
}

window.jspdf = { jsPDF: () => new FakePDF() };
global.jspdf = window.jspdf;

window.html2canvas = async () => ({
  width: 750,
  height: 1050,
  toDataURL: () => 'data:image/png;base64,fake',
});
global.html2canvas = window.html2canvas;

global.FileReader = class MockReader {
  readAsDataURL() {
    setTimeout(() => {
      if (this.onload) {
        this.onload({ target: { result: 'data:image/png;base64,upload' } });
      }
    }, 0);
  }
};

require('../script.js');

const waitFor = (ms = 0) => new Promise((resolve) => setTimeout(resolve, ms));

const cardForm = document.getElementById('card-form');
const exportForm = document.getElementById('export-form');

function mmToPx(mm) {
  return Math.round((mm / 25.4) * 300);
}

test('duplicate button stuurt kaart naar deck', async () => {
  const deck = document.getElementById('deck');
  const before = deck.children.length;
  document.getElementById('duplicate').click();
  await waitFor();
  assert.strictEqual(deck.children.length, before + 1);
});

test('swap-art wisselt afbeelding', async () => {
  const imageInput = cardForm.elements.imageUrl;
  const initial = imageInput.value;
  document.getElementById('swap-art').click();
  await waitFor();
  assert.notStrictEqual(imageInput.value, initial);
});

test('reset transform zet sliders terug', async () => {
  cardForm.elements.heroScale.value = 1.5;
  cardForm.elements.heroRotation.value = 20;
  cardForm.elements.heroX.value = 50;
  cardForm.elements.heroY.value = -15;
  cardForm.elements.heroOpacity.value = 0.5;
  cardForm.elements.heroFlipX.checked = true;
  cardForm.elements.heroFlipY.checked = true;

  document.getElementById('reset-transform').click();
  await waitFor();

  assert.equal(cardForm.elements.heroScale.value, '1');
  assert.equal(cardForm.elements.heroRotation.value, '0');
  assert.equal(cardForm.elements.heroX.value, '0');
  assert.equal(cardForm.elements.heroY.value, '0');
  assert.equal(cardForm.elements.heroOpacity.value, '1');
  assert.equal(cardForm.elements.heroFlipX.checked, false);
  assert.equal(cardForm.elements.heroFlipY.checked, false);
});

test('image picker opent file input en upload werkt', async () => {
  let pickerClicked = false;
  const fileInput = document.getElementById('image-upload');
  fileInput.addEventListener('click', () => {
    pickerClicked = true;
  });

  document.getElementById('image-picker').click();
  assert.ok(pickerClicked, 'file input moet klik registreren');

  Object.defineProperty(fileInput, 'files', {
    configurable: true,
    get() {
      return [{ name: 'upload.png' }];
    },
  });

  fileInput.dispatchEvent(new window.Event('change'));
  await waitFor();

  assert.match(cardForm.elements.imageUrl.value, /data:image\/png/);
});

test('preset wissel werkt en labels updaten', async () => {
  const preset = document.getElementById('size-preset');
  preset.value = 'poker';
  preset.dispatchEvent(new window.Event('change'));
  await waitFor();

  const widthPx = mmToPx(63).toString();
  const heightPx = mmToPx(88).toString();
  assert.equal(exportForm.elements.width.value, widthPx);
  assert.equal(exportForm.elements.height.value, heightPx);
  assert.equal(document.getElementById('size-px').textContent, `${widthPx} × ${heightPx} px`);
});

test('export kaart maakt png download', async () => {
  downloads.length = 0;
  exportForm.elements.format.value = 'png';
  document.getElementById('export').click();
  await waitFor();
  assert.ok(downloads.some((name) => name && name.endsWith('.png')));
});

test('sheet export maakt pdf mogelijk', async () => {
  savedPdfs.length = 0;
  exportForm.elements.format.value = 'pdf';
  document.getElementById('export-sheet').click();
  await waitFor();
  assert.ok(savedPdfs.some((name) => name.endsWith('.pdf')));
});
