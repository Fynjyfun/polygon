let nextId = 1;

export class Polygon {
  constructor({ vertices, position, color }) {
    this.id = nextId++;
    this.vertices = vertices;
    this.position = { ...position };
    this.color = color;
  }

  get name() {
    return `Полигон ${this.id}`;
  }

  getTransformedVertices() {
    return this.vertices.map(v => ({
      x: v.x + this.position.x,
      y: v.y + this.position.y,
    }));
  }

  clone() {
    const p = new Polygon({
      vertices: this.vertices.map(v => ({ ...v })),
      position: { ...this.position },
      color: this.color,
    });
    p.id = this.id;
    return p;
  }
}
