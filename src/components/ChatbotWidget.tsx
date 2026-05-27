// import { useEffect, useMemo, useRef, useState } from 'react';
// import { motion, AnimatePresence } from 'framer-motion';
// import { MessageCircle, X, Send, Bot, RotateCcw } from 'lucide-react';
// import { useApp } from '@/contexts/AppContext';

// interface Message {
//   id: string;
//   text: string;
//   isBot: boolean;
//   createdAt: string;
//   status?: 'sent' | 'failed';
// }

// type ChatIntent =
//   | 'greeting'
//   | 'room_search'
//   | 'owner_help'
//   | 'payment_help'
//   | 'booking_help'
//   | 'safety_help'
//   | 'general_help';

// interface SessionMemory {
//   lastIntent?: ChatIntent;
//   lastCity?: string;
//   lastBudget?: number;
//   lastFacility?: string;
// }

// const SCROLL_THRESHOLD = 80;
// const STREAM_DELAY_MS = 28;

// const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// const getTimestampLabel = (value: string) =>
//   new Date(value).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

// const inferIntent = (input: string): ChatIntent => {
//   const text = input.toLowerCase();
//   if (/(hi|hello|hey|namaste)/.test(text)) return 'greeting';
//   if (/(book|booking|reserve|request room|accepted booking)/.test(text)) return 'booking_help';
//   if (/(pay|payment|rent|monthly|razorpay|upi|phonepe|gpay|google pay|paytm)/.test(text)) return 'payment_help';
//   if (/(owner|list room|add room|tenant|dashboard)/.test(text)) return 'owner_help';
//   if (/(safe|safety|report|fraud|scam|harassment|issue)/.test(text)) return 'safety_help';
//   if (/(room|pg|hostel|flat|wifi|parking|ac|map|location|near|college|budget)/.test(text)) return 'room_search';
//   return 'general_help';
// };

// const buildSuggestions = (intent: ChatIntent, role?: string) => {
//   switch (intent) {
//     case 'room_search':
//       return ['Rooms with WiFi', 'Budget rooms in my city', 'Show nearby room tips'];
//     case 'payment_help':
//       return ['How do I pay rent?', 'Why is Pay Rent disabled?', 'What happens after payment?'];
//     case 'owner_help':
//       return role === 'owner'
//         ? ['How do I add a room?', 'How do I complete a stay?', 'How do monthly requests work?']
//         : ['How do owners add rooms?', 'How does owner approval work?', 'When does chat unlock?'];
//     case 'booking_help':
//       return ['How do I book a room?', 'When is a booking accepted?', 'How do I view booking history?'];
//     case 'safety_help':
//       return ['How do I report a user?', 'How do room reports work?', 'What should I do in a payment dispute?'];
//     default:
//       return ['How do I book a room?', 'How do payments work?', 'How do owners add rooms?'];
//   }
// };

// const ChatbotWidget = () => {
//   const { rooms, profile } = useApp();
//   const [open, setOpen] = useState(false);
//   const [messages, setMessages] = useState<Message[]>([
//     {
//       id: 'welcome',
//       text: 'Hi, I am your Havenly assistant. Ask me about rooms, booking, payments, reporting, or owner actions and I will guide you.',
//       isBot: true,
//       createdAt: new Date().toISOString(),
//       status: 'sent',
//     },
//   ]);
//   const [input, setInput] = useState('');
//   const [isTyping, setIsTyping] = useState(false);
//   const [lastFailedPrompt, setLastFailedPrompt] = useState<string | null>(null);
//   const [activeSuggestions, setActiveSuggestions] = useState<string[]>(buildSuggestions('general_help', profile?.role));
//   const messagesContainerRef = useRef<HTMLDivElement>(null);
//   const inputRef = useRef<HTMLInputElement>(null);
//   const pendingPromptRef = useRef<string | null>(null);
//   const isNearBottomRef = useRef(true);
//   const sessionMemoryRef = useRef<SessionMemory>({});

//   const approvedAvailableRooms = useMemo(
//     () => rooms.filter((room) => room.approvalStatus === 'approved' && room.status === 'available'),
//     [rooms],
//   );

//   const searchableCities = useMemo(
//     () => [...new Set(approvedAvailableRooms.map((room) => room.city).filter(Boolean))],
//     [approvedAvailableRooms],
//   );

//   const visibleSuggestions = useMemo(() => activeSuggestions.slice(0, 3), [activeSuggestions]);

//   const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
//     const container = messagesContainerRef.current;
//     if (!container) return;
//     container.scrollTo({ top: container.scrollHeight, behavior });
//   };

//   const isNearBottom = () => {
//     const container = messagesContainerRef.current;
//     if (!container) return true;
//     const distance = container.scrollHeight - container.scrollTop - container.clientHeight;
//     return distance <= SCROLL_THRESHOLD;
//   };

//   useEffect(() => {
//     if (open) {
//       requestAnimationFrame(() => {
//         if (isNearBottomRef.current) {
//           scrollToBottom(messages.length <= 1 ? 'auto' : 'smooth');
//         }
//       });
//       inputRef.current?.focus();
//     }
//   }, [isTyping, messages, open]);

//   useEffect(() => {
//     setActiveSuggestions((prev) => prev.length > 0 ? prev : buildSuggestions('general_help', profile?.role));
//   }, [profile?.role]);

//   const appendMessage = (nextMessage: Message) => {
//     setMessages((prev) => {
//       if (prev.some((item) => item.id === nextMessage.id)) return prev;
//       return [...prev, nextMessage];
//     });
//   };

//   const updateMessage = (id: string, updater: (message: Message) => Message) => {
//     setMessages((prev) => prev.map((message) => message.id === id ? updater(message) : message));
//   };

//   const streamBotReply = async (text: string, suggestions: string[], status: 'sent' | 'failed' = 'sent') => {
//     const messageId = `bot-${Date.now()}`;
//     appendMessage({
//       id: messageId,
//       text: '',
//       isBot: true,
//       createdAt: new Date().toISOString(),
//       status,
//     });

//     const words = text.split(' ');
//     let current = '';
//     for (const word of words) {
//       current = current ? `${current} ${word}` : word;
//       updateMessage(messageId, (message) => ({ ...message, text: current }));
//       await sleep(STREAM_DELAY_MS);
//     }

//     setActiveSuggestions(suggestions);
//   };

//   const handleScroll = () => {
//     isNearBottomRef.current = isNearBottom();
//   };

//   const detectCity = (inputText: string) => {
//     const lowered = inputText.toLowerCase();
//     return searchableCities.find((city) => lowered.includes(city.toLowerCase()));
//   };

//   const detectBudget = (inputText: string) => {
//     const match = inputText.match(/(\d{4,6})/);
//     return match ? Number(match[1]) : undefined;
//   };

//   const detectFacility = (inputText: string) => {
//     const lowered = inputText.toLowerCase();
//     const facilities = ['wifi', 'ac', 'parking', 'kitchen', 'gym', 'cctv', 'geyser'];
//     return facilities.find((facility) => lowered.includes(facility));
//   };

//   const buildRecommendationReply = (inputText: string) => {
//     const memory = sessionMemoryRef.current;
//     const city = detectCity(inputText) || memory.lastCity;
//     const budget = detectBudget(inputText) || memory.lastBudget;
//     const facility = detectFacility(inputText) || memory.lastFacility;

//     const scoredRooms = approvedAvailableRooms
//       .map((room) => {
//         let score = 0;
//         if (city && room.city.toLowerCase() === city.toLowerCase()) score += 3;
//         if (budget && room.price <= budget) score += 3;
//         if (facility && room.facilities.some((item) => item.toLowerCase().includes(facility))) score += 2;
//         if (!city && !budget && !facility) score += 1;
//         return { room, score };
//       })
//       .filter((entry) => entry.score > 0)
//       .sort((a, b) => b.score - a.score || a.room.price - b.room.price)
//       .slice(0, 3);

//     sessionMemoryRef.current = {
//       ...memory,
//       lastIntent: 'room_search',
//       lastCity: city,
//       lastBudget: budget,
//       lastFacility: facility,
//     };

//     if (scoredRooms.length === 0) {
//       return {
//         text: city || budget || facility
//           ? `I could not find a strong match yet${city ? ` in ${city}` : ''}. Try broadening your budget or removing one filter, and I can suggest a better shortlist.`
//           : 'I can help shortlist rooms by city, budget, and facilities. Try something like "rooms in Pune under 9000 with WiFi".',
//         suggestions: ['Rooms in Pune under 9000', 'Rooms with parking', 'Budget PG near college'],
//       };
//     }

//     const topRooms = scoredRooms
//       .map(({ room }) => `${room.title} in ${room.area}, ${room.city} for Rs${room.price.toLocaleString()}`)
//       .join('; ');

//     return {
//       text: `A good shortlist for you is: ${topRooms}. ${facility ? `I prioritized ${facility.toUpperCase()} where possible. ` : ''}${budget ? `I also kept the budget around Rs${budget.toLocaleString()}. ` : ''}Open the Explore page or room details to compare photos, facilities, and map location before booking.`,
//       suggestions: ['Show map and location tips', 'How do I book after choosing?', 'Any safer options for students?'],
//     };
//   };

//   const generateReply = (prompt: string) => {
//     const intent = inferIntent(prompt);
//     const memory = sessionMemoryRef.current;
//     const lowered = prompt.toLowerCase();
//     const wantsHindi = /(hindi|hinglish|namaste|kiraya|kamra)/.test(lowered);

//     if (intent === 'room_search') {
//       return buildRecommendationReply(prompt);
//     }

//     if (intent === 'payment_help') {
//       sessionMemoryRef.current = { ...memory, lastIntent: intent };
//       return {
//         text: wantsHindi
//           ? 'Payment flow simple hai: booking accept hone ke baad dashboard se payment open hota hai. Monthly rent request aane par "Pay Rent" use karke UPI, cards, netbanking, ya wallet options se payment complete kar sakte ho.'
//           : 'Once a booking is accepted, payment becomes available from the dashboard. For monthly rent, wait for the owner to create the next request, then use Pay Rent to continue through Razorpay with UPI, cards, netbanking, or wallet options.',
//         suggestions: buildSuggestions(intent, profile?.role),
//       };
//     }

//     if (intent === 'owner_help') {
//       sessionMemoryRef.current = { ...memory, lastIntent: intent };
//       return {
//         text: profile?.role === 'owner'
//           ? 'From your dashboard, you can add rooms, manage approvals, accept or reject booking requests, send monthly payment requests, and complete a tenant stay when the room becomes available again.'
//           : 'Owners use the dashboard to add rooms, review booking requests, manage monthly rent requests, and mark completed stays so rooms move back to available status cleanly.',
//         suggestions: buildSuggestions(intent, profile?.role),
//       };
//     }

//     if (intent === 'booking_help') {
//       sessionMemoryRef.current = { ...memory, lastIntent: intent };
//       return {
//         text: 'Booking works in a clear sequence: request the room, wait for owner approval, complete the initial payment, review the agreement, and then continue monthly rent inside the dashboard. Active stays and booking history are now separated so old bookings do not stay mixed into current ones.',
//         suggestions: buildSuggestions(intent, profile?.role),
//       };
//     }

//     if (intent === 'safety_help') {
//       sessionMemoryRef.current = { ...memory, lastIntent: intent };
//       return {
//         text: wantsHindi
//           ? 'Agar payment dispute, fraud, fake listing, ya harassment jaisa issue ho, to dashboard ya room page se report submit karo. Admin side par room reports aur user reports dono review hote hain.'
//           : 'If you run into fraud, payment disputes, fake listings, or harassment concerns, use the report actions in the room page or dashboard. The admin panel can now review both listing reports and user reports.',
//         suggestions: buildSuggestions(intent, profile?.role),
//       };
//     }

//     if (intent === 'greeting') {
//       const followUp = memory.lastIntent === 'room_search'
//         ? 'If you want, I can continue helping you shortlist rooms based on city, budget, or facilities.'
//         : 'If you tell me what you are trying to do, I can guide you one step at a time.';
//       sessionMemoryRef.current = { ...memory, lastIntent: intent };
//       return {
//         text: `Hi${profile?.name ? ` ${profile.name.split(' ')[0]}` : ''}. ${followUp}`,
//         suggestions: buildSuggestions(memory.lastIntent || 'general_help', profile?.role),
//       };
//     }

//     sessionMemoryRef.current = { ...memory, lastIntent: 'general_help' };
//     return {
//       text: 'I can help with room search, booking requests, payments, owner actions, and safety reports. Ask me in a simple sentence, and I will keep the answer practical.',
//       suggestions: buildSuggestions('general_help', profile?.role),
//     };
//   };

//   const sendBotReply = async (prompt: string) => {
//     const normalizedPrompt = prompt.trim().toLowerCase();
//     if (!normalizedPrompt || pendingPromptRef.current === normalizedPrompt) return;

//     pendingPromptRef.current = normalizedPrompt;
//     setIsTyping(true);
//     setLastFailedPrompt(null);

//     try {
//       await sleep(500);
//       const reply = generateReply(prompt);
//       await streamBotReply(reply.text, reply.suggestions, 'sent');
//     } catch (error) {
//       console.error('[chatbot] Failed to generate response', error);
//       setLastFailedPrompt(prompt);
//       await streamBotReply(
//         'I ran into a small issue while preparing that reply. You can retry once, and I will take another pass.',
//         buildSuggestions('general_help', profile?.role),
//         'failed',
//       );
//     } finally {
//       pendingPromptRef.current = null;
//       setIsTyping(false);
//     }
//   };

//   const send = async (promptOverride?: string) => {
//     const outgoing = (promptOverride ?? input).trim();
//     const normalizedOutgoing = outgoing.toLowerCase();
//     if (!outgoing) return;
//     if (pendingPromptRef.current === normalizedOutgoing) return;

//     setMessages((prev) => {
//       const last = prev[prev.length - 1];
//       if (!last?.isBot && last.text.trim().toLowerCase() === normalizedOutgoing) {
//         return prev;
//       }
//       return [
//         ...prev,
//         {
//           id: `user-${Date.now()}`,
//           text: outgoing,
//           isBot: false,
//           createdAt: new Date().toISOString(),
//           status: 'sent',
//         },
//       ];
//     });

//     setInput('');
//     isNearBottomRef.current = true;
//     await sendBotReply(outgoing);
//   };

//   const retryLastReply = async () => {
//     if (!lastFailedPrompt || isTyping) return;
//     await sendBotReply(lastFailedPrompt);
//   };

//   return (
//     <>
//       <AnimatePresence>
//         {open && (
//           <motion.div
//             initial={{ opacity: 0, y: 20, scale: 0.96 }}
//             animate={{ opacity: 1, y: 0, scale: 1 }}
//             exit={{ opacity: 0, y: 20, scale: 0.96 }}
//             className="fixed bottom-24 right-6 z-50 flex w-80 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xl sm:w-96"
//             style={{ maxHeight: '520px' }}
//           >
//             <div className="flex items-center gap-3 bg-gradient-to-r from-primary to-neon-purple px-4 py-3 text-primary-foreground">
//               <Bot className="h-5 w-5" />
//               <div>
//                 <p className="font-heading text-sm font-semibold">Havenly Assistant</p>
//                 <p className="text-xs opacity-80">Quick help for rooms, bookings, payments, and dashboard tasks</p>
//               </div>
//               <button onClick={() => setOpen(false)} className="ml-auto hover:opacity-80">
//                 <X className="h-4 w-4" />
//               </button>
//             </div>

//             <div
//               ref={messagesContainerRef}
//               onScroll={handleScroll}
//               className="flex-1 space-y-3 overflow-y-auto p-4 scrollbar-hide"
//               style={{ maxHeight: '350px' }}
//             >
//               {messages.map((message) => (
//                 <motion.div
//                   key={message.id}
//                   initial={{ opacity: 0, y: 8 }}
//                   animate={{ opacity: 1, y: 0 }}
//                   className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
//                 >
//                   <div
//                     className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
//                       message.isBot
//                         ? 'rounded-bl-md bg-secondary text-secondary-foreground'
//                         : 'rounded-br-md bg-primary text-primary-foreground'
//                     }`}
//                   >
//                     <p>{message.text}</p>
//                     <div className={`mt-2 flex items-center justify-between gap-3 text-[11px] ${message.isBot ? 'text-muted-foreground' : 'text-primary-foreground/80'}`}>
//                       <span>{getTimestampLabel(message.createdAt)}</span>
//                       {message.status === 'failed' && (
//                         <button
//                           onClick={() => void retryLastReply()}
//                           className="inline-flex items-center gap-1 rounded-full bg-background/40 px-2 py-1 hover:bg-background/60"
//                         >
//                           <RotateCcw className="h-3 w-3" /> Retry
//                         </button>
//                       )}
//                     </div>
//                   </div>
//                 </motion.div>
//               ))}

//               {isTyping && (
//                 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
//                   <div className="rounded-2xl rounded-bl-md bg-secondary px-3 py-2 text-sm text-secondary-foreground">
//                     <div className="flex items-center gap-2">
//                       <div className="flex items-center gap-1">
//                         <span className="h-2 w-2 animate-pulse rounded-full bg-muted-foreground/70" />
//                         <span className="h-2 w-2 animate-pulse rounded-full bg-muted-foreground/70 [animation-delay:120ms]" />
//                         <span className="h-2 w-2 animate-pulse rounded-full bg-muted-foreground/70 [animation-delay:240ms]" />
//                       </div>
//                       <span className="text-xs text-muted-foreground">Typing...</span>
//                     </div>
//                   </div>
//                 </motion.div>
//               )}
//             </div>

//             <div className="border-t border-border p-3">
//               <div className="mb-3 flex flex-wrap gap-2">
//                 {visibleSuggestions.map((suggestion) => (
//                   <button
//                     key={suggestion}
//                     type="button"
//                     onClick={() => void send(suggestion)}
//                     disabled={isTyping}
//                     className="rounded-full bg-secondary px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-secondary/80 disabled:opacity-60"
//                   >
//                     {suggestion}
//                   </button>
//                 ))}
//               </div>

//               <div className="flex gap-2">
//                 <input
//                   ref={inputRef}
//                   value={input}
//                   onChange={(e) => setInput(e.target.value)}
//                   onKeyDown={(e) => {
//                     if (e.key === 'Enter' && !e.shiftKey) {
//                       e.preventDefault();
//                       void send();
//                     }
//                   }}
//                   placeholder="Ask about rooms, booking, payments..."
//                   className="flex-1 rounded-xl bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
//                 />
//                 <button
//                   onClick={() => void send()}
//                   disabled={isTyping || !input.trim()}
//                   className="rounded-xl bg-primary p-2 text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
//                 >
//                   <Send className="h-4 w-4" />
//                 </button>
//               </div>
//             </div>
//           </motion.div>
//         )}
//       </AnimatePresence>

//       <motion.button
//         whileHover={{ scale: 1.05 }}
//         whileTap={{ scale: 0.95 }}
//         onClick={() => setOpen((prev) => !prev)}
//         className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-primary to-neon-purple text-primary-foreground shadow-lg transition-shadow hover:shadow-xl"
//       >
//         {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
//       </motion.button>
//     </>
//   );
// };

// export default ChatbotWidget;


import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, RotateCcw, Sparkles, ChevronDown } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  createdAt: string;
  status?: 'sent' | 'failed' | 'streaming';
}

interface SessionMemory {
  lastCity?: string;
  lastBudget?: number;
  lastFacility?: string;
  messageCount: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SCROLL_THRESHOLD = 80;
const QUICK_REPLIES = [
  'Find rooms near my college',
  'How do I book a room?',
  'How does payment work?',
  'I need help with my booking',
];

// ─── Branded SVG icon: house with AI spark ───────────────────────────────────

const HavenlyBotIcon = ({ size = 24, animated = false }: { size?: number; animated?: boolean }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* House body */}
    <rect x="6" y="16" width="20" height="13" rx="2" fill="white" fillOpacity="0.95" />
    {/* Roof */}
    <path d="M4 17 L16 6 L28 17" fill="white" fillOpacity="0.85" />
    <path d="M4 17 L16 6 L28 17" stroke="white" strokeWidth="1" fill="none" strokeLinejoin="round" />
    {/* Door */}
    <rect x="13" y="21" width="6" height="8" rx="1" fill="#1d4ed8" fillOpacity="0.7" />
    {/* Windows */}
    <rect x="7" y="19" width="4" height="3" rx="0.5" fill="#93c5fd" fillOpacity="0.8" />
    <rect x="21" y="19" width="4" height="3" rx="0.5" fill="#93c5fd" fillOpacity="0.8" />
    {/* AI spark top-right */}
    {animated ? (
      <motion.g
        animate={{ rotate: [0, 15, -10, 0], scale: [1, 1.2, 0.9, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        style={{ originX: '26px', originY: '6px' }}
      >
        <path d="M26 3 L27 6 L30 6 L27.5 8 L28.5 11 L26 9 L23.5 11 L24.5 8 L22 6 L25 6 Z"
          fill="#fbbf24" stroke="#f59e0b" strokeWidth="0.3" />
      </motion.g>
    ) : (
      <path d="M26 3 L27 6 L30 6 L27.5 8 L28.5 11 L26 9 L23.5 11 L24.5 8 L22 6 L25 6 Z"
        fill="#fbbf24" stroke="#f59e0b" strokeWidth="0.3" />
    )}
  </svg>
);

// ─── Utility ──────────────────────────────────────────────────────────────────

const getTimestampLabel = (value: string) =>
  new Date(value).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ─── AI Response via Anthropic API ───────────────────────────────────────────

const callAnthropicAPI = async (
  userMessage: string,
  context: {
    rooms: { title: string; city: string; area: string; price: number; facilities: string[]; roomType: string }[];
    profile?: { name?: string; role?: string } | null;
    memory: SessionMemory;
    history: { role: 'user' | 'assistant'; content: string }[];
  },
): Promise<string> => {
  const roomSummary = context.rooms
    .slice(0, 12)
    .map((r) => `• ${r.title} in ${r.area}, ${r.city} — Rs${r.price.toLocaleString()}/mo — ${r.roomType} — [${r.facilities.slice(0, 4).join(', ')}]`)
    .join('\n');

  const systemPrompt = `You are Havenly Assistant — the smart AI built into Havenly Spaces, a verified student housing marketplace in India. You know this platform deeply: every feature, every user flow, every edge case. You help students, owners, and visitors with anything related to the platform and general housing questions.

━━━ YOUR PERSONALITY ━━━
Warm, smart, direct. Like a senior friend who built the app and can explain anything clearly. Never say "I don't know" unless truly necessary — use your knowledge of the platform to answer confidently. Keep replies concise (under 120 words) unless a step-by-step walkthrough is needed. Use line breaks for steps. Use ₹ for rupees.

━━━ USER CONTEXT ━━━
Name: ${context.profile?.name || 'Guest'}
Role: ${context.profile?.role || 'visitor (not logged in)'}
Platform: Havenly Spaces

━━━ CURRENTLY AVAILABLE ROOMS ━━━
${roomSummary || 'No rooms are loaded yet — user may need to visit the Rooms page.'}

━━━ COMPLETE PLATFORM KNOWLEDGE ━━━

**STUDENT FLOW (end-to-end):**
1. Sign up as Student → verify email → land on student dashboard
2. Browse /rooms — filter by city, area, college, facilities, price range, room type
3. Click any room → view full details: photos, map location, college proximity, facilities, rating, reviews
4. Wishlist rooms using the heart icon (requires login)
5. Click "Request Booking" → request goes to owner with pending status
6. Wait for owner to Accept or Reject (owner gets email notification)
7. Once Accepted → payment unlocks → pay via Razorpay (UPI, cards, netbanking, wallets, EMI)
8. After payment → digital rental agreement is auto-generated → student can download/sign
9. Chat with owner unlocks after booking is accepted
10. Monthly rent: owner sends monthly request → student pays from dashboard → history tracked
11. Student can view: active booking, booking history, wishlist, payment history, agreements

**OWNER FLOW (end-to-end):**
1. Sign up as Owner → verify email → land on owner dashboard
2. Add Room: title, description, city, area, college nearby, price/month, room type (single/shared/triple), facilities (WiFi, AC, Parking, Laundry, Kitchen, Gym, CCTV, Power Backup, Furnished, Geyser), photos, map location
3. Room submitted → goes to Admin for approval → admin approves/rejects
4. Approved rooms appear on /rooms publicly
5. Owner receives booking requests → can Accept or Reject
6. After acceptance → payment tracked → agreement generated
7. Monthly rent: owner creates monthly payment request → student pays → owner sees payment status
8. Mark stay complete when tenant leaves → room status returns to "available"
9. Owner dashboard shows: all rooms, booking requests, active tenants, payment history, monthly requests

**ADMIN FLOW:**
1. Admin logs in → separate admin dashboard
2. Review pending room listings → Approve or Reject with reason
3. View all users (students + owners), all bookings, all payments
4. Review room reports and user reports submitted by users
5. Send system alerts (email/SMS) to users
6. Monitor platform analytics

**AUTHENTICATION & ACCOUNTS:**
- Signup: name, email, password (min 6 chars), role selection (student/owner)
- Login: email + password
- Forgot password: enter email → OTP code sent via email → enter code + new password → reset complete
- Alternative reset: click link in email → token_hash verified → set new password directly
- Password reset has 60-second cooldown between requests (anti-spam)
- Welcome email sent on signup (via SendGrid)
- Profile: update name, profile photo, contact info — saved by user ID in Supabase

**PAYMENTS (Razorpay):**
- Initial booking payment: unlocks after owner accepts booking
- Monthly rent: owner sends request → student pays from dashboard
- Methods: UPI (GPay, PhonePe, Paytm), debit/credit cards, netbanking, wallets
- "Pay Rent" button is disabled until owner creates monthly request — this is intentional
- Payment history visible on both student and owner dashboards
- Failed payment: retry from dashboard, Razorpay handles refund for duplicate charges

**CHAT:**
- Chat is locked until booking is accepted by owner — prevents spam
- Both student and owner can message after acceptance
- Messages are real-time via Supabase

**BOOKING STATUS FLOW:**
pending → accepted (by owner) OR rejected (by owner)
accepted → payment_pending → payment_completed → active
active → completed (when owner marks stay done) → room goes back to available

**WISHLIST:**
- Students can heart/un-heart any room
- Wishlist page shows all saved rooms
- Requires student login

**ROOM SEARCH & FILTERS:**
- Search by: title, city, area, college name
- Filters: price range (₹0 to actual max), room type (all/single/shared), facilities (multi-select)
- City quick-buttons appear below search bar
- Only approved + available rooms shown publicly
- All 7+ rooms visible (price range defaults to max so nothing hidden)

**AGREEMENTS:**
- Auto-generated PDF after payment
- Contains: student name, owner name, room details, rent amount, dates
- Both parties can download from dashboard

**REPORTING & SAFETY:**
- Users can report rooms (fake listing, wrong info, safety concern)
- Users can report other users (harassment, fraud, scam)
- Reports go to admin panel for review
- Admin can take action: warn, suspend, remove listing

**EMAIL NOTIFICATIONS (all automated):**
- Welcome email on signup (student + owner)
- Admin alert when new user registers
- Booking request email to owner (with student details)
- Booking confirmation email to student
- Password reset email with OTP + link
- Monthly rent request notification

**TECHNICAL STACK (for curious users):**
- Frontend: React + TypeScript + Tailwind CSS + Framer Motion
- Backend: Supabase (PostgreSQL database + Auth + Edge Functions + Realtime)
- Payments: Razorpay
- Emails: SendGrid
- AI: Claude (Anthropic) — that's me!
- Hosting: Vite build

**COMMON ISSUES & FIXES:**
Q: "Pay Rent button is greyed out" → Owner hasn't sent the monthly request yet. Ask your owner to create it from their dashboard.
Q: "I can't chat with my owner" → Chat only unlocks after booking is accepted. If accepted, refresh the page.
Q: "My room isn't showing up" → Admin approval is pending. Usually takes up to 24 hours.
Q: "I forgot my password" → Go to /auth → click "Forgot Password?" → enter email → check inbox for OTP code.
Q: "Booking request sent but no response" → Owner has 24-48 hours typically. You'll get an email when they respond.
Q: "Can I book multiple rooms?" → You can request multiple but only one active booking at a time is recommended.
Q: "How do I cancel a booking?" → Contact the owner via chat. Admin can assist if there's a dispute.
Q: "Is there a brokerage fee?" → Zero brokerage. Platform is free to use for students.
Q: "How does the agreement work?" → Auto-generated after payment. Download from your dashboard → Agreements section.

━━━ RULES ━━━
1. Answer ANY question about the platform confidently using the knowledge above
2. For off-topic general questions (studies, life advice, other apps), be helpful but briefly redirect to how Havenly can help
3. Reference specific room names/prices from the live list when recommending rooms
4. Always suggest a clear next step or action
5. Never say "I cannot help with that" for platform-related questions — you know everything about this platform
6. If user seems frustrated, be extra empathetic before solving
7. For questions outside your knowledge, give your best answer and offer to connect them with support`;

  const messages = [
    ...context.history.slice(-6), // last 6 messages for context
    { role: 'user' as const, content: userMessage },
  ];

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: systemPrompt,
      messages,
    }),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const data = await response.json();
  const textBlock = data.content?.find((b: { type: string }) => b.type === 'text');
  return textBlock?.text || 'I had trouble generating a response. Please try again.';
};

// ─── Fallback local response (when API unavailable) ───────────────────────────

const localFallback = (prompt: string, rooms: { title: string; city: string; area: string; price: number; roomType: string; facilities: string[] }[]): string => {
  const t = prompt.toLowerCase();

  // Payment issues
  if (/(pay rent.*grey|pay rent.*disable|pay rent.*not work|can't pay|cannot pay)/.test(t))
    return 'The Pay Rent button is disabled until your owner creates a monthly payment request from their dashboard. Once they send it, the button activates automatically. Ask your owner to check their dashboard!';
  if (/(pay|payment|rent|razorpay|upi|gpay|phonepe)/.test(t))
    return 'Payments go through Razorpay — UPI (GPay, PhonePe, Paytm), cards, netbanking, and wallets all work. Payment unlocks after your owner accepts the booking. Visit your dashboard → Bookings to pay. Need help with a specific step?';

  // Booking flow
  if (/(cancel|cancellation)/.test(t))
    return 'To cancel a booking, message your owner via chat (unlocks after acceptance). For disputes or unresponsive owners, contact admin through the report feature on the room page.';
  if (/(book|booking|request|reserve)/.test(t))
    return 'Booking flow: Find room → Request Booking → Owner accepts/rejects → Pay via dashboard → Get digital agreement. Chat with owner unlocks after acceptance. Active bookings and history are separate in your dashboard.';

  // Password / auth
  if (/(forgot|reset|password|otp|recovery)/.test(t))
    return 'Go to /auth → click "Forgot Password?" → enter your email → check inbox for OTP code → enter code + new password → done! The link in email also works. 60-second cooldown between requests.';
  if (/(signup|register|create account)/.test(t))
    return 'Sign up at /auth → choose Student or Owner → enter name, email, password (min 6 chars) → you\'ll get a welcome email and land on your dashboard. Welcome email is sent automatically after signup!';

  // Chat
  if (/(chat|message|talk to owner|contact owner)/.test(t))
    return 'Chat with your owner unlocks automatically once they accept your booking request. If accepted and chat isn\'t showing, try refreshing the page.';

  // Agreement
  if (/(agreement|contract|document|sign)/.test(t))
    return 'Your rental agreement is auto-generated after payment is complete. Download it from Dashboard → Agreements. It includes both party names, room details, rent amount, and dates.';

  // Wishlist
  if (/(wishlist|favourite|favorite|heart|save room)/.test(t))
    return 'Click the ❤️ heart icon on any room card to save it to your wishlist. View saved rooms under Dashboard → Wishlist. Requires student login.';

  // Room not showing / approval
  if (/(not showing|not visible|approval|pending|admin)/.test(t))
    return 'Rooms need admin approval before going public — usually within 24 hours. As an owner, check your dashboard for approval status. As a student, only approved + available rooms appear on /rooms.';

  // Owner listing
  if (/(owner|list room|add room|listing|tenant)/.test(t))
    return 'As an owner: Dashboard → Add Room → fill details (title, city, area, price, facilities, photos) → submit for admin approval → goes live when approved. Monthly rent: create request from dashboard → student pays → tracked automatically.';

  // Room search
  if (/(room|pg|hostel|flat|find|search|near college|budget)/.test(t)) {
    const match = rooms.slice(0, 2).map(r => `${r.title} in ${r.city} — ₹${r.price.toLocaleString()}/mo`).join(' | ');
    return match
      ? `Here are some options: ${match}. Use filters on /rooms to narrow by city, budget, facilities, or room type. Want me to help you find something specific?`
      : 'Visit /rooms to browse all available verified rooms. Use the search bar and filters to find by city, budget, and facilities. What are you looking for?';
  }

  // Safety / report
  if (/(report|fraud|fake|scam|safety|harassment)/.test(t))
    return 'You can report a room or user from the room details page or your dashboard. Admin reviews all reports. For urgent issues, use the report feature and describe the problem — admin can warn, suspend, or remove listings.';

  // General platform question
  return 'I\'m your Havenly Spaces assistant! I can help with: finding rooms, booking steps, payments, agreements, owner actions, password reset, chat, wishlist, and more. What do you need help with?';
};

// ─── Main Component ───────────────────────────────────────────────────────────

const ChatbotWidget = () => {
  const { rooms, profile } = useApp();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      text: `Hey${profile?.name ? ` ${profile.name.split(' ')[0]}` : ''}! 👋 I'm your Havenly AI assistant. I can help you find the perfect room, understand bookings, payments, and more. What are you looking for today?`,
      isBot: true,
      createdAt: new Date().toISOString(),
      status: 'sent',
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [lastFailedPrompt, setLastFailedPrompt] = useState<string | null>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>(QUICK_REPLIES);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const sessionMemory = useRef<SessionMemory>({ messageCount: 0 });
  const historyRef = useRef<{ role: 'user' | 'assistant'; content: string }[]>([]);

  const approvedRooms = useMemo(
    () => rooms.filter((r) => r.approvalStatus === 'approved' && r.status === 'available'),
    [rooms],
  );

  // Auto-scroll
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  const handleScroll = () => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowScrollBtn(distFromBottom > SCROLL_THRESHOLD);
  };

  useEffect(() => {
    if (open) {
      setTimeout(() => scrollToBottom('smooth'), 50);
      inputRef.current?.focus();
    }
  }, [messages, open, isTyping]);

  // Stream text word by word
  const streamText = async (msgId: string, text: string) => {
    const words = text.split(' ');
    let current = '';
    for (const word of words) {
      current = current ? `${current} ${word}` : word;
      setMessages((prev) =>
        prev.map((m) => (m.id === msgId ? { ...m, text: current, status: 'streaming' } : m)),
      );
      await sleep(22);
    }
    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, status: 'sent' } : m)),
    );
  };

  const send = async (promptOverride?: string) => {
    const outgoing = (promptOverride ?? input).trim();
    if (!outgoing || isTyping) return;

    setInput('');
    setLastFailedPrompt(null);

    // Add user message
    const userMsgId = `user-${Date.now()}`;
    setMessages((prev) => [...prev, {
      id: userMsgId,
      text: outgoing,
      isBot: false,
      createdAt: new Date().toISOString(),
      status: 'sent',
    }]);

    historyRef.current.push({ role: 'user', content: outgoing });
    sessionMemory.current.messageCount += 1;

    setIsTyping(true);

    // Add empty bot message placeholder
    const botMsgId = `bot-${Date.now()}`;
    setMessages((prev) => [...prev, {
      id: botMsgId,
      text: '',
      isBot: true,
      createdAt: new Date().toISOString(),
      status: 'streaming',
    }]);

    try {
      await sleep(400); // brief thinking pause

      let replyText: string;
      try {
        replyText = await callAnthropicAPI(outgoing, {
          rooms: approvedRooms,
          profile,
          memory: sessionMemory.current,
          history: historyRef.current.slice(-6),
        });
      } catch (apiErr) {
        console.warn('[chatbot] API unavailable, using fallback', apiErr);
        replyText = localFallback(outgoing, approvedRooms);
      }

      await streamText(botMsgId, replyText);
      historyRef.current.push({ role: 'assistant', content: replyText });

      // Update suggestions based on context
      const t = outgoing.toLowerCase();
      if (/(room|find|search|pg)/.test(t)) {
        setSuggestions(['Rooms with WiFi & AC', 'Budget under ₹8,000', 'Near engineering college']);
      } else if (/(book|booking)/.test(t)) {
        setSuggestions(['When will owner respond?', 'How do I cancel?', 'What happens after approval?']);
      } else if (/(pay|payment)/.test(t)) {
        setSuggestions(['Pay with UPI', 'Payment failed — help', 'View payment history']);
      } else {
        setSuggestions(['Find me a room', 'How do payments work?', 'Help with my booking']);
      }

    } catch (err) {
      console.error('[chatbot] Send failed', err);
      setLastFailedPrompt(outgoing);
      setMessages((prev) =>
        prev.map((m) => (m.id === botMsgId ? {
          ...m,
          text: 'Something went wrong on my end. Hit Retry and I\'ll try again.',
          status: 'failed',
        } : m)),
      );
    } finally {
      setIsTyping(false);
    }
  };

  const retry = async () => {
    if (!lastFailedPrompt || isTyping) return;
    await send(lastFailedPrompt);
  };

  const clearChat = () => {
    historyRef.current = [];
    sessionMemory.current = { messageCount: 0 };
    setMessages([{
      id: `welcome-${Date.now()}`,
      text: `Fresh start! What can I help you with today?`,
      isBot: true,
      createdAt: new Date().toISOString(),
      status: 'sent',
    }]);
    setSuggestions(QUICK_REPLIES);
  };

  return (
    <>
      {/* ── Chat panel ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 340, damping: 28 }}
            className="fixed bottom-24 right-5 z-50 flex flex-col overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-2xl shadow-blue-900/15"
            style={{ width: 480, maxHeight: 600 }}
          >
            {/* Header */}
            <div className="relative flex items-center gap-3 px-4 py-3.5"
              style={{ background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 60%, #3b82f6 100%)' }}>
              {/* Subtle grid pattern */}
              <div className="absolute inset-0 opacity-10"
                style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '20px 20px' }} />

              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
                <HavenlyBotIcon size={26} animated />
              </div>

              <div className="relative flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="font-semibold text-white text-sm leading-none">Havenly AI</p>
                  <span className="flex items-center gap-0.5 rounded-full bg-white/20 px-1.5 py-0.5 text-[9px] font-bold text-white/90 tracking-wide">
                    <Sparkles className="h-2.5 w-2.5" /> BETA
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-300 animate-pulse" />
                  <p className="text-xs text-white/75">Havenly Assistant</p>
                </div>
              </div>

              <div className="relative flex items-center gap-1">
                <button
                  onClick={clearChat}
                  title="Clear chat"
                  className="rounded-xl p-1.5 text-white/70 transition-colors hover:bg-white/15 hover:text-white"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-xl p-1.5 text-white/70 transition-colors hover:bg-white/15 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div
              ref={messagesContainerRef}
              onScroll={handleScroll}
              className="relative flex-1 overflow-y-auto px-4 py-4 space-y-3 scrollbar-hide"
              style={{ maxHeight: 380, background: '#f8faff' }}
            >
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className={`flex items-end gap-2 ${msg.isBot ? 'justify-start' : 'justify-end'}`}
                >
                  {/* Bot avatar */}
                  {msg.isBot && (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl mb-0.5"
                      style={{ background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)' }}>
                      <HavenlyBotIcon size={18} />
                    </div>
                  )}

                  <div className={`relative max-w-[82%] ${msg.isBot ? '' : 'items-end'}`}>
                    <div className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm ${
                      msg.isBot
                        ? 'rounded-bl-md bg-white border border-blue-50 text-gray-800'
                        : 'rounded-br-md text-white'
                    }`}
                      style={!msg.isBot ? { background: 'linear-gradient(135deg, #1d4ed8, #2563eb)' } : {}}
                    >
                      {msg.text || (msg.status === 'streaming' && (
                        <span className="flex gap-1 items-center py-0.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-bounce [animation-delay:0ms]" />
                          <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-bounce [animation-delay:120ms]" />
                          <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-bounce [animation-delay:240ms]" />
                        </span>
                      ))}

                      {msg.status === 'streaming' && msg.text && (
                        <span className="inline-block w-0.5 h-3.5 bg-blue-400 animate-pulse ml-0.5 align-text-bottom rounded-full" />
                      )}
                    </div>

                    {/* Timestamp + retry */}
                    <div className={`mt-1 flex items-center gap-2 px-1 text-[10px] text-gray-400 ${msg.isBot ? '' : 'justify-end'}`}>
                      <span>{getTimestampLabel(msg.createdAt)}</span>
                      {msg.status === 'failed' && (
                        <button
                          onClick={() => void retry()}
                          className="flex items-center gap-0.5 text-red-400 hover:text-red-500 font-medium"
                        >
                          <RotateCcw className="h-2.5 w-2.5" /> Retry
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* Typing indicator */}
              {isTyping && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-end gap-2">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl"
                    style={{ background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)' }}>
                    <HavenlyBotIcon size={18} />
                  </div>
                  <div className="rounded-2xl rounded-bl-md bg-white border border-blue-50 px-3.5 py-2.5 shadow-sm">
                    <div className="flex gap-1 items-center">
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-bounce [animation-delay:0ms]" />
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-bounce [animation-delay:120ms]" />
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-bounce [animation-delay:240ms]" />
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Scroll-to-bottom button */}
            <AnimatePresence>
              {showScrollBtn && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={() => scrollToBottom()}
                  className="absolute bottom-[140px] right-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white border border-blue-100 shadow-md text-blue-600 hover:bg-blue-50"
                >
                  <ChevronDown className="h-4 w-4" />
                </motion.button>
              )}
            </AnimatePresence>

            {/* Suggestions + Input */}
            <div className="border-t border-blue-50 bg-white px-3 pt-2.5 pb-3">
              {/* Quick replies */}
              <div className="mb-2.5 flex gap-1.5 overflow-x-auto scrollbar-hide pb-0.5">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => void send(s)}
                    disabled={isTyping}
                    className="shrink-0 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 transition-all hover:bg-blue-100 hover:border-blue-200 disabled:opacity-50"
                  >
                    {s}
                  </button>
                ))}
              </div>

              {/* Input row */}
              <div className="flex items-center gap-2 rounded-2xl border border-blue-100 bg-blue-50/60 px-3 py-1.5 focus-within:border-blue-300 focus-within:bg-white transition-all">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      void send();
                    }
                  }}
                  placeholder="Ask me anything about rooms..."
                  className="flex-1 bg-transparent text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none"
                />
                <button
                  onClick={() => void send()}
                  disabled={isTyping || !input.trim()}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-white transition-all disabled:opacity-40 hover:scale-105 active:scale-95"
                  style={{ background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)' }}
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Branding */}
              <p className="mt-1.5 text-center text-[10px] text-gray-300">
                Havenly Spaces
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── FAB trigger button ── */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.93 }}
        onClick={() => setOpen((prev) => !prev)}
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg shadow-blue-900/25 transition-shadow hover:shadow-xl hover:shadow-blue-900/30"
        style={{ background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 60%, #3b82f6 100%)' }}
        aria-label="Open Havenly AI assistant"
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.div key="close"
              initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}>
              <X className="h-6 w-6 text-white" />
            </motion.div>
          ) : (
            <motion.div key="icon"
              initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}>
              <HavenlyBotIcon size={28} animated />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pulse ring when closed */}
        {!open && (
          <motion.div
            className="absolute inset-0 rounded-2xl"
            animate={{ scale: [1, 1.18, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            style={{ background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)', zIndex: -1 }}
          />
        )}
      </motion.button>
    </>
  );
};

export default ChatbotWidget;