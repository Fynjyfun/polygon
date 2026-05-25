export function cssColorToHex(color) {
  const ctx = document.createElement('canvas').getContext('2d');
  ctx.fillStyle = color;
  const computed = ctx.fillStyle;
  const match = computed.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return '#000000';
  const r = parseInt(match[1]).toString(16).padStart(2, '0');
  const g = parseInt(match[2]).toString(16).padStart(2, '0');
  const b = parseInt(match[3]).toString(16).padStart(2, '0');
  return `#${r}${g}${b}`;
}

export function cssColorToHsl(color) {
  const ctx = document.createElement('canvas').getContext('2d');
  ctx.fillStyle = color;
  const computed = ctx.fillStyle;
  const match = computed.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return { h: 0, s: 100, l: 50 };
  let r = parseInt(match[1]) / 255;
  let g = parseInt(match[2]) / 255;
  let b = parseInt(match[3]) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) * 60; break;
      case g: h = ((b - r) / d + 2) * 60; break;
      case b: h = ((r - g) / d + 4) * 60; break;
    }
  }
  return { h: Math.round(h || 0), s: Math.round(s * 100), l: Math.round(l * 100) };
}
