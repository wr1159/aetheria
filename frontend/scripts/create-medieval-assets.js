import fs from 'fs';
import { createCanvas } from 'canvas';

// Ensure the directory exists
const assetsDir = 'public/assets/images';
if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
}

// Create village background (green field with blue sky)
const bgCanvas = createCanvas(800, 600);
const bgCtx = bgCanvas.getContext('2d');
// Sky
bgCtx.fillStyle = '#87CEEB';
bgCtx.fillRect(0, 0, 800, 300);
// Ground
bgCtx.fillStyle = '#7CFC00';
bgCtx.fillRect(0, 300, 800, 300);
// Sun
bgCtx.fillStyle = '#FFFF00';
bgCtx.beginPath();
bgCtx.arc(700, 100, 50, 0, Math.PI * 2);
bgCtx.fill();
// Path
bgCtx.fillStyle = '#8B4513';
bgCtx.fillRect(200, 300, 400, 300);
fs.writeFileSync(`${assetsDir}/village-bg.png`, bgCanvas.toBuffer('image/png'));
console.log('Created village-bg.png');

// Create villager (brown with simple clothing)
const villagerCanvas = createCanvas(32, 48);
const villagerCtx = villagerCanvas.getContext('2d');
// Body
villagerCtx.fillStyle = '#f2b999';
villagerCtx.fillRect(8, 8, 16, 16); // Head
villagerCtx.fillStyle = '#A52A2A';
villagerCtx.fillRect(8, 24, 16, 24); // Body
// Face
villagerCtx.fillStyle = '#000';
villagerCtx.fillRect(12, 12, 2, 2); // Left eye
villagerCtx.fillRect(18, 12, 2, 2); // Right eye
villagerCtx.fillRect(14, 18, 4, 1); // Mouth
// Clothing
villagerCtx.fillStyle = '#5F9EA0';
villagerCtx.fillRect(8, 24, 16, 10); // Shirt
fs.writeFileSync(`${assetsDir}/villager.png`, villagerCanvas.toBuffer('image/png'));
console.log('Created villager.png');

// Create wizard (purple robe with hat)
const wizardCanvas = createCanvas(32, 48);
const wizardCtx = wizardCanvas.getContext('2d');
// Body
wizardCtx.fillStyle = '#f2b999';
wizardCtx.fillRect(8, 12, 16, 16); // Head
wizardCtx.fillStyle = '#4B0082';
wizardCtx.fillRect(8, 28, 16, 20); // Body
// Hat
wizardCtx.fillStyle = '#4B0082';
wizardCtx.beginPath();
wizardCtx.moveTo(8, 12);
wizardCtx.lineTo(16, 0);
wizardCtx.lineTo(24, 12);
wizardCtx.fill();
// Face
wizardCtx.fillStyle = '#000';
wizardCtx.fillRect(12, 16, 2, 2); // Left eye
wizardCtx.fillRect(18, 16, 2, 2); // Right eye
wizardCtx.fillStyle = '#000';
wizardCtx.fillRect(14, 22, 4, 1); // Mouth
// Staff
wizardCtx.fillStyle = '#8B4513';
wizardCtx.fillRect(4, 20, 2, 28); // Staff
wizardCtx.fillStyle = '#00FFFF';
wizardCtx.beginPath();
wizardCtx.arc(5, 20, 3, 0, Math.PI * 2);
wizardCtx.fill();
fs.writeFileSync(`${assetsDir}/wizard.png`, wizardCanvas.toBuffer('image/png'));
console.log('Created wizard.png');

// Create house1 (wooden house with red roof)
const house1Canvas = createCanvas(64, 64);
const house1Ctx = house1Canvas.getContext('2d');
// Walls
house1Ctx.fillStyle = '#8B4513';
house1Ctx.fillRect(8, 24, 48, 32);
// Roof
house1Ctx.fillStyle = '#A52A2A';
house1Ctx.beginPath();
house1Ctx.moveTo(4, 24);
house1Ctx.lineTo(32, 4);
house1Ctx.lineTo(60, 24);
house1Ctx.fill();
// Door
house1Ctx.fillStyle = '#4B0082';
house1Ctx.fillRect(24, 40, 16, 16);
// Window
house1Ctx.fillStyle = '#87CEEB';
house1Ctx.fillRect(12, 32, 8, 8);
house1Ctx.fillRect(44, 32, 8, 8);
fs.writeFileSync(`${assetsDir}/house1.png`, house1Canvas.toBuffer('image/png'));
console.log('Created house1.png');

// Create house2 (stone house with blue roof)
const house2Canvas = createCanvas(64, 64);
const house2Ctx = house2Canvas.getContext('2d');
// Walls
house2Ctx.fillStyle = '#808080';
house2Ctx.fillRect(8, 24, 48, 32);
// Roof
house2Ctx.fillStyle = '#4682B4';
house2Ctx.beginPath();
house2Ctx.moveTo(4, 24);
house2Ctx.lineTo(32, 4);
house2Ctx.lineTo(60, 24);
house2Ctx.fill();
// Door
house2Ctx.fillStyle = '#8B4513';
house2Ctx.fillRect(24, 40, 16, 16);
// Window
house2Ctx.fillStyle = '#87CEEB';
house2Ctx.fillRect(12, 32, 8, 8);
house2Ctx.fillRect(44, 32, 8, 8);
fs.writeFileSync(`${assetsDir}/house2.png`, house2Canvas.toBuffer('image/png'));
console.log('Created house2.png');

// Create tree
const treeCanvas = createCanvas(48, 64);
const treeCtx = treeCanvas.getContext('2d');
// Trunk
treeCtx.fillStyle = '#8B4513';
treeCtx.fillRect(20, 32, 8, 32);
// Leaves
treeCtx.fillStyle = '#006400';
treeCtx.beginPath();
treeCtx.arc(24, 24, 16, 0, Math.PI * 2);
treeCtx.fill();
treeCtx.beginPath();
treeCtx.arc(16, 16, 12, 0, Math.PI * 2);
treeCtx.fill();
treeCtx.beginPath();
treeCtx.arc(32, 16, 12, 0, Math.PI * 2);
treeCtx.fill();
fs.writeFileSync(`${assetsDir}/tree.png`, treeCanvas.toBuffer('image/png'));
console.log('Created tree.png');

// Create stone
const stoneCanvas = createCanvas(32, 32);
const stoneCtx = stoneCanvas.getContext('2d');
stoneCtx.fillStyle = '#808080';
stoneCtx.beginPath();
stoneCtx.arc(16, 16, 12, 0, Math.PI * 2);
stoneCtx.fill();
stoneCtx.fillStyle = '#A9A9A9';
stoneCtx.beginPath();
stoneCtx.arc(14, 14, 2, 0, Math.PI * 2);
stoneCtx.fill();
fs.writeFileSync(`${assetsDir}/stone.png`, stoneCanvas.toBuffer('image/png'));
console.log('Created stone.png');

// Create scroll for dialog background
const scrollCanvas = createCanvas(400, 300);
const scrollCtx = scrollCanvas.getContext('2d');
// Parchment background
scrollCtx.fillStyle = '#F5DEB3';
scrollCtx.fillRect(0, 0, 400, 300);
// Edges
scrollCtx.fillStyle = '#D2B48C';
scrollCtx.fillRect(0, 0, 400, 10);
scrollCtx.fillRect(0, 290, 400, 10);
scrollCtx.fillRect(0, 0, 10, 300);
scrollCtx.fillRect(390, 0, 10, 300);
// Scroll rolls
scrollCtx.fillStyle = '#8B4513';
scrollCtx.fillRect(0, 0, 400, 20);
scrollCtx.fillRect(0, 280, 400, 20);
// Texture
scrollCtx.strokeStyle = '#D2B48C';
scrollCtx.lineWidth = 0.5;
for (let i = 0; i < 20; i++) {
    scrollCtx.beginPath();
    scrollCtx.moveTo(0, 40 + i * 12);
    scrollCtx.lineTo(400, 40 + i * 12);
    scrollCtx.stroke();
}
fs.writeFileSync(`${assetsDir}/scroll.png`, scrollCanvas.toBuffer('image/png'));
console.log('Created scroll.png');

console.log('All medieval assets created successfully!'); 