import { motion } from "framer-motion";
import { useAccount, useDisconnect, useWalletClient } from "wagmi";
import { useNavigate, Link } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { 
  Send, Search, Settings, Plus, 
  MoreVertical, Smile, Paperclip,
  ArrowLeft, Users, Shield, Loader2, Check, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { initializeXmtpClient, type Client } from "@/lib/xmtp";
import { Dm, Group, ConsentState } from "@xmtp/browser-sdk";
import { toast } from "sonner";
import { NewConversationDialog } from "@/components/chat/NewConversationDialog";
import { ConsentTabs, type ConsentFilter } from "@/components/chat/ConsentTabs";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SettingsSheet } from "@/components/chat/SettingsSheet";

interface DisplayConversation {
  id: string;
  peerAddress: string;
  name: string;
  lastMessage: string;
  time: string;
  unread: number;
  avatar: string;
  xmtpConversation: Dm | Group;
  consentState: "allowed" | "unknown" | "denied";
}

interface DisplayMessage {
  id: string;
  content: string;
  time: string;
  isOwn: boolean;
  status?: "sent" | "delivered" | "read";
}

const Chat = () => {
  const { isConnected, address } = useAccount();
  const { disconnect } = useDisconnect();
  const { data: walletClient } = useWalletClient();
  const navigate = useNavigate();
  
  const [messageInput, setMessageInput] = useState("");
  const [showMobileChat, setShowMobileChat] = useState(false);
  
  // XMTP State
  const [xmtpClient, setXmtpClient] = useState<Client | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [conversations, setConversations] = useState<DisplayConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<DisplayConversation | null>(null);
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  // New conversation dialog, consent filter & settings
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [consentFilter, setConsentFilter] = useState<ConsentFilter>("allowed");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSettings, setShowSettings] = useState(false);

  // Redirect if not connected
  useEffect(() => {
    if (!isConnected) {
      navigate("/welcome");
    }
  }, [isConnected, navigate]);

  // Reset XMTP client when wallet address changes
  useEffect(() => {
    // Clear XMTP state when wallet changes
    setXmtpClient(null);
    setConversations([]);
    setSelectedConversation(null);
    setMessages([]);
    setIsInitializing(false);
  }, [address]);

  // Initialize XMTP client
  useEffect(() => {
    const initXmtp = async () => {
      if (!walletClient || !address || xmtpClient || isInitializing) return;
      
      setIsInitializing(true);
      try {
        const client = await initializeXmtpClient(walletClient);
        setXmtpClient(client);
        toast.success("Connected to XMTP network");
      } catch (error) {
        console.error("Failed to initialize XMTP:", error);
        toast.error("Failed to connect to XMTP network");
      } finally {
        setIsInitializing(false);
      }
    };

    initXmtp();
  }, [walletClient, address, xmtpClient, isInitializing]);

  // Load conversations from XMTP
  const loadConversations = useCallback(async () => {
    if (!xmtpClient) return;
    
    try {
      // Sync with network
      await xmtpClient.conversations.sync();
      
      // List all conversations
      const convList = await xmtpClient.conversations.list();
      
      const displayConvs: DisplayConversation[] = await Promise.all(
        convList.map(async (conv, index) => {
          // Get peer identifier depending on conversation type
          let peerAddress = 'Unknown';
          if (conv instanceof Dm) {
            peerAddress = await conv.peerInboxId() || 'Unknown';
          } else if (conv instanceof Group) {
            peerAddress = conv.name || `Group ${index + 1}`;
          }
          
          const messages = await conv.messages({ limit: 1n });
          const lastMsg = messages[0];
          
          // Get consent state for this conversation
          const consent = await conv.consentState();
          let consentState: "allowed" | "unknown" | "denied" = "unknown";
          if (consent === ConsentState.Allowed) consentState = "allowed";
          else if (consent === ConsentState.Denied) consentState = "denied";
          
          return {
            id: conv.id,
            peerAddress,
            name: `${peerAddress.slice(0, 6)}...${peerAddress.slice(-4)}`,
            lastMessage: lastMsg?.content?.toString() || 'No messages yet',
            time: lastMsg ? new Date(Number(lastMsg.sentAtNs) / 1000000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
            unread: 0,
            avatar: peerAddress.slice(2, 4).toUpperCase(),
            xmtpConversation: conv,
            consentState,
          };
        })
      );
      
      setConversations(displayConvs);
    } catch (error) {
      console.error("Failed to load conversations:", error);
    }
  }, [xmtpClient]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Load messages for selected conversation
  useEffect(() => {
    const loadMessages = async () => {
      if (!selectedConversation?.xmtpConversation) return;
      
      setIsLoadingMessages(true);
      try {
        await selectedConversation.xmtpConversation.sync();
        const xmtpMessages = await selectedConversation.xmtpConversation.messages();
        
        const displayMessages: DisplayMessage[] = xmtpMessages.map((msg) => ({
          id: msg.id,
          content: msg.content?.toString() || '',
          time: new Date(Number(msg.sentAtNs) / 1000000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isOwn: msg.senderInboxId === xmtpClient?.inboxId,
          status: "delivered" as const,
        }));
        
        setMessages(displayMessages);
      } catch (error) {
        console.error("Failed to load messages:", error);
      } finally {
        setIsLoadingMessages(false);
      }
    };

    loadMessages();
  }, [selectedConversation, xmtpClient]);

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedConversation?.xmtpConversation || isSending) return;
    
    const content = messageInput.trim();
    setMessageInput("");
    setIsSending(true);
    
    // Optimistic update
    const optimisticMessage: DisplayMessage = {
      id: `temp-${Date.now()}`,
      content,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isOwn: true,
      status: "sent"
    };
    setMessages(prev => [...prev, optimisticMessage]);
    
    try {
      await selectedConversation.xmtpConversation.send(content);
      // Sync to get the actual message from network and replace optimistic one
      await selectedConversation.xmtpConversation.sync();
      const xmtpMessages = await selectedConversation.xmtpConversation.messages();
      const displayMessages: DisplayMessage[] = xmtpMessages.map((msg) => ({
        id: msg.id,
        content: msg.content?.toString() || '',
        time: new Date(Number(msg.sentAtNs) / 1000000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isOwn: msg.senderInboxId === xmtpClient?.inboxId,
        status: "delivered" as const,
      }));
      setMessages(displayMessages);
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Failed to send message");
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id));
      setMessageInput(content);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const selectConversation = (conv: DisplayConversation) => {
    setSelectedConversation(conv);
    setShowMobileChat(true);
  };

  // Allow or deny a conversation (consent management)
  const handleConsentAction = async (conv: DisplayConversation, action: "allow" | "deny") => {
    try {
      if (action === "allow") {
        await conv.xmtpConversation.updateConsentState(ConsentState.Allowed);
        toast.success("Contact allowed");
      } else {
        await conv.xmtpConversation.updateConsentState(ConsentState.Denied);
        toast.success("Contact blocked");
      }
      // Refresh conversations to update consent states
      await loadConversations();
    } catch (error) {
      console.error("Failed to update consent:", error);
      toast.error("Failed to update contact");
    }
  };

  // Filter conversations by consent state and search
  const filteredConversations = conversations.filter((conv) => {
    const matchesConsent = conv.consentState === consentFilter;
    const matchesSearch = searchQuery === "" || 
      conv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.peerAddress.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesConsent && matchesSearch;
  });

  // Count conversations by consent state
  const consentCounts = {
    allowed: conversations.filter(c => c.consentState === "allowed").length,
    unknown: conversations.filter(c => c.consentState === "unknown").length,
    denied: conversations.filter(c => c.consentState === "denied").length,
  };

  // Sidebar JSX
  const sidebarContent = (
    <div className="h-full flex flex-col bg-card border-r border-border">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <Link to="/" className="text-xl font-bold text-foreground hover:opacity-80 transition-opacity">
            Prime Chat
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-9 w-9"
              onClick={() => setShowSettings(true)}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search conversations..." 
            className="pl-9 bg-secondary/50 border-0"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        {/* Consent Tabs */}
        <div className="mt-3">
          <ConsentTabs 
            value={consentFilter} 
            onChange={setConsentFilter} 
            counts={consentCounts}
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
          {filteredConversations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">
                {consentFilter === "allowed" && "No conversations yet"}
                {consentFilter === "unknown" && "No message requests"}
                {consentFilter === "denied" && "No blocked contacts"}
              </p>
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <motion.div
                key={conv.id}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className={`w-full p-3 rounded-xl flex items-center gap-3 transition-colors mb-1 cursor-pointer ${
                  selectedConversation?.id === conv.id 
                    ? "bg-accent/20 border border-accent/30" 
                    : "hover:bg-secondary/50"
                }`}
              >
                <div 
                  className="flex-1 flex items-center gap-3"
                  onClick={() => selectConversation(conv)}
                >
                  <div className="relative">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                      selectedConversation?.id === conv.id ? "bg-accent text-accent-foreground" : "bg-secondary text-foreground"
                    }`}>
                      {conv.avatar}
                    </div>
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
                </div>
                
                {/* Consent action buttons for unknown/denied */}
                {conv.consentState === "unknown" && (
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-green-500 hover:bg-green-500/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleConsentAction(conv, "allow");
                      }}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive hover:bg-destructive/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleConsentAction(conv, "deny");
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                {conv.consentState === "denied" && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleConsentAction(conv, "allow");
                    }}
                  >
                    Unblock
                  </Button>
                )}
              </motion.div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* New Chat Button */}
      <div className="p-4 border-t border-border">
        <Button 
          className="w-full gap-2" 
          variant="default"
          onClick={() => setShowNewConversation(true)}
        >
          <Plus className="h-4 w-4" />
          New Conversation
        </Button>
      </div>
    </div>
  );

  // Chat Area JSX
  const chatAreaContent = (
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
            </div>
            <div>
              <p className="font-semibold text-foreground">{selectedConversation?.name}</p>
              <p className="text-xs text-muted-foreground">{selectedConversation?.peerAddress?.slice(0, 10)}...</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
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

  // Empty State JSX
  const emptyStateContent = (
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
    <>
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="h-screen w-full bg-background flex"
    >
      {/* Desktop Layout */}
      <div className="hidden lg:flex w-full">
        <div className="w-80 xl:w-96 shrink-0">
          {sidebarContent}
        </div>
        <div className="flex-1">
          {selectedConversation ? chatAreaContent : emptyStateContent}
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="flex lg:hidden w-full">
        {!showMobileChat ? (
          <div className="w-full">
            {sidebarContent}
          </div>
        ) : (
          <div className="w-full">
            {chatAreaContent}
          </div>
        )}
      </div>
    </motion.div>
    
    {/* New Conversation Dialog */}
    <NewConversationDialog
      open={showNewConversation}
      onOpenChange={setShowNewConversation}
      xmtpClient={xmtpClient}
      onConversationCreated={loadConversations}
    />
    
    {/* Settings Sheet */}
    <SettingsSheet
      open={showSettings}
      onOpenChange={setShowSettings}
      address={address}
    />
    </>
  );
};

export default Chat;
