import { cssColorToHsl } from '../utils/color';

const FIELD_W = 180;
const FIELD_H = 140;
const HUE_H = 14;

export class ColorPicker extends HTMLElement {
  static get observedAttributes() { return ['value']; }

  constructor() {
    super();
    this._fieldCanvas = document.createElement('canvas');
    this._fieldCanvas.className = 'cp-field';
    this._fieldCanvas.width = FIELD_W;
    this._fieldCanvas.height = FIELD_H;

    this._hueCanvas = document.createElement('canvas');
    this._hueCanvas.className = 'cp-hue';
    this._hueCanvas.width = FIELD_W;
    this._hueCanvas.height = HUE_H;

    this._hue = 0;
    this._fieldX = FIELD_W;
    this._fieldY = 0;
    this._hueX = 0;
    this._color = '#ff0000';

    this._onFieldDown = this._onFieldDown.bind(this);
    this._onHueDown = this._onHueDown.bind(this);
    this._onFieldMove = this._onFieldMove.bind(this);
    this._onHueMove = this._onHueMove.bind(this);
    this._onUp = this._onUp.bind(this);
  }

  connectedCallback() {
    this.appendChild(this._fieldCanvas);
    this.appendChild(this._hueCanvas);
    this._fieldCanvas.addEventListener('pointerdown', this._onFieldDown);
    this._hueCanvas.addEventListener('pointerdown', this._onHueDown);
    if (this.hasAttribute('value')) {
      this._setColor(this.getAttribute('value'));
    }
  }

  disconnectedCallback() {
    this._fieldCanvas.removeEventListener('pointerdown', this._onFieldDown);
    this._hueCanvas.removeEventListener('pointerdown', this._onHueDown);
    this._removeMoveListeners();
  }

  get value() { return this._color; }

  set value(color) {
    this._setColor(color);
    if (this.getAttribute('value') !== color) {
      this.setAttribute('value', color);
    }
  }

  attributeChangedCallback(name, old, value) {
    if (name === 'value' && value !== old && value !== this._color) {
      this._setColor(value);
    }
  }

  _setColor(color) {
    const { h, s, l } = cssColorToHsl(color);
    this._hue = h;
    this._fieldX = Math.round((s / 100) * FIELD_W);
    this._fieldY = Math.round((1 - l / 100) * FIELD_H);
    this._hueX = Math.round((h / 360) * FIELD_W);
    this._color = color;
    this._renderField();
    this._renderHue();
  }

  _onFieldDown(e) {
    e.stopPropagation();
    this._setFieldFromEvent(e);
    this._pointerActive = 'field';
    document.addEventListener('pointermove', this._onFieldMove);
    document.addEventListener('pointerup', this._onUp);
  }

  _onHueDown(e) {
    e.stopPropagation();
    this._setHueFromEvent(e);
    this._pointerActive = 'hue';
    document.addEventListener('pointermove', this._onHueMove);
    document.addEventListener('pointerup', this._onUp);
  }

  _onFieldMove(e) {
    this._setFieldFromEvent(e);
  }

  _onHueMove(e) {
    this._setHueFromEvent(e);
  }

  _onUp() {
    this._pointerActive = null;
    this._removeMoveListeners();
  }

  _removeMoveListeners() {
    document.removeEventListener('pointermove', this._onFieldMove);
    document.removeEventListener('pointermove', this._onHueMove);
    document.removeEventListener('pointerup', this._onUp);
  }

  _setFieldFromEvent(e) {
    const rect = this._fieldCanvas.getBoundingClientRect();
    this._fieldX = Math.round(e.clientX - rect.left);
    this._fieldY = Math.round(e.clientY - rect.top);
    this._fieldX = Math.max(0, Math.min(FIELD_W - 1, this._fieldX));
    this._fieldY = Math.max(0, Math.min(FIELD_H - 1, this._fieldY));
    this._color = this._readFieldColor(this._fieldX, this._fieldY);
    this._renderField();
    this._emitChange();
  }

  _setHueFromEvent(e) {
    const rect = this._hueCanvas.getBoundingClientRect();
    this._hueX = Math.round(e.clientX - rect.left);
    this._hueX = Math.max(0, Math.min(FIELD_W - 1, this._hueX));
    this._hue = Math.round((this._hueX / FIELD_W) * 360);
    this._renderField();
    this._renderHue();
    this._color = this._readFieldColor(this._fieldX, this._fieldY);
    this._emitChange();
  }

  _emitChange() {
    this.dispatchEvent(new Event('change', { bubbles: false }));
  }

  _readFieldColor(x, y) {
    const ctx = this._fieldCanvas.getContext('2d');
    const [r, g, b] = ctx.getImageData(x, y, 1, 1).data;
    const rh = r.toString(16).padStart(2, '0');
    const gh = g.toString(16).padStart(2, '0');
    const bh = b.toString(16).padStart(2, '0');
    return `#${rh}${gh}${bh}`;
  }

  _renderField() {
    const ctx = this._fieldCanvas.getContext('2d');
    const w = FIELD_W, h = FIELD_H;

    ctx.fillStyle = `hsl(${this._hue}, 100%, 50%)`;
    ctx.fillRect(0, 0, w, h);

    const black = ctx.createLinearGradient(0, 0, 0, h);
    black.addColorStop(0, 'rgba(0,0,0,0)');
    black.addColorStop(1, 'rgba(0,0,0,1)');
    ctx.fillStyle = black;
    ctx.fillRect(0, 0, w, h);

    const white = ctx.createLinearGradient(0, 0, w, 0);
    white.addColorStop(0, 'rgba(255,255,255,1)');
    white.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = white;
    ctx.fillRect(0, 0, w, h);

    this._drawFieldCursor();
  }

  _drawFieldCursor() {
    const ctx = this._fieldCanvas.getContext('2d');
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(this._fieldX, this._fieldY, 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(this._fieldX, this._fieldY, 5, 0, Math.PI * 2);
    ctx.stroke();
  }

  _renderHue() {
    const ctx = this._hueCanvas.getContext('2d');
    const w = FIELD_W, h = HUE_H;
    const grad = ctx.createLinearGradient(0, 0, w, 0);
    grad.addColorStop(0.00, 'hsl(0, 100%, 50%)');
    grad.addColorStop(0.17, 'hsl(60, 100%, 50%)');
    grad.addColorStop(0.33, 'hsl(120, 100%, 50%)');
    grad.addColorStop(0.50, 'hsl(180, 100%, 50%)');
    grad.addColorStop(0.67, 'hsl(240, 100%, 50%)');
    grad.addColorStop(0.83, 'hsl(300, 100%, 50%)');
    grad.addColorStop(1.00, 'hsl(360, 100%, 50%)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    this._drawHueCursor();
  }

  _drawHueCursor() {
    const ctx = this._hueCanvas.getContext('2d');
    const x = this._hueX;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, HUE_H);
    ctx.stroke();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, HUE_H);
    ctx.stroke();
  }
}

customElements.define('color-picker', ColorPicker);
