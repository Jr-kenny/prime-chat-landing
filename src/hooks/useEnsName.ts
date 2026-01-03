import { useState, useEffect } from "react";
import { createPublicClient, http, isAddress } from "viem";
import { mainnet } from "viem/chains";

// Create a public client for ENS resolution on mainnet
const mainnetClient = createPublicClient({
  chain: mainnet,
  transport: http(),
});

// Cache for resolved names
const nameCache = new Map<string, string | null>();
const avatarCache = new Map<string, string | null>();

export function useEnsName(address: string | undefined) {
  const [ensName, setEnsName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!address || !isAddress(address)) {
      setEnsName(null);
      return;
    }

    const lowerAddress = address.toLowerCase();
    
    // Check cache first
    if (nameCache.has(lowerAddress)) {
      setEnsName(nameCache.get(lowerAddress) ?? null);
      return;
    }

    const resolveName = async () => {
      setIsLoading(true);
      try {
        const name = await mainnetClient.getEnsName({
          address: address as `0x${string}`,
        });
        nameCache.set(lowerAddress, name);
        setEnsName(name);
      } catch (error) {
        console.error("Failed to resolve ENS name:", error);
        nameCache.set(lowerAddress, null);
        setEnsName(null);
      } finally {
        setIsLoading(false);
      }
    };

    resolveName();
  }, [address]);

  return { ensName, isLoading };
}

export function useEnsAvatar(ensName: string | null) {
  const [avatar, setAvatar] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!ensName) {
      setAvatar(null);
      return;
    }

    // Check cache first
    if (avatarCache.has(ensName)) {
      setAvatar(avatarCache.get(ensName) ?? null);
      return;
    }

    const resolveAvatar = async () => {
      setIsLoading(true);
      try {
        const avatarUrl = await mainnetClient.getEnsAvatar({
          name: ensName,
        });
        avatarCache.set(ensName, avatarUrl);
        setAvatar(avatarUrl);
      } catch (error) {
        console.error("Failed to resolve ENS avatar:", error);
        avatarCache.set(ensName, null);
        setAvatar(null);
      } finally {
        setIsLoading(false);
      }
    };

    resolveAvatar();
  }, [ensName]);

  return { avatar, isLoading };
}

// Utility to format display name
export function formatDisplayName(address: string, ensName: string | null): string {
  if (ensName) return ensName;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
