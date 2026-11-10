// 写真の仕上げ・保存・共有・まねっこの記念コラージュ
import { makeCanvas, rrect, starPath, FONT } from './util.js';

export const BRAND = 'なりきりカメラ';

function stamp(g, W, H) {
  const s = Math.max(14, W * 0.036);
  g.save();
  g.font = `900 ${s}px ${FONT}`; g.textAlign = 'right'; g.textBaseline = 'alphabetic'; g.lineJoin = 'round';
  g.strokeStyle = 'rgba(7,12,26,.6)'; g.lineWidth = s * 0.3; g.strokeText(BRAND, W - s * 0.8, H - s * 0.8);
  g.fillStyle = 'rgba(255,255,255,.96)'; g.fillText(BRAND, W - s * 0.8, H - s * 0.8);
  g.restore();
}

const toBlob = (c) => new Promise((ok) => c.toBlob(ok, 'image/jpeg', 0.92));

export async function makePhoto(shot) {
  const c = makeCanvas(shot.width, shot.height), g = c.getContext('2d');
  g.drawImage(shot, 0, 0);
  stamp(g, c.width, c.height);
  return toBlob(c);
}

// まねっこで できた顔を 1枚にまとめる。shots: [{ canvas, label }]
export async function makeCollage(shots, stars, total) {
  const W = 1080, H = 1350, c = makeCanvas(W, H), g = c.getContext('2d');
  const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#16306B'); bg.addColorStop(1, '#070C1A');
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  g.fillStyle = 'rgba(116,187,255,.16)'; g.beginPath(); g.arc(W / 2, -40, 620, 0, Math.PI * 2); g.fill();
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#ffffff';
  g.font = `900 78px ${FONT}`; g.fillText('まねっこ できたよ!', W / 2, 112);
  for (let i = 0; i < total; i++) {
    starPath(g, W / 2 + (i - (total - 1) / 2) * 92, 222, 36, 5, 0.5);
    g.fillStyle = i < stars ? '#FFD25A' : 'rgba(255,255,255,.2)'; g.fill();
  }
  const n = shots.length, cols = n <= 1 ? 1 : n <= 4 ? 2 : 3, rows = Math.max(1, Math.ceil(n / cols));
  const top = 300, pad = 48, gap = 26, areaW = W - pad * 2, areaH = H - top - 96;
  const tw = (areaW - gap * (cols - 1)) / cols, th = Math.min((areaH - gap * (rows - 1)) / rows, tw * 1.3);
  const usedH = th * rows + gap * (rows - 1), y0 = top + (areaH - usedH) / 2;
  shots.forEach((s, i) => {
    const r = Math.floor(i / cols), inRow = r === rows - 1 ? n - r * cols : cols;
    const x = pad + (areaW - (tw * inRow + gap * (inRow - 1))) / 2 + (i % cols) * (tw + gap), y = y0 + r * (th + gap);
    g.save(); rrect(g, x, y, tw, th, 30); g.clip();
    const sw = s.canvas.width, sh = s.canvas.height, k = Math.max(tw / sw, th / sh);
    g.drawImage(s.canvas, x + (tw - sw * k) / 2, y + (th - sh * k) * 0.3, sw * k, sh * k);
    g.restore();
    rrect(g, x, y, tw, th, 30); g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 6; g.stroke();
    g.font = `900 34px ${FONT}`; const lw = g.measureText(s.label).width + 44;
    rrect(g, x + 14, y + th - 70, lw, 54, 27); g.fillStyle = 'rgba(7,12,26,.72)'; g.fill();
    g.fillStyle = '#ffffff'; g.textAlign = 'left'; g.fillText(s.label, x + 36, y + th - 42); g.textAlign = 'center';
  });
  if (!n) { g.font = `700 44px ${FONT}`; g.fillStyle = '#B3C0DA'; g.fillText('つぎは きっと できるよ', W / 2, H / 2); }
  stamp(g, W, H);
  return toBlob(c);
}

export function fileName(prefix = 'narikiri') {
  const d = new Date(), p = (n) => String(n).padStart(2, '0');
  return `${prefix}_${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}.jpg`;
}

export function canShare(blob, name) {
  try { return !!(navigator.canShare && navigator.canShare({ files: [new File([blob], name, { type: blob.type })] })); } catch (e) { return false; }
}

export async function shareBlob(blob, name) {
  await navigator.share({ files: [new File([blob], name, { type: blob.type })], title: BRAND });
}

// 保存(ブラウザのダウンロードへ渡す)
export async function saveBlob(blob, name) {
  const a = document.createElement('a'), url = URL.createObjectURL(blob);
  a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  return 'download';
}
