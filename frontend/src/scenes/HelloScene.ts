export default class HelloScene extends Phaser.Scene {
    private player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
    private obstacles!: Phaser.Physics.Arcade.StaticGroup;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys | undefined;
    private dataText!: Phaser.GameObjects.Text; // To display fetched data
    private chatInput!: Phaser.GameObjects.DOMElement; // To hold the chat input
    private chatMessages: string[] = []; // To store chat messages
    private isInputMode = false; // To track if the user is in input mode
    private chatInputText = ""; // To hold the current chat input

    // Medieval village elements
    private buildings: Phaser.GameObjects.Image[] = [];
    private trees: Phaser.GameObjects.Image[] = [];
    private villageBackground!: Phaser.GameObjects.TileSprite;

    // NPC related properties
    private wizard!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
    private wizardInteractionZone!: Phaser.GameObjects.Zone;
    private isNearWizard = false;
    private isChatDialogOpen = false;
    private chatDialog!: Phaser.GameObjects.Container;
    private dialogInputText = ""; // Text being input by the user
    private inputText!: Phaser.GameObjects.Text; // Phaser Text object to display user input
    private inputCursor!: Phaser.GameObjects.Rectangle; // Cursor for text input
    private wizardMessages: { sender: string; text: string }[] = [];
    private interactKey!: Phaser.Input.Keyboard.Key;
    private cursorBlinkTimer!: Phaser.Time.TimerEvent; // Timer for cursor blinking

    constructor() {
        super("hello");
    }

    preload() {
        // Load medieval assets
        // this.load.image("village-bg", "assets/images/village-bg.png");
        this.load.image("villager", "assets/images/knight.png");
        this.load.image("wizard", "assets/images/wizard.png");
        this.load.image("house1", "assets/images/house1.png");
        this.load.image("house2", "assets/images/house2.png");
        this.load.image("tree", "assets/images/tree.png");
        this.load.image("stone", "assets/images/stone.png");
        this.load.image("scroll", "assets/images/scroll.png");
    }

    create() {
        const { width, height } = this.scale;
        const centerX = width * 0.5;
        const centerY = height * 0.5;

        // Create medieval village background
        this.add.image(centerX, centerY, "village-bg").setScale(1.2);

        // Add buildings to the village
        this.createVillage();

        // Create player (villager)
        this.player = this.physics.add.sprite(
            centerX,
            centerY + 100,
            "villager"
        );
        this.player.setCollideWorldBounds(true);
        this.player.setScale(0.8);

        // Create wizard NPC
        this.wizard = this.physics.add.sprite(
            centerX - 150,
            centerY - 50,
            "wizard"
        );
        this.wizard.setImmovable(true);
        this.wizard.setScale(0.9);

        // Create wizard interaction zone
        this.wizardInteractionZone = this.add.zone(
            this.wizard.x,
            this.wizard.y,
            100,
            100
        );
        this.physics.world.enable(this.wizardInteractionZone);

        // Create obstacles (stones)
        this.obstacles = this.physics.add.staticGroup();
        this.obstacles
            .create(centerX + 200, centerY + 100, "stone")
            .setScale(0.7);
        this.obstacles
            .create(centerX - 200, centerY + 150, "stone")
            .setScale(0.6);
        this.obstacles
            .create(centerX + 100, centerY - 150, "stone")
            .setScale(0.8);

        // Add collision detection
        this.physics.add.collider(this.player, this.obstacles);
        this.physics.add.collider(this.player, this.wizard);

        // Add buildings as obstacles
        this.buildings.forEach((building) => {
            this.physics.add.existing(building, true);
            this.physics.add.collider(this.player, building);
        });

        // Add trees as obstacles
        this.trees.forEach((tree) => {
            this.physics.add.existing(tree, true);
            this.physics.add.collider(this.player, tree);
        });

        // Add overlap detection for wizard interaction zone
        this.physics.add.overlap(
            this.player,
            this.wizardInteractionZone,
            this.handleWizardProximity,
            undefined,
            this
        );

        // Input handling
        this.cursors = this.input.keyboard?.createCursorKeys();
        if (this.input.keyboard) {
            this.interactKey = this.input.keyboard.addKey(
                Phaser.Input.Keyboard.KeyCodes.E
            );
        }

        // Create chat dialog (initially hidden)
        this.createChatDialog();
    }

    private createVillage() {
        const { width, height } = this.scale;

        // Add houses
        const house1 = this.add.image(width * 0.2, height * 0.3, "house1");
        house1.setScale(1.2);
        this.buildings.push(house1);

        const house2 = this.add.image(width * 0.8, height * 0.4, "house2");
        house2.setScale(1.1);
        this.buildings.push(house2);

        const house3 = this.add.image(width * 0.6, height * 0.2, "house1");
        house3.setScale(1.0);
        house3.flipX = true;
        this.buildings.push(house3);

        // Add trees
        for (let i = 0; i < 5; i++) {
            const tree = this.add.image(
                Phaser.Math.Between(50, width - 50),
                Phaser.Math.Between(50, height - 50),
                "tree"
            );
            tree.setScale(0.7);
            this.trees.push(tree);
        }
    }

    private handleWizardProximity() {
        if (!this.isNearWizard) {
            this.isNearWizard = true;
            // Show interaction prompt
            const promptText = this.add.text(
                this.wizard.x,
                this.wizard.y - 70,
                "Press E to speak with the Wizard",
                {
                    fontSize: "16px",
                    color: "#ffffff",
                    stroke: "#000000",
                    strokeThickness: 3,
                }
            );
            promptText.setOrigin(0.5);
            promptText.setName("interactionPrompt");
        }
    }

    private createChatDialog() {
        const { width, height } = this.scale;

        // Create a container for the chat dialog
        this.chatDialog = this.add.container(width / 2, height / 2);
        this.chatDialog.setVisible(false);
        this.chatDialog.setExclusive(true);

        // Add scroll background
        const background = this.add.image(0, 0, "scroll");
        background.setScale(1.5);
        background.setOrigin(0.5);
        this.chatDialog.add(background);

        // Add title
        const title = this.add.text(
            0,
            -background.displayHeight / 2 + 50,
            "Conversation with the Wizard",
            {
                fontSize: "24px",
                color: "#4a2511",
                fontStyle: "bold",
            }
        );
        title.setOrigin(0.5, 0);
        this.chatDialog.add(title);

        // Add close button
        const closeButton = this.add.text(
            background.displayWidth / 2 - 60,
            -background.displayHeight / 2 + 40,
            "X",
            { fontSize: "24px", color: "#4a2511", fontStyle: "bold" }
        );
        closeButton.setOrigin(0.5);
        closeButton.setInteractive({ useHandCursor: true });
        closeButton.on("pointerdown", () => this.closeChatDialog());
        this.chatDialog.add(closeButton);

        // Add chat messages area
        const messagesArea = this.add.rectangle(
            0,
            0,
            background.displayWidth - 100,
            background.displayHeight - 200,
            0xf8ecc9,
            0.1
        );
        messagesArea.setOrigin(0.5);
        this.chatDialog.add(messagesArea);

        // Add input area background
        const inputArea = this.add.rectangle(
            0,
            background.displayHeight / 2 - 70,
            background.displayWidth - 100,
            60,
            0x4a2511,
            0.3
        );
        inputArea.setOrigin(0.5);
        this.chatDialog.add(inputArea);

        // Add input field (now using Phaser Text instead of DOM Element)
        this.inputText = this.add.text(
            -inputArea.width / 2 + 20,
            background.displayHeight / 2 - 70,
            "",
            {
                fontSize: "16px",
                color: "#4a2511",
                backgroundColor: "#cfb98a",
                padding: { x: 10, y: 5 },
                fixedWidth: inputArea.width - 160, // Leave space for the send button
            }
        );
        this.inputText.setOrigin(0, 0.5);
        this.inputText.setName("inputText");
        this.chatDialog.add(this.inputText);

        // Add text cursor
        this.inputCursor = this.add.rectangle(
            this.inputText.x + 10, // Initial position
            this.inputText.y,
            2,
            this.inputText.height - 10,
            0x4a2511
        );
        this.inputCursor.setOrigin(0, 0.5);
        this.inputCursor.setName("inputCursor");
        this.chatDialog.add(this.inputCursor);

        // Add send button
        const sendButton = this.add.text(
            inputArea.width / 2 - 50,
            background.displayHeight / 2 - 70,
            "Send",
            {
                fontSize: "18px",
                color: "#4a2511",
                backgroundColor: "#d9c27e",
                padding: { x: 10, y: 5 },
            }
        );
        sendButton.setOrigin(0.5);
        sendButton.setInteractive({ useHandCursor: true });
        sendButton.on("pointerdown", () => this.sendWizardMessage());
        this.chatDialog.add(sendButton);

        // Add initial messages
        this.addWizardMessage(
            "Greetings, young villager! I am the wizard of this humble village. What knowledge do you seek?",
            "Wizard"
        );
    }

    private openChatDialog() {
        this.isChatDialogOpen = true;
        this.chatDialog.setVisible(true);

        // Disable player movement
        this.isInputMode = true;

        // Remove interaction prompt
        const prompt = this.children.getByName("interactionPrompt");
        if (prompt) {
            prompt.destroy();
        }

        // Reset input text
        this.dialogInputText = "";
        this.updateInputDisplay();

        // Start cursor blinking
        this.cursorBlinkTimer = this.time.addEvent({
            delay: 500,
            callback: this.blinkCursor,
            callbackScope: this,
            loop: true,
        });

        // Set up input handling for chat
        this.input.keyboard?.on("keydown", this.handleDialogKeydown, this);
    }

    private blinkCursor() {
        if (this.inputCursor) {
            this.inputCursor.setVisible(!this.inputCursor.visible);
        }
    }

    private updateInputDisplay() {
        // Update the displayed text
        this.inputText.setText(this.dialogInputText);

        // Update cursor position based on text width
        const textWidth =
            this.dialogInputText.length > 0
                ? this.inputText.width - 20 // Adjust for padding
                : 10;

        this.inputCursor.x = this.inputText.x + textWidth + 10;
        this.inputCursor.setVisible(true); // Ensure cursor is visible after input
    }

    private closeChatDialog() {
        this.isChatDialogOpen = false;
        this.chatDialog.setVisible(false);

        // Enable player movement
        this.isInputMode = false;

        // Remove keyboard listener
        this.input.keyboard?.off("keydown", this.handleDialogKeydown, this);

        // Stop cursor blinking
        if (this.cursorBlinkTimer) {
            this.cursorBlinkTimer.remove();
        }
    }

    private handleDialogKeydown(event: KeyboardEvent) {
        if (!this.isChatDialogOpen) return;

        if (event.key === "Enter") {
            this.sendWizardMessage();
        } else if (event.key === "Escape") {
            this.closeChatDialog();
        } else if (event.key === "Backspace") {
            // Remove last character
            if (this.dialogInputText.length > 0) {
                this.dialogInputText = this.dialogInputText.slice(0, -1);
                this.updateInputDisplay();
            }
        } else if (event.key.length === 1) {
            // Add character to input (limited to printable characters)
            this.dialogInputText += event.key;
            this.updateInputDisplay();
        }
    }

    private async sendWizardMessage() {
        const message = this.dialogInputText;

        if (message.trim() === "") return;

        // Add player message
        this.addWizardMessage(message, "Villager");

        // Clear input
        this.dialogInputText = "";
        this.updateInputDisplay();

        // Send message to backend
        try {
            const resp = await fetch("http://localhost:8001/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    message: message,
                    session_id: "default",
                }),
            });
            const json = await resp.json();
            this.addWizardMessage(json.response, "Wizard");
        } catch (error) {
            console.error("Error communicating with the wizard:", error);
            this.addWizardMessage(
                "I seem to be having trouble with my magical powers...",
                "Wizard"
            );
        }
    }

    private addWizardMessage(text: string, sender: string) {
        this.wizardMessages.push({ sender, text });
        this.updateChatMessages();
    }

    private updateChatMessages() {
        // Remove existing message displays
        this.chatDialog.getAll().forEach((child) => {
            if (child.name && child.name.startsWith("message_")) {
                this.chatDialog.remove(child);
                child.removeFromDisplayList().removeFromUpdateList();
            }
        });

        const { width } = this.scale;
        const maxMessages = 4; // Maximum number of messages to display
        const startIndex = Math.max(
            0,
            this.wizardMessages.length - maxMessages
        );
        const visibleMessages = this.wizardMessages.slice(startIndex);

        visibleMessages.forEach((message, index) => {
            const yPos = -100 + index * 60;
            const isWizard = message.sender === "Wizard";
            const xPos = isWizard ? -width * 0.3 : width * 0.3;
            const bgColor = isWizard ? 0x5d4037 : 0x795548;
            const textColor = isWizard ? "#e6ccff" : "#ffffff";

            // Create message background and add directly to the container
            const msgBg = this.add.rectangle(
                xPos,
                yPos,
                width * 0.35,
                50,
                bgColor,
                0.8
            );
            msgBg.setOrigin(isWizard ? 0 : 1, 0.5);
            msgBg.name = `message_bg_${index}`;
            this.chatDialog.add(msgBg);

            // Create message text and add directly to the container
            const msgText = this.add.text(
                xPos + (isWizard ? 10 : -10),
                yPos,
                message.text,
                {
                    fontSize: "16px",
                    color: textColor,
                    wordWrap: { width: width * 0.33 },
                    fontStyle: isWizard ? "italic" : "normal",
                }
            );
            msgText.setOrigin(isWizard ? 0 : 1, 0.5);
            msgText.name = `message_text_${index}`;
            this.chatDialog.add(msgText);
        });
    }

    update() {
        const speed = 160;
        this.player.setVelocity(0);

        // Check for wizard interaction
        if (
            this.isNearWizard &&
            this.interactKey &&
            Phaser.Input.Keyboard.JustDown(this.interactKey) &&
            !this.isChatDialogOpen
        ) {
            this.openChatDialog();
        }

        // Update wizard interaction state
        if (this.isNearWizard) {
            const distance = Phaser.Math.Distance.Between(
                this.player.x,
                this.player.y,
                this.wizard.x,
                this.wizard.y
            );

            if (distance > 100) {
                this.isNearWizard = false;
                const prompt = this.children.getByName("interactionPrompt");
                if (prompt) {
                    prompt.destroy();
                }
            }
        }

        if (!this.isInputMode) {
            // Only allow movement if not in input mode
            if (this.cursors) {
                if (this.cursors.left.isDown) {
                    this.player.setVelocityX(-speed);
                    this.player.flipX = true;
                } else if (this.cursors.right.isDown) {
                    this.player.setVelocityX(speed);
                    this.player.flipX = false;
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
