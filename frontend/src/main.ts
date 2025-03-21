import Phaser from "phaser";
import HelloScene from "./scenes/HelloScene";

const config: Phaser.Types.Core.GameConfig = {
    parent: "app",
    type: Phaser.AUTO,
    width: 1280,
    height: 640,
    scale: {
        mode: Phaser.Scale.ScaleModes.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics: {
        default: "arcade",
    },
    scene: [HelloScene],
};

export default new Phaser.Game(config);
