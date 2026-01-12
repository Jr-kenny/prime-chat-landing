import { useState, useEffect, useCallback } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useSwitchChain } from 'wagmi';
import { base } from 'viem/chains';
import { 
  getNameByAddress, 
  hasName, 
  isNameTaken, 
  validateNameFormat,
  isReservedName,
  NAME_REGISTRY_ADDRESS,
  NAME_REGISTRY_ABI 
} from '@/lib/nameRegistry';

export interface UsePrimeChatNameResult {
  // Current user's name state
  name: string | null;
  hasRegisteredName: boolean;
  isLoading: boolean;
  
  // Registration
  registerName: (name: string) => Promise<void>;
  isRegistering: boolean;
  registrationError: string | null;
  
  // Name validation
  checkNameAvailability: (name: string) => Promise<{ available: boolean; error?: string }>;
  
  // Lookup other users' names
  lookupName: (address: `0x${string}`) => Promise<string | null>;
  
  // Refresh current user's name
  refresh: () => Promise<void>;
}

// Simple cache for name lookups
const nameCache = new Map<string, string | null>();

export function usePrimeChatName(): UsePrimeChatNameResult {
  const { address, chainId } = useAccount();
  const { switchChain } = useSwitchChain();
  
  const [name, setName] = useState<string | null>(null);
  const [hasRegisteredName, setHasRegisteredName] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [registrationError, setRegistrationError] = useState<string | null>(null);
  
  // Contract write hook
  const { 
    writeContract, 
    data: txHash, 
    isPending: isWritePending,
    error: writeError,
    reset: resetWrite
  } = useWriteContract();
  
  // Wait for transaction
  const { 
    isLoading: isTxLoading, 
    isSuccess: isTxSuccess,
    error: txError
  } = useWaitForTransactionReceipt({
    hash: txHash,
  });
  
  const isRegistering = isWritePending || isTxLoading;
  
  // Fetch user's name on mount and when address changes
  const fetchUserName = useCallback(async () => {
    if (!address) {
      setName(null);
      setHasRegisteredName(false);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    try {
      const [userName, hasName_] = await Promise.all([
        getNameByAddress(address),
        hasName(address)
      ]);
      setName(userName);
      setHasRegisteredName(hasName_);
    } catch (error) {
      console.error('Failed to fetch user name:', error);
    } finally {
      setIsLoading(false);
    }
  }, [address]);
  
  useEffect(() => {
    fetchUserName();
  }, [fetchUserName]);
  
  // Handle transaction success
  useEffect(() => {
    if (isTxSuccess) {
      // Refresh name after successful registration
      fetchUserName();
      setRegistrationError(null);
    }
  }, [isTxSuccess, fetchUserName]);
  
  // Handle errors
  useEffect(() => {
    if (writeError) {
      const errorMessage = writeError.message || 'Failed to register name';
      // Parse common errors
      if (errorMessage.includes('Name already taken')) {
        setRegistrationError('This name is already taken');
      } else if (errorMessage.includes('This name is reserved')) {
        setRegistrationError('This name is reserved');
      } else if (errorMessage.includes('You already have a name')) {
        setRegistrationError('You already have a registered name');
      } else if (errorMessage.includes('user rejected')) {
        setRegistrationError('Transaction was rejected');
      } else {
        setRegistrationError('Failed to register name. Please try again.');
      }
    }
    if (txError) {
      setRegistrationError('Transaction failed. Please try again.');
    }
  }, [writeError, txError]);
  
  // Check name availability
  const checkNameAvailability = useCallback(async (nameToCheck: string): Promise<{ available: boolean; error?: string }> => {
    // First validate format
    const formatValidation = validateNameFormat(nameToCheck);
    if (!formatValidation.valid) {
      return { available: false, error: formatValidation.error };
    }
    
    // Check reserved names
    if (isReservedName(nameToCheck)) {
      return { available: false, error: 'This name is reserved' };
    }
    
    // Check on-chain availability
    const taken = await isNameTaken(nameToCheck);
    if (taken) {
      return { available: false, error: 'Name already taken' };
    }
    
    return { available: true };
  }, []);
  
  // Register name - using type assertion to work around strict wagmi types
  const registerName = useCallback(async (nameToRegister: string) => {
    if (!address) {
      setRegistrationError('Please connect your wallet');
      return;
    }
    
    // Ensure user is on Base network
    if (chainId !== base.id) {
      try {
        await switchChain({ chainId: base.id });
      } catch {
        setRegistrationError('Please switch to Base network');
        return;
      }
    }
    
    setRegistrationError(null);
    resetWrite();
    
    // Validate first
    const availability = await checkNameAvailability(nameToRegister);
    if (!availability.available) {
      setRegistrationError(availability.error || 'Name not available');
      return;
    }
    
    // Register on-chain
    try {
      writeContract({
        address: NAME_REGISTRY_ADDRESS,
        abi: NAME_REGISTRY_ABI,
        functionName: 'registerName',
        args: [nameToRegister.toLowerCase()],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);
    } catch (err) {
      console.error('Write contract error:', err);
      setRegistrationError('Failed to submit transaction');
    }
  }, [address, chainId, switchChain, checkNameAvailability, writeContract, resetWrite]);
  
  // Lookup other users' names (with caching)
  const lookupName = useCallback(async (lookupAddress: `0x${string}`): Promise<string | null> => {
    const cached = nameCache.get(lookupAddress);
    if (cached !== undefined) {
      return cached;
    }
    
    const foundName = await getNameByAddress(lookupAddress);
    nameCache.set(lookupAddress, foundName);
    return foundName;
  }, []);
  
  return {
    name,
    hasRegisteredName,
    isLoading,
    registerName,
    isRegistering,
    registrationError,
    checkNameAvailability,
    lookupName,
    refresh: fetchUserName,
  };
}
