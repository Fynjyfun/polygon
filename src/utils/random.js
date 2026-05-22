import { getBounds, polygonsOverlap } from './geometry';

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function getRandomColor() {
  const h = Math.floor(Math.random() * 360);
  const s = 60 + Math.floor(Math.random() * 30);
  const l = 40 + Math.floor(Math.random() * 20);
  return `hsl(${h}, ${s}%, ${l}%)`;
}

export function generateRandomPolygon(canvasW, canvasH, existingPolygons = []) {
  for (let attempt = 0; attempt < 30; attempt++) {
    const numVertices = randInt(3, 7);
    const maxRadius = Math.min(canvasW, canvasH) * (0.08 + Math.random() * 0.12);

    const angles = [];
    for (let i = 0; i < numVertices; i++) {
      angles.push(Math.random() * 2 * Math.PI);
    }
    angles.sort((a, b) => a - b);

    const vertices = angles.map(angle => {
      const r = maxRadius * (0.4 + Math.random() * 0.6);
      return { x: Math.cos(angle) * r, y: Math.sin(angle) * r };
    });

    const bounds = getBounds(vertices);
    const polyW = bounds.maxX - bounds.minX;
    const polyH = bounds.maxY - bounds.minY;

    const posX = Math.random() * (canvasW - polyW) - bounds.minX;
    const posY = Math.random() * (canvasH - polyH) - bounds.minY;
    const position = { x: posX, y: posY };

    const worldVertices = vertices.map(v => ({
      x: v.x + position.x,
      y: v.y + position.y,
    }));

    let valid = true;
    for (const existing of existingPolygons) {
      if (polygonsOverlap(worldVertices, existing.getTransformedVertices())) {
        valid = false;
        break;
      }
    }

    if (valid) {
      return { vertices, position, color: getRandomColor() };
    }
  }

  return null;
}
