export class AddPolygonCommand {
  constructor(scene, polygon) {
    this.scene = scene;
    this.polygon = polygon;
  }

  execute() { this.scene.add(this.polygon); }
  undo() { this.scene.remove(this.polygon.id); }
  redo() { this.scene.add(this.polygon); }
}

export class RemovePolygonCommand {
  constructor(scene, polygon) {
    this.scene = scene;
    this.polygon = polygon.clone();
    this.wasSelected = scene.getSelectedId() === polygon.id;
  }

  execute() { this.scene.remove(this.polygon.id); }
  undo() {
    this.scene.add(this.polygon);
    if (this.wasSelected) this.scene.select(this.polygon.id);
  }
  redo() { this.scene.remove(this.polygon.id); }
}

export class MovePolygonCommand {
  constructor(scene, polygonId, oldPosition, newPosition) {
    this.scene = scene;
    this.polygonId = polygonId;
    this.oldPos = { ...oldPosition };
    this.newPos = { ...newPosition };
  }

  execute() { this.scene.movePolygon(this.polygonId, this.newPos); }
  undo() { this.scene.movePolygon(this.polygonId, this.oldPos); }
  redo() { this.scene.movePolygon(this.polygonId, this.newPos); }
}

export class ClearAllCommand {
  constructor(scene) {
    this.scene = scene;
    this.saved = scene.getAll().map(p => p.clone());
    this.wasSelected = scene.getSelectedId();
  }

  execute() { this.scene.clear(); }
  undo() {
    this.saved.forEach(p => this.scene.add(p));
    if (this.wasSelected) this.scene.select(this.wasSelected);
  }
  redo() { this.scene.clear(); }
}

export class CommandManager {
  constructor() {
    this._undoStack = [];
    this._redoStack = [];
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

  execute(command) {
    command.execute();
    this._undoStack.push(command);
    this._redoStack = [];
    this._emit('change');
  }

  undo() {
    if (!this.canUndo) return;
    const command = this._undoStack.pop();
    command.undo();
    this._redoStack.push(command);
    this._emit('change');
  }

  redo() {
    if (!this.canRedo) return;
    const command = this._redoStack.pop();
    command.redo();
    this._undoStack.push(command);
    this._emit('change');
  }

  get canUndo() { return this._undoStack.length > 0; }
  get canRedo() { return this._redoStack.length > 0; }
}
