import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send, Clock } from 'lucide-react';
import { toast } from 'sonner';

const Contact = () => {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 1000));
    toast.success('Message sent! We\'ll respond within 24 hours.');
    setForm({ name: '', email: '', subject: '', message: '' });
    setSubmitting(false);
  };
  const inputClass = "w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors";
  return (
    <div className="min-h-screen pt-20 pb-16">
      <div className="container mx-auto px-4 max-w-5xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <h1 className="font-heading text-4xl font-bold mb-4">Get in <span className="gradient-text">Touch</span></h1>
          <p className="text-muted-foreground">Have questions? We'd love to hear from you.</p>
        </motion.div>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {[{ icon: Mail, label: 'Email', value: 'support@roomfinder.com' }, { icon: Phone, label: 'Phone', value: '+91 98765 43210' }, { icon: MapPin, label: 'Office', value: 'Pune, India' }, { icon: Clock, label: 'Response', value: 'Within 24 hours' }].map((item, i) => (
              <motion.div key={item.label} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="glass p-5 flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0"><item.icon className="w-5 h-5 text-primary" /></div>
                <div><h3 className="font-heading font-semibold text-sm">{item.label}</h3><p className="text-sm">{item.value}</p></div>
              </motion.div>
            ))}
          </div>
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-3">
            <form onSubmit={handleSubmit} className="glass p-6 space-y-4">
              <h2 className="font-heading text-xl font-semibold mb-2">Send a Message</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input type="text" placeholder="Name *" className={inputClass} value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
                <input type="email" placeholder="Email *" className={inputClass} value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
              </div>
              <input type="text" placeholder="Subject" className={inputClass} value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} />
              <textarea placeholder="Message *" rows={5} className={inputClass} value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} required />
              <button type="submit" disabled={submitting} className="btn-neon w-full flex items-center justify-center gap-2 disabled:opacity-60">
                <Send className="w-4 h-4" /> {submitting ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
export default Contact;
