export function getBounds(vertices) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const v of vertices) {
    if (v.x < minX) minX = v.x;
    if (v.y < minY) minY = v.y;
    if (v.x > maxX) maxX = v.x;
    if (v.y > maxY) maxY = v.y;
  }
  return { minX, minY, maxX, maxY };
}

export function pointInPolygon(px, py, vertices) {
  let inside = false;
  const n = vertices.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = vertices[i].x, yi = vertices[i].y;
    const xj = vertices[j].x, yj = vertices[j].y;
    if ((yi > py) !== (yj > py) &&
        px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

function segmentsIntersect(a, b, c, d) {
  const det = (b.x - a.x) * (d.y - c.y) - (b.y - a.y) * (d.x - c.x);
  if (Math.abs(det) < 1e-10) return false;
  const t = ((c.x - a.x) * (d.y - c.y) - (c.y - a.y) * (d.x - c.x)) / det;
  const u = ((c.x - a.x) * (b.y - a.y) - (c.y - a.y) * (b.x - a.x)) / det;
  return t >= 0 && t <= 1 && u >= 0 && u <= 1;
}

export function polygonsOverlap(verts1, verts2) {
  const b1 = getBounds(verts1);
  const b2 = getBounds(verts2);
  if (b1.maxX < b2.minX || b2.maxX < b1.minX ||
      b1.maxY < b2.minY || b2.maxY < b1.minY) {
    return false;
  }

  for (const v of verts1) {
    if (pointInPolygon(v.x, v.y, verts2)) return true;
  }
  for (const v of verts2) {
    if (pointInPolygon(v.x, v.y, verts1)) return true;
  }

  const n = verts1.length, m = verts2.length;
  for (let i = 0; i < n; i++) {
    const a = verts1[i];
    const b = verts1[(i + 1) % n];
    for (let j = 0; j < m; j++) {
      const c = verts2[j];
      const d = verts2[(j + 1) % m];
      if (segmentsIntersect(a, b, c, d)) return true;
    }
  }

  return false;
}

export function clampPosition(position, localVertices, canvasW, canvasH) {
  const bounds = getBounds(localVertices);
  return {
    x: Math.max(-bounds.minX, Math.min(position.x, canvasW - bounds.maxX)),
    y: Math.max(-bounds.minY, Math.min(position.y, canvasH - bounds.maxY)),
  };
}
