import React from "react";
import { createAppKit } from "@reown/appkit/react";
import { WagmiProvider } from "wagmi";
import { anvil, eduChainTestnet } from "@reown/appkit/networks";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";

// 0. Setup queryClient
const queryClient = new QueryClient();

// 1. Get projectId from https://cloud.reown.com
const projectId = "YOUR_PROJECT_ID";

// 3. Set the networks
const networks = [eduChainTestnet, anvil];

// 4. Create Wagmi Adapter
const wagmiAdapter = new WagmiAdapter({
    networks,
    projectId,
    ssr: true,
});

// 5. Create modal
createAppKit({
    adapters: [wagmiAdapter],
    networks: [eduChainTestnet, anvil],
    projectId,
    features: {
        analytics: true, // Optional - defaults to your Cloud configuration
    },
});

export function AppKitProvider({
    children,
}: {
    children?: React.ReactNode;
}): React.JSX.Element {
    return (
        <WagmiProvider config={wagmiAdapter.wagmiConfig}>
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
        </WagmiProvider>
    );
}
