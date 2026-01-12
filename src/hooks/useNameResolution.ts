import { useState, useEffect, useCallback, useRef } from 'react';
import { getNameByAddress } from '@/lib/nameRegistry';

interface NameCache {
  [key: string]: {
    name: string | null;
    address: `0x${string}` | null;
    timestamp: number;
  };
}

// Global cache for name resolution (persists across component mounts)
const globalNameCache: NameCache = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Global XMTP client reference for inbox state lookups
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let xmtpClientRef: any = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function setXmtpClientForResolution(client: any) {
  xmtpClientRef = client;
}

/**
 * Extract wallet address from XMTP inbox ID
 * First checks if it's already an address, then tries XMTP lookup
 */
export function extractAddressFromInboxId(inboxId: string): `0x${string}` | null {
  // If it's already a valid ethereum address
  if (/^0x[a-fA-F0-9]{40}$/.test(inboxId)) {
    return inboxId as `0x${string}`;
  }
  
  // XMTP inbox IDs may contain the address in different formats
  // Try to extract a 0x address from the string
  const addressMatch = inboxId.match(/0x[a-fA-F0-9]{40}/);
  if (addressMatch) {
    return addressMatch[0] as `0x${string}`;
  }
  
  return null;
}

/**
 * Async function to resolve inbox ID to wallet address using XMTP client
 */
async function resolveInboxIdToAddress(inboxId: string): Promise<`0x${string}` | null> {
  // First try sync extraction
  const syncAddress = extractAddressFromInboxId(inboxId);
  if (syncAddress) return syncAddress;
  
  // If we have XMTP client, use it to look up the inbox state
  if (xmtpClientRef) {
    try {
      const inboxStates = await xmtpClientRef.inboxStateFromInboxIds([inboxId]);
      if (inboxStates && inboxStates.length > 0) {
        const state = inboxStates[0];
        // Find Ethereum identifier
        const ethIdentifier = state.identifiers?.find(
          (i: { identifierKind: string; identifier: string }) => i.identifierKind === 'Ethereum'
        );
        if (ethIdentifier?.identifier) {
          return ethIdentifier.identifier as `0x${string}`;
        }
      }
    } catch (error) {
      console.error('Failed to resolve inbox ID to address:', error);
    }
  }
  
  return null;
}

/**
 * Hook to resolve a single inbox ID to a PrimeChat name
 */
export function useResolvedName(inboxId: string | undefined): {
  name: string | null;
  displayName: string;
  isLoading: boolean;
  address: `0x${string}` | null;
} {
  const [name, setName] = useState<string | null>(null);
  const [address, setAddress] = useState<`0x${string}` | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    if (!inboxId) {
      setName(null);
      setAddress(null);
      return;
    }
    
    // Check cache first (by inbox ID)
    const cached = globalNameCache[inboxId];
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      setName(cached.name);
      setAddress(cached.address);
      return;
    }
    
    setIsLoading(true);
    
    // First resolve inbox ID to wallet address
    resolveInboxIdToAddress(inboxId)
      .then(async (resolvedAddress) => {
        setAddress(resolvedAddress);
        
        if (!resolvedAddress) {
          // Couldn't resolve to address, cache as null
          globalNameCache[inboxId] = {
            name: null,
            address: null,
            timestamp: Date.now(),
          };
          setName(null);
          return;
        }
        
        // Now look up the name from the registry
        try {
          const resolvedName = await getNameByAddress(resolvedAddress);
          globalNameCache[inboxId] = {
            name: resolvedName,
            address: resolvedAddress,
            timestamp: Date.now(),
          };
          setName(resolvedName);
        } catch (error) {
          console.error('Failed to resolve name:', error);
          globalNameCache[inboxId] = {
            name: null,
            address: resolvedAddress,
            timestamp: Date.now(),
          };
          setName(null);
        }
      })
      .catch((error) => {
        console.error('Failed to resolve inbox ID:', error);
        setName(null);
        setAddress(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [inboxId]);
  
  // Generate display name (registered name or truncated address or truncated inbox ID)
  const displayName = name 
    ? name 
    : address
      ? `${address.slice(0, 6)}...${address.slice(-4)}`
      : inboxId 
        ? `${inboxId.slice(0, 6)}...${inboxId.slice(-4)}`
        : 'Unknown';
  
  return { name, displayName, isLoading, address };
}

/**
 * Hook to batch resolve multiple inbox IDs to PrimeChat names
 */
export function useBatchNameResolution(inboxIds: string[]): {
  names: Map<string, string | null>;
  displayNames: Map<string, string>;
  isLoading: boolean;
  refresh: () => void;
} {
  const [names, setNames] = useState<Map<string, string | null>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  
  const resolve = useCallback(async () => {
    const idsToResolve = inboxIds.filter((id) => {
      // Check if already cached (by inbox ID)
      const cached = globalNameCache[id];
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return false;
      }
      return true;
    });
    
    if (idsToResolve.length === 0) {
      // Update from cache
      const cachedNames = new Map<string, string | null>();
      inboxIds.forEach((id) => {
        if (globalNameCache[id]) {
          cachedNames.set(id, globalNameCache[id].name);
        }
      });
      setNames(cachedNames);
      return;
    }
    
    setIsLoading(true);
    
    const results = new Map<string, string | null>();
    
    // Resolve in parallel
    await Promise.all(
      idsToResolve.map(async (id) => {
        try {
          const address = await resolveInboxIdToAddress(id);
          if (!address) {
            globalNameCache[id] = { name: null, address: null, timestamp: Date.now() };
            results.set(id, null);
            return;
          }
          
          const name = await getNameByAddress(address);
          globalNameCache[id] = { name, address, timestamp: Date.now() };
          results.set(id, name);
        } catch (error) {
          console.error(`Failed to resolve name for ${id}:`, error);
          globalNameCache[id] = { name: null, address: null, timestamp: Date.now() };
          results.set(id, null);
        }
      })
    );
    
    // Merge with existing cached results
    const mergedNames = new Map<string, string | null>();
    inboxIds.forEach((id) => {
      if (results.has(id)) {
        mergedNames.set(id, results.get(id)!);
      } else if (globalNameCache[id]) {
        mergedNames.set(id, globalNameCache[id].name);
      }
    });
    
    setNames(mergedNames);
    setIsLoading(false);
  }, [inboxIds]);
  
  useEffect(() => {
    resolve();
  }, [resolve]);
  
  // Generate display names
  const displayNames = new Map<string, string>();
  inboxIds.forEach((id) => {
    const name = names.get(id);
    const cached = globalNameCache[id];
    if (name) {
      displayNames.set(id, name);
    } else if (cached?.address) {
      displayNames.set(id, `${cached.address.slice(0, 6)}...${cached.address.slice(-4)}`);
    } else {
      displayNames.set(id, `${id.slice(0, 6)}...${id.slice(-4)}`);
    }
  });
  
  return { names, displayNames, isLoading, refresh: resolve };
}

/**
 * Clear the name cache (useful after registration)
 */
export function clearNameCache(inboxId?: string) {
  if (inboxId) {
    delete globalNameCache[inboxId];
  } else {
    Object.keys(globalNameCache).forEach((key) => {
      delete globalNameCache[key];
    });
  }
}
