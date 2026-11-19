import './styles/game.css';
import { PhaserRenderer } from './game/renderers/PhaserRenderer.js';
import { GameController } from './game/ui/GameController.js';
import { buildShell } from './game/ui/shell.js';

const root=document.getElementById('app');
if(!root)throw new Error('No app root');
buildShell(root);
const stage=document.getElementById('game-stage');
if(!stage)throw new Error('Missing game stage');
new GameController(root,new PhaserRenderer(stage));
