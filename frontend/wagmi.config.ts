import { defineConfig } from "@wagmi/cli";
import { foundry } from "@wagmi/cli/plugins";

export default defineConfig({
    out: "src/generated.ts",
    contracts: [],
    plugins: [
        foundry({
            project: "../contracts",
            deployments: {
                AetheriaAvatar: {
                    31337: "0x5fbdb2315678afecb367f032d93f642f64180aa3",
                },
            },
        }),
    ],
});
