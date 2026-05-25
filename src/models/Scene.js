import { pointInPolygon, polygonsOverlap } from '../utils/geometry';

export class Scene {
  constructor() {
    this._polygons = [];
    this._selectedId = null;
    this._listeners = {};
  }

  on(event, fn) {
    (this._listeners[event] ??= []).push(fn);
    return () => this.off(event, fn);
  }

  off(event, fn) {
    const fns = this._listeners[event];
    if (fns) this._listeners[event] = fns.filter(f => f !== fn);
  }

  _emit(event, data) {
    (this._listeners[event] ?? []).forEach(fn => fn(data));
  }

  add(polygon) {
    this._polygons.push(polygon);
    this._emit('scene-change', this._polygons);
    return polygon;
  }

  remove(id) {
    const idx = this._polygons.findIndex(p => p.id === id);
    if (idx === -1) return null;
    const [removed] = this._polygons.splice(idx, 1);
    if (this._selectedId === id) this._selectedId = null;
    this._emit('scene-change', this._polygons);
    if (this._selectedId === null) this._emit('selection-change', null);
    return removed;
  }

  clear() {
    this._polygons = [];
    this._selectedId = null;
    this._emit('scene-change', this._polygons);
    this._emit('selection-change', null);
  }

  get(id) {
    return this._polygons.find(p => p.id === id) ?? null;
  }

  getAll() {
    return [...this._polygons];
  }

  select(id) {
    if (this._selectedId === id) return;
    this._selectedId = id;
    this._emit('selection-change', id ? this.get(id) : null);
  }

  deselectAll() {
    if (this._selectedId === null) return;
    this._selectedId = null;
    this._emit('selection-change', null);
  }

  getSelected() {
    return this._selectedId ? this.get(this._selectedId) : null;
  }

  getSelectedId() {
    return this._selectedId;
  }

  changeColor(id, newColor) {
    const poly = this.get(id);
    if (!poly) return;
    poly.color = newColor;
    this._emit('scene-change', this._polygons);
  }

  movePolygon(id, newPosition) {
    const poly = this.get(id);
    if (!poly) return;
    poly.position = { ...newPosition };
    this._emit('polygon-moved', poly);
  }

  getPolygonAt(x, y) {
    for (let i = this._polygons.length - 1; i >= 0; i--) {
      const poly = this._polygons[i];
      const verts = poly.getTransformedVertices();
      if (pointInPolygon(x, y, verts)) return poly;
    }
    return null;
  }

  wouldOverlap(polygon, position) {
    const verts = polygon.vertices.map(v => ({ x: v.x + position.x, y: v.y + position.y }));
    for (const other of this._polygons) {
      if (other.id === polygon.id) continue;
      if (polygonsOverlap(verts, other.getTransformedVertices())) return true;
    }
    return false;
  }

  get count() {
    return this._polygons.length;
  }

  toJSON() {
    return {
      version: 1,
      polygons: this._polygons.map(p => ({
        vertices: p.vertices.map(v => ({ x: v.x, y: v.y })),
        position: { x: p.position.x, y: p.position.y },
        color: p.color,
      })),
    };
  }
}
