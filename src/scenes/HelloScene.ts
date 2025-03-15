export default class HelloScene extends Phaser.Scene {
    private player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
    private obstacles!: Phaser.Physics.Arcade.StaticGroup;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys | undefined;
    private dataText!: Phaser.GameObjects.Text; // To display fetched data

    constructor() {
        super("hello");
    }

    preload() {
        // load static from our public dir
        this.load.image("vite-phaser-logo", "assets/images/vite-phaser.png");

        // load static assets from url
        this.load.image(
            "sky",
            "https://labs.phaser.io/assets/skies/space3.png"
        );
        this.load.image(
            "red",
            "https://labs.phaser.io/assets/particles/red.png"
        );
        this.load.image("player", "assets/images/player.png"); // Load player sprite
        this.load.image("obstacle", "assets/images/obstacle.png"); // Load obstacle sprite
    }

    create() {
        const { width, height } = this.scale;
        const centerX = width * 0.5;
        const centerY = height * 0.5;

        this.add.image(400, 300, "sky");
        const particles = this.add.particles(centerX, centerY, "red");
        const logo = this.add.image(centerX, centerY, "vite-phaser-logo");

        particles.emitParticle(2, 100, 200);

        this.player = this.physics.add.sprite(centerX, centerY, "player");
        this.player.setCollideWorldBounds(true);

        // Create obstacles
        this.obstacles = this.physics.add.staticGroup();
        this.obstacles.create(300, 300, "obstacle");
        this.obstacles.create(500, 300, "obstacle");

        // Add collision detection
        this.physics.add.collider(this.player, this.obstacles);

        // Input handling
        this.cursors = this.input.keyboard?.createCursorKeys();

        // Create a button
        const button = this.add.text(100, 100, 'Fetch Data', { color: '#ff0' })
            .setInteractive()
            .on('pointerdown', () => this.fetchData()); // Call fetchData on click

        // Create a text object to display the data
        this.dataText = this.add.text(100, 150, 'test', { color: '#fff', wordWrap: { width: 400 } });
    }

    private async fetchData() {
        try {
            const resp = await fetch('https://api.sampleapis.com/switch/games');
            const json = await resp.json();
            this.displayData(json[0]);
        } catch (err) {
            this.dataText.setText("error");
        }
    }

    private displayData(data: any) {
        this.dataText.setText(data.name);
    }

    update() {
        const speed = 160;
        this.player.setVelocity(0);

        if (this.cursors) {
            if (this.cursors.left.isDown) {
                this.player.setVelocityX(-speed);
            } else if (this.cursors.right.isDown) {
                this.player.setVelocityX(speed);
            }

            if (this.cursors.up.isDown) {
                this.player.setVelocityY(-speed);
            } else if (this.cursors.down.isDown) {
                this.player.setVelocityY(speed);
            }
        }
    }
}
