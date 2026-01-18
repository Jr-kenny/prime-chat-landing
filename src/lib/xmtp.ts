import { Client, type Signer } from '@xmtp/browser-sdk';
import { type WalletClient, toBytes } from 'viem';
import { reactionCodec, remoteAttachmentCodec, replyCodec } from '@/lib/xmtpCodecs';

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
      // Convert hex string signature to actual binary bytes
      return typeof signature === 'string' ? toBytes(signature) : signature;
    },
  };
};

/**
 * Clear local XMTP database for a specific address.
 * This is necessary when switching networks (dev→production) or when identity conflicts occur.
 */
async function clearXmtpLocalDatabase(address: string): Promise<void> {
  const dbPrefix = `xmtp-${address.toLowerCase()}`;
  
  // Clear IndexedDB databases that match XMTP pattern
  if ('indexedDB' in window) {
    const databases = await indexedDB.databases?.() ?? [];
    for (const db of databases) {
      if (db.name && (db.name.includes('xmtp') || db.name.includes(address.toLowerCase()))) {
        console.log('[XMTP] Deleting IndexedDB:', db.name);
        indexedDB.deleteDatabase(db.name);
      }
    }
  }
  
  // Clear any localStorage keys related to XMTP
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.includes('xmtp') || key.includes(dbPrefix))) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(key => {
    console.log('[XMTP] Removing localStorage key:', key);
    localStorage.removeItem(key);
  });
  
  console.log('[XMTP] Local database cleared for', address);
}

/**
 * Check if an error is a recoverable identity conflict (e.g., wrong chain ID or stale installation).
 */
function isIdentityConflictError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes('Wrong chain id') ||
    message.includes('invalid argument') ||
    message.includes('Identity already exists') ||
    message.includes('Installation not found') ||
    message.includes('createSyncAccessHandle')
  );
}

export const initializeXmtpClient = async (
  walletClient: WalletClient,
  retryCount = 0
): Promise<Client> => {
  const signer = createXmtpSigner(walletClient);
  const address = walletClient.account?.address ?? '';

  try {
    const client = await Client.create(signer, {
      env: 'production', // XMTP mainnet
      appVersion: 'PrimeChat/1.0',
      codecs: [reactionCodec, remoteAttachmentCodec, replyCodec],
    });

    // The SDK infers a wider content-type union when codecs are provided; cast to our app-wide client type.
    return client as unknown as Client;
  } catch (error) {
    console.error('[XMTP] Client creation failed:', error);

    // If this is a recoverable identity conflict and we haven't retried yet
    if (isIdentityConflictError(error) && retryCount < 1) {
      console.log('[XMTP] Detected identity conflict, clearing local data and retrying...');
      await clearXmtpLocalDatabase(address);
      
      // Small delay to let IndexedDB cleanup complete
      await new Promise((r) => setTimeout(r, 500));
      
      // Retry once
      return initializeXmtpClient(walletClient, retryCount + 1);
    }

    throw error;
  }
};

export type { Client } from '@xmtp/browser-sdk';
