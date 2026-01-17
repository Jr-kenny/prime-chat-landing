import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, useAnimation } from 'framer-motion';
import { Reply } from 'lucide-react';

interface MessageReaction {
  emoji: string;
  count: number;
  hasReacted: boolean;
}

interface ReplyToInfo {
  id: string;
  content: string;
  isOwn?: boolean;
}

interface DisplayMessage {
  id: string;
  content: string;
  time: string;
  isOwn: boolean;
  status?: "sent" | "delivered" | "read";
  timestamp: number;
  reactions?: MessageReaction[];
  replyTo?: ReplyToInfo;
}

// Common emoji reactions
const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

interface MessageBubbleProps {
  message: DisplayMessage;
  onReact?: (messageId: string, emoji: string, action: 'added' | 'removed') => void;
  onReply?: (message: { id: string; content: string; isOwn: boolean }) => void;
}

export const MessageBubble = ({ message, onReact, onReply }: MessageBubbleProps) => {
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  
  // Swipe to reply
  const x = useMotionValue(0);
  const controls = useAnimation();
  const replyIconOpacity = useTransform(x, [0, 50, 80], [0, 0.5, 1]);
  const replyIconScale = useTransform(x, [0, 50, 80], [0.5, 0.8, 1]);
  const [isDragging, setIsDragging] = useState(false);

  // Handle long press for mobile - show reactions + reply
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
    const existing = message.reactions?.find(r => r.emoji === emoji);
    const action = existing?.hasReacted ? 'removed' : 'added';
    onReact?.(message.id, emoji, action);
    setShowReactionPicker(false);
  }, [message.id, message.reactions, onReact]);

  const handleReply = useCallback(() => {
    onReply?.({ id: message.id, content: message.content, isOwn: message.isOwn });
    setShowReactionPicker(false);
  }, [message, onReply]);

  // Swipe gesture handling
  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    const currentX = x.get();
    if (currentX > 60 && onReply) {
      handleReply();
    }
    controls.start({ x: 0, transition: { type: 'spring', stiffness: 500, damping: 30 } });
  }, [x, controls, onReply, handleReply]);

  return (
    <div className={`relative flex ${message.isOwn ? 'justify-end' : 'justify-start'}`}>
      {/* Reply icon indicator (shows on swipe) */}
      {!message.isOwn && (
        <motion.div
          style={{ opacity: replyIconOpacity, scale: replyIconScale }}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-8 text-muted-foreground"
        >
          <Reply className="h-5 w-5" />
        </motion.div>
      )}

      <motion.div
        ref={bubbleRef}
        drag={!message.isOwn && onReply ? "x" : false}
        dragConstraints={{ left: 0, right: 100 }}
        dragElastic={0.1}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd}
        animate={controls}
        style={{ x: !message.isOwn ? x : undefined }}
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        onContextMenu={handleContextMenu}
        className={`max-w-[70%] rounded-2xl px-4 py-3 relative select-none cursor-pointer ${
          message.isOwn
            ? "bg-primary text-primary-foreground rounded-br-md"
            : "bg-secondary text-secondary-foreground rounded-bl-md"
        } ${isDragging ? 'shadow-lg' : ''}`}
      >
        {/* Reply-to preview */}
        {message.replyTo && (
          <div className={`mb-2 px-3 py-2 rounded-lg text-xs border-l-2 ${
            message.isOwn 
              ? 'bg-primary-foreground/10 border-primary-foreground/30' 
              : 'bg-background/50 border-primary/50'
          }`}>
            <p className="opacity-70 truncate">{message.replyTo.content}</p>
          </div>
        )}

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

        {/* Reaction + Reply picker popup */}
        <AnimatePresence>
          {showReactionPicker && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 10 }}
              className={`absolute z-50 ${
                message.isOwn ? 'right-0' : 'left-0'
              } -top-14 bg-card border border-border rounded-full shadow-lg px-2 py-1 flex items-center gap-1`}
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
              {/* Reply button in picker */}
              {onReply && (
                <>
                  <div className="w-px h-6 bg-border mx-1" />
                  <motion.button
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleReply}
                    className="p-1.5 hover:bg-secondary rounded-full transition-colors"
                    title="Reply"
                  >
                    <Reply className="h-4 w-4" />
                  </motion.button>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
