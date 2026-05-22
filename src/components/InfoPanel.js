export class InfoPanel extends HTMLElement {
  constructor() {
    super();
    this._scene = null;
    this._countEl = document.createElement('span');
    this._selectEl = document.createElement('span');
    this._unsubs = [];
  }

  connectedCallback() {
    this.appendChild(this._countEl);
    this.appendChild(this._selectEl);
    if (this._scene) this._subscribe();
    this._update();
  }

  disconnectedCallback() {
    this._unsubs.forEach(fn => fn());
  }

  setScene(scene) {
    this._unsubs.forEach(fn => fn());
    this._unsubs = [];
    this._scene = scene;
    if (this.isConnected) this._subscribe();
    this._update();
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
    this._selectEl.textContent = selected ? `Выбран: ${selected.name}` : 'Ничего не выбрано';
  }
}

customElements.define('info-panel', InfoPanel);
