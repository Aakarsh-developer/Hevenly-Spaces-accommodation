import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Bot } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  isBot: boolean;
}

const RESPONSES: { keywords: string[]; answer: string }[] = [
  { keywords: ['book', 'booking', 'reserve'], answer: 'To book a room, browse available listings, click "Book Now" on a room you like, and the owner will review your request. You\'ll be notified once accepted!' },
  { keywords: ['price', 'cost', 'cheap', 'affordable', 'budget', '₹', 'rent'], answer: 'You can filter rooms by price range on the Explore page. We have rooms starting from ₹3,000/month. Use the price filter to find rooms within your budget.' },
  { keywords: ['chat', 'message', 'contact', 'owner', 'talk'], answer: 'You can chat with room owners after your booking request is accepted. This keeps communication safe and on-platform.' },
  { keywords: ['wifi', 'ac', 'parking', 'facility', 'amenity', 'facilities'], answer: 'Each room listing shows available facilities like WiFi, AC, Parking, Laundry, etc. Use the facilities filter on the Explore page to find rooms with specific amenities.' },
  { keywords: ['location', 'distance', 'map', 'near', 'college', 'campus'], answer: 'Each room page has an embedded map showing the exact location. Click "See Distance" to calculate the distance from your college or current location.' },
  { keywords: ['register', 'signup', 'sign up', 'account', 'create'], answer: 'Click "Sign In" in the top right, then select "Sign Up". Choose your role (Student or Owner) and fill in your details to get started.' },
  { keywords: ['owner', 'list', 'add room', 'post'], answer: 'As a Room Owner, go to your Dashboard and click "Add Room" to list a new property. Add photos, set the price, facilities, and location.' },
  { keywords: ['wishlist', 'save', 'favorite', 'heart'], answer: 'Students can save favorite rooms to their Wishlist by clicking the heart icon on any room card. Access your saved rooms from the Wishlist page.' },
  { keywords: ['safe', 'security', 'scam', 'trust', 'verified'], answer: 'All listings are verified. We block sharing of personal contact info in chats to keep transactions safe and on-platform.' },
  { keywords: ['help', 'support', 'issue', 'problem'], answer: 'You can reach our support team at support@roomfinder.com or visit the Contact Us page. We\'re here to help!' },
  { keywords: ['hi', 'hello', 'hey', 'greetings'], answer: 'Hello! 👋 Welcome to RoomFinder. How can I help you today? You can ask me about rooms, booking, pricing, or any platform features.' },
];

const getResponse = (input: string): string => {
  const lower = input.toLowerCase();
  const match = RESPONSES.find(r => r.keywords.some(k => lower.includes(k)));
  return match?.answer || "I can help with room searches, booking, pricing, facilities, and more. Try asking about something specific like \"How do I book a room?\" or \"Rooms with WiFi\".";
};

const ChatbotWidget = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', text: 'Hi! 👋 I\'m your RoomFinder assistant. Ask me about rooms, booking, pricing, or anything else!', isBot: true },
  ]);
  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = () => {
    if (!input.trim()) return;
    const userMsg: Message = { id: Date.now().toString(), text: input.trim(), isBot: false };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setTimeout(() => {
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), text: getResponse(userMsg.text), isBot: true }]);
    }, 600);
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 bg-card border border-border rounded-2xl shadow-xl flex flex-col overflow-hidden"
            style={{ maxHeight: '480px' }}
          >
            <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-primary to-neon-purple text-primary-foreground">
              <Bot className="w-5 h-5" />
              <div>
                <p className="font-heading font-semibold text-sm">RoomFinder Assistant</p>
                <p className="text-xs opacity-80">Ask me anything about rooms</p>
              </div>
              <button onClick={() => setOpen(false)} className="ml-auto hover:opacity-80">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide" style={{ maxHeight: '340px' }}>
              {messages.map(m => (
                <motion.div key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className={`flex ${m.isBot ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                    m.isBot ? 'bg-secondary text-secondary-foreground rounded-bl-md' : 'bg-primary text-primary-foreground rounded-br-md'
                  }`}>
                    {m.text}
                  </div>
                </motion.div>
              ))}
              <div ref={endRef} />
            </div>

            <div className="p-3 border-t border-border flex gap-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && send()}
                placeholder="Ask about rooms, booking..."
                className="flex-1 px-3 py-2 rounded-xl bg-secondary text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button onClick={send} className="p-2 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-r from-primary to-neon-purple text-primary-foreground shadow-lg flex items-center justify-center hover:shadow-xl transition-shadow"
      >
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </motion.button>
    </>
  );
};

export default ChatbotWidget;
