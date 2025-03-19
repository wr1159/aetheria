# Vite Phaser Typescript Template

Vite + Phaser + Typescript starter template.

## Features
- Minting NFT avatar based on own wallet tx history.
- AI NPC behaviour based on wallet history.
- AI NPC and Player will have the same NFT avatar. Player can choose to be using the NFT avatar or amongst default avatars
- Talk to pre-defined NPC and other player NPCs.
- Pre defined NPCs will also be AI.
- Create maps for different zones based on random top mcap coins ie: "ETH LAND", "SOL LAND".

Predefined NPCs:

- Wizard -> General crypto enquiries.
- Jailor / Sheriff -> Explore transactions of criminals. Show transactions as a graph (ZachXBT)
- Witch / Oracle* -> RNG generates random <1m mcap memecoin day (not the same for all players true random).

## Preview

![preview.jpg](preview.jpg)

## Getting Started

```bash
npx degit iwantantra/vite-phaser-ts my-game
cd my-game
npm install
```

## Available scripts

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

## Project structure

```
.
├── dist
├── node_modules
├── public
│    ├── assets
├── src
│   ├── scenes
│       ├── HelloScene.ts
│   ├── main.ts
├── index.html
├── package.json
```

`dist` your build will placed in this folder.\
`src` you can structure your codes and folder as you like inside this folder.\
`public` your static asset must be placed inside this folder. You can also
create new folder inside this folder.

## License

[MIT License](LICENSE.md)
