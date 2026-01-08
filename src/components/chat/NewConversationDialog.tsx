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
import { Client, type Identifier } from "@xmtp/browser-sdk";
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
  const [peerInboxId, setPeerInboxId] = useState<string>("");

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
    setPeerInboxId("");

    try {
      console.log("Checking reachability for address:", walletAddress);
      
      // According to official docs: canMessage is a static method on Client
      const identifiers: Identifier[] = [
        {
          identifier: walletAddress,
          identifierKind: "Ethereum" as const,
        },
      ];
      
      // This returns a Map of string (identifier) => boolean (is reachable)
      const response = await Client.canMessage(identifiers);
      
      console.log("canMessage response:", {
        address: walletAddress,
        response,
        mapSize: response.size,
        mapEntries: Array.from(response.entries()),
      });
      
      // The map key is the identifier string we passed
      const isReachable = response.get(walletAddress) || false;
      
      console.log("Is reachable:", isReachable);
      
      if (isReachable) {
        // Now get the inbox ID of this wallet
        // We need to query the network to get their inbox ID
        try {
          // Use getDmByIdentifier to get the peer's information
          const dmIdentifier: Identifier = {
            identifier: walletAddress,
            identifierKind: "Ethereum" as const,
          };
          
          // This will return a DM object if the peer exists, and we can extract their inboxId
          const dm = await xmtpClient.conversations.getDmByIdentifier(dmIdentifier);
          const peerId = await dm.peerInboxId();
          
          console.log("Peer inbox ID:", peerId);
          setPeerInboxId(peerId);
        } catch (error) {
          console.error("Error getting peer inbox ID:", error);
          // Still mark as reachable, we'll handle inboxId in startConversation
        }
        
        toast.success("Wallet is reachable on XMTP!");
      } else {
        toast.error("This wallet hasn't joined XMTP yet");
      }
      
      setCanMessage(isReachable);
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
      console.log("Creating DM with address:", walletAddress);
      
      // According to official docs, newDm takes an inboxId
      // But if we pass the wallet address, it should work as well
      // Let's try with the wallet address first
      const conversation = await xmtpClient.conversations.newDm(walletAddress);
      
      console.log("✅ DM created:", {
        id: conversation.id,
        address: walletAddress,
      });
      
      // CRITICAL: Sync the conversation
      console.log("Syncing new DM...");
      await conversation.sync();
      console.log("✅ DM synced successfully");
      
      toast.success("Conversation started!");
      
      // Reload conversations
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
    setPeerInboxId("");
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
                  setPeerInboxId("");
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
