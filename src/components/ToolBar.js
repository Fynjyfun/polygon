import { Polygon } from '../models/Polygon';
import { AddPolygonCommand, RemovePolygonCommand, ClearAllCommand, ImportCommand } from '../models/CommandManager';
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
    this._onImportFile = this._onImportFile.bind(this);

    this._fileInput = document.createElement('input');
    this._fileInput.type = 'file';
    this._fileInput.accept = '.json,application/json';
    this._fileInput.style.display = 'none';
    this._fileInput.addEventListener('change', this._onImportFile);
  }

  connectedCallback() {
    this.innerHTML = `
      <button data-action="generate">➕ Сгенерировать</button>
      <button data-action="delete">🗑️ Удалить</button>
      <button data-action="clear">❌ Удалить все</button>
      <span class="separator"></span>
      <button data-action="export">💾 Экспорт</button>
      <button data-action="import">📂 Импорт</button>
      <span class="separator"></span>
      <button data-action="undo" disabled>↩️ Отменить</button>
      <button data-action="redo" disabled>↪️ Повторить</button>
    `;

    this.appendChild(this._fileInput);

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

  export() {
    if (!this._scene || this._scene.count === 0) { showToast('Нечего экспортировать'); return; }
    const json = JSON.stringify(this._scene.toJSON(), null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'scene.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Сцена экспортирована');
  }

  import() {
    this._fileInput.value = '';
    this._fileInput.click();
  }

  _onImportFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (!data.polygons || !Array.isArray(data.polygons)) {
          showToast('Неверный формат файла');
          return;
        }
        const polygons = data.polygons.map(p => new Polygon({
          vertices: p.vertices,
          position: p.position,
          color: p.color,
        }));
        this._commands.execute(new ImportCommand(this._scene, polygons));
        showToast(`Импортировано полигонов: ${polygons.length}`);
      } catch (err) {
        showToast('Ошибка импорта');
      }
    };
    reader.readAsText(file);
  }

  undo() { this._commands?.undo(); }
  redo() { this._commands?.redo(); }

  _onKeyDown(e) {
    if ((e.ctrlKey || e.metaKey) && e.code === 'KeyZ' && !e.shiftKey) { e.preventDefault(); this.undo(); }
    if ((e.ctrlKey || e.metaKey) && (e.code === 'KeyY' || (e.shiftKey && e.code === 'KeyZ'))) {
      e.preventDefault(); this.redo();
    }
    if (e.code === 'Delete') { this.delete(); }
  }

  _syncButtons() {
    if (!this._commands) return;
    this._bns.undo.disabled = !this._commands.canUndo;
    this._bns.redo.disabled = !this._commands.canRedo;
  }
}

customElements.define('tool-bar', ToolBar);
