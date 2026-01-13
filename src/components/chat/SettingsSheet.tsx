import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { User, Wallet, LogOut, Edit2, Loader2, Check, X } from "lucide-react";
import { useDisconnect, useAccount, useWriteContract, useWaitForTransactionReceipt, useSwitchChain } from "wagmi";
import { useNavigate } from "react-router-dom";
import { usePrimeChatName } from "@/hooks/usePrimeChatName";
import { NAME_REGISTRY_ADDRESS, NAME_REGISTRY_ABI, validateNameFormat, isReservedName, isNameTaken } from "@/lib/nameRegistry";
import { base } from "viem/chains";
import { toast } from "sonner";

interface SettingsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  address: string | undefined;
}

export const SettingsSheet = ({ open, onOpenChange, address }: SettingsSheetProps) => {
  const { disconnect } = useDisconnect();
  const { chainId } = useAccount();
  const { switchChain } = useSwitchChain();
  const navigate = useNavigate();
  
  const { name, hasRegisteredName, isLoading: isLoadingName, refresh } = usePrimeChatName();
  
  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isCheckingName, setIsCheckingName] = useState(false);
  
  // Contract write for updateName
  const { 
    writeContract, 
    data: txHash, 
    isPending: isWritePending,
    error: writeError,
    reset: resetWrite
  } = useWriteContract();
  
  const { 
    isLoading: isTxLoading, 
    isSuccess: isTxSuccess 
  } = useWaitForTransactionReceipt({ hash: txHash });
  
  const isUpdating = isWritePending || isTxLoading;

  const handleDisconnect = () => {
    disconnect();
    onOpenChange(false);
    navigate("/welcome");
  };
  
  // Start editing
  const handleStartEdit = () => {
    setNewUsername(name || "");
    setIsEditing(true);
    setValidationError(null);
    resetWrite();
  };
  
  // Cancel editing
  const handleCancelEdit = () => {
    setIsEditing(false);
    setNewUsername("");
    setValidationError(null);
  };
  
  // Validate and update username
  const handleUpdateUsername = async () => {
    if (!newUsername.trim()) {
      setValidationError("Username cannot be empty");
      return;
    }
    
    // Check format
    const formatCheck = validateNameFormat(newUsername);
    if (!formatCheck.valid) {
      setValidationError(formatCheck.error || "Invalid format");
      return;
    }
    
    // Check reserved
    if (isReservedName(newUsername)) {
      setValidationError("This name is reserved");
      return;
    }
    
    // Check if same as current
    if (newUsername.toLowerCase() === name?.toLowerCase()) {
      setValidationError("This is your current username");
      return;
    }
    
    // Check availability on-chain
    setIsCheckingName(true);
    try {
      const taken = await isNameTaken(newUsername);
      if (taken) {
        setValidationError("Username is already taken");
        setIsCheckingName(false);
        return;
      }
    } catch (error) {
      console.error("Failed to check name:", error);
      setValidationError("Failed to check availability");
      setIsCheckingName(false);
      return;
    }
    setIsCheckingName(false);
    
    // Ensure on Base network
    if (chainId !== base.id) {
      try {
        await switchChain({ chainId: base.id });
      } catch {
        setValidationError("Please switch to Base network");
        return;
      }
    }
    
    // Call updateName contract function
    try {
      writeContract({
        address: NAME_REGISTRY_ADDRESS,
        abi: NAME_REGISTRY_ABI,
        functionName: 'updateName',
        args: [newUsername.toLowerCase()],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);
    } catch (err) {
      console.error("Failed to update name:", err);
      setValidationError("Failed to submit transaction");
    }
  };
  
  // Handle success
  useEffect(() => {
    if (isTxSuccess) {
      toast.success("Username updated successfully!");
      setIsEditing(false);
      setNewUsername("");
      refresh();
    }
  }, [isTxSuccess, refresh]);
  
  // Handle error
  useEffect(() => {
    if (writeError) {
      if (writeError.message?.includes("user rejected")) {
        setValidationError("Transaction rejected");
      } else {
        setValidationError("Failed to update username");
      }
    }
  }, [writeError]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Settings</SheetTitle>
          <SheetDescription>
            Customize your profile and preferences
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Wallet Address */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Connected Wallet
            </Label>
            <p className="text-sm font-mono bg-secondary/50 p-3 rounded-lg break-all">
              {address}
            </p>
          </div>

          {/* PrimeChat Username */}
          <div className="space-y-3">
            <Label className="text-sm text-muted-foreground flex items-center gap-2">
              <User className="h-4 w-4" />
              PrimeChat Username
            </Label>
            
            {isLoadingName ? (
              <div className="p-3 bg-secondary/50 rounded-lg flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-muted-foreground">Loading...</span>
              </div>
            ) : isEditing ? (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={newUsername}
                    onChange={(e) => {
                      setNewUsername(e.target.value);
                      setValidationError(null);
                    }}
                    placeholder="Enter new username"
                    disabled={isUpdating || isCheckingName}
                    className="flex-1"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleUpdateUsername}
                    disabled={isUpdating || isCheckingName || !newUsername.trim()}
                    className="shrink-0"
                  >
                    {isUpdating || isCheckingName ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4 text-green-500" />
                    )}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleCancelEdit}
                    disabled={isUpdating}
                    className="shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                {validationError && (
                  <p className="text-xs text-destructive">{validationError}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  3-32 characters, letters, numbers, and underscores only
                </p>
              </div>
            ) : (
              <div className="p-3 bg-secondary/50 rounded-lg flex items-center justify-between">
                {hasRegisteredName && name ? (
                  <span className="font-semibold">{name}</span>
                ) : (
                  <span className="text-muted-foreground italic">No username set</span>
                )}
                {hasRegisteredName && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={handleStartEdit}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Disconnect Button */}
          <div className="pt-4 border-t border-border">
            <Button 
              variant="destructive" 
              className="w-full gap-2"
              onClick={handleDisconnect}
            >
              <LogOut className="h-4 w-4" />
              Disconnect
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
