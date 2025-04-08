export default class HelloScene extends Phaser.Scene {
    private player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
    private obstacles!: Phaser.Physics.Arcade.StaticGroup;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys | undefined;
    private isInputMode = false; // To track if the user is in input mode
    private backgroundMusic!: Phaser.Sound.BaseSound;
    private foreground!: Phaser.GameObjects.Image; // Add foreground property

    // Medieval village elements

    // NPC related properties
    private wizard!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
    private wizardInteractionZone!: Phaser.GameObjects.Zone;
    private isNearWizard = false;
    private isChatDialogOpen = false;
    private chatDialog!: Phaser.GameObjects.Container;
    private dialogInputText = ""; // Text being input by the user
    private inputText!: Phaser.GameObjects.Text; // Phaser Text object to display user input
    private wizardMessages: { sender: string; text: string }[] = [];
    private interactKey!: Phaser.Input.Keyboard.Key;
    private messageContainer!: Phaser.GameObjects.Container; // Container for scrollable messages
    private messagesArea!: Phaser.GameObjects.Rectangle; // Visual area for messages
    private messagesMask!: Phaser.Display.Masks.GeometryMask; // Mask for limiting message visibility
    private scrollPosition = 0; // Current scroll position
    private scrollableHeight = 0; // Total height of all messages

    // Add sound properties
    private scrollOpenSound!: Phaser.Sound.BaseSound;

    // Add these properties after the other private properties
    private questIcon!: Phaser.GameObjects.Image;
    private questDialog!: Phaser.GameObjects.Container;
    private isQuestDialogOpen = false;
    private quests: {
        title: string;
        description: string;
        completed: boolean;
    }[] = [
        {
            title: "Unlock Hidden Quest from Wizard",
            description: "Find and speak with the village wizard",
            completed: false,
        },
        {
            title: "Explore the Village",
            description: "Discover the various areas of the medieval village",
            completed: false,
        },
    ];
    constructor() {
        super("hello");
    }

    preload() {
        // Load medieval assets
        this.load.image("village-bg", "assets/images/village-bg.png");
        this.load.image("villager", "assets/images/wizardnpc.png");
        this.load.image("wizard", "assets/images/wizard.png");

        this.load.image("scroll", "assets/images/scroll.png");
        this.load.image("cursor", "assets/images/cursor.png"); // Load cursor image
        this.load.image("foreground", "assets/images/foreground.png"); // Load foreground image
        this.load.image("mini-scroll", "assets/images/quest-scroll.png");

        // Load background music
        this.load.audio("medieval-music", "assets/audio/medieval-music.mp3");

        // Load sound effects
        this.load.audio("scrollOpen", "assets/audio/scroll-open.wav");
    }

    create() {
        const { width, height } = this.scale;
        const centerX = width * 0.5;
        const centerY = height * 0.5;

        // Hide the default cursor

        // Play background music
        this.backgroundMusic = this.sound.add("medieval-music", {
            volume: 0.5,
            loop: true,
        });
        this.backgroundMusic.play();

        // Create medieval village background
        this.add.image(centerX, centerY, "village-bg").setScale(1.2);

        // Create foreground (will be in front of player)
        this.foreground = this.add.image(centerX, centerY, "foreground");
        this.foreground.setScale(1.2);
        this.foreground.setDepth(0.9); // Ensure it's above the player

        // Add buildings to the village

        // Create player (villager)
        this.player = this.physics.add.sprite(
            centerX,
            centerY + 100,
            "villager"
        );
        this.player.setCollideWorldBounds(true);
        this.player.setScale(0.8);

        // Set custom collision box for player (bottom 60% of sprite)
        const playerHeight = this.player.height * 0.8; // Account for scale
        const collisionHeight = playerHeight * 0.5; // 60% of sprite height
        const collisionOffset = (playerHeight - collisionHeight) / 2; // Center the collision box
        this.player.body.setSize(
            this.player.width * 0.8,
            collisionHeight,
            false
        );
        this.player.body.setOffset(0, collisionOffset);

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
        this.obstacles.add(
            this.add.rectangle(centerX, centerY - 200, 1500, 200, 0x000000, 0)
        );
        this.obstacles.add(
            this.add.rectangle(
                centerX + 535,
                centerY - 100,
                10,
                200,
                0x000000,
                0
            )
        );
        this.obstacles.add(
            this.add.rectangle(
                centerX + 600,
                centerY - 100,
                50,
                200,
                0x000000,
                0
            )
        );
        this.obstacles.add(
            this.add.rectangle(
                centerX - 830,
                centerY + 200,
                750,
                280,
                0x000000,
                0
            )
        );
        this.obstacles.add(
            this.add.rectangle(
                centerX - 250,
                centerY + 200,
                280,
                280,
                0x000000,
                0
            )
        );
        this.obstacles.add(
            this.add.rectangle(
                centerX - 450,
                centerY + 350,
                750,
                100,
                0x000000,
                0
            )
        );
        this.obstacles.add(
            this.add.rectangle(
                centerX + 850,
                centerY + 200,
                750,
                280,
                0x000000,
                0
            )
        );
        this.obstacles.add(
            this.add.rectangle(
                centerX + 200,
                centerY + 350,
                250,
                100,
                0x000000,
                0
            )
        );
        this.obstacles.add(
            this.add.rectangle(
                centerX + 570,
                centerY + 350,
                250,
                100,
                0x000000,
                0
            )
        );
        this.obstacles.add(
            this.add.rectangle(
                centerX + 250,
                centerY + 170,
                50,
                100,
                0x000000,
                0
            )
        );
        this.obstacles.add(
            this.add.rectangle(
                centerX + 150,
                centerY + 190,
                50,
                70,
                0x000000,
                0
            )
        );
        this.obstacles.add(
            this.add.rectangle(
                centerX + 220,
                centerY + 100,
                150,
                20,
                0x000000,
                0
            )
        );

        // Add collision detection
        this.physics.add.collider(this.player, this.obstacles);
        this.physics.add.collider(this.player, this.wizard);

        // Add trees as obstacles

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

        // After loading sounds
        this.scrollOpenSound = this.sound.add("scrollOpen");
        // Create quest icon in top right
        this.questIcon = this.add.image(
            width - 40,
            height - 640,
            "mini-scroll"
        );
        this.questIcon.setScale(0.1);
        this.questIcon.setInteractive({ useHandCursor: true });
        this.questIcon.setDepth(1.1);

        // Add a pulsing effect to make it more noticeable
        this.tweens.add({
            targets: this.questIcon,
            scale: 0.11,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: "Sine.easeInOut",
        });

        // Create quest dialog (initially hidden)
        this.createQuestDialog();

        // Add click handler for quest icon
        this.questIcon.on("pointerdown", () => {
            if (!this.isQuestDialogOpen) {
                this.openQuestDialog();
            }
        });
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
        this.chatDialog.setDepth(1.2);
        // Add scroll background
        const background = this.add.image(0, 0, "scroll");
        background.setScale(1.5);
        background.setOrigin(0.5);

        this.chatDialog.add(background);

        // Add title
        const title = this.add.text(
            0,
            -background.displayHeight / 2 + 36,
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
            background.displayWidth / 2 - 56,
            -background.displayHeight / 2 + 44,
            "X",
            { fontSize: "24px", color: "#4a2511", fontStyle: "bold" }
        );
        closeButton.setOrigin(0.5);
        closeButton.setInteractive({ useHandCursor: true });
        closeButton.on("pointerdown", () => this.closeChatDialog());
        this.chatDialog.add(closeButton);

        // Add chat messages area - position it higher to leave space for input
        this.messagesArea = this.add.rectangle(
            0,
            0, // Moved up to leave space for input at the bottom
            background.displayWidth - 270,
            background.displayHeight - 180, // Slightly smaller to make room for input
            0xf8ecc9,
            0.1
        );
        this.messagesArea.setOrigin(0.5);
        this.messagesArea.setInteractive(); // Make it interactive for scroll events
        this.chatDialog.add(this.messagesArea);

        // Create a graphics object for the mask
        const maskGraphics = this.add.graphics();
        maskGraphics.fillStyle(0xffffff);
        maskGraphics.setAlpha(0);
        maskGraphics.fillRect(
            width / 2 - this.messagesArea.width / 2,
            height / 2 - this.messagesArea.height / 2 - 0, // Adjust for the new position
            this.messagesArea.width,
            this.messagesArea.height
        );

        // Create the mask from the graphics object
        this.messagesMask = new Phaser.Display.Masks.GeometryMask(
            this,
            maskGraphics
        );

        // Create container for messages that will be masked
        this.messageContainer = this.add.container(0, 0);
        // Calculate initial Y position - align with the top of the messages area
        const initialY = -this.messagesArea.height / 2 - 20;
        this.messageContainer.setPosition(0, initialY);
        this.messageContainer.setMask(this.messagesMask);
        this.chatDialog.add(this.messageContainer);

        // Set up scrolling with mouse wheel
        this.input.on(
            "wheel",
            (
                pointer: Phaser.Input.Pointer,
                _gameObjects: any,
                _deltaX: number,
                deltaY: number
            ) => {
                if (
                    this.isChatDialogOpen &&
                    this.messagesArea.getBounds().contains(pointer.x, pointer.y)
                ) {
                    this.scrollMessages(deltaY);
                }
            }
        );

        // Add input area background at the bottom
        const inputArea = this.add.rectangle(
            0,
            background.displayHeight / 2 - 50,
            background.displayWidth - 270,
            60, // Initial height, will expand if needed
            0x4a2511,
            0.3
        );
        inputArea.setOrigin(0.5);
        inputArea.setName("inputArea"); // So we can reference it later
        this.chatDialog.add(inputArea);

        // Add input field (now using Phaser Text instead of DOM Element)
        this.inputText = this.add.text(
            -inputArea.width / 2 + 20,
            background.displayHeight / 2 - 50,
            "",
            {
                fontSize: "16px",
                color: "#4a2511",
                backgroundColor: "#cfb98a",
                padding: { x: 10, y: 5 },
                fixedWidth: inputArea.width - 160, // Leave space for the send button
                wordWrap: {
                    width: inputArea.width - 160,
                    useAdvancedWrap: true,
                }, // Enable word wrapping
            }
        );
        this.inputText.setOrigin(0, 0.5);
        this.inputText.setName("inputText");
        this.chatDialog.add(this.inputText);

        // Add send button
        const sendButton = this.add.text(
            inputArea.width / 2 - 50,
            background.displayHeight / 2 - 50,
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
        sendButton.setName("sendButton");
        this.chatDialog.add(sendButton);

        // Add initial messages
        this.addWizardMessage(
            "Greetings! I am Niloy the Wizard, what knowledge do you seek?",
            "Wizard"
        );
    }

    private scrollMessages(deltaY: number) {
        // Calculate new scroll position
        const scrollSpeed = 15;
        this.scrollPosition += deltaY > 0 ? scrollSpeed : -scrollSpeed;

        // Clamp scroll position
        const maxScroll = Math.max(
            -this.messagesArea.height,
            this.scrollableHeight - this.messagesArea.height
        );
        this.scrollPosition = Phaser.Math.Clamp(
            this.scrollPosition,
            0,
            maxScroll
        );

        // Update message container position - the key change is to use the initial starting point
        const initialY = -this.messagesArea.height / 2 - 30;
        this.messageContainer.y = initialY - this.scrollPosition;
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

        // Set up input handling for chat
        this.input.keyboard?.on("keydown", this.handleDialogKeydown, this);

        // Scroll to bottom of messages
        this.scrollToBottom();

        // Play scroll open sound
        this.scrollOpenSound.play();

        // Complete the "Talk to the Wizard" quest if it's the first time
        const wizardQuest = this.quests.find(
            (q) => q.title === "Talk to the Wizard"
        );
        if (wizardQuest && !wizardQuest.completed) {
            this.completeQuest("Talk to the Wizard");
        }
    }

    private scrollToBottom() {
        // Calculate max scroll and set to bottom
        const maxScroll = Math.max(
            0,
            this.scrollableHeight - this.messagesArea.height
        );
        this.scrollPosition = maxScroll;

        // Update message container position
        this.messageContainer.y =
            -this.scrollPosition +
            this.messagesArea.height / 2 -
            this.scrollableHeight;
    }

    private updateInputDisplay() {
        // Update the displayed text
        this.inputText.setText(this.dialogInputText);

        // Get input area reference
        const inputArea = this.chatDialog.getByName(
            "inputArea"
        ) as Phaser.GameObjects.Rectangle;
        const sendButton = this.chatDialog.getByName(
            "sendButton"
        ) as Phaser.GameObjects.Text;

        // Adjust height of input area based on text height
        if (this.inputText.height > 40) {
            inputArea.height = this.inputText.height + 20; // Add padding

            // Ensure input text is vertically aligned correctly
            this.inputText.setOrigin(0, 0.5);

            // Reposition send button to align with input area
            if (sendButton) {
                sendButton.y = inputArea.y;
            }
        } else {
            // Reset to default height if text is short
            inputArea.height = 60;
        }
    }

    private closeChatDialog() {
        this.isChatDialogOpen = false;
        this.chatDialog.setVisible(false);

        // Enable player movement
        this.isInputMode = false;

        // Remove keyboard listener
        this.input.keyboard?.off("keydown", this.handleDialogKeydown, this);
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
        } else if (event.ctrlKey && event.key === "v") {
            // Handle paste (Ctrl+V)
            navigator.clipboard
                .readText()
                .then((text) => {
                    this.dialogInputText += text;
                    this.updateInputDisplay();
                })
                .catch((err) => {
                    console.error("Failed to read clipboard: ", err);
                });
        } else if (event.ctrlKey && event.key === "c") {
            // Handle copy (Ctrl+C)
            if (this.dialogInputText.length > 0) {
                navigator.clipboard
                    .writeText(this.dialogInputText)
                    .catch((err) => {
                        console.error("Failed to copy text: ", err);
                    });
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

        // Get or create session ID
        let sessionId = localStorage.getItem("sessionId");
        if (!sessionId) {
            sessionId = this.generateUUID();
            localStorage.setItem("sessionId", sessionId);
        }

        // Send message to backend
        try {
            const resp = await fetch("http://localhost:8001/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    message: message,
                    session_id: sessionId,
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

        // Play message sent sound
    }

    // Generate a UUID v4
    private generateUUID(): string {
        return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
            /[xy]/g,
            function (c) {
                const r = (Math.random() * 16) | 0;
                const v = c === "x" ? r : (r & 0x3) | 0x8;
                return v.toString(16);
            }
        );
    }

    private addWizardMessage(text: string, sender: string) {
        this.wizardMessages.push({ sender, text });
        this.updateChatMessages();

        // Auto-scroll to the bottom when a new message is added
        // this.scrollToBottom();
    }

    private updateChatMessages() {
        // Clear existing messages from container
        this.messageContainer.removeAll(true);

        // Vertical position tracker starting at top
        let yPos = 0;

        // Create all messages
        this.wizardMessages.forEach((message) => {
            const isWizard = message.sender === "Wizard";
            const xPos = isWizard
                ? -this.messagesArea.width / 2 + 20
                : this.messagesArea.width / 2 - 20;
            const bgColor = isWizard ? 0x5d4037 : 0x795548;
            const textColor = isWizard ? "#d07eed" : "#ffffff";

            // Create message text first so we can measure its height
            const msgText = this.add.text(xPos, yPos, message.text, {
                fontSize: "16px",
                color: textColor,
                wordWrap: {
                    width: this.messagesArea.width * 0.6,
                    useAdvancedWrap: true,
                },
                fontStyle: isWizard ? "italic" : "normal",
                align: isWizard ? "left" : "right",
                padding: { x: 5, y: 5 },
            });
            msgText.setOrigin(isWizard ? 0 : 1, 0);

            // Create message background sized to fit the text
            const padding = 10; // Padding around text
            const msgBg = this.add.rectangle(
                xPos,
                yPos + msgText.height / 2,
                msgText.width + padding * 2,
                msgText.height + padding,
                bgColor,
                0.8
            );
            msgBg.setOrigin(isWizard ? 0 : 1, 0.5);

            // Add to message container (background first, then text)
            this.messageContainer.add(msgBg);
            this.messageContainer.add(msgText);

            // Update vertical position for next message
            yPos += msgText.height + 15; // Add spacing between messages
        });

        // Update total scrollable height
        this.scrollableHeight = yPos > 0 ? yPos : 0;

        this.messageContainer.y =
            this.messagesArea.height / 2 - this.scrollableHeight;
        this.scrollPosition = this.scrollableHeight;
    }

    private createQuestDialog() {
        const { width, height } = this.scale;

        // Create container for quest dialog
        this.questDialog = this.add.container(width / 2, height / 2);
        this.questDialog.setVisible(false);
        this.questDialog.setDepth(1.2);

        // Add scroll background
        const background = this.add.image(0, 0, "scroll");
        background.setScale(1.2);
        this.questDialog.add(background);

        // Add title
        const title = this.add.text(
            0,
            -background.displayHeight / 2 + 40,
            "Quests",
            {
                fontSize: "32px",
                color: "#4a2511",
                fontStyle: "bold",
            }
        );
        title.setOrigin(0.5);
        this.questDialog.add(title);

        // Add close button
        const closeButton = this.add.text(
            background.displayWidth / 2 - 40,
            -background.displayHeight / 2 + 40,
            "X",
            { fontSize: "24px", color: "#4a2511", fontStyle: "bold" }
        );
        closeButton.setOrigin(0.5);
        closeButton.setInteractive({ useHandCursor: true });
        closeButton.on("pointerdown", () => this.closeQuestDialog());
        this.questDialog.add(closeButton);

        // Add quests list
        let yPos = -background.displayHeight / 3;
        this.quests.forEach((quest, index) => {
            // Quest title
            const questTitle = this.add.text(
                -background.displayWidth / 3,
                yPos,
                quest.title,
                {
                    fontSize: "20px",
                    color: "#4a2511",
                    fontStyle: "bold",
                }
            );
            this.questDialog.add(questTitle);

            // Quest description
            const questDesc = this.add.text(
                -background.displayWidth / 3,
                yPos + 25,
                quest.description,
                {
                    fontSize: "16px",
                    color: "#4a2511",
                    wordWrap: { width: background.displayWidth * 0.6 },
                }
            );
            this.questDialog.add(questDesc);

            // Quest status
            const status = this.add.text(
                background.displayWidth / 3 - 40,
                yPos,
                quest.completed ? "✓" : "○",
                {
                    fontSize: "24px",
                    color: quest.completed ? "#006400" : "#4a2511",
                }
            );
            status.setOrigin(0.5);
            this.questDialog.add(status);

            yPos += 80;
        });
    }

    private openQuestDialog() {
        this.isQuestDialogOpen = true;
        this.questDialog.setVisible(true);
        this.isInputMode = true; // Disable player movement
        this.scrollOpenSound.play();
    }

    private closeQuestDialog() {
        this.isQuestDialogOpen = false;
        this.questDialog.setVisible(false);
        this.isInputMode = false; // Enable player movement
    }

    private completeQuest(questTitle: string) {
        const quest = this.quests.find((q) => q.title === questTitle);
        if (quest) {
            quest.completed = true;
            // Refresh the quest dialog if it's open
            if (this.isQuestDialogOpen) {
                this.questDialog.destroy();
                this.createQuestDialog();
                this.questDialog.setVisible(true);
            }
        }
    }

    update() {
        const speed = 160;
        this.player.setVelocity(0);

        // Update custom cursor position

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

        if (!this.isInputMode && !this.isQuestDialogOpen) {
            // Only allow movement if not in input mode and quest dialog is closed
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
