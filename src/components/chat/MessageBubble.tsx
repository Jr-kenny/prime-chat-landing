import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface MessageReaction {
  emoji: string;
  count: number;
  hasReacted: boolean;
}

interface DisplayMessage {
  id: string;
  content: string;
  time: string;
  isOwn: boolean;
  status?: "sent" | "delivered" | "read";
  timestamp: number;
  reactions?: MessageReaction[];
}

// Common emoji reactions
const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

interface MessageBubbleProps {
  message: DisplayMessage;
  onReact?: (messageId: string, emoji: string) => void;
}

export const MessageBubble = ({ message, onReact }: MessageBubbleProps) => {
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);

  // Handle long press for mobile
  const handleTouchStart = useCallback(() => {
    longPressTimer.current = setTimeout(() => {
      setShowReactionPicker(true);
    }, 500);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  // Handle right-click for desktop
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setShowReactionPicker(true);
  }, []);

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (bubbleRef.current && !bubbleRef.current.contains(e.target as Node)) {
        setShowReactionPicker(false);
      }
    };

    if (showReactionPicker) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showReactionPicker]);

  const handleReact = useCallback((emoji: string) => {
    onReact?.(message.id, emoji);
    setShowReactionPicker(false);
  }, [message.id, onReact]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${message.isOwn ? "justify-end" : "justify-start"} group relative`}
    >
      <div
        ref={bubbleRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        onContextMenu={handleContextMenu}
        className={`max-w-[70%] rounded-2xl px-4 py-3 relative select-none ${
          message.isOwn
            ? "bg-primary text-primary-foreground rounded-br-md"
            : "bg-secondary text-secondary-foreground rounded-bl-md"
        }`}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
        
        {/* Reactions display */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {message.reactions.filter(r => r.count > 0).map((reaction) => (
              <button
                key={reaction.emoji}
                onClick={() => handleReact(reaction.emoji)}
                className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs transition-colors ${
                  reaction.hasReacted
                    ? 'bg-primary/20 border border-primary/30'
                    : 'bg-background/50 hover:bg-background/80'
                }`}
              >
                <span>{reaction.emoji}</span>
                <span className={message.isOwn ? 'text-primary-foreground/80' : 'text-foreground/80'}>{reaction.count}</span>
              </button>
            ))}
          </div>
        )}

        <div className={`flex items-center justify-end gap-1 mt-1 ${
          message.isOwn ? "text-primary-foreground/60" : "text-muted-foreground"
        }`}>
          <span className="text-[10px]">{message.time}</span>
          {message.isOwn && message.status === "delivered" && (
            <span className="text-[10px]">✓</span>
          )}
          {message.isOwn && message.status === "read" && (
            <span className="text-[10px]">✓✓</span>
          )}
        </div>

        {/* Reaction picker popup */}
        <AnimatePresence>
          {showReactionPicker && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 10 }}
              className={`absolute z-50 ${
                message.isOwn ? 'right-0' : 'left-0'
              } -top-12 bg-card border border-border rounded-full shadow-lg px-2 py-1 flex gap-1`}
            >
              {REACTION_EMOJIS.map((emoji) => (
                <motion.button
                  key={emoji}
                  whileHover={{ scale: 1.3 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleReact(emoji)}
                  className="p-1.5 hover:bg-secondary rounded-full text-lg transition-colors"
                >
                  {emoji}
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};