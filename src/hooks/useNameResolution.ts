import { useState, useEffect, useCallback, useRef } from 'react';
import { getNameByAddress } from '@/lib/nameRegistry';

interface NameCache {
  [address: string]: {
    name: string | null;
    timestamp: number;
  };
}

// Global cache for name resolution (persists across component mounts)
const globalNameCache: NameCache = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Extract wallet address from XMTP inbox ID
 * Inbox IDs are typically the wallet address or derived from it
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
 * Hook to resolve a single inbox ID to a PrimeChat name
 */
export function useResolvedName(inboxId: string | undefined): {
  name: string | null;
  displayName: string;
  isLoading: boolean;
  address: `0x${string}` | null;
} {
  const [name, setName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const address = inboxId ? extractAddressFromInboxId(inboxId) : null;
  
  useEffect(() => {
    if (!address) {
      setName(null);
      return;
    }
    
    // Check cache first
    const cached = globalNameCache[address];
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      setName(cached.name);
      return;
    }
    
    setIsLoading(true);
    
    getNameByAddress(address)
      .then((resolvedName) => {
        globalNameCache[address] = {
          name: resolvedName,
          timestamp: Date.now(),
        };
        setName(resolvedName);
      })
      .catch((error) => {
        console.error('Failed to resolve name:', error);
        setName(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [address]);
  
  // Generate display name (registered name or truncated address/inbox)
  const displayName = name 
    ? name 
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
  const resolveQueue = useRef<Set<string>>(new Set());
  
  const resolve = useCallback(async () => {
    const idsToResolve = inboxIds.filter((id) => {
      const address = extractAddressFromInboxId(id);
      if (!address) return false;
      
      // Check if already cached and not expired
      const cached = globalNameCache[address];
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return false;
      }
      
      return true;
    });
    
    if (idsToResolve.length === 0) {
      // Update from cache
      const cachedNames = new Map<string, string | null>();
      inboxIds.forEach((id) => {
        const address = extractAddressFromInboxId(id);
        if (address && globalNameCache[address]) {
          cachedNames.set(id, globalNameCache[address].name);
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
        const address = extractAddressFromInboxId(id);
        if (!address) {
          results.set(id, null);
          return;
        }
        
        try {
          const name = await getNameByAddress(address);
          globalNameCache[address] = {
            name,
            timestamp: Date.now(),
          };
          results.set(id, name);
        } catch (error) {
          console.error(`Failed to resolve name for ${id}:`, error);
          results.set(id, null);
        }
      })
    );
    
    // Merge with existing cached results
    const mergedNames = new Map<string, string | null>();
    inboxIds.forEach((id) => {
      if (results.has(id)) {
        mergedNames.set(id, results.get(id)!);
      } else {
        const address = extractAddressFromInboxId(id);
        if (address && globalNameCache[address]) {
          mergedNames.set(id, globalNameCache[address].name);
        }
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
    displayNames.set(
      id,
      name ? name : `${id.slice(0, 6)}...${id.slice(-4)}`
    );
  });
  
  return { names, displayNames, isLoading, refresh: resolve };
}

/**
 * Clear the name cache (useful after registration)
 */
export function clearNameCache(address?: string) {
  if (address) {
    delete globalNameCache[address];
  } else {
    Object.keys(globalNameCache).forEach((key) => {
      delete globalNameCache[key];
    });
  }
}
