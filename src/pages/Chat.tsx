import { motion } from "framer-motion";
import { useAccount, useDisconnect } from "wagmi";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { 
  Moon, Sun, Send, Search, Settings, Plus, 
  MoreVertical, Phone, Video, Smile, Paperclip,
  ArrowLeft, Users, Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Conversation {
  id: number;
  name: string;
  address: string;
  lastMessage: string;
  time: string;
  unread: number;
  avatar: string;
  online: boolean;
}

interface Message {
  id: number;
  content: string;
  time: string;
  isOwn: boolean;
  status?: "sent" | "delivered" | "read";
}

const conversations: Conversation[] = [
  {
    id: 1,
    name: "vitalik.eth",
    address: "0x7a25...8f3d",
    lastMessage: "The encrypted group chat feature is exactly what we need.",
    time: "2:36 PM",
    unread: 2,
    avatar: "V",
    online: true,
  },
  {
    id: 2,
    name: "punk6529.eth",
    address: "0x4b21...9c7e",
    lastMessage: "Let's discuss the NFT integration tomorrow.",
    time: "1:15 PM",
    unread: 0,
    avatar: "P",
    online: true,
  },
  {
    id: 3,
    name: "sassal.eth",
    address: "0x8d43...2f1a",
    lastMessage: "Great podcast episode! 🎙️",
    time: "Yesterday",
    unread: 0,
    avatar: "S",
    online: false,
  },
  {
    id: 4,
    name: "cobie.eth",
    address: "0x2e67...5b8c",
    lastMessage: "Check out this alpha...",
    time: "Yesterday",
    unread: 5,
    avatar: "C",
    online: false,
  },
  {
    id: 5,
    name: "DegenSpartan",
    address: "0x9f12...3d4e",
    lastMessage: "wagmi ser 🚀",
    time: "Monday",
    unread: 0,
    avatar: "D",
    online: true,
  },
];

const Chat = () => {
  const { isConnected, address } = useAccount();
  const { disconnect } = useDisconnect();
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(false);
  const [messageInput, setMessageInput] = useState("");
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(conversations[0]);
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, content: "Hey! Saw your proposal on the DAO. Really solid thinking on the tokenomics.", time: "2:34 PM", isOwn: false },
    { id: 2, content: "Thanks! Been working on it for weeks. The community feedback has been incredible.", time: "2:35 PM", isOwn: true, status: "read" },
    { id: 3, content: "The encrypted group chat feature is exactly what we need. When's the launch?", time: "2:36 PM", isOwn: false },
    { id: 4, content: "We're targeting next month. Still need to finish the audit.", time: "2:38 PM", isOwn: true, status: "read" },
    { id: 5, content: "Perfect. Let me know if you need any help with the security review.", time: "2:40 PM", isOwn: false },
    { id: 6, content: "That would be amazing! I'll send over the docs.", time: "2:41 PM", isOwn: true, status: "delivered" },
  ]);
  const [showMobileChat, setShowMobileChat] = useState(false);

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

  const handleSendMessage = () => {
    if (!messageInput.trim()) return;
    const newMessage: Message = {
      id: messages.length + 1,
      content: messageInput,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isOwn: true,
      status: "sent"
    };
    setMessages([...messages, newMessage]);
    setMessageInput("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const selectConversation = (conv: Conversation) => {
    setSelectedConversation(conv);
    setShowMobileChat(true);
  };

  // Sidebar Component
  const Sidebar = () => (
    <div className="h-full flex flex-col bg-card border-r border-border">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-foreground">Prime Chat</h1>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setIsDark(!isDark)}>
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search conversations..." 
            className="pl-9 bg-secondary/50 border-0"
          />
        </div>
      </div>

      {/* User Profile */}
      <div className="p-4 border-b border-border bg-secondary/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-accent-foreground font-bold">
            {address?.slice(2, 4).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm text-foreground truncate">Connected Wallet</p>
            <p className="text-xs text-muted-foreground truncate">{address?.slice(0, 6)}...{address?.slice(-4)}</p>
          </div>
          <div className="flex items-center gap-1 text-xs text-accent">
            <Shield className="h-3 w-3" />
            <span>XMTP</span>
          </div>
        </div>
      </div>

      {/* Conversations List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {conversations.map((conv) => (
            <motion.button
              key={conv.id}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => selectConversation(conv)}
              className={`w-full p-3 rounded-xl flex items-center gap-3 transition-colors mb-1 ${
                selectedConversation?.id === conv.id 
                  ? "bg-accent/20 border border-accent/30" 
                  : "hover:bg-secondary/50"
              }`}
            >
              <div className="relative">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                  selectedConversation?.id === conv.id ? "bg-accent text-accent-foreground" : "bg-secondary text-foreground"
                }`}>
                  {conv.avatar}
                </div>
                {conv.online && (
                  <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-card" />
                )}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-sm text-foreground truncate">{conv.name}</p>
                  <span className="text-xs text-muted-foreground">{conv.time}</span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground truncate">{conv.lastMessage}</p>
                  {conv.unread > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-accent text-accent-foreground text-xs font-medium rounded-full">
                      {conv.unread}
                    </span>
                  )}
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </ScrollArea>

      {/* New Chat Button */}
      <div className="p-4 border-t border-border">
        <Button className="w-full gap-2" variant="default">
          <Plus className="h-4 w-4" />
          New Conversation
        </Button>
      </div>
    </div>
  );

  // Chat Area Component
  const ChatArea = () => (
    <div className="h-full flex flex-col bg-background">
      {/* Chat Header */}
      <div className="px-4 py-3 border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-9 w-9 lg:hidden"
              onClick={() => setShowMobileChat(false)}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-accent-foreground font-bold">
                {selectedConversation?.avatar}
              </div>
              {selectedConversation?.online && (
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-card" />
              )}
            </div>
            <div>
              <p className="font-semibold text-foreground">{selectedConversation?.name}</p>
              <p className="text-xs text-muted-foreground">{selectedConversation?.address}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Phone className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Video className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Users className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4 max-w-3xl mx-auto">
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${message.isOwn ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                  message.isOwn
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-secondary text-secondary-foreground rounded-bl-md"
                }`}
              >
                <p className="text-sm leading-relaxed">{message.content}</p>
                <div className={`flex items-center justify-end gap-1 mt-1 ${
                  message.isOwn ? "text-primary-foreground/60" : "text-muted-foreground"
                }`}>
                  <span className="text-[10px]">{message.time}</span>
                  {message.isOwn && message.status === "read" && (
                    <span className="text-[10px]">✓✓</span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </ScrollArea>

      {/* Message Input */}
      <div className="p-4 border-t border-border bg-card/50 backdrop-blur-sm">
        <div className="flex items-center gap-3 max-w-3xl mx-auto">
          <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0">
            <Paperclip className="h-5 w-5" />
          </Button>
          <div className="flex-1 relative">
            <Input
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type a message..."
              className="pr-12 py-6 bg-secondary/50 border-0 rounded-xl"
            />
            <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-9 w-9">
              <Smile className="h-5 w-5 text-muted-foreground" />
            </Button>
          </div>
          <Button 
            size="icon" 
            className="h-10 w-10 shrink-0 rounded-xl"
            onClick={handleSendMessage}
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );

  // Empty State
  const EmptyState = () => (
    <div className="h-full flex flex-col items-center justify-center bg-background text-center p-8">
      <div className="w-20 h-20 rounded-full bg-secondary/50 flex items-center justify-center mb-6">
        <Shield className="h-10 w-10 text-muted-foreground" />
      </div>
      <h2 className="text-xl font-semibold text-foreground mb-2">Welcome to Prime Chat</h2>
      <p className="text-muted-foreground max-w-md">
        Select a conversation to start messaging securely with end-to-end encryption powered by XMTP.
      </p>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="h-screen w-full bg-background flex"
    >
      {/* Desktop Layout */}
      <div className="hidden lg:flex w-full">
        <div className="w-80 xl:w-96 shrink-0">
          <Sidebar />
        </div>
        <div className="flex-1">
          {selectedConversation ? <ChatArea /> : <EmptyState />}
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="flex lg:hidden w-full">
        {!showMobileChat ? (
          <div className="w-full">
            <Sidebar />
          </div>
        ) : (
          <div className="w-full">
            <ChatArea />
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default Chat;
