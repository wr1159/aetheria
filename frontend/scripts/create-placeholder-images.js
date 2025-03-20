import fs from 'fs';
import { createCanvas } from 'canvas';

// Create player image (blue square)
const playerCanvas = createCanvas(32, 32);
const playerCtx = playerCanvas.getContext('2d');
playerCtx.fillStyle = '#3498db';
playerCtx.fillRect(0, 0, 32, 32);
const playerBuffer = playerCanvas.toBuffer('image/png');
fs.writeFileSync('public/assets/images/player.png', playerBuffer);
console.log('Created player.png');

// Create NPC image (green square)
const npcCanvas = createCanvas(32, 32);
const npcCtx = npcCanvas.getContext('2d');
npcCtx.fillStyle = '#2ecc71';
npcCtx.fillRect(0, 0, 32, 32);
// Add a simple face to distinguish it
npcCtx.fillStyle = '#000';
npcCtx.fillRect(8, 8, 4, 4); // Left eye
npcCtx.fillRect(20, 8, 4, 4); // Right eye
npcCtx.fillRect(8, 20, 16, 4); // Mouth
const npcBuffer = npcCanvas.toBuffer('image/png');
fs.writeFileSync('public/assets/images/npc.png', npcBuffer);
console.log('Created npc.png');

// Create obstacle image (red square)
const obstacleCanvas = createCanvas(32, 32);
const obstacleCtx = obstacleCanvas.getContext('2d');
obstacleCtx.fillStyle = '#e74c3c';
obstacleCtx.fillRect(0, 0, 32, 32);
const obstacleBuffer = obstacleCanvas.toBuffer('image/png');
fs.writeFileSync('public/assets/images/obstacle.png', obstacleBuffer);
console.log('Created obstacle.png');

console.log('All placeholder images created successfully!'); 