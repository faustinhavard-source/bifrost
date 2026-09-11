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

const paper = '<rect width="100%" height="100%" fill="#eaff00"/>';

function makePoster(w, h, tall) {
  const canvas = createCanvas(w, h, SvgExportFlag.ConvertTextToPaths);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';

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
  return canvas.getContent().toString().replace(/(<svg[^>]*>)/, `$1${paper}`);
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
