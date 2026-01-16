import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

// Common emoji reactions
const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

interface MessageReactionsProps {
  messageId: string;
  reactions: { emoji: string; count: number; hasReacted: boolean }[];
  onReact: (messageId: string, emoji: string, action: 'added' | 'removed') => void;
  isOwn?: boolean;
}

export const MessageReactions = ({
  messageId,
  reactions,
  onReact,
  isOwn = false,
}: MessageReactionsProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleReact = useCallback(
    (emoji: string) => {
      const existing = reactions.find((r) => r.emoji === emoji);
      const action = existing?.hasReacted ? 'removed' : 'added';
      onReact(messageId, emoji, action);
      setIsOpen(false);
    },
    [messageId, reactions, onReact]
  );

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {/* Existing reactions */}
      <AnimatePresence>
        {reactions
          .filter((r) => r.count > 0)
          .map((reaction) => (
            <motion.button
              key={reaction.emoji}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleReact(reaction.emoji)}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-colors ${
                reaction.hasReacted
                  ? 'bg-primary/20 text-primary border border-primary/30'
                  : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
              }`}
            >
              <span>{reaction.emoji}</span>
              <span>{reaction.count}</span>
            </motion.button>
          ))}
      </AnimatePresence>

      {/* Add reaction button */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Smile className="h-3 w-3" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          side={isOwn ? 'left' : 'right'}
          className="w-auto p-2"
          align="center"
        >
          <div className="flex gap-1">
            {REACTION_EMOJIS.map((emoji) => (
              <motion.button
                key={emoji}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleReact(emoji)}
                className="p-1.5 hover:bg-secondary rounded text-lg"
              >
                {emoji}
              </motion.button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};
