import './ColorPicker';
import { ChangeColorCommand } from '../models/CommandManager';

export class InfoPanel extends HTMLElement {
  constructor() {
    super();
    this._scene = null;
    this._commands = null;
    this._countEl = document.createElement('span');

    this._rightEl = document.createElement('span');
    this._rightEl.className = 'info-right';

    this._selectEl = document.createElement('span');

    this._colorBtn = document.createElement('button');
    this._colorBtn.className = 'color-indicator';
    this._colorBtn.type = 'button';

    this._picker = document.createElement('color-picker');

    this._previewEl = document.createElement('span');
    this._previewEl.className = 'cp-preview';

    this._okBtn = document.createElement('button');
    this._okBtn.className = 'color-ok-btn';
    this._okBtn.textContent = 'OK';

    this._popup = document.createElement('div');
    this._popup.className = 'color-popup hidden';

    const bottomRow = document.createElement('div');
    bottomRow.className = 'cp-bottom';
    bottomRow.appendChild(this._previewEl);
    bottomRow.appendChild(this._okBtn);

    this._popup.appendChild(this._picker);
    this._popup.appendChild(bottomRow);

    this._rightEl.appendChild(this._selectEl);
    this._rightEl.appendChild(this._colorBtn);
    this._rightEl.appendChild(this._popup);

    this._unsubs = [];

    this._onColorBtnClick = this._onColorBtnClick.bind(this);
    this._onOkClick = this._onOkClick.bind(this);
    this._onPickerChange = this._onPickerChange.bind(this);
    this._onDocumentClick = this._onDocumentClick.bind(this);
    this._onKeyDown = this._onKeyDown.bind(this);
  }

  connectedCallback() {
    this.appendChild(this._countEl);
    this.appendChild(this._rightEl);
    this._colorBtn.addEventListener('click', this._onColorBtnClick);
    this._okBtn.addEventListener('click', this._onOkClick);
    this._picker.addEventListener('change', this._onPickerChange);
    document.addEventListener('click', this._onDocumentClick);
    document.addEventListener('keydown', this._onKeyDown);
    if (this._scene) this._subscribe();
    this._update();
  }

  disconnectedCallback() {
    this._unsubs.forEach(fn => fn());
    this._colorBtn.removeEventListener('click', this._onColorBtnClick);
    this._okBtn.removeEventListener('click', this._onOkClick);
    this._picker.removeEventListener('change', this._onPickerChange);
    document.removeEventListener('click', this._onDocumentClick);
    document.removeEventListener('keydown', this._onKeyDown);
  }

  setScene(scene) {
    this._unsubs.forEach(fn => fn());
    this._unsubs = [];
    this._scene = scene;
    if (this.isConnected) this._subscribe();
    this._update();
  }

  setCommands(commands) {
    this._commands = commands;
  }

  _subscribe() {
    if (!this._scene) return;
    this._unsubs.push(
      this._scene.on('scene-change', () => this._update()),
      this._scene.on('selection-change', () => this._update()),
    );
  }

  _update() {
    if (!this._scene) return;
    this._countEl.textContent = `Полигонов на холсте: ${this._scene.count}`;
    const selected = this._scene.getSelected();
    if (selected) {
      this._selectEl.textContent = `Выбран: ${selected.name}`;
      this._colorBtn.style.display = '';
      this._colorBtn.style.backgroundColor = selected.color;
    } else {
      this._selectEl.textContent = 'Ничего не выбрано';
      this._colorBtn.style.display = 'none';
      this._closePopup();
    }
  }

  _onColorBtnClick(e) {
    e.stopPropagation();
    if (!this._popup.classList.contains('hidden')) {
      this._closePopup();
      return;
    }
    const selected = this._scene.getSelected();
    if (!selected) return;
    this._picker.value = selected.color;
    this._previewEl.style.backgroundColor = selected.color;
    this._popup.classList.remove('hidden');
  }

  _onPickerChange() {
    this._previewEl.style.backgroundColor = this._picker.value;
  }

  _onOkClick(e) {
    e.stopPropagation();
    const selected = this._scene.getSelected();
    if (!selected || !this._commands) {
      this._closePopup();
      return;
    }
    const oldColor = selected.color;
    const newColor = this._picker.value;
    if (oldColor !== newColor) {
      this._commands.execute(new ChangeColorCommand(this._scene, selected.id, oldColor, newColor));
    }
    this._closePopup();
  }

  _onDocumentClick(e) {
    if (this._popup.classList.contains('hidden')) return;
    if (e.target === this._colorBtn || this._popup.contains(e.target)) return;
    this._closePopup();
  }

  _onKeyDown(e) {
    if (e.key === 'Escape') this._closePopup();
  }

  _closePopup() {
    this._popup.classList.add('hidden');
  }
}

customElements.define('info-panel', InfoPanel);
