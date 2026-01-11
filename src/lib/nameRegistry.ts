import { encodeFunctionData, decodeFunctionResult } from 'viem';

// PrimeChat Name Registry Contract on Base Mainnet
export const NAME_REGISTRY_ADDRESS = '0x962743EAe1Bbd8C9715102DB10F129f1AF47670A' as const;

// Base RPC endpoint
const BASE_RPC = 'https://mainnet.base.org';

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

// Helper to call read functions via RPC
async function callContract<T>(
  functionName: string, 
  args: unknown[],
  outputTypes: { name: string; type: string }[]
): Promise<T> {
  const data = encodeFunctionData({
    abi: NAME_REGISTRY_ABI,
    functionName: functionName as 'getNameByAddress' | 'getAddressByName' | 'hasName' | 'isNameTaken',
    args: args as never,
  });

  const response = await fetch(BASE_RPC, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'eth_call',
      params: [
        {
          to: NAME_REGISTRY_ADDRESS,
          data,
        },
        'latest',
      ],
      id: 1,
    }),
  });

  const json = await response.json();
  
  if (json.error) {
    throw new Error(json.error.message);
  }

  const result = decodeFunctionResult({
    abi: NAME_REGISTRY_ABI,
    functionName: functionName as 'getNameByAddress' | 'getAddressByName' | 'hasName' | 'isNameTaken',
    data: json.result,
  });

  return result as T;
}

// Helper to get name by address
export async function getNameByAddress(address: `0x${string}`): Promise<string | null> {
  try {
    const name = await callContract<string>('getNameByAddress', [address], [{ name: '', type: 'string' }]);
    return name && name.length > 0 ? name : null;
  } catch (error) {
    console.error('Failed to get name for address:', error);
    return null;
  }
}

// Helper to check if address has a name
export async function hasName(address: `0x${string}`): Promise<boolean> {
  try {
    return await callContract<boolean>('hasName', [address], [{ name: '', type: 'bool' }]);
  } catch (error) {
    console.error('Failed to check if address has name:', error);
    return false;
  }
}

// Helper to check if name is taken
export async function isNameTaken(name: string): Promise<boolean> {
  try {
    return await callContract<boolean>('isNameTaken', [name], [{ name: '', type: 'bool' }]);
  } catch (error) {
    console.error('Failed to check if name is taken:', error);
    return true; // Default to taken on error for safety
  }
}

// Helper to get address by name
export async function getAddressByName(name: string): Promise<`0x${string}` | null> {
  try {
    const address = await callContract<`0x${string}`>('getAddressByName', [name], [{ name: '', type: 'address' }]);
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
