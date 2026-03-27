import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Lock } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';

const SCROLL_THRESHOLD = 100;

const ChatPanel = () => {
  const { user, bookings, rooms, chatMessagesByBooking, chatLoadingByBooking, chatHasLoadedByBooking, sendMessage, fetchMessages, markConversationRead } = useApp();
  const [selectedBooking, setSelectedBooking] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [isNearBottom, setIsNearBottom] = useState(true);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const previousMessageCountRef = useRef(0);
  const shouldAutoScrollRef = useRef(true);
  const hasFetchedMessagesRef = useRef<Record<string, boolean>>({});
  const fetchMessagesRef = useRef(fetchMessages);
  const markConversationReadRef = useRef(markConversationRead);

  const acceptedBookings = useMemo(() => bookings
    .filter((booking) => booking.status === 'accepted' && (booking.student_id === user?.id || booking.owner_id === user?.id))
    .sort((a, b) => new Date(b.last_message_at || b.created_at).getTime() - new Date(a.last_message_at || a.created_at).getTime()), [bookings, user?.id]);

  const currentMessages = useMemo(
    () => (selectedBooking ? (chatMessagesByBooking[selectedBooking] || []) : []),
    [chatMessagesByBooking, selectedBooking],
  );
  const messagesLoading = selectedBooking ? !!chatLoadingByBooking[selectedBooking] : false;
  const messagesLoaded = selectedBooking ? !!chatHasLoadedByBooking[selectedBooking] : false;

  useEffect(() => {
    fetchMessagesRef.current = fetchMessages;
  }, [fetchMessages]);

  useEffect(() => {
    markConversationReadRef.current = markConversationRead;
  }, [markConversationRead]);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    const container = messagesContainerRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior });
  };

  const checkNearBottom = () => {
    const container = messagesContainerRef.current;
    if (!container) return true;

    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    return distanceFromBottom <= SCROLL_THRESHOLD;
  };

  useEffect(() => {
    if (!selectedBooking && acceptedBookings.length > 0) {
      setSelectedBooking(acceptedBookings[0].id);
    }
  }, [acceptedBookings, selectedBooking]);

  useEffect(() => {
    if (selectedBooking) {
      shouldAutoScrollRef.current = true;
      previousMessageCountRef.current = 0;
      setIsNearBottom(true);
      if (!hasFetchedMessagesRef.current[selectedBooking]) {
        hasFetchedMessagesRef.current[selectedBooking] = true;
        void fetchMessagesRef.current(selectedBooking);
      }
      void markConversationReadRef.current(selectedBooking);
    }
  }, [selectedBooking]);

  useEffect(() => {
    if (selectedBooking && currentMessages.length > 0 && checkNearBottom()) {
      void markConversationReadRef.current(selectedBooking);
    }
  }, [currentMessages.length, selectedBooking]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const nextIsNearBottom = checkNearBottom();
    const hasNewMessages = currentMessages.length > previousMessageCountRef.current;
    const shouldAutoScroll = shouldAutoScrollRef.current || (hasNewMessages && nextIsNearBottom);

    if (shouldAutoScroll) {
      scrollToBottom(previousMessageCountRef.current === 0 ? 'auto' : 'smooth');
      shouldAutoScrollRef.current = false;
      setIsNearBottom(true);
    } else {
      setIsNearBottom(nextIsNearBottom);
    }

    previousMessageCountRef.current = currentMessages.length;
  }, [currentMessages]);

  const handleScroll = () => {
    const nearBottom = checkNearBottom();
    setIsNearBottom(nearBottom);
    shouldAutoScrollRef.current = nearBottom;
  };

  const handleSend = async () => {
    if (!message.trim() || !selectedBooking) return;
    shouldAutoScrollRef.current = true;
    const nextMessage = message;
    setMessage('');
    await sendMessage(selectedBooking, nextMessage);
    await markConversationRead(selectedBooking);
  };

  return (
    <div className="grid w-full min-h-[32rem] grid-cols-1 gap-4 md:h-[min(68vh,42rem)] md:min-h-0 md:grid-cols-3">
      <div className="glass flex min-h-[14rem] flex-col overflow-hidden">
        <div className="shrink-0 p-4 pb-3">
          <h3 className="mb-3 font-heading font-semibold">Conversations</h3>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
          {acceptedBookings.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Lock className="h-4 w-4" /> Chat is available after booking is accepted
            </div>
          ) : (
            acceptedBookings.map((booking) => {
              const room = rooms.find((item) => item.id === booking.room_id);
              const otherName = booking.student_id === user?.id ? booking.owner_name : booking.student_name;
              return (
                <button
                  key={booking.id}
                  onClick={() => setSelectedBooking(booking.id)}
                  className={`mb-2 w-full rounded-xl p-3 text-left transition-all ${selectedBooking === booking.id ? 'border border-primary/30 bg-primary/10' : 'bg-secondary hover:bg-secondary/80'}`}
                >
                  <div className="mb-1 flex items-center justify-between gap-3">
                    <p className="truncate text-sm font-medium">{room?.title || 'Room'}</p>
                    {(booking.unread_count || 0) > 0 && (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                        {booking.unread_count}
                      </span>
                    )}
                  </div>
                  <p className="truncate text-xs text-muted-foreground">{otherName}</p>
                  <p className="mt-1 truncate text-xs text-muted-foreground/80">{booking.last_message || 'No messages yet'}</p>
                </button>
              );
            })
          )}
        </div>
      </div>

      <div className="glass flex min-h-[24rem] flex-col overflow-hidden md:col-span-2">
        {!selectedBooking ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
            Select a conversation to start chatting
          </div>
        ) : (
          <>
            <div className="shrink-0 border-b border-border p-4">
              <p className="font-heading font-semibold text-sm">
                {rooms.find((room) => room.id === acceptedBookings.find((booking) => booking.id === selectedBooking)?.room_id)?.title}
              </p>
              {!isNearBottom && (
                <p className="text-xs text-muted-foreground mt-1">You are viewing older messages. New messages will not interrupt your scroll.</p>
              )}
            </div>
            <div ref={messagesContainerRef} onScroll={handleScroll} className="min-h-0 flex-1 overflow-y-auto p-4 scrollbar-hide">
              {messagesLoading && !messagesLoaded && currentMessages.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-8">Loading messages...</p>
              )}
              {!messagesLoading && messagesLoaded && currentMessages.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-8">No messages yet. Say hello!</p>
              )}
              <div className="space-y-3">
                {currentMessages.map((msg) => (
                  <motion.div key={msg.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${msg.sender_id === user?.id ? 'rounded-br-md bg-gradient-to-r from-primary to-neon-purple text-primary-foreground' : 'rounded-bl-md bg-secondary text-foreground'}`}>
                      {msg.sender_name && msg.sender_id !== user?.id && (
                        <p className="mb-1 text-[10px] font-medium opacity-70">{msg.sender_name}</p>
                      )}
                      <p>{msg.content}</p>
                      <p className="mt-1 text-[10px] opacity-60">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
            <div className="sticky bottom-0 shrink-0 border-t border-border bg-card/95 p-4 backdrop-blur">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && void handleSend()}
                  className="flex-1 px-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                />
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => void handleSend()} className="p-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                  <Send className="w-5 h-5" />
                </motion.button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ChatPanel;
