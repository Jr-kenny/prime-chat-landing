import { useState } from "react";
import { Share2, Copy, Check, QrCode, Link as LinkIcon } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

const PRIMECHAT_URL = "https://prime-chat-landing.vercel.app/chat";

export const ShareDialog = () => {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(PRIMECHAT_URL);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join me on PrimeChat",
          text: "Chat securely with end-to-end encryption on PrimeChat!",
          url: PRIMECHAT_URL,
        });
      } catch (error) {
        // User cancelled or share failed silently
        console.log("Share cancelled or failed:", error);
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9" title="Invite friends">
          <Share2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Invite Friends to PrimeChat
          </DialogTitle>
          <DialogDescription>
            Share this link or QR code with friends to invite them to chat securely on PrimeChat.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-6 py-4">
          {/* QR Code */}
          <div className="bg-white p-4 rounded-xl shadow-sm">
            <QRCodeSVG
              value={PRIMECHAT_URL}
              size={180}
              level="H"
              includeMargin={false}
              bgColor="#ffffff"
              fgColor="#000000"
            />
          </div>

          {/* Link display and copy */}
          <div className="w-full space-y-3">
            <div className="flex items-center gap-2 p-3 bg-secondary/50 rounded-lg">
              <LinkIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-sm text-foreground truncate flex-1">
                {PRIMECHAT_URL}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 flex-shrink-0"
                onClick={handleCopyLink}
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Share buttons */}
            <div className="flex gap-2">
              <Button onClick={handleCopyLink} variant="outline" className="flex-1 gap-2">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied!" : "Copy Link"}
              </Button>
              <Button onClick={handleShare} className="flex-1 gap-2">
                <Share2 className="h-4 w-4" />
                Share
              </Button>
            </div>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Friends need to connect a wallet and join XMTP to start chatting.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
