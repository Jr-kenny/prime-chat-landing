import { useResolvedName } from "@/hooks/useNameResolution";
import { Loader2 } from "lucide-react";

interface ConversationNameDisplayProps {
  inboxId: string;
  className?: string;
  showAddress?: boolean;
}

/**
 * Displays the resolved PrimeChat name for an inbox ID,
 * falling back to truncated address if no name is registered.
 */
export const ConversationNameDisplay = ({ 
  inboxId, 
  className = "",
  showAddress = false 
}: ConversationNameDisplayProps) => {
  const { displayName, isLoading, name, address } = useResolvedName(inboxId);

  if (isLoading) {
    return (
      <span className={`flex items-center gap-1 ${className}`}>
        <Loader2 className="h-3 w-3 animate-spin" />
        <span className="text-muted-foreground">...</span>
      </span>
    );
  }

  return (
    <span className={className}>
      <span className={name ? "text-foreground font-semibold" : "text-foreground"}>
        {displayName}
      </span>
      {showAddress && name && address && (
        <span className="text-xs text-muted-foreground ml-1">
          ({address.slice(0, 6)}...{address.slice(-4)})
        </span>
      )}
    </span>
  );
};

/**
 * Simple hook wrapper for getting display name string
 */
export const useConversationDisplayName = (inboxId: string | undefined) => {
  const { displayName, name, isLoading } = useResolvedName(inboxId);
  return { displayName, hasRegisteredName: !!name, isLoading };
};
