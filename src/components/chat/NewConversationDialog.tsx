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
import { type Client } from "@xmtp/browser-sdk";
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
      const identifier = {
        identifier: walletAddress.toLowerCase(),
        identifierKind: "Ethereum" as const,
      };
      const canMessageResult = await xmtpClient.canMessage([identifier]);

      const [resolvedKey] = canMessageResult.keys();
      const isReachable = canMessageResult.get(resolvedKey) ?? false;

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
      // Step A: Resolve wallet address to Inbox ID
      const peerInboxId = await xmtpClient.findInboxIdByIdentifier({
        identifier: walletAddress.toLowerCase(),
        identifierKind: "Ethereum",
      });

      if (!peerInboxId) {
        toast.error("Could not resolve inbox ID for this wallet");
        return;
      }

      // Step B: Check if DM already exists, otherwise create new one
      const existingDm = xmtpClient.conversations.getDmByInboxId(peerInboxId);
      const conversation = await (existingDm 
        ? Promise.resolve(existingDm) 
        : xmtpClient.conversations.newDm(peerInboxId));
      
      console.log("Conversation ID:", conversation.id);

      toast.success("Conversation started!");
      onConversationCreated();
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
