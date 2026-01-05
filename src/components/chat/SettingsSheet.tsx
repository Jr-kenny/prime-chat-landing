import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { User, Wallet, LogOut } from "lucide-react";
import { useDisconnect } from "wagmi";
import { useNavigate } from "react-router-dom";

interface SettingsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  address: string | undefined;
}

export const SettingsSheet = ({ open, onOpenChange, address }: SettingsSheetProps) => {
  const [ensName, setEnsName] = useState<string | null>(null);
  const [baseName, setBaseName] = useState<string | null>(null);
  const [isLoadingNames, setIsLoadingNames] = useState(false);
  const { disconnect } = useDisconnect();
  const navigate = useNavigate();

  const handleDisconnect = () => {
    disconnect();
    onOpenChange(false);
    navigate("/welcome");
  };

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

          {/* Linked Names */}
          <div className="space-y-3">
            <Label className="text-sm text-muted-foreground flex items-center gap-2">
              <User className="h-4 w-4" />
              Linked Names
            </Label>
            
            {isLoadingNames ? (
              <p className="text-sm text-muted-foreground">Looking up names...</p>
            ) : (
              <div className="space-y-2">
                {ensName && (
                  <div className="p-3 bg-secondary/50 rounded-lg">
                    <span className="text-xs text-muted-foreground mr-2">ENS:</span>
                    <span className="font-medium">{ensName}</span>
                  </div>
                )}
                {baseName && (
                  <div className="p-3 bg-secondary/50 rounded-lg">
                    <span className="text-xs text-muted-foreground mr-2">Basename:</span>
                    <span className="font-medium">{baseName}</span>
                  </div>
                )}
                {!ensName && !baseName && (
                  <p className="text-sm text-muted-foreground">
                    No ENS or Basename found for this wallet
                  </p>
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
