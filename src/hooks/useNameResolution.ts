import { useState, useEffect, useCallback } from 'react';
import { getNameByAddress } from '@/lib/nameRegistry';

interface NameCache {
  [key: string]: {
    name: string | null;
    address: `0x${string}` | null;
    timestamp: number;
  };
}

const globalNameCache: NameCache = {};
const CACHE_DURATION = 5 * 60 * 1000;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let xmtpClientRef: any = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function setXmtpClientForResolution(client: any) {
  xmtpClientRef = client;
}

async function resolveInboxIdToAddress(inboxId: string): Promise<`0x${string}` | null> {
  if (/^0x[a-fA-F0-9]{40}$/.test(inboxId)) {
    return inboxId as `0x${string}`;
  }

  if (!xmtpClientRef) {
    console.warn('XMTP client not initialized for name resolution');
    return null;
  }

  try {
    const inboxStates = await xmtpClientRef.inboxStateFromInboxIds([inboxId]);
    
    if (!inboxStates || inboxStates.length === 0) {
      console.warn(`No inbox state found for inbox ID: ${inboxId}`);
      return null;
    }

    const state = inboxStates[0];
    
    const ethIdentifier = state.identifiers?.find(
      (i: { identifier: string; identifierKind: string }) => 
        i.identifierKind === 'Ethereum'
    );

    if (ethIdentifier?.identifier) {
      const addr = ethIdentifier.identifier;
      if (/^0x[a-fA-F0-9]{40}$/.test(addr)) {
        return addr as `0x${string}`;
      }
    }

    return null;
  } catch (error) {
    console.error(`Failed to resolve inbox ID to address [${inboxId}]:`, error);
    return null;
  }
}

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

    const cached = globalNameCache[inboxId];
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      setName(cached.name);
      setAddress(cached.address);
      return;
    }

    setIsLoading(true);

    resolveInboxIdToAddress(inboxId)
      .then(async (resolvedAddress) => {
        setAddress(resolvedAddress);

        if (!resolvedAddress) {
          globalNameCache[inboxId] = {
            name: null,
            address: null,
            timestamp: Date.now(),
          };
          setName(null);
          return;
        }

        try {
          const resolvedName = await getNameByAddress(resolvedAddress);
          globalNameCache[inboxId] = {
            name: resolvedName,
            address: resolvedAddress,
            timestamp: Date.now(),
          };
          setName(resolvedName);
        } catch (error) {
          console.error('Failed to resolve name from registry:', error);
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

  const displayName = name
    ? name
    : address
      ? `${address.slice(0, 6)}...${address.slice(-4)}`
      : inboxId
        ? `${inboxId.slice(0, 6)}...${inboxId.slice(-4)}`
        : 'Unknown';

  return { name, displayName, isLoading, address };
}

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
      const cached = globalNameCache[id];
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return false;
      }
      return true;
    });

    if (idsToResolve.length === 0) {
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

export function clearNameCache(inboxId?: string) {
  if (inboxId) {
    delete globalNameCache[inboxId];
  } else {
    Object.keys(globalNameCache).forEach((key) => {
      delete globalNameCache[key];
    });
  }
}
