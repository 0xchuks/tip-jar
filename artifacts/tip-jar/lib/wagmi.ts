import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { monadTestnet } from "./chain";

export const config = getDefaultConfig({
  appName: "Monad Tip Jar",
  // Get a real project ID at https://cloud.walletconnect.com
  // Injected wallets (MetaMask) work without a valid WalletConnect projectId.
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "00000000000000000000000000000000",
  chains: [monadTestnet],
  ssr: true,
});
