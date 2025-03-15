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
    
    // NPC related properties
    private npc!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
    private npcInteractionZone!: Phaser.GameObjects.Zone;
    private isNearNpc: boolean = false;
    private isChatDialogOpen: boolean = false;
    private chatDialog!: Phaser.GameObjects.Container;
    private dialogInput!: Phaser.GameObjects.DOMElement;
    private dialogInputText: string = '';
    private npcMessages: {sender: string, text: string}[] = [];
    private interactKey!: Phaser.Input.Keyboard.Key;

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
        this.load.image("npc", "assets/images/npc.png"); // Load NPC sprite
    }

    create() {
        const { width, height } = this.scale;
        const centerX = width * 0.5;
        const centerY = height * 0.5;

        this.add.image(400, 300, "sky");
        this.add.image(centerX, centerY, "vite-phaser-logo");
        const particles = this.add.particles(centerX, centerY, "red");

        particles.emitParticle(2, 100, 200);

        this.player = this.physics.add.sprite(centerX, centerY, "player");
        this.player.setCollideWorldBounds(true);

        // Create NPC
        this.npc = this.physics.add.sprite(centerX + 100, centerY - 50, "npc");
        this.npc.setImmovable(true);
        
        // Create NPC interaction zone (larger than the NPC sprite)
        this.npcInteractionZone = this.add.zone(this.npc.x, this.npc.y, 100, 100);
        this.physics.world.enable(this.npcInteractionZone);
        
        // Create obstacles
        this.obstacles = this.physics.add.staticGroup();
        this.obstacles.create(300, 300, "obstacle");
        this.obstacles.create(500, 300, "obstacle");

        // Add collision detection
        this.physics.add.collider(this.player, this.obstacles);
        this.physics.add.collider(this.player, this.npc);
        
        // Add overlap detection for NPC interaction zone
        this.physics.add.overlap(
            this.player,
            this.npcInteractionZone,
            this.handleNpcProximity,
            undefined,
            this
        );

        // Input handling
        this.cursors = this.input.keyboard?.createCursorKeys();
        if (this.input.keyboard) {
            this.interactKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
        }

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

        // Create chat dialog (initially hidden)
        this.createChatDialog();
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
            // get randomIndex
            const randomIndex = Math.floor(Math.random() * json.length);
            this.displayData(json[randomIndex]);
        } catch (err) {
            this.dataText.setText("error");
        }
    }

    private displayData(data: any) {
        this.dataText.setText(data.name);
    }

    private handleNpcProximity() {
        if (!this.isNearNpc) {
            this.isNearNpc = true;
            // Show interaction prompt
            const promptText = this.add.text(
                this.npc.x,
                this.npc.y - 50,
                "Press E to talk",
                { fontSize: '16px', color: '#ffffff' }
            );
            promptText.setOrigin(0.5);
            promptText.setName('interactionPrompt');
        }
    }

    private createChatDialog() {
        const { width, height } = this.scale;
        
        // Create a container for the chat dialog
        this.chatDialog = this.add.container(width / 2, height / 2);
        this.chatDialog.setVisible(false);
        this.chatDialog.setExclusive(true);
        
        // Add background
        const background = this.add.rectangle(0, 0, width * 0.8, height * 0.7, 0x000000, 0.8);
        background.setOrigin(0.5);
        this.chatDialog.add(background);
        
        // Add title
        const title = this.add.text(0, -background.height / 2 + 20, "Chat with NPC", {
            fontSize: '24px',
            color: '#ffffff'
        });
        title.setOrigin(0.5, 0);
        this.chatDialog.add(title);
        
        // Add close button
        const closeButton = this.add.text(
            background.width / 2 - 30,
            -background.height / 2 + 20,
            "X",
            { fontSize: '24px', color: '#ffffff' }
        );
        closeButton.setOrigin(0.5);
        closeButton.setInteractive({ useHandCursor: true });
        closeButton.on('pointerdown', () => this.closeChatDialog());
        this.chatDialog.add(closeButton);
        
        // Add chat messages area
        const messagesArea = this.add.rectangle(
            0,
            0,
            background.width - 40,
            background.height - 120,
            0x333333,
            0.5
        );
        messagesArea.setOrigin(0.5);
        this.chatDialog.add(messagesArea);
        
        // Add input area
        const inputArea = this.add.rectangle(
            0,
            background.height / 2 - 40,
            background.width - 40,
            60,
            0x555555,
            0.8
        );
        inputArea.setOrigin(0.5);
        this.chatDialog.add(inputArea);
        
        // Add input field
        this.dialogInput = this.add.dom(
            0,
            background.height / 2 - 40,
            'input',
            'width: 80%; height: 40px; padding: 5px; font-size: 16px;'
        );
        this.dialogInput.setOrigin(0.5);
        this.chatDialog.add(this.dialogInput);
        
        // Add send button
        const sendButton = this.add.text(
            inputArea.width / 2 - 50,
            background.height / 2 - 40,
            "Send",
            { fontSize: '18px', color: '#ffffff', backgroundColor: '#4a4a4a', padding: { x: 10, y: 5 } }
        );
        sendButton.setOrigin(0.5);
        sendButton.setInteractive({ useHandCursor: true });
        sendButton.on('pointerdown', () => this.sendNpcMessage());
        this.chatDialog.add(sendButton);
        
        // Add initial messages
        this.addNpcMessage("Hello there! How can I help you today?", "NPC");
    }

    private openChatDialog() {
        this.isChatDialogOpen = true;
        this.chatDialog.setVisible(true);
        
        // Disable player movement
        this.isInputMode = true;
        
        // Remove interaction prompt
        const prompt = this.children.getByName('interactionPrompt');
        if (prompt) {
            prompt.destroy();
        }
        
        // Focus on input field
        const inputElement = this.dialogInput.getChildByName('input') as HTMLInputElement;
        if (inputElement) {
            inputElement.focus();
        }
        
        // Set up input handling for chat
        this.input.keyboard?.on('keydown', this.handleDialogKeydown, this);
    }
    
    private closeChatDialog() {
        this.isChatDialogOpen = false;
        this.chatDialog.setVisible(false);
        
        // Enable player movement
        this.isInputMode = false;
        
        // Remove keyboard listener
        this.input.keyboard?.off('keydown', this.handleDialogKeydown, this);
    }
    
    private handleDialogKeydown(event: KeyboardEvent) {
        if (!this.isChatDialogOpen) return;
        
        if (event.key === 'Enter') {
            this.sendNpcMessage();
        } else if (event.key === 'Escape') {
            this.closeChatDialog();
        } else if (event.key === 'Backspace') {
            this.dialogInputText = this.dialogInputText.slice(0, -1);
        } else if (event.key.length === 1) {
            this.dialogInputText += event.key;
        }
        
        // Update input field
        const inputElement = this.dialogInput.getChildByName('input') as HTMLInputElement;
        if (inputElement) {
            inputElement.value = this.dialogInputText;
        }
    }
    
    private sendNpcMessage() {
        const inputElement = this.dialogInput.getChildByName('input') as HTMLInputElement;
        const message = inputElement ? inputElement.value : this.dialogInputText;
        
        if (message.trim() === '') return;
        
        // Add player message
        this.addNpcMessage(message, "Player");
        
        // Clear input
        this.dialogInputText = '';
        if (inputElement) {
            inputElement.value = '';
            inputElement.focus();
        }
        
        // Simulate NPC response (replace with API call later)
        setTimeout(() => {
            const responses = [
                "That's interesting! Tell me more.",
                "I understand. How can I assist you further?",
                "I'm processing that information. Give me a moment.",
                "That's a good point. Have you considered an alternative approach?",
                "I'm here to help with any questions you might have."
            ];
            const randomResponse = responses[Math.floor(Math.random() * responses.length)];
            this.addNpcMessage(randomResponse, "NPC");
        }, 1000);
    }
    
    private addNpcMessage(text: string, sender: string) {
        this.npcMessages.push({ sender, text });
        this.updateChatMessages();
    }
    
    private updateChatMessages() {
        // Remove existing message displays
        this.chatDialog.getAll().forEach(child => {
            if (child.name && child.name.startsWith('message_')) {
                this.chatDialog.remove(child);
                child.removeFromDisplayList().removeFromUpdateList();
            }
        });

        const { width } = this.scale;
        const maxMessages = 4; // Maximum number of messages to display
        const startIndex = Math.max(0, this.npcMessages.length - maxMessages);
        const visibleMessages = this.npcMessages.slice(startIndex);

        visibleMessages.forEach((message, index) => {
            const yPos = -100 + (index * 60);
            const isNpc = message.sender === "NPC";
            const xPos = isNpc ? -width * 0.3 : width * 0.1;
            // const align = isNpc ? 'left' : 'right';
            const bgColor = isNpc ? 0x4a6fa5 : 0x6a8759;

            // Create message background and add directly to the container
            const msgBg = this.add.rectangle(
                xPos,
                yPos,
                width * 0.35,
                50,
                bgColor,
                0.8
            );
            msgBg.setOrigin(isNpc ? 0 : 1, 0.5);
            msgBg.name = `message_bg_${index}`;
            this.chatDialog.add(msgBg);

            // Create message text and add directly to the container
            const msgText = this.add.text(
                xPos + (isNpc ? 10 : -10),
                yPos,
                message.text,
                { fontSize: '16px', color: '#ffffff', wordWrap: { width: width * 0.33 } }
            );
            msgText.setOrigin(isNpc ? 0 : 1, 0.5);
            msgText.name = `message_text_${index}`;
            this.chatDialog.add(msgText);
        });
    }

    update() {
        const speed = 160;
        this.player.setVelocity(0);

        // Check for NPC interaction
        if (this.isNearNpc && this.interactKey && Phaser.Input.Keyboard.JustDown(this.interactKey) && !this.isChatDialogOpen) {
            this.openChatDialog();
        }

        // Update NPC interaction state
        if (this.isNearNpc) {
            const distance = Phaser.Math.Distance.Between(
                this.player.x, this.player.y,
                this.npc.x, this.npc.y
            );
            
            if (distance > 100) {
                this.isNearNpc = false;
                const prompt = this.children.getByName('interactionPrompt');
                if (prompt) {
                    prompt.destroy();
                }
            }
        }

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
