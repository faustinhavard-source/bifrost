// Generate the outlined poster artwork and stills from the site's own renderer.
// Requires @napi-rs/canvas. BIFROST_POSTER_FONT can point to an alternative licensed font.
const { createCanvas, GlobalFonts, SvgExportFlag, loadImage } = require('@napi-rs/canvas');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const assets = path.join(root, 'dist/assets');
const { drawFrame, createGlyphAtlas } = require('../dist/script.js');

GlobalFonts.registerFromPath(process.env.BIFROST_POSTER_FONT || '/System/Library/Fonts/Supplemental/Arial.ttf', 'Poster');
GlobalFonts.registerFromPath(path.join(assets, 'vt323.ttf'), 'Terminal');

const dots = `<defs><pattern id="print" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(19)"><g fill="#191919"><path d="M3 1.05 4.46 1.7 4.94 3.16 4.02 4.52 2.55 4.85 1.12 3.8 1.29 2.2Z"/><path d="M9 1.3 10.7 2.08 10.86 3.5 9.8 4.85 8.25 4.6 7.1 3.36 7.48 1.8Z"/><path d="M3 7.13 4.52 7.7 4.82 9.2 3.88 10.58 2.28 10.71 1.02 9.4 1.42 7.8Z"/><path d="M9 7.08 10.65 7.85 10.91 9.4 9.65 10.93 8.1 10.61 7.04 9.16 7.64 7.6Z"/></g></pattern></defs><rect width="100%" height="100%" fill="#e5e5e2"/><rect width="100%" height="100%" fill="url(#print)"/>`;

function makePoster(w, h, tall) {
  const canvas = createCanvas(w, h, SvgExportFlag.ConvertTextToPaths);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#171717';

  function word(text, x, y, width, height) {
    ctx.font = '200px Poster';
    const m = ctx.measureText(text);
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(width / (m.actualBoundingBoxLeft + m.actualBoundingBoxRight), height / (m.actualBoundingBoxAscent + m.actualBoundingBoxDescent));
    ctx.fillText(text, m.actualBoundingBoxLeft, m.actualBoundingBoxAscent);
    ctx.restore();
  }
  function caption(text, x, y, size, align = 'left') {
    ctx.font = `${size}px Terminal`;
    ctx.textAlign = align;
    const m = ctx.measureText(text);
    const left = align === 'right' ? x - m.width : align === 'center' ? x - m.width / 2 : x;
    ctx.fillStyle = '#e5e5e2';
    ctx.fillRect(left - 4, y - size * .82, m.width + 8, size * 1.06);
    ctx.fillStyle = '#171717';
    ctx.fillText(text, x, y);
    ctx.textAlign = 'left';
  }

  if (tall) {
    caption('BIFROST / ROBOTICS', 15, 25, 17);
    caption('45 BUILDERS', w - 15, 25, 17, 'right');
    word('THE', -14, 73, 418, 126);
    word('NEXT', 12, 244, 400, 126);
    word('MOVE IS', -17, 414, 423, 118);
    word('PHYSICAL', -12, 576, 414, 126);
    caption('ZURICH > SHENZHEN', 15, 757, 26);
    caption('07–18 DEC 2026 / 25 JAN–04 FEB 2027', 15, 787, 16);
    caption('ENTREPRENEURS FIRST × PLUTO HOUSE', 15, 825, 16);
  } else {
    caption('BIFROST / ROBOTICS FOUNDERS PROGRAM', 24, 34, 21);
    caption('45 BUILDERS / ZURICH > SHENZHEN', w - 24, 34, 21, 'right');
    word('THE NEXT', -24, 88, 1488, 230);
    word('MOVE IS', 102, 368, 1400, 230);
    word('PHYSICAL', -43, 652, 1525, 245);
    caption('ZURICH / 07–18 DEC 2026', 24, 962, 23);
    caption('SHENZHEN / 25 JAN–04 FEB 2027', w / 2, 962, 23, 'center');
    caption('ENTREPRENEURS FIRST × PLUTO HOUSE', w - 24, 962, 23, 'right');
  }
  return canvas.getContent().toString().replace(/(<svg[^>]*>)/, `$1${dots}`);
}

async function main() {
  const wide = makePoster(1440, 1000, false);
  const tall = makePoster(390, 844, true);
  fs.writeFileSync(path.join(assets, 'poster-wide.svg'), wide);
  fs.writeFileSync(path.join(assets, 'poster-tall.svg'), tall);
  const type = createGlyphAtlas(createCanvas);
  type.atlas = await loadImage(type.atlas.toBuffer('image/png'));
  const still = createCanvas(1200, 1500);
  drawFrame(still.getContext('2d'), 1200, 1500, 0, type);
  fs.writeFileSync(path.join(assets, 'humanoid.webp'), still.toBuffer('image/webp', 100));

  for (const [w, h, source, output] of [
    [1440, 900, wide, '/tmp/bifrost-print-desktop.png'],
    [390, 844, tall, '/tmp/bifrost-print-mobile.png'],
    [1200, 750, wide, path.join(assets, 'poster-share.jpg')],
  ]) {
    const canvas = createCanvas(w, h), ctx = canvas.getContext('2d');
    ctx.drawImage(await loadImage(Buffer.from(source)), 0, 0, w, h);
    const robot = createCanvas(w, h);
    drawFrame(robot.getContext('2d'), w, h, 0, type);
    ctx.drawImage(robot, 0, 0);
    fs.writeFileSync(output, output.endsWith('.jpg') ? canvas.toBuffer('image/jpeg', 85) : canvas.toBuffer('image/png'));
  }
  console.log('Outlined poster backgrounds, transparent figure and share image generated.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
