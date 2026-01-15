import {
  createPublicClient,
  fallback,
  http,
  type Address,
  encodeFunctionData,
  decodeFunctionResult,
} from 'viem';
import { base } from 'viem/chains';

// PrimeChat Name Registry Contract on Base Mainnet
export const NAME_REGISTRY_ADDRESS = '0x962743EAe1Bbd8C9715102DB10F129f1AF47670A' as const;

// Public RPCs (fallback order). These are unauthenticated endpoints; any single one may rate limit.
const BASE_RPCS = [
  'https://mainnet.base.org',
  'https://base-rpc.publicnode.com',
  'https://base.llamarpc.com',
] as const;

const publicClient = createPublicClient({
  chain: base,
  transport: fallback(BASE_RPCS.map((url) => http(url))),
});

// Contract ABI - only the functions we need
export const NAME_REGISTRY_ABI = [
  {
    inputs: [{ internalType: 'address', name: '_address', type: 'address' }],
    name: 'getNameByAddress',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'string', name: '_name', type: 'string' }],
    name: 'getAddressByName',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: '_address', type: 'address' }],
    name: 'hasName',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'string', name: '_name', type: 'string' }],
    name: 'isNameTaken',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'string', name: '_name', type: 'string' }],
    name: 'registerName',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'string', name: '_newName', type: 'string' }],
    name: 'updateName',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'unregisterName',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

// Lightweight retry for transient RPC 429s
async function withRetry<T>(fn: () => Promise<T>, attempts = 2): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      // small backoff
      await new Promise((r) => setTimeout(r, 300 * (i + 1)));
    }
  }
  throw lastErr;
}

// Helper to call read functions via viem public client
async function callContract<T>(
  functionName: 'getNameByAddress' | 'getAddressByName' | 'hasName' | 'isNameTaken',
  args: readonly unknown[],
): Promise<T> {
  // Use a manual eth_call payload so we can stay compatible with our minimal ABI typing,
  // while still benefiting from viem's fallback transports.
  const data = encodeFunctionData({
    abi: NAME_REGISTRY_ABI,
    functionName,
    args: args as never,
  });

  const result = await withRetry(() =>
    publicClient.request({
      method: 'eth_call',
      params: [
        {
          to: NAME_REGISTRY_ADDRESS,
          data,
        },
        'latest',
      ],
    }),
  );

  const decoded = decodeFunctionResult({
    abi: NAME_REGISTRY_ABI,
    functionName,
    data: result as `0x${string}`,
  });

  return decoded as T;
}

// Helper to get name by address
export async function getNameByAddress(address: `0x${string}`): Promise<string | null> {
  try {
    const name = await callContract<string>('getNameByAddress', [address]);
    return name && name.length > 0 ? name : null;
  } catch (error) {
    console.error('Failed to get name for address:', error);
    return null;
  }
}

// Helper to check if address has a name
export async function hasName(address: `0x${string}`): Promise<boolean> {
  try {
    return await callContract<boolean>('hasName', [address]);
  } catch (error) {
    console.error('Failed to check if address has name:', error);
    return false;
  }
}

// Helper to check if name is taken
export async function isNameTaken(name: string): Promise<boolean> {
  try {
    return await callContract<boolean>('isNameTaken', [name]);
  } catch (error) {
    console.error('Failed to check if name is taken:', error);
    return true; // Default to taken on error for safety
  }
}

// Helper to get address by name
export async function getAddressByName(name: string): Promise<`0x${string}` | null> {
  try {
    const address = await callContract<`0x${string}`>('getAddressByName', [name]);
    return address && address !== '0x0000000000000000000000000000000000000000' ? address : null;
  } catch (error) {
    console.error('Failed to get address for name:', error);
    return null;
  }
}

// Validate name format (3-32 chars, alphanumeric + underscore)
export function validateNameFormat(name: string): { valid: boolean; error?: string } {
  if (name.length < 3) {
    return { valid: false, error: 'Name must be at least 3 characters' };
  }
  if (name.length > 32) {
    return { valid: false, error: 'Name must be 32 characters or less' };
  }
  if (!/^[a-zA-Z0-9_]+$/.test(name)) {
    return { valid: false, error: 'Only letters, numbers, and underscores allowed' };
  }
  return { valid: true };
}

// Reserved names that cannot be registered
const RESERVED_NAMES = [
  'admin', 'prime', 'primechat', 'support', 'moderator',
  'bot', 'system', 'owner', 'nft', 'token',
  'vault', 'bridge', 'official', 'verified', 'community'
];

export function isReservedName(name: string): boolean {
  return RESERVED_NAMES.includes(name.toLowerCase());
}
