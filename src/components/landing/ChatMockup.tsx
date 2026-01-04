import { useState } from "react";
import { motion } from "framer-motion";
import { Moon, Sun } from "lucide-react";

interface Message {
  id: number;
  sender: string;
  address: string;
  content: string;
  time: string;
  isOwn: boolean;
}

const mockMessages: Message[] = [
  {
    id: 1,
    sender: "vitalik.eth",
    address: "0x7a25...8f3d",
    content: "Hey! Saw your proposal on the DAO. Really solid thinking on the tokenomics.",
    time: "2:34 PM",
    isOwn: false,
  },
  {
    id: 2,
    sender: "You",
    address: "0x3b92...1a4c",
    content: "Thanks! Been working on it for weeks. The community feedback has been incredible.",
    time: "2:35 PM",
    isOwn: true,
  },
  {
    id: 3,
    sender: "vitalik.eth",
    address: "0x7a25...8f3d",
    content: "The encrypted group chat feature is exactly what we need. When's the launch?",
    time: "2:36 PM",
    isOwn: false,
  },
];

const ChatMockup = () => {
  const [isDark, setIsDark] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, delay: 0.5 }}
      className="relative mx-auto w-full max-w-[320px]"
    >
      {/* Phone Frame */}
      <div
        className={`relative rounded-[3rem] p-3 shadow-2xl transition-colors duration-300 ${
          isDark ? "bg-foreground" : "bg-foreground"
        }`}
      >
        {/* Screen */}
        <div
          className={`relative rounded-[2.5rem] overflow-hidden transition-colors duration-300 ${
            isDark ? "bg-[#0a0a0a]" : "bg-background"
          }`}
        >
          {/* Status Bar */}
          <div className="flex items-center justify-between px-6 pt-3 pb-2">
            <span className={`text-xs font-medium ${isDark ? "text-white" : "text-foreground"}`}>
              9:41
            </span>
            <div className="flex items-center gap-1">
              <div className={`w-4 h-2 rounded-sm ${isDark ? "bg-white" : "bg-foreground"}`} />
            </div>
          </div>

          {/* Header */}
          <div className={`px-4 py-3 border-b ${isDark ? "border-white/10" : "border-border"}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                  isDark ? "bg-accent text-accent-foreground" : "bg-accent text-accent-foreground"
                }`}>
                  V
                </div>
                <div>
                  <p className={`font-semibold text-sm ${isDark ? "text-white" : "text-foreground"}`}>
                    vitalik.eth
                  </p>
                  <p className={`text-xs ${isDark ? "text-white/50" : "text-muted-foreground"}`}>
                    0x7a25...8f3d
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsDark(!isDark)}
                className={`p-2 rounded-full transition-colors ${
                  isDark ? "bg-white/10 hover:bg-white/20" : "bg-secondary hover:bg-secondary/80"
                }`}
              >
                {isDark ? (
                  <Sun className="w-4 h-4 text-white" />
                ) : (
                  <Moon className="w-4 h-4 text-foreground" />
                )}
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="h-[280px] sm:h-[340px] px-4 py-4 space-y-4 overflow-hidden">
            {mockMessages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isOwn ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                    message.isOwn
                      ? isDark
                        ? "bg-accent text-accent-foreground"
                        : "bg-primary text-primary-foreground"
                      : isDark
                      ? "bg-white/10 text-white"
                      : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  <p className="text-sm leading-relaxed">{message.content}</p>
                  <p
                    className={`text-[10px] mt-1 ${
                      message.isOwn
                        ? isDark
                          ? "text-accent-foreground/70"
                          : "text-primary-foreground/70"
                        : isDark
                        ? "text-white/50"
                        : "text-muted-foreground"
                    }`}
                  >
                    {message.time}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className={`px-4 py-3 border-t ${isDark ? "border-white/10" : "border-border"}`}>
            <div
              className={`flex items-center gap-2 rounded-full px-4 py-2.5 ${
                isDark ? "bg-white/10" : "bg-secondary"
              }`}
            >
              <span className={`text-sm ${isDark ? "text-white/50" : "text-muted-foreground"}`}>
                Message...
              </span>
            </div>
          </div>

          {/* Home Indicator */}
          <div className="flex justify-center py-2">
            <div className={`w-32 h-1 rounded-full ${isDark ? "bg-white/30" : "bg-foreground/20"}`} />
          </div>
        </div>
      </div>

      {/* Reflection/Glow */}
      <div className="absolute -inset-4 -z-10 bg-accent/10 rounded-[4rem] blur-3xl opacity-50" />
    </motion.div>
  );
};

export default ChatMockup;
