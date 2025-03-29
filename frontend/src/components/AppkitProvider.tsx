import React from "react";
import { createAppKit } from "@reown/appkit/react";
import { WagmiProvider } from "wagmi";
import { anvil, eduChainTestnet } from "@reown/appkit/networks";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";

const queryClient = new QueryClient();

const projectId = "8bcd1c1314eca84c967115bfcab8e931";

const networks = [eduChainTestnet, anvil];

const wagmiAdapter = new WagmiAdapter({
    networks,
    projectId,
    ssr: true,
});

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
