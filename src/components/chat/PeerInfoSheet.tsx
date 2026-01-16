import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Wallet, User, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useResolvedName } from "@/hooks/useNameResolution";
import { BlockButton } from "./BlockButton";
import { Separator } from "@/components/ui/separator";

interface PeerInfoSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  peerInboxId: string | undefined;
  isBlocked?: boolean;
  onBlock?: () => Promise<void>;
  onUnblock?: () => Promise<void>;
}

export const PeerInfoSheet = ({ 
  open, 
  onOpenChange, 
  peerInboxId,
  isBlocked = false,
  onBlock,
  onUnblock,
}: PeerInfoSheetProps) => {
  const [copied, setCopied] = useState(false);
  const { displayName, name, address, isLoading } = useResolvedName(peerInboxId);

  const handleCopyAddress = async () => {
    if (address) {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Contact Info</SheetTitle>
          <SheetDescription>
            Details about your conversation partner
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {isLoading ? (
            <div className="space-y-4">
              <div className="h-16 bg-secondary/50 rounded-lg animate-pulse" />
              <div className="h-16 bg-secondary/50 rounded-lg animate-pulse" />
            </div>
          ) : (
            <>
              {/* PrimeChat Username */}
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground flex items-center gap-2">
                  <User className="h-4 w-4" />
                  PrimeChat Username
                </Label>
                <div className="p-3 bg-secondary/50 rounded-lg">
                  {name ? (
                    <span className="font-semibold text-foreground">{name}</span>
                  ) : (
                    <span className="text-muted-foreground italic">No username registered</span>
                  )}
                </div>
              </div>

              {/* Wallet Address */}
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground flex items-center gap-2">
                  <Wallet className="h-4 w-4" />
                  Wallet Address
                </Label>
                <div className="p-3 bg-secondary/50 rounded-lg flex items-center justify-between gap-2">
                  <p className="text-sm font-mono break-all flex-1">
                    {address || displayName}
                  </p>
                  {address && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={handleCopyAddress}
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
              </div>

              {/* XMTP Inbox ID (technical) */}
              {peerInboxId && (
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">
                    XMTP Inbox ID
                  </Label>
                  <p className="text-xs font-mono text-muted-foreground bg-secondary/30 p-2 rounded break-all">
                    {peerInboxId}
                  </p>
                </div>
              )}

              {/* Block/Unblock Button */}
              {onBlock && onUnblock && (
                <>
                  <Separator className="my-4" />
                  <BlockButton
                    isBlocked={isBlocked}
                    onBlock={onBlock}
                    onUnblock={onUnblock}
                    peerName={name || undefined}
                  />
                </>
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
