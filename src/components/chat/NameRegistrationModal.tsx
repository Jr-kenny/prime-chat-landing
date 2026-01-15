import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { 
  User, 
  Check, 
  X, 
  Loader2, 
  Sparkles,
  AlertCircle,
  Fuel
} from 'lucide-react';
import { usePrimeChatName } from '@/hooks/usePrimeChatName';
import { validateNameFormat, isReservedName } from '@/lib/nameRegistry';
import { useChainId, useSwitchChain } from 'wagmi';
import { base } from 'viem/chains';

interface NameRegistrationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRegistered?: () => void;
}

type AvailabilityStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid' | 'reserved';

export const NameRegistrationModal = ({ 
  open, 
  onOpenChange,
  onRegistered 
}: NameRegistrationModalProps) => {
  const [username, setUsername] = useState('');
  const [availabilityStatus, setAvailabilityStatus] = useState<AvailabilityStatus>('idle');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);
  
  const chainId = useChainId();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const isOnBase = chainId === base.id;
  
  const { 
    registerName, 
    isRegistering, 
    registrationError,
    checkNameAvailability,
    hasRegisteredName
  } = usePrimeChatName();
  
  // Close modal if user already has a name
  useEffect(() => {
    if (hasRegisteredName && open) {
      onOpenChange(false);
      onRegistered?.();
    }
  }, [hasRegisteredName, open, onOpenChange, onRegistered]);
  
  // Check availability with debounce
  const checkAvailability = useCallback(async (name: string) => {
    if (name.length === 0) {
      setAvailabilityStatus('idle');
      setValidationError(null);
      return;
    }
    
    // First validate format locally
    const formatCheck = validateNameFormat(name);
    if (!formatCheck.valid) {
      setAvailabilityStatus('invalid');
      setValidationError(formatCheck.error || 'Invalid name format');
      return;
    }
    
    // Check reserved names
    if (isReservedName(name)) {
      setAvailabilityStatus('reserved');
      setValidationError('This name is reserved');
      return;
    }
    
    setAvailabilityStatus('checking');
    setValidationError(null);
    
    const result = await checkNameAvailability(name);
    
    if (result.available) {
      setAvailabilityStatus('available');
      setValidationError(null);
    } else {
      setAvailabilityStatus('taken');
      setValidationError(result.error || 'Name not available');
    }
  }, [checkNameAvailability]);
  
  // Debounced input handler
  const handleUsernameChange = (value: string) => {
    const sanitized = value.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setUsername(sanitized);
    
    // Clear previous timer
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    
    // Set new timer for availability check
    const timer = setTimeout(() => {
      checkAvailability(sanitized);
    }, 500);
    
    setDebounceTimer(timer);
  };
  
  const handleRegister = async () => {
    if (availabilityStatus !== 'available' || !username) return;
    
    await registerName(username);
  };
  
  const handleSwitchToBase = () => {
    switchChain({ chainId: base.id });
  };
  
  const getStatusIcon = () => {
    switch (availabilityStatus) {
      case 'checking':
        return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
      case 'available':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'taken':
      case 'invalid':
      case 'reserved':
        return <X className="h-4 w-4 text-destructive" />;
      default:
        return null;
    }
  };
  
  const getStatusText = () => {
    switch (availabilityStatus) {
      case 'checking':
        return 'Checking availability...';
      case 'available':
        return 'Available ✓';
      case 'taken':
        return 'Name already taken';
      case 'invalid':
        return validationError || 'Invalid name';
      case 'reserved':
        return 'This name is reserved';
      default:
        return '';
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent" />
            Complete Your Profile
          </DialogTitle>
          <DialogDescription>
            Every PrimeChat user needs a unique onchain name. This name will be displayed in all your conversations.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Network Check */}
          {!isOnBase && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg"
            >
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-destructive">Wrong Network</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Name registration requires Base network
                  </p>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="mt-2"
                    onClick={handleSwitchToBase}
                    disabled={isSwitching}
                  >
                    {isSwitching ? (
                      <>
                        <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                        Switching...
                      </>
                    ) : (
                      'Switch to Base'
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
          
          {/* Username Input */}
          <div className="space-y-2">
            <Label htmlFor="username" className="text-sm flex items-center gap-2">
              <User className="h-4 w-4" />
              Choose your username
            </Label>
            <div className="relative">
              <Input
                id="username"
                value={username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                placeholder="e.g., alice_web3"
                className="pr-10"
                maxLength={32}
                disabled={isRegistering}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {getStatusIcon()}
              </div>
            </div>
            
            {/* Status/Error Message */}
            <AnimatePresence mode="wait">
              {(availabilityStatus !== 'idle' || validationError) && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className={`text-xs ${
                    availabilityStatus === 'available' 
                      ? 'text-green-500' 
                      : 'text-destructive'
                  }`}
                >
                  {getStatusText()}
                </motion.p>
              )}
            </AnimatePresence>
            
            <p className="text-xs text-muted-foreground">
              3-32 characters. Letters, numbers, and underscores only.
            </p>
          </div>
          
          {/* Registration Error */}
          {registrationError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg"
            >
              <p className="text-sm text-destructive flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {registrationError}
              </p>
            </motion.div>
          )}
          
          {/* Gas Cost Info */}
          <div className="flex items-center gap-2 p-3 bg-secondary/50 rounded-lg">
            <Fuel className="h-4 w-4 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              Gas cost: ~$0.001-0.01 on Base mainnet
            </p>
          </div>
          
          {/* Register Button */}
          <Button
            onClick={handleRegister}
            disabled={
              !isOnBase || 
              availabilityStatus !== 'available' || 
              isRegistering || 
              !username
            }
            className="w-full gap-2"
          >
            {isRegistering ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Registering...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Register Name
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
