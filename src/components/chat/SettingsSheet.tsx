import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { User, Wallet } from "lucide-react";
import { toast } from "sonner";

interface SettingsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  address: string | undefined;
}

export const SettingsSheet = ({ open, onOpenChange, address }: SettingsSheetProps) => {
  const [displayName, setDisplayName] = useState("");
  const [ensName, setEnsName] = useState<string | null>(null);
  const [baseName, setBaseName] = useState<string | null>(null);
  const [isLoadingNames, setIsLoadingNames] = useState(false);

  // Load saved display name on mount
  useEffect(() => {
    if (address) {
      const savedName = localStorage.getItem(`primechat_displayname_${address}`);
      if (savedName) {
        setDisplayName(savedName);
      }
    }
  }, [address]);

  // Fetch ENS/Basename when sheet opens
  useEffect(() => {
    const fetchNames = async () => {
      if (!address || !open) return;
      
      setIsLoadingNames(true);
      try {
        // Fetch ENS name from Ethereum mainnet
        const ensResponse = await fetch(
          `https://api.ensideas.com/ens/resolve/${address}`
        );
        if (ensResponse.ok) {
          const ensData = await ensResponse.json();
          if (ensData.name) {
            setEnsName(ensData.name);
          }
        }
      } catch (error) {
        console.log("ENS lookup failed:", error);
      }

      try {
        // Fetch Basename from Base network
        const baseResponse = await fetch(
          `https://api.basename.app/v1/addresses/${address}`
        );
        if (baseResponse.ok) {
          const baseData = await baseResponse.json();
          if (baseData.name) {
            setBaseName(baseData.name);
          }
        }
      } catch (error) {
        console.log("Basename lookup failed:", error);
      }
      
      setIsLoadingNames(false);
    };

    fetchNames();
  }, [address, open]);

  const handleSave = () => {
    if (address && displayName.trim()) {
      localStorage.setItem(`primechat_displayname_${address}`, displayName.trim());
      toast.success("Display name saved");
    }
    onOpenChange(false);
  };

  const selectName = (name: string) => {
    setDisplayName(name);
  };

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

          {/* Available Names */}
          <div className="space-y-3">
            <Label className="text-sm text-muted-foreground flex items-center gap-2">
              <User className="h-4 w-4" />
              Available Names
            </Label>
            
            {isLoadingNames ? (
              <p className="text-sm text-muted-foreground">Looking up names...</p>
            ) : (
              <div className="space-y-2">
                {ensName && (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => selectName(ensName)}
                  >
                    <span className="text-xs text-muted-foreground mr-2">ENS:</span>
                    {ensName}
                  </Button>
                )}
                {baseName && (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => selectName(baseName)}
                  >
                    <span className="text-xs text-muted-foreground mr-2">Basename:</span>
                    {baseName}
                  </Button>
                )}
                {!ensName && !baseName && !isLoadingNames && (
                  <p className="text-sm text-muted-foreground">
                    No ENS or Basename found for this wallet
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Custom Display Name */}
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter your display name"
            />
            <p className="text-xs text-muted-foreground">
              This will be shown to other users in conversations
            </p>
          </div>

          {/* Save Button */}
          <Button onClick={handleSave} className="w-full">
            Save Changes
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
