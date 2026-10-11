// Code-drawn calendar/sun artwork, independent of Google branding. No dependencies.
const fs = require('node:fs');
const {png} = require('./artifact-utils');
function canvas(width, height) {
  const scale = 4; const w = width * scale; const h = height * scale; const pixels = Buffer.alloc(w * h * 4);
  function shape(x, y, width, height, color, contains) {
    for (let py = Math.max(0, Math.floor(y * scale)); py < Math.min(h, Math.ceil((y + height) * scale)); py++) {
      for (let px = Math.max(0, Math.floor(x * scale)); px < Math.min(w, Math.ceil((x + width) * scale)); px++) {
        if (contains((px + .5) / scale, (py + .5) / scale)) {
          const i = (py * w + px) * 4; pixels.set([...color, 255], i);
        }
      }
    }
  }
  const rect = (x, y, width, height, color) => shape(x, y, width, height, color, () => true);
  const circle = (x, y, radius, color) => shape(x - radius, y - radius, radius * 2, radius * 2, color, (px, py) => (px - x) ** 2 + (py - y) ** 2 <= radius ** 2);
  const rounded = (x, y, width, height, radius, color) => shape(x, y, width, height, color, (px, py) => {
    const cx = Math.max(x + radius, Math.min(x + width - radius, px));
    const cy = Math.max(y + radius, Math.min(y + height - radius, py));
    return (px - cx) ** 2 + (py - cy) ** 2 <= radius ** 2;
  });
  function output() {
    const result = Buffer.alloc(width * height * 4);
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4; let alpha = 0; const rgb = [0, 0, 0];
      for (let sy = 0; sy < scale; sy++) for (let sx = 0; sx < scale; sx++) {
        const j = ((y * scale + sy) * w + x * scale + sx) * 4;
        alpha += pixels[j + 3];
        for (let channel = 0; channel < 3; channel++) rgb[channel] += pixels[j + channel] * pixels[j + 3];
      }
      for (let channel = 0; channel < 3; channel++) result[i + channel] = alpha ? Math.round(rgb[channel] / alpha) : 0;
      result[i + 3] = Math.round(alpha / (scale * scale));
    }
    return png(width, height, result);
  }
  return {rect, circle, rounded, output};
}
function icon(c, x, y, size) {
  const s = size / 128;
  const rect = (a,b,w,h,color) => c.rect(x+a*s,y+b*s,w*s,h*s,color);
  const round = (a,b,w,h,r,color) => c.rounded(x+a*s,y+b*s,w*s,h*s,r*s,color);
  round(16,16,96,96,16,[40,85,140]); round(25,36,78,65,8,[239,245,251]);
  rect(25,36,78,18,[73,159,183]); round(39,23,7,24,3,[230,239,249]); round(82,23,7,24,3,[230,239,249]);
  rect(34,63,5,29,[74,189,178]); rect(40,63,2,29,[40,120,230]);
  rect(49,65,17,7,[112,163,214]); rect(49,78,36,7,[112,163,214]);
  c.circle(x+86*s,y+66*s,14*s,[241,181,63]); c.circle(x+86*s,y+66*s,8*s,[255,216,100]);
}
fs.mkdirSync('assets', {recursive: true}); fs.mkdirSync('store/assets', {recursive: true});
for (const size of [16,32,48,128]) { const c = canvas(size,size); icon(c,0,0,size); fs.writeFileSync(`assets/icon-${size}.png`,c.output()); }
const promo = canvas(440,280);
promo.rect(0,0,440,280,[18,31,50]); icon(promo,22,49,170);
promo.rounded(206,40,206,200,16,[36,55,77]);
for (let i = 0; i < 3; i++) {
  const x = 223+i*59; promo.circle(x+22,64,7,[242,201,86]);
  for (let hour = 0; hour < 7; hour++) {
    promo.rect(x,88+hour*18,4,18,[80+hour*20,180-hour*6,190-hour*16]);
    promo.rect(x+5,88+hour*18,2,18,[45,105+hour*8,195]);
  }
  promo.rounded(x+10,104+i*25,40,32,5,[79,133,177]);
  promo.rounded(x+10,173-i*8,40,26,5,[84,158,142]);
}
fs.writeFileSync('store/assets/promo-440x280.png',promo.output());
console.log('Generated four PNG icons and a 440×280 promotional image.');
