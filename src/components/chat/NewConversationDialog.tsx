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
import { getAddressByName } from "@/lib/nameRegistry";

interface NewConversationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  xmtpClient: Client | null;
  onConversationCreated: (conversationId: string) => void;
}

export const NewConversationDialog = ({
  open,
  onOpenChange,
  xmtpClient,
  onConversationCreated,
}: NewConversationDialogProps) => {
  const [searchInput, setSearchInput] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [canMessage, setCanMessage] = useState<boolean | null>(null);
  const [resolvedAddress, setResolvedAddress] = useState<string | null>(null);
  const [resolvedUsername, setResolvedUsername] = useState<string | null>(null);

  const isValidAddress = (address: string) => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  };

  // Combined check - handles both wallet addresses and usernames
  const checkReachability = async () => {
    if (!xmtpClient) {
      toast.error("XMTP client not connected");
      return;
    }

    const input = searchInput.trim();
    if (!input) {
      toast.error("Please enter a wallet address or username");
      return;
    }

    setIsChecking(true);
    setCanMessage(null);
    setResolvedAddress(null);
    setResolvedUsername(null);

    try {
      let targetAddress: string;

      // Check if input is a wallet address or username
      if (isValidAddress(input)) {
        // It's a wallet address
        targetAddress = input;
        setResolvedAddress(input);
      } else {
        // It's a username - look up in PrimeChat registry
        const address = await getAddressByName(input.toLowerCase());
        
        if (!address) {
          toast.error("Username not found on PrimeChat");
          setCanMessage(false);
          setIsChecking(false);
          return;
        }
        
        targetAddress = address;
        setResolvedAddress(address);
        setResolvedUsername(input);
      }

      // Check if that wallet is on XMTP
      const identifier = {
        identifier: targetAddress.toLowerCase(),
        identifierKind: "Ethereum" as const,
      };
      const canMessageResult = await xmtpClient.canMessage([identifier]);

      const [resolvedKey] = canMessageResult.keys();
      const isReachable = canMessageResult.get(resolvedKey) ?? false;

      setCanMessage(isReachable);

      if (isReachable) {
        toast.success(resolvedUsername ? `Found ${resolvedUsername} - ready to chat!` : "Wallet is reachable!");
      } else {
        toast.error(resolvedUsername ? `${resolvedUsername}'s wallet hasn't joined XMTP yet` : "This wallet hasn't joined XMTP yet");
      }
    } catch (error) {
      console.error("Failed to check reachability:", error);
      toast.error("Failed to check reachability");
      setCanMessage(false);
    } finally {
      setIsChecking(false);
    }
  };

  const startConversation = async () => {
    if (!xmtpClient || !canMessage || !resolvedAddress) return;

    setIsCreating(true);
    try {
      // Resolve wallet address to Inbox ID
      const peerInboxId = await xmtpClient.findInboxIdByIdentifier({
        identifier: resolvedAddress.toLowerCase(),
        identifierKind: "Ethereum",
      });

      if (!peerInboxId) {
        toast.error("Could not resolve inbox ID for this wallet");
        return;
      }

      // Sync conversations first
      await xmtpClient.conversations.sync();

      // Check if DM already exists, otherwise create new one
      const existingDm = await xmtpClient.conversations.getDmByInboxId(peerInboxId);
      let conversation;
      
      if (existingDm) {
        conversation = existingDm;
        console.log("Reusing existing DM:", conversation.id);
      } else {
        conversation = await xmtpClient.conversations.newDm(peerInboxId);
        console.log("Created new DM:", conversation.id);
      }

      toast.success(existingDm ? "Opening conversation..." : "Conversation created!");
      handleClose();
      onConversationCreated(conversation.id);
    } catch (error) {
      console.error("Failed to create conversation:", error);
      toast.error("Failed to start conversation");
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    setSearchInput("");
    setCanMessage(null);
    setResolvedAddress(null);
    setResolvedUsername(null);
    onOpenChange(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isChecking && searchInput.trim()) {
      e.preventDefault();
      checkReachability();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Conversation</DialogTitle>
          <DialogDescription>
            Enter a wallet address or PrimeChat username
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Unified search input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Wallet / Username
            </label>
            <div className="flex gap-2">
              <Input
                placeholder="0x... or username"
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  setCanMessage(null);
                  setResolvedAddress(null);
                  setResolvedUsername(null);
                }}
                onKeyPress={handleKeyPress}
                className="flex-1"
              />
              <Button
                onClick={checkReachability}
                disabled={!searchInput.trim() || isChecking}
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
                      {resolvedUsername ? `${resolvedUsername} is on XMTP` : "Wallet is on XMTP"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {resolvedAddress?.slice(0, 10)}...{resolvedAddress?.slice(-8)}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-destructive" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">
                      Not reachable on XMTP
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {isValidAddress(searchInput) 
                        ? "This wallet hasn't created an XMTP identity yet"
                        : "Username not found or hasn't joined XMTP"
                      }
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
