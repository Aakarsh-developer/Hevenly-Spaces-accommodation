import { motion } from 'framer-motion';
import { HelpCircle } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const FAQ = () => {
  const faqs = [
    { q: 'How do I create an account?', a: 'Click Sign In, then Sign Up. Enter your name, email, password and select your role (Student or Owner).' },
    { q: 'What\'s the difference between Student and Owner?', a: 'Students search/book rooms. Owners list properties and manage booking requests.' },
    { q: 'How does booking work?', a: 'Students send booking requests. Owners accept/reject from their dashboard. Once accepted, chat is enabled.' },
    { q: 'Is the chat safe?', a: 'Yes! Our chat filters personal contact info automatically to protect both parties.' },
    { q: 'Is RoomFinder free?', a: 'Yes, completely free for both Students and Owners. No hidden fees.' },
    { q: 'How do I list a room?', a: 'Create an Owner account, go to Dashboard > Add Room, and fill in the details.' },
  ];
  return (
    <div className="min-h-screen pt-20 pb-16">
      <div className="container mx-auto px-4 max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4"><HelpCircle className="w-7 h-7 text-primary" /></div>
          <h1 className="font-heading text-4xl font-bold mb-3">Frequently Asked <span className="gradient-text">Questions</span></h1>
          <p className="text-muted-foreground">Find answers to common questions about RoomFinder.</p>
        </motion.div>
        <Accordion type="single" collapsible className="space-y-3">
          {faqs.map((faq, i) => (
            <AccordionItem key={i} value={`faq-${i}`} className="glass px-6 border-none">
              <AccordionTrigger className="font-heading font-medium text-left text-sm py-4 hover:no-underline hover:text-primary">{faq.q}</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-4">{faq.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        <div className="glass p-6 mt-8 text-center">
          <p className="text-sm text-muted-foreground">Still have questions? <a href="/contact" className="text-primary hover:underline">Contact us</a></p>
        </div>
      </div>
    </div>
  );
};
export default FAQ;
