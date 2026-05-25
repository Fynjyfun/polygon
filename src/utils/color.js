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
