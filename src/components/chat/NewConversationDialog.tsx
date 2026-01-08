import { useState } from "react";
import { Loader2, Search, CheckCircle, XCircle, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { type Client, type Identifier } from "@xmtp/browser-sdk";
import { toast } from "sonner";

interface NewConversationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  xmtpClient: Client | null;
  onConversationCreated: () => void;
}

export const NewConversationDialog = ({
  open,
  onOpenChange,
  xmtpClient,
  onConversationCreated,
}: NewConversationDialogProps) => {
  const [walletAddress, setWalletAddress] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [canMessage, setCanMessage] = useState<boolean | null>(null);

  const isValidAddress = (address: string) => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  };

  const checkReachability = async () => {
    if (!xmtpClient) {
      toast.error("XMTP client not connected");
      return;
    }
    if (!isValidAddress(walletAddress)) {
      toast.error("Please enter a valid Ethereum address");
      return;
    }

    setIsChecking(true);
    setCanMessage(null);

    try {
      console.log("Checking reachability for address:", walletAddress);
      
      // Create identifier array as per official XMTP docs
      const identifiers: Identifier[] = [
        {
          identifier: walletAddress, // Use the address as-is, XMTP handles normalization
          identifierKind: "Ethereum" as const,
        },
      ];
      
      // Check if the wallet can receive XMTP messages
      const canMessageResult = await xmtpClient.canMessage(identifiers);
      
      // The response is a Map where key is the identifier string
      const isReachable = canMessageResult.get(walletAddress) || false;
      
      console.log("Reachability check result:", {
        address: walletAddress,
        isReachable,
        mapKeys: Array.from(canMessageResult.keys()),
      });
      
      setCanMessage(isReachable);

      if (isReachable) {
        toast.success("Wallet is reachable on XMTP!");
      } else {
        toast.error("This wallet hasn't joined XMTP yet");
      }
    } catch (error) {
      console.error("Failed to check reachability:", error);
      toast.error("Failed to check wallet reachability");
      setCanMessage(false);
    } finally {
      setIsChecking(false);
    }
  };

  const startConversation = async () => {
    if (!xmtpClient || !canMessage) return;

    setIsCreating(true);
    try {
      console.log("Creating DM conversation with:", walletAddress);
      
      // Create a DM conversation using the wallet address directly
      // This is the official XMTP V3 API - no need to create identifier separately
      const conversation = await xmtpClient.conversations.newDm(walletAddress);
      
      console.log("✅ Conversation created:", {
        id: conversation.id,
        address: walletAddress,
      });
      
      // CRITICAL: Sync the conversation before closing the dialog
      // This ensures the conversation is ready and will receive messages
      console.log("Syncing new DM conversation...");
      await conversation.sync();
      console.log("✅ DM conversation synced successfully");
      
      toast.success("Conversation started!");
      
      // Reload conversations to show the new one
      await onConversationCreated();
      
      handleClose();
    } catch (error) {
      console.error("Failed to create conversation:", error);
      toast.error("Failed to start conversation");
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    setWalletAddress("");
    setCanMessage(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Conversation</DialogTitle>
          <DialogDescription>
            Enter a wallet address to start a secure, encrypted chat.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Wallet Address Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Wallet Address
            </label>
            <div className="flex gap-2">
              <Input
                placeholder="0x..."
                value={walletAddress}
                onChange={(e) => {
                  setWalletAddress(e.target.value);
                  setCanMessage(null);
                }}
                className="flex-1"
              />
              <Button
                onClick={checkReachability}
                disabled={!isValidAddress(walletAddress) || isChecking}
                variant="secondary"
              >
                {isChecking ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Reachability Status */}
          {canMessage !== null && (
            <div
              className={`flex items-center gap-3 p-3 rounded-lg ${
                canMessage
                  ? "bg-green-500/10 border border-green-500/20"
                  : "bg-destructive/10 border border-destructive/20"
              }`}
            >
              {canMessage ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">
                      Wallet is on XMTP
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {walletAddress.slice(0, 10)}...{walletAddress.slice(-8)}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-destructive" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">
                      Not on XMTP
                    </p>
                    <p className="text-xs text-muted-foreground">
                      This wallet hasn't created an XMTP identity yet
                    </p>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Start Chat Button */}
          <Button
            onClick={startConversation}
            disabled={!canMessage || isCreating}
            className="w-full gap-2"
          >
            {isCreating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MessageSquare className="h-4 w-4" />
            )}
            Start Conversation
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
