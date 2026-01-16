import { motion } from "framer-motion";
import { useAccount, useDisconnect, useWalletClient } from "wagmi";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useEffect, useState, useCallback, useRef } from "react";
import { 
  Send, Search, Settings, Plus, 
  Smile, ArrowLeft, Users, Shield, Check, X, ChevronDown
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
import { ShareDialog } from "@/components/chat/ShareDialog";
import { PeerInfoSheet } from "@/components/chat/PeerInfoSheet";
import Logo from "@/components/Logo";
import { UserProfileSection } from "@/components/chat/UserProfileSection";
import { ConversationNameDisplay } from "@/components/chat/ConversationNameDisplay";
import { setXmtpClientForResolution } from "@/hooks/useNameResolution";
import { useSessionPersistence, type ChatSession } from "@/hooks/useSessionPersistence";
import { AttachmentPicker, AttachmentPreview, type AttachmentFile } from "@/components/chat/AttachmentPicker";
import { MessageBubble } from "@/components/chat/MessageBubble";

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
  lastMessageTimestamp: number;
}

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
  contentType?: string;
  attachment?: {
    filename: string;
    mimeType: string;
    data?: Uint8Array;
    url?: string;
  };
}

/**
 * Safely extract text content from XMTP message content
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractMessageContent(content: any): string {
  if (content === null || content === undefined) {
    return '';
  }
  if (typeof content === 'string') {
    return content;
  }
  if (typeof content === 'object') {
    if (content.text) return content.text;
    if (content.content) return extractMessageContent(content.content);
    // Check for attachment
    if (content.filename) return `📎 ${content.filename}`;
    // Check for reaction - skip display
    if (content.action && content.reference) return '';
    // Check for group membership change - skip display
    if (content.initiatedByInboxId || content.addedInboxes || content.removedInboxes) return '';
    const str = String(content);
    if (str === '[object Object]') {
      // Return greeting for unrecognized object types (like initial conversation setup)
      return 'Hi! 👋';
    }
    return str;
  }
  return String(content);
}

const Chat = () => {
  const { isConnected, address } = useAccount();
  const { disconnect } = useDisconnect();
  const { data: walletClient } = useWalletClient();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [messageInput, setMessageInput] = useState("");
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [pendingAttachment, setPendingAttachment] = useState<AttachmentFile | null>(null);
  
  // XMTP State
  const [xmtpClient, setXmtpClient] = useState<Client | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [conversations, setConversations] = useState<DisplayConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<DisplayConversation | null>(null);
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  // Session persistence
  const { saveSession, loadSession, clearSession } = useSessionPersistence();
  const [sessionRestored, setSessionRestored] = useState(false);
  
  // Dialog states
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [consentFilter, setConsentFilter] = useState<ConsentFilter>("allowed");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [showPeerInfo, setShowPeerInfo] = useState(false);

  // Auto-scroll and unread tracking
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  // Scroll to bottom helper
  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
    setHasNewMessages(false);
    if (selectedConversation) {
      setUnreadCounts(prev => ({ ...prev, [selectedConversation.id]: 0 }));
    }
  }, [selectedConversation]);

  // Handle scroll position
  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const target = event.currentTarget;
    const isNear = target.scrollHeight - target.scrollTop - target.clientHeight < 100;
    setIsNearBottom(isNear);
    if (isNear) {
      setHasNewMessages(false);
      if (selectedConversation) {
        setUnreadCounts(prev => ({ ...prev, [selectedConversation.id]: 0 }));
      }
    }
  }, [selectedConversation]);

  // Mobile back button handler - proper navigation stack
  const handleMobileBack = useCallback(() => {
    if (showMobileChat) {
      setShowMobileChat(false);
      setSelectedConversation(null);
    } else {
      // Already on conversation list, don't navigate away
    }
  }, [showMobileChat]);

  // Handle browser back button on mobile
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (showMobileChat) {
        event.preventDefault();
        handleMobileBack();
        // Push state back to prevent actual navigation
        window.history.pushState({ chat: true }, '', location.pathname);
      }
    };

    // Push initial state
    if (typeof window !== 'undefined') {
      window.history.pushState({ chat: true }, '', location.pathname);
      window.addEventListener('popstate', handlePopState);
    }

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [showMobileChat, handleMobileBack, location.pathname]);

  // Save session state when it changes
  useEffect(() => {
    if (sessionRestored) {
      saveSession({
        selectedConversationId: selectedConversation?.id ?? null,
        consentFilter,
        showMobileChat,
      });
    }
  }, [selectedConversation, consentFilter, showMobileChat, saveSession, sessionRestored]);

  // Redirect if not connected
  useEffect(() => {
    if (!isConnected) {
      clearSession();
      navigate("/welcome");
    }
  }, [isConnected, navigate, clearSession]);

  // Reset XMTP client when wallet address changes
  useEffect(() => {
    setXmtpClient(null);
    setConversations([]);
    setSelectedConversation(null);
    setMessages([]);
    setIsInitializing(false);
    setUnreadCounts({});
    setSessionRestored(false);
  }, [address]);

  // Initialize XMTP client
  useEffect(() => {
    const initXmtp = async () => {
      if (!walletClient || !address || xmtpClient || isInitializing) return;
      
      setIsInitializing(true);
      try {
        const client = await initializeXmtpClient(walletClient);
        setXmtpClient(client);
        setXmtpClientForResolution(client);
        toast.success("Connected to XMTP network");
      } catch (error) {
        console.error("Failed to initialize XMTP:", error);
        // Handle errors silently for identity conflicts - just log
        const msg = error instanceof Error ? error.message : String(error);
        if (msg.includes('Wrong chain id') || msg.includes('invalid argument')) {
          console.log("[XMTP] Identity conflict, auto-recovery attempted");
        } else if (msg.includes('createSyncAccessHandle')) {
          toast.error("Close other tabs and refresh to continue");
        } else {
          toast.error("Connection issue - please refresh");
        }
      } finally {
        setIsInitializing(false);
      }
    };

    initXmtp();
  }, [walletClient, address, xmtpClient, isInitializing]);

  // Throttle sync operations to prevent rate limiting
  const lastSyncRef = useRef<number>(0);
  const SYNC_THROTTLE_MS = 5000; // Minimum 5 seconds between full syncs

  // Load conversations from XMTP
  const loadConversations = useCallback(async (skipSync = false) => {
    if (!xmtpClient) return;
    
    try {
      const consentStates: ConsentState[] = [
        ConsentState.Allowed,
        ConsentState.Unknown,
        ConsentState.Denied,
      ];

      // Throttle sync operations to prevent rate limiting
      const now = Date.now();
      const shouldSync = !skipSync && (now - lastSyncRef.current > SYNC_THROTTLE_MS);
      
      if (shouldSync) {
        lastSyncRef.current = now;
        await xmtpClient.conversations.syncAll(consentStates);
      }

      const convList = await xmtpClient.conversations.list({ consentStates });
      
      const displayConvs: DisplayConversation[] = await Promise.all(
        convList.map(async (conv, index) => {
          let peerAddress = 'Unknown';
          if (conv instanceof Dm) {
            peerAddress = await conv.peerInboxId() || 'Unknown';
          } else if (conv instanceof Group) {
            peerAddress = conv.name || `Group ${index + 1}`;
          }
          
          const messagesResult = await conv.messages({ limit: 10n });
          const lastMsg = messagesResult.length > 0 ? messagesResult[messagesResult.length - 1] : null;
          const lastMessageTimestamp = lastMsg ? Number(lastMsg.sentAtNs) / 1000000 : 0;
          
          const consent = await conv.consentState();
          let consentState: "allowed" | "unknown" | "denied" = "unknown";
          if (consent === ConsentState.Allowed) consentState = "allowed";
          else if (consent === ConsentState.Denied) consentState = "denied";
          
          return {
            id: conv.id,
            peerAddress,
            name: `${peerAddress.slice(0, 6)}...${peerAddress.slice(-4)}`,
            lastMessage: extractMessageContent(lastMsg?.content) || 'No messages yet',
            time: lastMsg ? new Date(lastMessageTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
            unread: unreadCounts[conv.id] || 0,
            avatar: peerAddress.slice(2, 4).toUpperCase(),
            xmtpConversation: conv,
            consentState,
            lastMessageTimestamp,
          };
        })
      );
      
      displayConvs.sort((a, b) => b.lastMessageTimestamp - a.lastMessageTimestamp);
      setConversations(displayConvs);
      
      return displayConvs;
    } catch (error) {
      console.error("Failed to load conversations:", error);
      return [];
    }
  }, [xmtpClient, unreadCounts]);

  // Restore session after conversations load
  useEffect(() => {
    if (!xmtpClient || sessionRestored) return;
    
    const restoreSession = async () => {
      const session = loadSession();
      if (!session) {
        setSessionRestored(true);
        return;
      }

      // Restore consent filter
      setConsentFilter(session.consentFilter);

      // Load conversations first
      const convs = await loadConversations();
      
      // Find and restore selected conversation
      if (session.selectedConversationId && convs) {
        const found = convs.find(c => c.id === session.selectedConversationId);
        if (found) {
          setSelectedConversation(found);
          setShowMobileChat(session.showMobileChat);
        }
      }
      
      setSessionRestored(true);
    };

    restoreSession();
  }, [xmtpClient, sessionRestored, loadSession, loadConversations]);

  // Initial load and setup streams
  useEffect(() => {
    if (!xmtpClient || !sessionRestored) return;
    
    let conversationStream: { end: () => Promise<{ value: undefined; done: boolean }> } | null = null;
    let allMessagesStream: { end: () => Promise<{ value: undefined; done: boolean }> } | null = null;
    let isActive = true;

    const setupStreams = async () => {
      try {
        conversationStream = await xmtpClient.conversations.stream({
          onValue: async () => {
            if (!isActive) return;
            await loadConversations(true);
          },
        });

        allMessagesStream = await xmtpClient.conversations.streamAllMessages({
          consentStates: [ConsentState.Allowed, ConsentState.Unknown],
          onValue: async (message) => {
            if (!isActive) return;
            
            const isOwnMessage = message.senderInboxId === xmtpClient.inboxId;
            const convId = message.conversationId;
            
            if (!isOwnMessage && (!selectedConversation || selectedConversation.id !== convId)) {
              setUnreadCounts(prev => ({
                ...prev,
                [convId]: (prev[convId] || 0) + 1
              }));
            }
            
            // Use skipSync=true to avoid excessive API calls on every message
            // The list() call already fetches latest data from local DB
            await loadConversations(true);
          },
        });
      } catch (error) {
        console.error("Failed to setup streams:", error);
      }
    };

    // Only load if not already restored
    if (conversations.length === 0) {
      loadConversations();
    }
    setupStreams();

    return () => {
      isActive = false;
      if (conversationStream) conversationStream.end();
      if (allMessagesStream) allMessagesStream.end();
    };
  }, [xmtpClient, loadConversations, selectedConversation, sessionRestored, conversations.length]);

  // Load messages for selected conversation
  useEffect(() => {
    if (!selectedConversation?.xmtpConversation || !xmtpClient) return;
    
    let streamProxy: { end: () => Promise<{ value: undefined; done: boolean }> } | null = null;
    let isActive = true;
    
    const loadMessages = async () => {
      setIsLoadingMessages(true);
      try {
        await selectedConversation.xmtpConversation.sync();
        const xmtpMessages = await selectedConversation.xmtpConversation.messages();
        
        if (!isActive) return;
        
        const displayMessages: DisplayMessage[] = xmtpMessages.map((msg) => ({
          id: msg.id,
          content: extractMessageContent(msg.content),
          time: new Date(Number(msg.sentAtNs) / 1000000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isOwn: msg.senderInboxId === xmtpClient?.inboxId,
          status: "delivered" as const,
          timestamp: Number(msg.sentAtNs) / 1000000,
          reactions: [],
        }));
        
        // Filter out reaction messages (they're metadata, not display messages)
        const filteredMessages = displayMessages.filter(m => m.content !== '');
        
        setMessages(filteredMessages);
        setUnreadCounts(prev => ({ ...prev, [selectedConversation.id]: 0 }));
        
        // Always scroll to bottom when loading messages
        setTimeout(() => scrollToBottom("auto"), 100);
      } catch (error) {
        console.error("Failed to load messages:", error);
      } finally {
        setIsLoadingMessages(false);
      }
    };

    const setupStream = async () => {
      try {
        streamProxy = await selectedConversation.xmtpConversation.stream({
          onValue: (message) => {
            if (!isActive) return;
            
            const content = extractMessageContent(message.content);
            // Skip reaction messages in display
            if (content === '') return;
            
            const newMessage: DisplayMessage = {
              id: message.id,
              content,
              time: new Date(Number(message.sentAtNs) / 1000000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              isOwn: message.senderInboxId === xmtpClient?.inboxId,
              status: "delivered" as const,
              timestamp: Number(message.sentAtNs) / 1000000,
              reactions: [],
            };
            
            setMessages(prev => {
              if (prev.some(m => m.id === message.id)) return prev;
              const filtered = prev.filter(m => !m.id.startsWith('temp-') || m.content !== newMessage.content);
              return [...filtered, newMessage];
            });
            
            // Auto-scroll for new messages - always scroll for own messages, check isNearBottom for others
            if (newMessage.isOwn || isNearBottom) {
              setTimeout(() => scrollToBottom(), 50);
            } else {
              setHasNewMessages(true);
            }
          },
          onError: (error) => {
            console.error("Stream error:", error);
          },
        });
      } catch (error) {
        console.error("Failed to setup message stream:", error);
      }
    };

    loadMessages();
    setupStream();

    return () => {
      isActive = false;
      if (streamProxy) streamProxy.end();
    };
  }, [selectedConversation, xmtpClient, scrollToBottom, isNearBottom]);

  const handleSendMessage = async () => {
    if ((!messageInput.trim() && !pendingAttachment) || !selectedConversation?.xmtpConversation || isSending) return;
    
    const content = messageInput.trim();
    const attachment = pendingAttachment;
    
    setMessageInput("");
    setPendingAttachment(null);
    setIsSending(true);
    
    // Optimistic update
    const optimisticMessage: DisplayMessage = {
      id: `temp-${Date.now()}`,
      content: attachment ? `📎 ${attachment.file.name}` : content,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isOwn: true,
      status: "sent",
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, optimisticMessage]);
    setTimeout(() => scrollToBottom(), 50);
    
    try {
      // For now, send text content only (attachments need remote storage)
      if (content) {
        selectedConversation.xmtpConversation.sendOptimistic(content);
        await selectedConversation.xmtpConversation.publishMessages();
      }
      
      if (attachment) {
        // TODO: Implement with @xmtp/content-type-remote-attachment
        // For now, just send filename as placeholder
        toast.info("Attachments coming soon!");
      }
      
      await selectedConversation.xmtpConversation.sync();
      const xmtpMessages = await selectedConversation.xmtpConversation.messages();
      const displayMessages: DisplayMessage[] = xmtpMessages
        .map((msg) => ({
          id: msg.id,
          content: extractMessageContent(msg.content),
          time: new Date(Number(msg.sentAtNs) / 1000000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isOwn: msg.senderInboxId === xmtpClient?.inboxId,
          status: "delivered" as const,
          timestamp: Number(msg.sentAtNs) / 1000000,
        }))
        .filter(m => m.content !== '');
      setMessages(displayMessages);
      setTimeout(() => scrollToBottom(), 50);
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Failed to send message");
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
    setUnreadCounts(prev => ({ ...prev, [conv.id]: 0 }));
    setHasNewMessages(false);
  };

  const handleConversationCreated = useCallback(async (conversationId: string) => {
    if (!xmtpClient) return;
    
    try {
      await loadConversations();
      
      const consentStates: ConsentState[] = [
        ConsentState.Allowed,
        ConsentState.Unknown,
        ConsentState.Denied,
      ];
      await xmtpClient.conversations.syncAll(consentStates);
      const convList = await xmtpClient.conversations.list({ consentStates });
      
      const newConv = convList.find(c => c.id === conversationId);
      if (newConv) {
        let peerAddress = 'Unknown';
        if (newConv instanceof Dm) {
          peerAddress = await newConv.peerInboxId() || 'Unknown';
        } else if (newConv instanceof Group) {
          peerAddress = newConv.name || 'Group';
        }
        
        const consent = await newConv.consentState();
        let consentState: "allowed" | "unknown" | "denied" = "unknown";
        if (consent === ConsentState.Allowed) consentState = "allowed";
        else if (consent === ConsentState.Denied) consentState = "denied";
        
        const displayConv: DisplayConversation = {
          id: newConv.id,
          peerAddress,
          name: `${peerAddress.slice(0, 6)}...${peerAddress.slice(-4)}`,
          lastMessage: 'No messages yet',
          time: '',
          unread: 0,
          avatar: peerAddress.slice(2, 4).toUpperCase(),
          xmtpConversation: newConv,
          consentState,
          lastMessageTimestamp: 0,
        };
        
        setConsentFilter(consentState);
        setSelectedConversation(displayConv);
        setShowMobileChat(true);
      }
    } catch (error) {
      console.error("Failed to select new conversation:", error);
    }
  }, [xmtpClient, loadConversations]);

  const handleConsentAction = async (conv: DisplayConversation, action: "allow" | "deny") => {
    try {
      if (action === "allow") {
        await conv.xmtpConversation.updateConsentState(ConsentState.Allowed);
        toast.success("Contact allowed");
      } else {
        await conv.xmtpConversation.updateConsentState(ConsentState.Denied);
        toast.success("Contact blocked");
      }
      await loadConversations();
    } catch (error) {
      console.error("Failed to update consent:", error);
      toast.error("Failed to update contact");
    }
  };

  // Block handler for PeerInfoSheet
  const handleBlockPeer = useCallback(async () => {
    if (!selectedConversation) return;
    await selectedConversation.xmtpConversation.updateConsentState(ConsentState.Denied);
    await loadConversations();
    setShowPeerInfo(false);
    setSelectedConversation(null);
    setShowMobileChat(false);
  }, [selectedConversation, loadConversations]);

  const handleUnblockPeer = useCallback(async () => {
    if (!selectedConversation) return;
    await selectedConversation.xmtpConversation.updateConsentState(ConsentState.Allowed);
    await loadConversations();
  }, [selectedConversation, loadConversations]);

  // Filter conversations
  const filteredConversations = conversations.filter((conv) => {
    const matchesConsent = conv.consentState === consentFilter;
    const matchesSearch = searchQuery === "" || 
      conv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.peerAddress.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesConsent && matchesSearch;
  });

  const consentCounts = {
    allowed: conversations.filter(c => c.consentState === "allowed").length,
    unknown: conversations.filter(c => c.consentState === "unknown").length,
    denied: conversations.filter(c => c.consentState === "denied").length,
  };

  // Sidebar JSX
  const sidebarContent = (
    <div className="h-full flex flex-col bg-card border-r border-border">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <Link to="/" className="hover:opacity-80 transition-opacity">
            <Logo size="sm" />
          </Link>
          <div className="flex items-center gap-2">
            <ShareDialog />
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
        
        <div className="mt-3">
          <ConsentTabs 
            value={consentFilter} 
            onChange={setConsentFilter} 
            counts={consentCounts}
          />
        </div>
      </div>

      <UserProfileSection address={address} />

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
            filteredConversations.map((conv) => {
              const unreadCount = unreadCounts[conv.id] || 0;
              return (
                <motion.div
                  key={conv.id}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className={`w-full p-3 rounded-xl flex items-center gap-3 transition-colors mb-1 cursor-pointer ${
                    selectedConversation?.id === conv.id 
                      ? "bg-accent/20 border border-accent/30" 
                      : "hover:bg-secondary/50"
                  } ${conv.consentState === "unknown" ? "border-l-2 border-l-destructive" : ""}`}
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
                      {(unreadCount > 0 || conv.consentState === "unknown") && (
                        <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 bg-destructive text-destructive-foreground text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                          {unreadCount > 0 ? (unreadCount > 99 ? '99+' : unreadCount) : '!'}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center justify-between">
                        <div className={`font-semibold text-sm truncate ${unreadCount > 0 ? 'text-foreground' : 'text-foreground'}`}>
                          <ConversationNameDisplay inboxId={conv.peerAddress} />
                        </div>
                        <span className="text-xs text-muted-foreground">{conv.time}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className={`text-sm truncate ${unreadCount > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                          {conv.lastMessage}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {conv.consentState === "unknown" && (
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-green-500 hover:text-green-600 hover:bg-green-500/10"
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
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
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
              );
            })
          )}
        </div>
      </ScrollArea>

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
      {/* Chat Header - sticky */}
      <div className="px-4 py-3 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-9 w-9 lg:hidden"
              onClick={handleMobileBack}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-accent-foreground font-bold">
                {selectedConversation?.avatar}
              </div>
            </div>
            <div>
              <div className="font-semibold text-foreground">
                {selectedConversation && (
                  <ConversationNameDisplay inboxId={selectedConversation.peerAddress} />
                )}
              </div>
              <p className="text-xs text-muted-foreground">{selectedConversation?.peerAddress?.slice(0, 10)}...</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-9 w-9"
              onClick={() => setShowPeerInfo(true)}
              title="View contact info"
            >
              <Users className="h-4 w-4" />
            </Button>
            {/* Removed unused MoreVertical button */}
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-hidden relative">
        <ScrollArea 
          className="h-full p-4" 
          ref={scrollAreaRef}
          onScrollCapture={handleScroll}
        >
          <div className="space-y-4 max-w-3xl mx-auto pb-4">
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* New messages indicator */}
        {hasNewMessages && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            onClick={() => scrollToBottom()}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-2 rounded-full shadow-lg flex items-center gap-2 hover:bg-primary/90 transition-colors"
          >
            <ChevronDown className="h-4 w-4" />
            <span className="text-sm font-medium">New messages</span>
          </motion.button>
        )}
      </div>

      {/* Attachment Preview */}
      {pendingAttachment && (
        <div className="px-4 py-2 border-t border-border bg-card/50">
          <AttachmentPreview
            attachment={pendingAttachment}
            onRemove={() => setPendingAttachment(null)}
            onSend={handleSendMessage}
            isSending={isSending}
          />
        </div>
      )}

      {/* Message Input - sticky */}
      <div className="p-4 border-t border-border bg-card/50 backdrop-blur-sm sticky bottom-0">
        <div className="flex items-center gap-3 max-w-3xl mx-auto">
          <AttachmentPicker
            onAttach={setPendingAttachment}
            disabled={isSending}
          />
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
            disabled={isSending || (!messageInput.trim() && !pendingAttachment)}
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
      
      <NewConversationDialog
        open={showNewConversation}
        onOpenChange={setShowNewConversation}
        xmtpClient={xmtpClient}
        onConversationCreated={handleConversationCreated}
      />
      
      <SettingsSheet
        open={showSettings}
        onOpenChange={setShowSettings}
        address={address}
      />
      
      <PeerInfoSheet
        open={showPeerInfo}
        onOpenChange={setShowPeerInfo}
        peerInboxId={selectedConversation?.peerAddress}
        isBlocked={selectedConversation?.consentState === "denied"}
        onBlock={handleBlockPeer}
        onUnblock={handleUnblockPeer}
      />
    </>
  );
};

export default Chat;
