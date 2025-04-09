# Aetheria

Mint your Personal Avatar based on your wallet activity to embark on a Gamified Blockchain Learning Experience!

Submission for UK AI Agent Hack.

Bounties:

- Venice.ai - Effective Image Generation using Venice API
- FLock.io - Build the Next Big Retail AI App with FLock AI Arena Models
- Edu.Chain - AI on EDU Chain: Building the Future of AI-Powered Solutions in Education Onchain

## Features

- Pixel Art RPG
- Quests to guide users.
- Minting NFT avatar on **EduChain** with generated image based on own wallet tx history and analysis (Venice)
- Wizard NPC who can fetch live data from the blockchain with Moralis and complete your quests (FLock.io)
- Wizard NPC allows for RAG via Vector embeddings search.
- Wizard NPC stores previous chat history.

## TODO

### Backend TODO

- [x] Wallet Analysis with Moralis
- [x] Generate Image with Venice
- [x] ERC721
- [X] Minting logic - Generate Background Removed Image + Upload to hosting provider + Contract Minting
- [X] Add RAG + VectorDB for memory retrieval + more context
- [X] Host Backend

### Frontend TODO

- [X] Add bounding boxes for map
- [X] Separate Chat logic for each NPC
- [X] Mint Page Frontend

## Preview

![preview.png](preview.png)

## Available scripts (Frontend)

### To run the project

```bash
npm run dev
```

### To build the project

```bash
npm run build
```

### To preview the build

```bash
npm run preview
```

### To lint check your code using eslint

```bash
npm run lint
```

### To lint check and fix your code

```bash
npm run lint-fix
```
