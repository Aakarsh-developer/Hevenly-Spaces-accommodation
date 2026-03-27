import { motion } from 'framer-motion';
import { FileText } from 'lucide-react';

const Terms = () => {
  const sections = [
    { title: '1. Acceptance', content: 'By using RoomFinder, you agree to these terms. They apply to all users.' },
    { title: '2. Accounts', content: 'You must provide accurate information and keep credentials secure. Choose Student or Owner role during signup.' },
    { title: '3. Listings', content: 'Owners are responsible for listing accuracy. Misleading listings will be removed.' },
    { title: '4. Bookings', content: 'Booking requests are not binding until accepted. Financial arrangements are between student and owner.' },
    { title: '5. Chat Rules', content: 'Chat is for booking-related communication only. Sharing personal contact info is automatically filtered.' },
    { title: '6. Liability', content: 'RoomFinder is a marketplace. We do not own or manage listed properties.' },
  ];
  return (
    <div className="min-h-screen pt-20 pb-16">
      <div className="container mx-auto px-4 max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4"><FileText className="w-7 h-7 text-primary" /></div>
          <h1 className="font-heading text-4xl font-bold mb-3">Terms & <span className="gradient-text">Conditions</span></h1>
          <p className="text-muted-foreground">Last updated: March 2026</p>
        </motion.div>
        <div className="space-y-6">
          {sections.map((s, i) => (
            <motion.div key={s.title} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }} className="glass p-6">
              <h2 className="font-heading text-lg font-semibold mb-3">{s.title}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.content}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};
export default Terms;
