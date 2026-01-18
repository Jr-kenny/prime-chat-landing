import { http } from 'wagmi';
import { mainnet, polygon, arbitrum, optimism, base } from 'wagmi/chains';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import {
  injectedWallet,
  walletConnectWallet,
  metaMaskWallet,
  coinbaseWallet,
  rainbowWallet,
  phantomWallet,
  trustWallet,
  rabbyWallet,
  zerionWallet,
} from '@rainbow-me/rainbowkit/wallets';

// WalletConnect Project ID - required for WalletConnect v2
const WALLETCONNECT_PROJECT_ID = '73f25536c5ad3830a68ce8ca5a65d019';

export const config = getDefaultConfig({
  appName: 'Prime Chat',
  projectId: WALLETCONNECT_PROJECT_ID,
  chains: [mainnet, polygon, arbitrum, optimism, base],
  transports: {
    [mainnet.id]: http(),
    [polygon.id]: http(),
    [arbitrum.id]: http(),
    [optimism.id]: http(),
    [base.id]: http(),
  },
  // Custom wallet list - prioritizes injected/browser extension wallets
  // This ensures mobile web3 browsers (Mises, Opera, etc.) show their extensions
  wallets: [
    {
      groupName: 'Installed',
      wallets: [
        injectedWallet,    // Catches ANY injected provider (Rabby, Zerion, etc.)
        rabbyWallet,
        phantomWallet,
        zerionWallet,
      ],
    },
    {
      groupName: 'Popular',
      wallets: [
        metaMaskWallet,
        coinbaseWallet,
        rainbowWallet,
        trustWallet,
        walletConnectWallet, // Fallback for any wallet via QR/deep link
      ],
    },
  ],
});

declare module 'wagmi' {
  interface Register {
    config: typeof config;
  }
}
