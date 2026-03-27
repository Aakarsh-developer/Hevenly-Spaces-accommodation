import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';

const PrivacyPolicy = () => {
  const sections = [
    { title: '1. Information We Collect', content: 'We collect your name, email, role, room listings, chat messages, and usage data to operate and improve the platform.' },
    { title: '2. How We Use Your Information', content: 'To manage accounts, display listings, facilitate chat between students and owners, process bookings, send notifications, and ensure platform safety.' },
    { title: '3. Data Security', content: 'Passwords are securely hashed. All connections use TLS/SSL encryption. Chat includes automated filtering to prevent contact sharing.' },
    { title: '4. Your Rights', content: 'You can access, correct, or delete your data at any time by contacting privacy@roomfinder.com.' },
  ];
  return (
    <div className="min-h-screen pt-20 pb-16">
      <div className="container mx-auto px-4 max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4"><Shield className="w-7 h-7 text-primary" /></div>
          <h1 className="font-heading text-4xl font-bold mb-3">Privacy <span className="gradient-text">Policy</span></h1>
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
export default PrivacyPolicy;
