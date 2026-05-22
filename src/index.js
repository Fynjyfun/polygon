import './styles/main.css';
import './components/AppCanvas';
import './components/ToolBar';
import './components/InfoPanel';
import { Scene } from './models/Scene';
import { CommandManager } from './models/CommandManager';

const scene = new Scene();
const commands = new CommandManager();

const canvas = document.querySelector('app-canvas');
const toolbar = document.querySelector('tool-bar');
const info = document.querySelector('info-panel');

canvas.setScene(scene);
canvas.setCommandManager(commands);
toolbar.init(scene, commands, canvas);
info.setScene(scene);
