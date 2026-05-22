import { clampPosition, polygonsOverlap } from '../utils/geometry';
import { MovePolygonCommand } from '../models/CommandManager';

const ANIM_DURATION = 300;

export class AppCanvas extends HTMLElement {
  constructor() {
    super();
    this._canvas = document.createElement('canvas');
    this._ctx = this._canvas.getContext('2d');
    this._scene = null;
    this._commands = null;
    this._animPolys = new Map();
    this._unsubs = [];

    this._isDragging = false;
    this._dragStartMouse = null;
    this._dragStartPos = null;
    this._dragPoly = null;

    this._onPointerDown = this._onPointerDown.bind(this);
    this._onPointerMove = this._onPointerMove.bind(this);
    this._onPointerUp = this._onPointerUp.bind(this);
    this._resizeObserver = new ResizeObserver(() => this._resize());
  }

  connectedCallback() {
    this.appendChild(this._canvas);
    this._canvas.addEventListener('pointerdown', this._onPointerDown);
    this._resizeObserver.observe(this);
    if (this._scene) this._subscribeScene();
    this._resize();
  }

  disconnectedCallback() {
    this._canvas.removeEventListener('pointerdown', this._onPointerDown);
    this._resizeObserver.disconnect();
    document.removeEventListener('pointermove', this._onPointerMove);
    document.removeEventListener('pointerup', this._onPointerUp);
    this._unsubs.forEach(fn => fn());
  }

  setScene(scene) {
    this._unsubs.forEach(fn => fn());
    this._unsubs = [];
    this._scene = scene;
    if (this.isConnected) this._subscribeScene();
    this._resize();
  }

  setCommandManager(cmds) { this._commands = cmds; }

  triggerRandomPolygon(polygon) {
    this._animPolys.set(polygon.id, performance.now());
    this._render();
  }

  _subscribeScene() {
    if (!this._scene) return;
    this._unsubs.push(
      this._scene.on('scene-change', () => this._render()),
      this._scene.on('selection-change', () => this._render()),
      this._scene.on('polygon-moved', () => this._render()),
    );
  }

  _resize() {
    const rect = this.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this._canvas.width = rect.width * dpr;
    this._canvas.height = rect.height * dpr;
    this._ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this._w = rect.width;
    this._h = rect.height;
    this._render();
  }

  _getPos(e) {
    const rect = this._canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  _onPointerDown(e) {
    if (!this._scene) return;
    const pos = this._getPos(e);
    const poly = this._scene.getPolygonAt(pos.x, pos.y);

    if (poly) {
      this._scene.select(poly.id);
      this._isDragging = true;
      this._dragStartMouse = pos;
      this._dragStartPos = { ...poly.position };
      this._dragPoly = poly;
      this._canvas.setPointerCapture(e.pointerId);
      this._canvas.addEventListener('pointermove', this._onPointerMove);
      this._canvas.addEventListener('pointerup', this._onPointerUp);
    } else {
      this._scene.deselectAll();
    }
  }

  _onPointerMove(e) {
    if (!this._isDragging || !this._dragPoly || !this._commands) return;
    const pos = this._getPos(e);
    const dx = pos.x - this._dragStartMouse.x;
    const dy = pos.y - this._dragStartMouse.y;

    const newPos = clampPosition(
      { x: this._dragStartPos.x + dx, y: this._dragStartPos.y + dy },
      this._dragPoly.vertices,
      this._w,
      this._h,
    );

    const testVerts = this._dragPoly.vertices.map(v => ({
      x: v.x + newPos.x,
      y: v.y + newPos.y,
    }));

    let blocked = false;
    for (const other of this._scene.getAll()) {
      if (other.id === this._dragPoly.id) continue;
      if (polygonsOverlap(testVerts, other.getTransformedVertices())) {
        blocked = true;
        break;
      }
    }

    if (!blocked) {
      this._dragPoly.position = newPos;
      this._render();
    }
  }

  _onPointerUp() {
    if (!this._isDragging || !this._dragPoly || !this._commands) return;
    this._isDragging = false;
    this._canvas.removeEventListener('pointermove', this._onPointerMove);
    this._canvas.removeEventListener('pointerup', this._onPointerUp);

    const finalPos = { ...this._dragPoly.position };
    if (finalPos.x !== this._dragStartPos.x || finalPos.y !== this._dragStartPos.y) {
      this._commands.execute(
        new MovePolygonCommand(this._scene, this._dragPoly.id, this._dragStartPos, finalPos),
      );
    }

    this._dragPoly = null;
    this._dragStartMouse = null;
    this._dragStartPos = null;
  }

  _render() {
    const ctx = this._ctx;
    ctx.clearRect(0, 0, this._w, this._h);

    if (!this._scene) return;

    const selected = this._scene.getSelected();

    for (const poly of this._scene.getAll()) {
      const raw = poly.getTransformedVertices();
      let verts = raw;

      const animStart = this._animPolys.get(poly.id);
      if (animStart !== undefined) {
        const t = Math.min((performance.now() - animStart) / ANIM_DURATION, 1);
        const scale = easeOutBack(t);
        if (t >= 1) {
          this._animPolys.delete(poly.id);
        } else {
          const cx = raw.reduce((s, v) => s + v.x, 0) / raw.length;
          const cy = raw.reduce((s, v) => s + v.y, 0) / raw.length;
          verts = raw.map(v => ({
            x: cx + (v.x - cx) * scale,
            y: cy + (v.y - cy) * scale,
          }));
          requestAnimationFrame(() => this._render());
        }
      }

      ctx.beginPath();
      ctx.moveTo(verts[0].x, verts[0].y);
      for (let i = 1; i < verts.length; i++) {
        ctx.lineTo(verts[i].x, verts[i].y);
      }
      ctx.closePath();

      ctx.fillStyle = poly.color;
      ctx.fill();

      const isSelected = selected && selected.id === poly.id;
      ctx.strokeStyle = isSelected ? '#ffffff' : 'rgba(0,0,0,0.5)';
      ctx.lineWidth = isSelected ? 3 : 1.5;
      ctx.stroke();
    }
  }
}

function easeOutBack(t) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

customElements.define('app-canvas', AppCanvas);
