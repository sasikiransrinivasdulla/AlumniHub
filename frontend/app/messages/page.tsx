"use client";

import { useEffect, useState, useRef, use, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { getUserProfile, clearAuth, UserProfile } from "@/services/authService";
import {
  getConversations,
  getMessages,
  sendMessage,
  markAsRead,
  deleteMessage,
  ConversationDto,
  MessageDto,
} from "@/services/chatService";
import { uploadPostImage } from "@/services/uploadService";
import { useSocket } from "@/context/SocketContext";
import Sidebar from "@/components/Sidebar";
import { motion, AnimatePresence } from "framer-motion";

import { requestCache } from "@/services/cacheService";

function MessagesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryConversationId = searchParams.get("conversationId");

  const { stompClient, setUnreadCount } = useSocket();

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [conversations, setConversations] = useState<ConversationDto[]>([]);
  const [activeConversation, setActiveConversation] = useState<ConversationDto | null>(null);
  
  const [messages, setMessages] = useState<MessageDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Pagination states
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  
  // Message input state
  const [inputText, setInputText] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Other UI states
  const [showEmojiPlaceholder, setShowEmojiPlaceholder] = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [seenStatus, setSeenStatus] = useState(false);

  // Refs
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const activeConvRef = useRef<ConversationDto | null>(null);

  // Keep active conversation ref in sync for event listeners
  useEffect(() => {
    activeConvRef.current = activeConversation;
  }, [activeConversation]);

  // 1. Initial Authentication & Conversations fetch
  useEffect(() => {
    async function loadInitialData() {
      try {
        const profile = await getUserProfile();
        if (!profile.profileCompleted) {
          router.push("/profile/setup");
          return;
        }
        setCurrentUser(profile);

        // Check cache first
        const cachedConvList = requestCache.get("conversations_list");
        let convList: ConversationDto[] = [];
        if (cachedConvList) {
          convList = cachedConvList;
          setConversations(convList);
          setLoadingConversations(false);
        } else {
          convList = await getConversations();
          setConversations(convList);
          requestCache.set("conversations_list", convList, 15000); // cache for 15s
          setLoadingConversations(false);
        }

        // If query param is present, select that conversation
        if (queryConversationId) {
          const match = convList.find((c) => c.id === queryConversationId);
          if (match) {
            setActiveConversation(match);
          } else {
            // Fetch conversation directly if not in list
            try {
              const { getOrCreateConversation } = await import("@/services/chatService");
              const targetUserConv = await getOrCreateConversation(queryConversationId);
              setActiveConversation(targetUserConv);
              setConversations((prev) => {
                const updated = [targetUserConv, ...prev.filter(c => c.id !== targetUserConv.id)];
                requestCache.set("conversations_list", updated, 15000);
                return updated;
              });
            } catch (err) {
              console.error("Could not fetch conversation for query ID", err);
            }
          }
        }
      } catch (err) {
        console.error(err);
        clearAuth();
        router.push("/");
      } finally {
        setLoading(false);
      }
    }
    loadInitialData();
  }, [queryConversationId, router]);

  // 2. Load Messages when Active Conversation changes
  useEffect(() => {
    if (!activeConversation) {
      setMessages([]);
      return;
    }

    setLoadingMessages(true);
    setPage(0);
    setHasMore(true);
    setSeenStatus(false);

    // Check cache
    const cacheKey = `messages_${activeConversation.id}`;
    const cachedMessages = requestCache.get(cacheKey);
    if (cachedMessages) {
      setMessages(cachedMessages);
      setLoadingMessages(false);
      
      // Still fetch from network to refresh, but do it silently
      getMessages(activeConversation.id, 0)
        .then((res) => {
          const list = [...res.content].reverse();
          setMessages(list);
          setHasMore(!res.last);
          requestCache.set(cacheKey, list, 15000);
        })
        .catch(console.error);

      // Trigger scroll
      setTimeout(() => {
        if (chatEndRef.current) {
          chatEndRef.current.scrollIntoView({ behavior: "auto" });
        }
      }, 100);

      markAsRead(activeConversation.id).catch(console.error);
      return;
    }

    getMessages(activeConversation.id, 0)
      .then((res) => {
        const list = [...res.content].reverse();
        setMessages(list);
        setHasMore(!res.last);
        requestCache.set(cacheKey, list, 15000);
        
        markAsRead(activeConversation.id).catch(console.error);
        
        setTimeout(() => {
          if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: "auto" });
          }
        }, 100);
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        setLoadingMessages(false);
      });
  }, [activeConversation]);

  // 3. Handle inbox updates from SocketProvider
  useEffect(() => {
    const handleInboxUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<ConversationDto>;
      const updatedConv = customEvent.detail;
      
      setConversations((prev) => {
        const filtered = prev.filter((c) => c.id !== updatedConv.id);
        const list = [updatedConv, ...filtered];
        requestCache.set("conversations_list", list, 15000);
        return list;
      });

      if (activeConvRef.current && activeConvRef.current.id === updatedConv.id) {
        markAsRead(updatedConv.id).catch(console.error);
      }
    };

    window.addEventListener("inbox-update", handleInboxUpdate);
    return () => {
      window.removeEventListener("inbox-update", handleInboxUpdate);
    };
  }, []);

  // 4. WebSocket Room Subscription for Active Conversation
  useEffect(() => {
    if (!stompClient || !activeConversation) return;

    // Subscribe to messages
    const msgSub = stompClient.subscribe(`/topic/conversations/${activeConversation.id}`, (message) => {
      try {
        const newMsg: MessageDto = JSON.parse(message.body);
        
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          
          // Replace any matching optimistic message
          const hasOptimistic = prev.some((m) => m.id.startsWith("optimistic-") && m.text === newMsg.text);
          let list;
          if (hasOptimistic) {
            list = prev.map((m) => (m.id.startsWith("optimistic-") && m.text === newMsg.text) ? newMsg : m);
          } else {
            list = [...prev, newMsg];
          }
          requestCache.set(`messages_${activeConversation.id}`, list, 15000);
          return list;
        });

        setTimeout(() => {
          if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: "smooth" });
          }
        }, 50);

        if (currentUser && newMsg.senderId !== currentUser.id) {
          markAsRead(activeConversation.id).catch(console.error);
        }
      } catch (err) {
        console.error("Error parsing message body", err);
      }
    });

    // Subscribe to seen status
    const readSub = stompClient.subscribe(`/topic/conversations/${activeConversation.id}/read`, () => {
      setMessages((prev) => {
        const list = prev.map((m) => (currentUser && m.senderId === currentUser.id ? { ...m, isRead: true } : m));
        requestCache.set(`messages_${activeConversation.id}`, list, 15000);
        return list;
      });
      setSeenStatus(true);
    });

    return () => {
      msgSub.unsubscribe();
      readSub.unsubscribe();
    };
  }, [stompClient, activeConversation, currentUser]);

  // 5. Scroll Pagination / Lazy Loading
  const handleScroll = async () => {
    if (!chatContainerRef.current || loadingMessages || !hasMore || !activeConversation) return;

    const { scrollTop, scrollHeight } = chatContainerRef.current;
    if (scrollTop <= 10) { // Near the top of the container
      const nextPage = page + 1;
      setLoadingMessages(true);

      try {
        const res = await getMessages(activeConversation.id, nextPage);
        const olderMessages = [...res.content].reverse();
        const prevHeight = scrollHeight;
        
        setMessages((prev) => {
          const list = [...olderMessages, ...prev];
          requestCache.set(`messages_${activeConversation.id}`, list, 15000);
          return list;
        });
        setPage(nextPage);
        setHasMore(!res.last);

        setTimeout(() => {
          if (chatContainerRef.current) {
            const diff = chatContainerRef.current.scrollHeight - prevHeight;
            chatContainerRef.current.scrollTop = diff;
          }
        }, 50);
      } catch (err) {
        console.error("Failed to load older messages", err);
      } finally {
        setLoadingMessages(false);
      }
    }
  };

  // 6. Send Message Action
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConversation || (!inputText.trim() && !selectedImage)) return;

    const textToSend = inputText.trim();
    setInputText("");
    const optimisticId = `optimistic-${Date.now()}`;
    const localPreview = imagePreview;
    
    setSelectedImage(null);
    setImagePreview(null);
    setSeenStatus(false);

    // Optimistically append the message
    const optimisticMsg: MessageDto = {
      id: optimisticId,
      conversationId: activeConversation.id,
      senderId: currentUser!.id,
      senderName: currentUser!.fullName,
      senderProfilePicture: currentUser!.profilePicture,
      text: textToSend,
      imageUrl: localPreview,
      createdAt: new Date().toISOString(),
      isRead: false,
    };

    setMessages((prev) => {
      const list = [...prev, optimisticMsg];
      requestCache.set(`messages_${activeConversation.id}`, list, 15000);
      return list;
    });

    setTimeout(() => {
      if (chatEndRef.current) {
        chatEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }, 50);

    let finalImageUrl = null;
    if (selectedImage) {
      setUploadingImage(true);
      try {
        finalImageUrl = await uploadPostImage(selectedImage);
      } catch (err) {
        alert("Image upload failed. Please try again.");
        setUploadingImage(false);
        // remove optimistic message
        setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
        return;
      }
      setUploadingImage(false);
    }

    try {
      const realMsg = await sendMessage(activeConversation.id, textToSend, finalImageUrl);
      
      // Replace optimistic message with the real one
      setMessages((prev) => {
        const list = prev.map((m) => m.id === optimisticId ? realMsg : m);
        requestCache.set(`messages_${activeConversation.id}`, list, 15000);
        return list;
      });
    } catch (err) {
      console.error(err);
      // remove optimistic message
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      alert("Failed to send message.");
    }
  };

  // 7. Image selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // 8. Delete Own Message Action
  const handleDelete = async (msgId: string) => {
    if (!confirm("Are you sure you want to unsend this message?")) return;
    try {
      await deleteMessage(msgId);
      // Remove locally
      setMessages((prev) => prev.filter((m) => m.id !== msgId));
    } catch (err) {
      console.error(err);
      alert("Failed to delete message.");
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        <p className="text-[17px] tracking-[0.2em] uppercase text-neutral-500 animate-pulse">Initializing Chat...</p>
      </main>
    );
  }

  // Format date helper
  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch (e) {
      return "";
    }
  };

  return (
    <div className="h-screen bg-black text-white flex overflow-hidden">
      {/* Sidebar navigation */}
      <Sidebar user={currentUser} />

      {/* Main Messages Layout Grid */}
      <main className="flex-1 h-screen overflow-hidden pl-20 md:pl-72 flex relative select-none">
        
        {/* Horizontal separation layout: Left pane (Inbox conversations list) & Right pane (Active chat room) */}
        <div className="flex w-full h-full">
          
          {/* Inbox Conversations List */}
          <div className={`w-full md:w-80 lg:w-96 border-r border-white/5 flex flex-col h-full bg-black/40 backdrop-blur-md ${activeConversation ? "hidden md:flex" : "flex"}`}>
            
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
              <h1 className="text-[24px] font-light tracking-widest uppercase text-white leading-tight">Messages</h1>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto divide-y divide-white/5 px-3 py-2 space-y-1">
              {loadingConversations ? (
                <div className="p-6 text-center text-[15px] text-neutral-500 uppercase tracking-widest animate-pulse">Loading conversations...</div>
              ) : conversations.length === 0 ? (
                <div className="p-10 text-center text-[15px] text-neutral-500 uppercase tracking-widest">No conversations yet</div>
              ) : (
                conversations.map((c) => {
                  const isActive = activeConversation?.id === c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => setActiveConversation(c)}
                      className={`w-full relative flex items-center gap-3.5 p-3 rounded-xl text-left transition-all duration-300 cursor-pointer border ${
                        isActive 
                          ? "bg-white/[0.08] border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.03)]" 
                          : "hover:bg-white/[0.04] border-transparent"
                      }`}
                    >
                      {/* Left Active Indicator */}
                      {isActive && (
                        <motion.div
                          layoutId="chatActiveIndicator"
                          className="absolute left-1 w-[3px] h-[45%] bg-white rounded-full"
                          transition={{ type: "spring", stiffness: 380, damping: 30 }}
                        />
                      )}

                      <div className="relative w-10 h-10 rounded-full overflow-hidden border border-white/10 bg-neutral-900 flex items-center justify-center flex-shrink-0 ml-1.5">
                        {c.participant.profilePicture ? (
                          <Image
                            src={c.participant.profilePicture}
                            alt={c.participant.fullName}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          <span className="text-[13px] font-medium text-white uppercase">
                            {c.participant.fullName.charAt(0)}
                          </span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline">
                          <h4 className="text-[14px] font-medium text-white truncate leading-none mb-1">
                            {c.participant.fullName}
                          </h4>
                          {c.lastMessageTime && (
                            <span className="text-[11px] text-neutral-500 font-light flex-shrink-0 ml-2">
                              {new Date(c.lastMessageTime).toLocaleDateString([], { month: "short", day: "numeric" })}
                            </span>
                          )}
                        </div>
                        <p className={`text-[13px] truncate leading-none pr-4 mt-1 ${c.unreadCount > 0 ? "text-white font-bold" : "text-neutral-450"}`}>
                          {c.lastMessageImageUrl ? "📷 Image message" : c.lastMessageText || "No messages yet"}
                        </p>
                      </div>

                      {c.unreadCount > 0 && (
                        <span className="w-2.5 h-2.5 bg-white rounded-full flex-shrink-0 shadow-glow" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Active Chat Room Pane */}
          <div className={`flex-1 flex flex-col h-full bg-black/20 ${!activeConversation ? "hidden md:flex justify-center items-center text-center px-6" : "flex"}`}>
            
            {activeConversation ? (
              <>
                {/* Chat Room Header */}
                <div className="p-5 border-b border-white/5 bg-black/40 backdrop-blur-md flex items-center justify-between z-10 flex-shrink-0">
                  <div className="flex items-center gap-4">
                    {/* Back Button (Mobile only) */}
                    <button
                      onClick={() => setActiveConversation(null)}
                      className="md:hidden p-2 text-neutral-450 hover:text-white cursor-pointer mr-1"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>

                    <div className="relative w-10 h-10 rounded-full overflow-hidden border border-white/10 bg-neutral-900 flex items-center justify-center">
                      {activeConversation.participant.profilePicture ? (
                        <Image
                          src={activeConversation.participant.profilePicture}
                          alt={activeConversation.participant.fullName}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <span className="text-[15px] font-bold text-white uppercase">
                          {activeConversation.participant.fullName.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="text-[17px] font-semibold leading-none mb-1 text-white">
                        {activeConversation.participant.fullName}
                      </h3>
                      <p className="text-[13px] text-neutral-450 uppercase tracking-wider leading-none">
                        {activeConversation.participant.department} {activeConversation.participant.batch}
                      </p>
                    </div>
                  </div>

                  {/* Header Actions Placeholder (Info page etc) */}
                  <div className="flex items-center gap-3">
                    <span className="text-[13px] text-neutral-500 uppercase tracking-widest hidden lg:block">Liquid Glass Secure</span>
                  </div>
                </div>

                {/* Messages List Area */}
                <div
                  ref={chatContainerRef}
                  onScroll={handleScroll}
                  className="flex-1 overflow-y-auto px-6 py-6 space-y-4"
                >
                  {loadingMessages && page > 0 && (
                    <div className="text-center py-2 text-[13px] text-neutral-500 uppercase tracking-widest">Loading older messages...</div>
                  )}

                  {messages.length === 0 ? (
                    <div className="h-full flex flex-col justify-center items-center text-center text-neutral-500 space-y-3">
                      <p className="text-[15px] tracking-wider uppercase">Say hello to your classmate</p>
                      <p className="text-[13px] text-neutral-600 font-light">Type a message below to start chatting</p>
                    </div>
                  ) : (
                    messages.map((m, idx) => {
                      const isOwn = currentUser && m.senderId === currentUser.id;
                      const showSeen = isOwn && idx === messages.length - 1 && (m.isRead || seenStatus);

                      return (
                        <div key={m.id} className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
                          <div className={`flex items-end gap-2 max-w-[75%] group`}>
                            
                            {/* Classmate Avatar next to bubble (if not own) */}
                            {!isOwn && (
                              <div className="relative w-8 h-8 rounded-full overflow-hidden border border-white/5 bg-neutral-900 flex items-center justify-center flex-shrink-0 mb-1">
                                {m.senderProfilePicture ? (
                                  <Image
                                    src={m.senderProfilePicture}
                                    alt={m.senderName}
                                    fill
                                    className="object-cover"
                                    unoptimized
                                  />
                                ) : (
                                  <span className="text-[11px] font-bold text-white uppercase">
                                    {m.senderName.charAt(0)}
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Message Container / Bubble */}
                            <div className="flex flex-col">
                              <div
                                className={`relative py-2.5 px-4 rounded-[18px] text-[14px] leading-relaxed transition-all duration-200 border ${
                                  isOwn
                                    ? "bg-white border-white text-black rounded-tr-[4px]"
                                    : "bg-white/[0.04] border-white/8 text-white rounded-tl-[4px]"
                                }`}
                              >
                                {/* Optional Image attachment */}
                                {m.imageUrl && (
                                  <div className="relative w-64 h-64 rounded-xl overflow-hidden mb-3 border border-neutral-700 bg-neutral-900">
                                    <Image
                                      src={m.imageUrl}
                                      alt="Message attachment"
                                      fill
                                      className="object-cover"
                                      unoptimized
                                    />
                                  </div>
                                )}

                                {/* Message text */}
                                <p className="whitespace-pre-wrap select-text pr-6 break-words">{m.text}</p>

                                {/* Timestamp / Action icons on hover */}
                                <div className="absolute right-3 bottom-2 flex items-center space-x-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                  {isOwn && (
                                    <button
                                      onClick={() => handleDelete(m.id)}
                                      title="Delete message"
                                      className="text-black/60 hover:text-black cursor-pointer p-0.5"
                                    >
                                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-7v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    </button>
                                  )}
                                </div>
                              </div>
                              
                              {/* Small details below bubble (Timestamp) */}
                              <span className="text-[10px] text-neutral-500 font-light mt-1 self-end px-1 select-none">
                                {formatTime(m.createdAt)}
                              </span>
                            </div>
                          </div>

                          {/* Seen Indicator */}
                          {showSeen && (
                            <span className="text-[10px] text-neutral-450 italic mt-0.5 px-2 font-light select-none">
                              Seen
                            </span>
                          )}
                        </div>
                      );
                    })
                  )}

                  {/* Typing Indicator Placeholder */}
                  {partnerTyping && (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-neutral-900 border border-white/5 flex items-center justify-center">
                        <span className="text-[10px] text-neutral-400 font-bold uppercase">
                          {activeConversation.participant.fullName.charAt(0)}
                        </span>
                      </div>
                      <div className="bg-white/5 border border-white/8 p-3 rounded-2xl rounded-tl-[4px] text-[15px] text-neutral-400">
                        <span className="animate-pulse">Typing...</span>
                      </div>
                    </div>
                  )}

                  <div ref={chatEndRef} />
                </div>

                {/* Image upload preview row if selected */}
                {imagePreview && (
                  <div className="px-6 py-3 border-t border-white/5 bg-black/40 flex items-center justify-between z-10 flex-shrink-0">
                    <div className="flex items-center gap-4">
                      <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-neutral-700">
                        <Image src={imagePreview} alt="Preview" fill className="object-cover" />
                        {uploadingImage && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <span className="text-[10px] text-white uppercase animate-pulse">Uploading...</span>
                          </div>
                        )}
                      </div>
                      <span className="text-[15px] text-neutral-400">Selected attachment</span>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedImage(null);
                        setImagePreview(null);
                      }}
                      className="text-[13px] text-neutral-400 hover:text-white uppercase tracking-widest cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                )}

                {/* Input panel / Message form */}
                <form
                  onSubmit={handleSend}
                  className="p-5 border-t border-white/5 bg-black/40 backdrop-blur-md flex items-center gap-4 z-10 flex-shrink-0"
                >
                  {/* Emoji popover trigger placeholder */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowEmojiPlaceholder(!showEmojiPlaceholder)}
                      className="p-2 text-neutral-400 hover:text-white transition-colors duration-200 cursor-pointer"
                      title="Add emoji"
                    >
                      <svg className="w-6.5 h-6.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                    {showEmojiPlaceholder && (
                      <div className="absolute bottom-12 left-0 glass-panel p-4 rounded-xl w-64 border border-white/10 z-20 text-center space-y-2">
                        <p className="text-[13px] text-neutral-400 uppercase tracking-wider">Emoji Picker Placeholder</p>
                        <p className="text-[11px] text-neutral-500 font-light">Emojis will be integrated here</p>
                      </div>
                    )}
                  </div>

                  {/* Image Attachment Trigger */}
                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageChange}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2 text-neutral-400 hover:text-white transition-colors duration-200 cursor-pointer"
                      title="Attach image"
                    >
                      <svg className="w-6.5 h-6.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>

                  {/* Input field */}
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Message..."
                    className="flex-1 glass-input focus:outline-none px-4 py-2.5 text-[14px] rounded-full"
                  />

                  {/* Send Button */}
                  <button
                    type="submit"
                    disabled={uploadingImage || (!inputText.trim() && !selectedImage)}
                    className="py-2.5 px-5 bg-white text-black hover:bg-neutral-200 text-[13px] font-semibold uppercase tracking-widest rounded-full transition-all duration-300 cursor-pointer disabled:opacity-50 flex-shrink-0 shadow-[0_4px_12px_rgba(255,255,255,0.08)]"
                  >
                    Send
                  </button>
                </form>
              </>
            ) : (
              <div className="space-y-4">
                <div className="w-20 h-20 rounded-full border border-white/5 bg-neutral-900/50 flex items-center justify-center mx-auto text-neutral-450">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h2 className="text-[20px] font-light tracking-[0.15em] uppercase text-white leading-tight">Your Inbox</h2>
                <p className="text-[14px] text-neutral-450 font-light max-w-xs mx-auto leading-relaxed">
                  Select a classmate from the list or browse classmates to start messaging.
                </p>
              </div>
            )}
          </div>

        </div>

      </main>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        <p className="text-[17px] tracking-[0.2em] uppercase text-neutral-500 animate-pulse">Initializing Chat...</p>
      </main>
    }>
      <MessagesContent />
    </Suspense>
  );
}
