import { Polygon } from '../models/Polygon';
import { AddPolygonCommand, RemovePolygonCommand, ClearAllCommand } from '../models/CommandManager';
import { generateRandomPolygon } from '../utils/random';
import { showToast } from './Toast';

export class ToolBar extends HTMLElement {
  constructor() {
    super();
    this._scene = null;
    this._commands = null;
    this._canvas = null;
    this._bns = {};
    this._onKeyDown = this._onKeyDown.bind(this);
  }

  connectedCallback() {
    this.innerHTML = `
      <button data-action="generate">➕ Сгенерировать</button>
      <button data-action="delete">🗑️ Удалить</button>
      <button data-action="clear">❌ Удалить все</button>
      <span class="separator"></span>
      <button data-action="undo" disabled>↩️ Отменить</button>
      <button data-action="redo" disabled>↪️ Повторить</button>
    `;

    this.querySelectorAll('button').forEach(btn => {
      const action = btn.dataset.action;
      this._bns[action] = btn;
      btn.addEventListener('click', () => this[action]());
    });

    document.addEventListener('keydown', this._onKeyDown);
  }

  disconnectedCallback() {
    document.removeEventListener('keydown', this._onKeyDown);
  }

  init(scene, commands, canvas) {
    this._scene = scene;
    this._commands = commands;
    this._canvas = canvas;

    commands.on('change', () => this._syncButtons());
    this._syncButtons();
  }

  generate() {
    if (!this._canvas) return;
    const data = generateRandomPolygon(this._canvas._w, this._canvas._h, this._scene.getAll());
    if (!data) { showToast('Нет места для нового полигона'); return; }
    const polygon = new Polygon(data);
    this._commands.execute(new AddPolygonCommand(this._scene, polygon));
  }

  delete() {
    const poly = this._scene?.getSelected();
    if (!poly) { showToast('Полигон не выбран'); return; }
    this._commands.execute(new RemovePolygonCommand(this._scene, poly));
  }

  clear() {
    if (!this._scene || this._scene.count === 0) return;
    this._commands.execute(new ClearAllCommand(this._scene));
  }

  undo() { this._commands?.undo(); }
  redo() { this._commands?.redo(); }

  _onKeyDown(e) {
    if (e.ctrlKey && e.key === 'z' && !e.shiftKey) { e.preventDefault(); this.undo(); }
    if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'z')) {
      e.preventDefault(); this.redo();
    }
    if (e.key === 'Delete') { this.delete(); }
  }

  _syncButtons() {
    if (!this._commands) return;
    this._bns.undo.disabled = !this._commands.canUndo;
    this._bns.redo.disabled = !this._commands.canRedo;
  }
}

customElements.define('tool-bar', ToolBar);
