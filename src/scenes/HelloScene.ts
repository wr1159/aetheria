export default class HelloScene extends Phaser.Scene {
    private player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
    private obstacles!: Phaser.Physics.Arcade.StaticGroup;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys | undefined;
    private dataText!: Phaser.GameObjects.Text; // To display fetched data
    private chatInput!: Phaser.GameObjects.DOMElement; // To hold the chat input
    private chatMessages: string[] = []; // To store chat messages
    private isInputMode: boolean = false; // To track if the user is in input mode
    private chatInputText: string = ''; // To hold the current chat input
    // TODO: Show current input 

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

        // Create a chat input box
        this.chatInput = this.add.dom(centerX, centerY).createFromHTML('<input type="text" placeholder="Type your message..." style="width: 200px;"/>');
        this.chatInput.addListener('keydown');

        // Listen for key events
        this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
            if (this.isInputMode) {
                if (event.key === 'Enter') {
                    this.sendMessage(this.chatInputText);
                    this.chatInputText = ''; // Clear input after sending
                    this.isInputMode = false; // Exit input mode
                } else if (event.key === 'Backspace') {
                    this.chatInputText = this.chatInputText.slice(0, -1); // Remove last character
                } else if (event.key.length === 1) {
                    this.chatInputText += event.key; // Add character to input
                }
            } else if (event.key === 'Enter') {
                this.isInputMode = true; // Enter input mode
            }
        });

        // Create a button
        const button = this.add.text(100, 100, 'Fetch Data', { color: '#ff0' })
            .setInteractive()
            .on('pointerdown', () => this.fetchData()) // Call fetchData on click
            .on('pointerover', () => button.setStyle({ fill: '#0f0' })) // Change color on hover
            .on('pointerout', () => button.setStyle({ fill: '#ff0' })); // Reset color on hover out

        // Change cursor to pointer
        button.setInteractive({ useHandCursor: true });

        // Create a text object to display the data
        this.dataText = this.add.text(100, 150, 'test', { color: '#fff', wordWrap: { width: 400 } });
    }

    private sendMessage(message: string) {
        if (this.chatMessages.length > 5) {
            this.chatMessages = this.chatMessages.slice(1);
            console.log("slice", this.chatMessages);
        }
        this.chatMessages.push(message);
        console.log("afterpush", this.chatMessages);
        this.displayChatMessages();
    }

    private displayChatMessages() {
        // Clear previous chat display
        this.children.list.forEach(child => {
            if (child.name === 'chatDisplay') {
                child.destroy();
            }
        });

        // Create a new chat display
        const chatDisplay = this.add.text(10, this.scale.height - 100, this.chatMessages.join('\n'), { color: '#fff', wordWrap: { width: 200 } });
        chatDisplay.setOrigin(0); // Align to the bottom left
        chatDisplay.name = 'chatDisplay'; // Set name for easy access
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

        if (!this.isInputMode) { // Only allow movement if not in input mode
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
}
