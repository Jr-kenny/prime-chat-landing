import { usePrimeChatName } from "@/hooks/usePrimeChatName";
import { Loader2, User } from "lucide-react";

interface UserProfileSectionProps {
  address: `0x${string}` | undefined;
}

export const UserProfileSection = ({ address }: UserProfileSectionProps) => {
  const { name, isLoading } = usePrimeChatName();

  if (!address) return null;

  return (
    <div className="px-4 py-3 border-b border-border bg-secondary/30">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
          <User className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          {isLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Loading...</span>
            </div>
          ) : name ? (
            <>
              <p className="font-semibold text-foreground truncate">{name}</p>
              <p className="text-xs text-muted-foreground truncate">
                {address.slice(0, 6)}...{address.slice(-4)}
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No name registered</p>
          )}
        </div>
      </div>
    </div>
  );
};
