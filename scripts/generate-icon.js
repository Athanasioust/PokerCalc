const sharp = require('sharp');
const path = require('path');

// Dark navy background with a large spade and "PC" text
// Generates all required Expo icon sizes from one SVG source

const SIZES = [
  { file: 'icon.png',                    size: 1024 },
  { file: 'splash-icon.png',             size: 1024 },
  { file: 'favicon.png',                 size: 64   },
  { file: 'android-icon-foreground.png', size: 1024, transparent: true },
];

function mainIconSvg(size) {
  const s = size;
  const center = s / 2;
  const spadeSize = Math.round(s * 0.58);
  const fontSize = Math.round(s * 0.14);
  const labelY = Math.round(s * 0.91);
  const radius = Math.round(s * 0.18);

  return `<svg width="${s}" height="${s}" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="${s}" height="${s}" rx="${radius}" fill="#1a1a2e"/>

  <!-- Spade symbol -->
  <text
    x="${center}"
    y="${Math.round(s * 0.62)}"
    font-family="serif"
    font-size="${spadeSize}"
    text-anchor="middle"
    dominant-baseline="middle"
    fill="#ffffff"
  >♠</text>

  <!-- App label -->
  <text
    x="${center}"
    y="${labelY}"
    font-family="sans-serif"
    font-size="${fontSize}"
    font-weight="bold"
    text-anchor="middle"
    fill="#7b8cde"
    letter-spacing="${Math.round(s * 0.03)}"
  >POKERCALC</text>
</svg>`;
}

function foregroundSvg(size) {
  const s = size;
  const center = s / 2;
  const spadeSize = Math.round(s * 0.62);
  return `<svg width="${s}" height="${s}" xmlns="http://www.w3.org/2000/svg">
  <text
    x="${center}"
    y="${Math.round(s * 0.60)}"
    font-family="serif"
    font-size="${spadeSize}"
    text-anchor="middle"
    dominant-baseline="middle"
    fill="#ffffff"
  >♠</text>
</svg>`;
}

function androidBackgroundSvg(size) {
  return `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#1a1a2e"/>
</svg>`;
}

async function generate() {
  const assetsDir = path.join(__dirname, '..', 'assets');

  for (const { file, size, transparent } of SIZES) {
    const svg = transparent ? foregroundSvg(size) : mainIconSvg(size);
    const outPath = path.join(assetsDir, file);
    await sharp(Buffer.from(svg)).png().toFile(outPath);
    console.log(`Generated ${file} (${size}x${size})`);
  }

  // Android background (solid colour, no icon)
  const bgSvg = androidBackgroundSvg(1024);
  const bgPath = path.join(assetsDir, 'android-icon-background.png');
  await sharp(Buffer.from(bgSvg)).png().toFile(bgPath);
  console.log('Generated android-icon-background.png');

  // Monochrome (white spade on transparent for Android 13 themed icons)
  const monoSvg = foregroundSvg(1024);
  const monoPath = path.join(assetsDir, 'android-icon-monochrome.png');
  await sharp(Buffer.from(monoSvg)).png().toFile(monoPath);
  console.log('Generated android-icon-monochrome.png');

  console.log('\nAll icons generated successfully.');
}

generate().catch(err => { console.error(err); process.exit(1); });
