import { useState, useEffect, useCallback, useRef } from 'react';
import { getNameByAddress } from '@/lib/nameRegistry';

interface NameCache {
  [key: string]: {
    name: string | null;
    address: `0x${string}` | null;
    timestamp: number;
  };
}

const STORAGE_KEY = 'primechat_name_cache_v1';

// Global cache for name resolution (persists across component mounts)
const globalNameCache: NameCache = (() => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as NameCache;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
})();

// Keep cache longer to reduce RPC pressure; refresh will still revalidate when needed.
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Global XMTP client reference for inbox state lookups
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let xmtpClientRef: any = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function setXmtpClientForResolution(client: any) {
  xmtpClientRef = client;
}

let persistTimer: number | null = null;
function persistCacheSoon() {
  if (persistTimer) window.clearTimeout(persistTimer);
  persistTimer = window.setTimeout(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(globalNameCache));
    } catch {
      // ignore quota / private mode
    }
  }, 250);
}

// Deduplicate concurrent name lookups per address
const pendingNameByAddress = new Map<string, Promise<string | null>>();

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
 * This is the key function - XMTP inbox IDs are NOT wallet addresses,
 * we need to query XMTP to get the actual wallet address.
 */
export async function resolveInboxIdToAddress(inboxId: string): Promise<`0x${string}` | null> {
  // First try sync extraction (in case it's already an address)
  const syncAddress = extractAddressFromInboxId(inboxId);
  if (syncAddress) return syncAddress;

  // If we have XMTP client, use it to look up the inbox state
  // NOTE: In @xmtp/browser-sdk v5, this lives under `client.preferences`
  if (xmtpClientRef?.preferences?.inboxStateFromInboxIds) {
    try {
      // Try cached first for speed, then fall back to a network refresh if needed
      let inboxStates = await xmtpClientRef.preferences.inboxStateFromInboxIds(
        [inboxId],
        false,
      );
      if (!inboxStates || inboxStates.length === 0) {
        inboxStates = await xmtpClientRef.preferences.inboxStateFromInboxIds(
          [inboxId],
          true,
        );
      }

      if (inboxStates && inboxStates.length > 0) {
        const state = inboxStates[0];

        // Find Ethereum identifier from the inbox state
        if (state.identifiers && Array.isArray(state.identifiers)) {
          const ethIdentifier = state.identifiers.find(
            (i: { identifierKind: string; identifier: string }) =>
              i.identifierKind === "Ethereum",
          );
          if (ethIdentifier?.identifier && /^0x[a-fA-F0-9]{40}$/.test(ethIdentifier.identifier)) {
            return ethIdentifier.identifier.toLowerCase() as `0x${string}`;
          }
        }
      }
    } catch (error) {
      console.error("Failed to resolve inbox ID to address:", error);
    }
  }

  return null;
}

/**
 * Hook to resolve a single inbox ID to a PrimeChat name
 * 
 * Flow:
 * 1. Take XMTP inbox ID (e.g., "507936...d436")
 * 2. Query XMTP to get the wallet address from that inbox ID
 * 3. Query PrimeChat Name Registry to get the username for that wallet
 * 4. Display username if found, otherwise show truncated wallet address
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
  const resolutionInProgress = useRef<string | null>(null);
  
  useEffect(() => {
    if (!inboxId) {
      setName(null);
      setAddress(null);
      return;
    }
    
    // Prevent duplicate resolutions
    if (resolutionInProgress.current === inboxId) {
      return;
    }
    
    // Check cache first (by inbox ID)
    const cached = globalNameCache[inboxId];
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      setName(cached.name);
      setAddress(cached.address);
      return;
    }
    
    resolutionInProgress.current = inboxId;
    setIsLoading(true);
    
    // Async resolution: InboxID -> Wallet Address -> PrimeChat Name
    const resolve = async () => {
      try {
        // Step 1: Resolve inbox ID to wallet address via XMTP
        const resolvedAddress = await resolveInboxIdToAddress(inboxId);
        setAddress(resolvedAddress);

        if (!resolvedAddress) {
          globalNameCache[inboxId] = {
            name: null,
            address: null,
            timestamp: Date.now(),
          };
          persistCacheSoon();
          setName(null);
          return;
        }

        // Step 2: Look up the PrimeChat name (deduped + cached)
        const cacheKey = resolvedAddress.toLowerCase();
        const existing = Object.values(globalNameCache).find(
          (v) => v.address?.toLowerCase() === cacheKey && Date.now() - v.timestamp < CACHE_DURATION,
        );
        if (existing) {
          setName(existing.name);
          globalNameCache[inboxId] = { name: existing.name, address: resolvedAddress, timestamp: Date.now() };
          persistCacheSoon();
          return;
        }

        const pending = pendingNameByAddress.get(cacheKey);
        const namePromise =
          pending ??
          (async () => {
            const n = await getNameByAddress(resolvedAddress);
            return n;
          })();

        if (!pending) pendingNameByAddress.set(cacheKey, namePromise);

        const resolvedName = await namePromise;
        pendingNameByAddress.delete(cacheKey);

        globalNameCache[inboxId] = {
          name: resolvedName,
          address: resolvedAddress,
          timestamp: Date.now(),
        };
        persistCacheSoon();
        setName(resolvedName);
      } catch (error) {
        console.error('Failed to resolve name:', error);
        setName(null);
      } finally {
        setIsLoading(false);
        resolutionInProgress.current = null;
      }
    };
    
    resolve();
  }, [inboxId]);
  
  // Generate display name priority: 
  // 1. PrimeChat registered name
  // 2. Truncated wallet address (if we resolved it)
  // 3. Truncated inbox ID (fallback)
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
    if (inboxIds.length === 0) return;
    
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
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(globalNameCache));
  } catch {
    // ignore
  }
}
