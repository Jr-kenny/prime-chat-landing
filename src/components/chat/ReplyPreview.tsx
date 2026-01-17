import { X } from 'lucide-react';
import { motion } from 'framer-motion';

interface ReplyPreviewProps {
  replyToMessage: {
    id: string;
    content: string;
    isOwn: boolean;
  };
  onCancel: () => void;
}

export const ReplyPreview = ({ replyToMessage, onCancel }: ReplyPreviewProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="flex items-center gap-3 px-4 py-2 bg-secondary/50 border-l-4 border-primary rounded-r-lg"
    >
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-primary">
          {replyToMessage.isOwn ? 'Replying to yourself' : 'Replying to message'}
        </p>
        <p className="text-sm text-muted-foreground truncate">
          {replyToMessage.content}
        </p>
      </div>
      <button
        onClick={onCancel}
        className="p-1 hover:bg-secondary rounded-full transition-colors"
        type="button"
      >
        <X className="h-4 w-4 text-muted-foreground" />
      </button>
    </motion.div>
  );
};
