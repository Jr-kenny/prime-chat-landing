import { motion } from "framer-motion";
import { useAccount, useDisconnect } from "wagmi";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { LogOut, Moon, Sun, Send, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Message {
  id: number;
  sender: string;
  address: string;
  content: string;
  time: string;
  isOwn: boolean;
}

const mockConversations = [
  { id: 1, name: "vitalik.eth", address: "0x7a25...8f3d", lastMessage: "The encrypted group chat feature is...", unread: 2 },
  { id: 2, name: "punk6529.eth", address: "0x4b28...9c2e", lastMessage: "Let's discuss the NFT integration", unread: 0 },
  { id: 3, name: "sassal.eth", address: "0x9d12...3f7a", lastMessage: "Great call yesterday!", unread: 1 },
];

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
  {
    id: 4,
    sender: "You",
    address: "0x3b92...1a4c",
    content: "We're targeting next month. Still need to finish the audit.",
    time: "2:38 PM",
    isOwn: true,
  },
];

const Chat = () => {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(false);
  const [messageInput, setMessageInput] = useState("");
  const [showSidebar, setShowSidebar] = useState(true);

  useEffect(() => {
    if (!isConnected) {
      navigate("/welcome");
    }
  }, [isConnected, navigate]);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="h-screen bg-background flex"
    >
      {/* Sidebar */}
      <div
        className={`${
          showSidebar ? "w-80" : "w-0"
        } transition-all duration-300 border-r border-border bg-card overflow-hidden flex-shrink-0`}
      >
        <div className="h-full flex flex-col min-w-[320px]">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between">
              <span className="text-xl font-bold">prime chat</span>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsDark(!isDark)}
                  className="h-8 w-8"
                >
                  {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="mt-3 p-3 bg-secondary rounded-lg">
              <p className="text-xs text-muted-foreground">Connected as</p>
              <p className="font-medium text-sm">{address ? truncateAddress(address) : ""}</p>
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-2">
              {mockConversations.map((conv) => (
                <div
                  key={conv.id}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    conv.id === 1
                      ? "bg-secondary"
                      : "hover:bg-secondary/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-accent-foreground font-bold">
                      {conv.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm truncate">{conv.name}</p>
                        {conv.unread > 0 && (
                          <span className="w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                            {conv.unread}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {conv.lastMessage}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Disconnect */}
          <div className="p-4 border-t border-border">
            <Button
              variant="ghost"
              className="w-full justify-start text-muted-foreground hover:text-foreground"
              onClick={() => disconnect()}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Disconnect
            </Button>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="h-16 border-b border-border flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setShowSidebar(!showSidebar)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-accent-foreground font-bold">
              V
            </div>
            <div>
              <p className="font-semibold">vitalik.eth</p>
              <p className="text-xs text-muted-foreground">0x7a25...8f3d</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {mockMessages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${message.isOwn ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                  message.isOwn
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground"
                }`}
              >
                <p className="text-sm leading-relaxed">{message.content}</p>
                <p
                  className={`text-[10px] mt-1 ${
                    message.isOwn
                      ? "text-primary-foreground/70"
                      : "text-muted-foreground"
                  }`}
                >
                  {message.time}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 bg-secondary rounded-full px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <Button size="icon" className="rounded-full h-11 w-11">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Chat;
