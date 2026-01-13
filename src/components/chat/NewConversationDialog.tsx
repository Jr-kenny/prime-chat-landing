import { useState } from "react";
import { Loader2, Search, CheckCircle, XCircle, MessageSquare, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  const [walletAddress, setWalletAddress] = useState("");
  const [username, setUsername] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [canMessage, setCanMessage] = useState<boolean | null>(null);
  const [resolvedAddress, setResolvedAddress] = useState<string | null>(null);
  const [searchTab, setSearchTab] = useState<"wallet" | "username">("wallet");

  const isValidAddress = (address: string) => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  };

  // Check reachability by wallet address
  const checkReachabilityByWallet = async () => {
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
    setResolvedAddress(walletAddress);

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

  // Check reachability by PrimeChat username
  const checkReachabilityByUsername = async () => {
    if (!xmtpClient) {
      toast.error("XMTP client not connected");
      return;
    }
    if (!username.trim()) {
      toast.error("Please enter a username");
      return;
    }

    setIsChecking(true);
    setCanMessage(null);
    setResolvedAddress(null);

    try {
      // Step 1: Look up wallet address from PrimeChat name registry
      const address = await getAddressByName(username.toLowerCase());
      
      if (!address) {
        toast.error("Username not found on PrimeChat");
        setCanMessage(false);
        setIsChecking(false);
        return;
      }
      
      setResolvedAddress(address);

      // Step 2: Check if that wallet is on XMTP
      const identifier = {
        identifier: address.toLowerCase(),
        identifierKind: "Ethereum" as const,
      };
      const canMessageResult = await xmtpClient.canMessage([identifier]);

      const [resolvedKey] = canMessageResult.keys();
      const isReachable = canMessageResult.get(resolvedKey) ?? false;

      setCanMessage(isReachable);

      if (isReachable) {
        toast.success(`Found ${username} - wallet is reachable!`);
      } else {
        toast.error(`${username}'s wallet hasn't joined XMTP yet`);
      }
    } catch (error) {
      console.error("Failed to check reachability:", error);
      toast.error("Failed to look up username");
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
    setWalletAddress("");
    setUsername("");
    setCanMessage(null);
    setResolvedAddress(null);
    onOpenChange(false);
  };

  const handleTabChange = (tab: string) => {
    setSearchTab(tab as "wallet" | "username");
    setCanMessage(null);
    setResolvedAddress(null);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Conversation</DialogTitle>
          <DialogDescription>
            Search by wallet address or PrimeChat username
          </DialogDescription>
        </DialogHeader>

        <Tabs value={searchTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="wallet" className="gap-2">
              <Search className="h-4 w-4" />
              Wallet
            </TabsTrigger>
            <TabsTrigger value="username" className="gap-2">
              <User className="h-4 w-4" />
              Username
            </TabsTrigger>
          </TabsList>

          <TabsContent value="wallet" className="space-y-4 pt-4">
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
                    setResolvedAddress(null);
                  }}
                  className="flex-1"
                />
                <Button
                  onClick={checkReachabilityByWallet}
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
          </TabsContent>

          <TabsContent value="username" className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                PrimeChat Username
              </label>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter username..."
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setCanMessage(null);
                    setResolvedAddress(null);
                  }}
                  className="flex-1"
                />
                <Button
                  onClick={checkReachabilityByUsername}
                  disabled={!username.trim() || isChecking}
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
          </TabsContent>
        </Tabs>

        <div className="space-y-4">
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
                      {searchTab === "username" ? `${username} is on XMTP` : "Wallet is on XMTP"}
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
                      {searchTab === "username" ? "Username not found or not on XMTP" : "Not on XMTP"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {searchTab === "username" 
                        ? "This user may not have registered or joined XMTP"
                        : "This wallet hasn't created an XMTP identity yet"
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
