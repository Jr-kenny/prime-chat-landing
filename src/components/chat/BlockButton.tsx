import { useState } from 'react';
import { ShieldOff, ShieldCheck, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

interface BlockButtonProps {
  isBlocked: boolean;
  onBlock: () => Promise<void>;
  onUnblock: () => Promise<void>;
  peerName?: string;
}

export const BlockButton = ({
  isBlocked,
  onBlock,
  onUnblock,
  peerName,
}: BlockButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleAction = async () => {
    setIsLoading(true);
    try {
      if (isBlocked) {
        await onUnblock();
        toast.success('Contact unblocked');
      } else {
        await onBlock();
        toast.success('Contact blocked');
      }
    } catch (error) {
      console.error('Failed to update block status:', error);
      toast.error('Failed to update contact');
    } finally {
      setIsLoading(false);
    }
  };

  if (isBlocked) {
    return (
      <Button
        variant="outline"
        className="w-full gap-2"
        onClick={handleAction}
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ShieldCheck className="h-4 w-4" />
        )}
        Unblock Contact
      </Button>
    );
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="destructive"
          className="w-full gap-2"
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ShieldOff className="h-4 w-4" />
          )}
          Block Contact
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Block {peerName || 'this contact'}?</AlertDialogTitle>
          <AlertDialogDescription>
            Blocked contacts won't be able to send you messages. You can unblock
            them later from the Blocked tab or contact info.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleAction}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Block
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
