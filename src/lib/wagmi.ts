import { http } from 'wagmi';
import { mainnet, polygon, arbitrum, optimism, base } from 'wagmi/chains';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';

// WalletConnect Project ID - get yours at https://cloud.walletconnect.com
// This is a publishable ID (not secret), required for WalletConnect v2
const WALLETCONNECT_PROJECT_ID = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'c4f79cc821944d9680842e34466bfb';

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
});

declare module 'wagmi' {
  interface Register {
    config: typeof config;
  }
}
