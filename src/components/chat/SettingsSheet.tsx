import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useAccount, useDisconnect } from "wagmi";
import { useEnsName, useEnsAvatar } from "@/hooks/useEnsName";
import { Button } from "@/components/ui/button";
import { Loader2, User, ExternalLink, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ThemeToggle from "@/components/ThemeToggle";

interface SettingsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SettingsSheet = ({ open, onOpenChange }: SettingsSheetProps) => {
  const { address } = useAccount();
  const { disconnect } = useDisconnect();
  const navigate = useNavigate();
  const { ensName, isLoading: ensLoading } = useEnsName(address);
  const { avatar, isLoading: avatarLoading } = useEnsAvatar(ensName);

  const handleDisconnect = () => {
    disconnect();
    onOpenChange(false);
    navigate("/welcome");
  };

  const displayName = ensName || `${address?.slice(0, 6)}...${address?.slice(-4)}`;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Settings</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Profile Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Profile
            </h3>
            
            <div className="flex items-center gap-4 p-4 rounded-xl bg-secondary/50">
              {/* Avatar */}
              <div className="relative w-16 h-16 rounded-full bg-accent flex items-center justify-center overflow-hidden">
                {avatarLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                ) : avatar ? (
                  <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User className="h-8 w-8 text-accent-foreground" />
                )}
              </div>

              {/* Name & Address */}
              <div className="flex-1 min-w-0">
                {ensLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Resolving name...</span>
                  </div>
                ) : (
                  <>
                    <p className="font-semibold text-foreground truncate">{displayName}</p>
                    {ensName && (
                      <p className="text-xs text-muted-foreground truncate mt-1">
                        {address?.slice(0, 10)}...{address?.slice(-8)}
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* ENS/Basename Info */}
            <div className="p-4 rounded-xl border border-border bg-card">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-accent/10">
                  <User className="h-4 w-4 text-foreground" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm text-foreground">Web3 Identity</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {ensName 
                      ? `Your ENS name "${ensName}" is linked to this wallet.`
                      : "No ENS name or Basename found. Set one to display a human-readable identity."
                    }
                  </p>
                  {!ensName && (
                    <a
                      href="https://app.ens.domains"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-accent hover:underline mt-2"
                    >
                      Get an ENS name <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Appearance Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Appearance
            </h3>
            
            <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-card">
              <div>
                <p className="font-medium text-sm text-foreground">Theme</p>
                <p className="text-xs text-muted-foreground">Toggle dark/light mode</p>
              </div>
              <ThemeToggle className="h-9 w-9" />
            </div>
          </div>

          {/* Actions Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Account
            </h3>
            
            <Button
              variant="destructive"
              className="w-full gap-2"
              onClick={handleDisconnect}
            >
              <LogOut className="h-4 w-4" />
              Disconnect Wallet
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default SettingsSheet;
