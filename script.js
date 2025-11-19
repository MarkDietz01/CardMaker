const cardForm = document.getElementById('card-form');
const exportForm = document.getElementById('export-form');
const preview = document.getElementById('card-preview');
const deck = document.getElementById('deck');
const template = document.getElementById('card-template');
const duplicateBtn = document.getElementById('duplicate');
const exportBtn = document.getElementById('export');
const exportSheetBtn = document.getElementById('export-sheet');
const sizePreset = document.getElementById('size-preset');
const swapArtBtn = document.getElementById('swap-art');
const imagePickerBtn = document.getElementById('image-picker');
const imageUploadInput = document.getElementById('image-upload');
const resetTransformBtn = document.getElementById('reset-transform');
const sizeMmLabel = document.getElementById('size-mm');
const sizeInLabel = document.getElementById('size-in');
const sizePxLabel = document.getElementById('size-px');

const rarityStyles = {
  common: { label: 'Common', color: '#b2c1d3', glow: 'rgba(178, 193, 211, 0.18)' },
  rare: { label: 'Rare', color: '#6de0ff', glow: 'rgba(109, 224, 255, 0.2)' },
  epic: { label: 'Epic', color: '#f2c94c', glow: 'rgba(242, 201, 76, 0.2)' },
  legendary: { label: 'Legendary', color: '#ff9f43', glow: 'rgba(255, 159, 67, 0.18)' },
};

const presets = {
  poker: { mm: [63, 88] },
  tarot: { mm: [70, 120] },
  mini: { mm: [44, 68] },
};

const artLibrary = [
  'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=900&q=80',
];

let deckData = [];
let artIndex = 0;

function mmToPx(mm, dpi = 300) {
  return Math.round((mm / 25.4) * dpi);
}

function pxToMm(px) {
  return (px / 96) * 25.4;
}

function pxToIn(px) {
  return px / 96;
}

function formatDimensionPair(widthPx, heightPx, converter, unit) {
  return `${converter(widthPx).toFixed(2)} × ${converter(heightPx).toFixed(2)} ${unit}`;
}

function updateViewportMeta(width, height) {
  if (sizeMmLabel) sizeMmLabel.textContent = formatDimensionPair(width, height, pxToMm, 'mm');
  if (sizeInLabel) sizeInLabel.textContent = formatDimensionPair(width, height, pxToIn, 'in');
  if (sizePxLabel) sizePxLabel.textContent = `${Math.round(width)} × ${Math.round(height)} px`;
}

function collectCardData() {
  const data = Object.fromEntries(new FormData(cardForm).entries());
  data.radius = Number(data.radius) || 16;
  data.shadow = Number(data.shadow) || 16;
  data.power = data.power || '0';
  data.defense = data.defense || '0';
  data.texture = data.texture || 'none';
  data.panelType = data.panelType || 'gradient';
  data.imageUrl = data.imageUrl || artLibrary[artIndex];
  data.imageFit = data.imageFit || 'cover';
  data.heroBlend = data.heroBlend || 'normal';
  data.heroOpacity = Number(data.heroOpacity ?? 1);
  data.heroScale = Number(data.heroScale ?? 1);
  data.heroRotation = Number(data.heroRotation ?? 0);
  data.heroX = Number(data.heroX ?? 0);
  data.heroY = Number(data.heroY ?? 0);
  data.heroFlipX = cardForm.elements.heroFlipX?.checked ?? false;
  data.heroFlipY = cardForm.elements.heroFlipY?.checked ?? false;
  data.backgroundColor = data.backgroundColor || '#0f1117';
  return data;
}

function collectExportSettings() {
  const entries = Object.fromEntries(new FormData(exportForm).entries());
  return {
    width: Number(entries.width),
    height: Number(entries.height),
    scale: Number(entries.scale) || 1,
    format: entries.format,
    bleed: Number(entries.bleed) || 0,
    cropMarks: Boolean(entries.cropMarks),
    transparent: Boolean(entries.transparent),
  };
}

function renderCard(target, data, options = {}) {
  const settings = { cropMarks: true, safeZone: true, bleed: 0, measurement: null, ...options };
  target.innerHTML = '';
  target.className = 'card';

  target.classList.toggle('crop-off', !settings.cropMarks);
  target.classList.toggle('safe-zone-off', !settings.safeZone);
  target.classList.remove('texture-grid', 'texture-dots', 'texture-linen');
  if (data.texture && data.texture !== 'none') {
    target.classList.add(`texture-${data.texture}`);
  }

  target.style.borderRadius = `${data.radius}px`;
  target.style.boxShadow = `0 ${data.shadow / 2}px ${data.shadow * 1.6}px rgba(0,0,0,0.4)`;
  target.style.background = `linear-gradient(140deg, ${data.primaryColor}, ${data.secondaryColor})`;

  const content = template.content.cloneNode(true);
  target.appendChild(content);

  const rarity = rarityStyles[data.rarity] || rarityStyles.common;
  const rarityEl = target.querySelector('.rarity');
  rarityEl.textContent = rarity.label;
  rarityEl.style.color = rarity.color;
  rarityEl.style.textShadow = `0 0 20px ${rarity.glow}`;

  target.querySelector('.icon').textContent = data.icon;
  target.querySelector('.title').textContent = data.title;
  target.querySelector('.subtitle').textContent = data.subtitle;
  target.querySelector('.type').textContent = data.type;
  target.querySelector('.cost').textContent = data.cost;
  target.querySelector('.tags').textContent = data.tags;
  target.querySelector('.description').textContent = data.description;
  target.querySelector('.power').textContent = data.power;
  target.querySelector('.defense').textContent = data.defense;

  const heroName = target.querySelector('.hero-name');
  const heroMedia = target.querySelector('.hero-media');
  const heroGradient = target.querySelector('.hero-gradient');
  const heroGrid = target.querySelector('.hero-grid');
  const measureMm = target.querySelector('.measure-mm');
  const measureIn = target.querySelector('.measure-in');

  if (heroName) heroName.textContent = data.title || 'Nieuwe kaart';
  if (heroGradient) {
    heroGradient.style.background = `linear-gradient(140deg, ${data.primaryColor}, ${data.secondaryColor})`;
    heroGradient.style.opacity = data.panelType === 'image' ? 0.3 : 0.85;
  }
  if (heroGrid) {
    heroGrid.style.opacity = data.panelType === 'image' ? 0.2 : 0.35;
  }
  if (heroMedia) {
    heroMedia.style.backgroundColor = data.backgroundColor;
    if (data.panelType === 'gradient') {
      heroMedia.style.backgroundImage = 'none';
      heroMedia.style.opacity = 0;
    } else {
      heroMedia.style.backgroundImage = data.imageUrl ? `url(${data.imageUrl})` : 'none';
      heroMedia.style.backgroundSize = data.imageFit === 'contain' ? 'contain' : 'cover';
      heroMedia.style.backgroundRepeat = 'no-repeat';
      heroMedia.style.backgroundPosition = 'center';
      heroMedia.style.opacity = data.heroOpacity;
      heroMedia.style.mixBlendMode = data.panelType === 'image' ? 'normal' : data.heroBlend;
    }
    const flipX = data.heroFlipX ? -1 : 1;
    const flipY = data.heroFlipY ? -1 : 1;
    heroMedia.style.transform = `translate(${data.heroX}px, ${data.heroY}px) scale(${data.heroScale * flipX}, ${data.heroScale * flipY}) rotate(${data.heroRotation}deg)`;
  }

  if (settings.measurement && measureMm && measureIn) {
    measureMm.textContent = formatDimensionPair(settings.measurement.width, settings.measurement.height, pxToMm, 'mm');
    measureIn.textContent = formatDimensionPair(settings.measurement.width, settings.measurement.height, pxToIn, 'in');
  }

  let bleedOverlay = target.querySelector('.bleed-overlay');
  if (bleedOverlay) bleedOverlay.remove();
  if (settings.bleed > 0) {
    bleedOverlay = document.createElement('div');
    bleedOverlay.className = 'bleed-overlay';
    bleedOverlay.style.borderWidth = `${Math.max(8, settings.bleed / 2)}px`;
    target.appendChild(bleedOverlay);
  }
}

function renderPreview() {
  const data = collectCardData();
  const exportSettings = collectExportSettings();
  const measurement = { width: exportSettings.width, height: exportSettings.height };
  renderCard(preview, data, { cropMarks: exportSettings.cropMarks, safeZone: exportSettings.cropMarks, bleed: exportSettings.bleed, measurement });
  updateViewportMeta(measurement.width, measurement.height);
}

function renderDeck() {
  const exportSettings = collectExportSettings();
  const measurement = { width: exportSettings.width, height: exportSettings.height };
  deck.innerHTML = '';
  deckData.forEach((data) => {
    const card = document.createElement('div');
    renderCard(card, data, { cropMarks: exportSettings.cropMarks, safeZone: exportSettings.cropMarks, bleed: exportSettings.bleed, measurement });
    card.style.width = '100%';
    deck.appendChild(card);
  });
}

function applyPreset(presetKey) {
  const preset = presets[presetKey];
  if (!preset) return;
  const [mmWidth, mmHeight] = preset.mm;
  const pxWidth = mmToPx(mmWidth);
  const pxHeight = mmToPx(mmHeight);
  exportForm.elements.width.value = pxWidth;
  exportForm.elements.height.value = pxHeight;
}

function buildExportCard(data, settings) {
  const card = document.createElement('div');
  card.style.width = `${settings.width}px`;
  card.style.height = `${settings.height}px`;
  renderCard(card, data, { cropMarks: settings.cropMarks, safeZone: settings.cropMarks, bleed: settings.bleed, measurement: { width: settings.width, height: settings.height } });

  const wrapper = document.createElement('div');
  wrapper.className = 'export-wrapper';
  wrapper.style.position = 'relative';
  wrapper.style.padding = `${settings.bleed}px`;
  wrapper.style.background = settings.transparent ? 'transparent' : '#0c0e14';
  wrapper.style.display = 'inline-flex';
  wrapper.style.justifyContent = 'center';
  wrapper.style.alignItems = 'center';
  wrapper.style.boxSizing = 'border-box';
  wrapper.style.borderRadius = `${data.radius + settings.bleed}px`;

  wrapper.appendChild(card);

  if (settings.cropMarks) {
    const crops = document.createElement('div');
    crops.className = 'crop-marks';
    wrapper.appendChild(crops);
  }
  return wrapper;
}

async function exportNode(node, settings, filenameBase) {
  document.body.appendChild(node);
  const canvas = await html2canvas(node, {
    scale: settings.scale,
    backgroundColor: settings.transparent ? null : '#0c0e14',
    removeContainer: true,
    useCORS: true,
    allowTaint: false,
  });
  document.body.removeChild(node);

  if (settings.format === 'pdf') {
    const { jsPDF } = window.jspdf || {};
    if (!jsPDF) throw new Error('PDF library niet geladen');
    const pdf = new jsPDF({
      orientation: canvas.width >= canvas.height ? 'landscape' : 'portrait',
      unit: 'mm',
      format: [pxToMm(canvas.width), pxToMm(canvas.height)],
    });
    pdf.addImage(canvas.toDataURL('image/png', 1), 'PNG', 0, 0, pxToMm(canvas.width), pxToMm(canvas.height));
    pdf.save(`${filenameBase}.pdf`);
    return;
  }

  const mime = settings.format === 'jpeg' ? 'image/jpeg' : 'image/png';
  const dataUrl = canvas.toDataURL(mime, 0.92);
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = `${filenameBase}.${settings.format}`;
  link.click();
}

async function exportSingle() {
  const data = collectCardData();
  const settings = collectExportSettings();
  const cardNode = buildExportCard(data, settings);
  await exportNode(cardNode, settings, `cardmaker-${data.title || 'kaart'}`);
}

async function exportSheet() {
  const settings = collectExportSettings();
  const cards = deckData.length ? deckData : [collectCardData()];
  const sheet = document.createElement('div');
  sheet.style.display = 'grid';
  sheet.style.gridTemplateColumns = 'repeat(3, 1fr)';
  sheet.style.gap = `${settings.bleed}px`;
  sheet.style.padding = `${settings.bleed}px`;
  sheet.style.background = settings.transparent ? 'transparent' : '#0c0e14';

  cards.slice(0, 9).forEach((data) => {
    sheet.appendChild(buildExportCard(data, settings));
  });

  while (sheet.children.length < 9) {
    sheet.appendChild(buildExportCard(cards[0], settings));
  }

  await exportNode(sheet, settings, 'cardmaker-sheet');
}

cardForm.addEventListener('input', () => {
  renderPreview();
});

exportForm.addEventListener('input', () => {
  renderPreview();
  renderDeck();
});

sizePreset.addEventListener('change', (event) => {
  if (event.target.value === 'custom') return;
  applyPreset(event.target.value);
  renderPreview();
  renderDeck();
});

duplicateBtn.addEventListener('click', () => {
  deckData.push(collectCardData());
  renderDeck();
});

exportBtn.addEventListener('click', async () => {
  exportBtn.disabled = true;
  exportBtn.textContent = 'Exporteren...';
  try {
    await exportSingle();
  } finally {
    exportBtn.disabled = false;
    exportBtn.textContent = 'Exporteer kaart';
  }
});

exportSheetBtn.addEventListener('click', async () => {
  exportSheetBtn.disabled = true;
  exportSheetBtn.textContent = 'Sheet exporteren...';
  try {
    await exportSheet();
  } finally {
    exportSheetBtn.disabled = false;
    exportSheetBtn.textContent = 'Exporteer 3×3 sheet';
  }
});

swapArtBtn?.addEventListener('click', () => {
  artIndex = (artIndex + 1) % artLibrary.length;
  cardForm.elements.imageUrl.value = artLibrary[artIndex];
  renderPreview();
});

imagePickerBtn?.addEventListener('click', () => {
  imageUploadInput?.click();
});

imageUploadInput?.addEventListener('change', (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    cardForm.elements.imageUrl.value = e.target?.result || '';
    renderPreview();
  };
  reader.readAsDataURL(file);
});

resetTransformBtn?.addEventListener('click', () => {
  cardForm.elements.heroScale.value = 1;
  cardForm.elements.heroRotation.value = 0;
  cardForm.elements.heroX.value = 0;
  cardForm.elements.heroY.value = 0;
  cardForm.elements.heroOpacity.value = 1;
  cardForm.elements.heroFlipX.checked = false;
  cardForm.elements.heroFlipY.checked = false;
  renderPreview();
});

if (!cardForm.elements.imageUrl.value) {
  cardForm.elements.imageUrl.value = artLibrary[0];
}

renderPreview();
