import { Client, type Signer } from '@xmtp/browser-sdk';
import { type WalletClient } from 'viem';

export const createXmtpSigner = (walletClient: WalletClient): Signer => {
  const account = walletClient.account;
  if (!account) {
    throw new Error('Wallet client has no account');
  }

  return {
    type: 'EOA',
    getIdentifier: () => ({
      identifier: account.address,
      identifierKind: 'Ethereum' as const,
    }),
    signMessage: async (message: string): Promise<Uint8Array> => {
      const signature = await walletClient.signMessage({
        message,
        account,
      });
      // Convert hex string signature to bytes for XMTP
      return new TextEncoder().encode(signature);
    },
  };
};

export const initializeXmtpClient = async (walletClient: WalletClient) => {
  const signer = createXmtpSigner(walletClient);

  const client = await Client.create(signer, {
    env: 'dev', // Use 'production' for mainnet
  });

  return client;
};

export type { Client } from '@xmtp/browser-sdk';
