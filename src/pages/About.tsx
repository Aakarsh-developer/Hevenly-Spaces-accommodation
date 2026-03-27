import { motion } from 'framer-motion';
import { Home, Users, Shield, MapPin, Award, Heart } from 'lucide-react';

const About = () => {
  const values = [
    { icon: Shield, title: 'Trust & Safety', desc: 'Every listing is verified. Every transaction is secure.' },
    { icon: Heart, title: 'Student First', desc: 'Built by students, for students.' },
    { icon: MapPin, title: 'Local Expertise', desc: 'Deep knowledge of student neighborhoods in 50+ cities.' },
    { icon: Award, title: 'Quality Assured', desc: 'Rigorous quality checks on every listing.' },
  ];

  return (
    <div className="min-h-screen pt-20 pb-16">
      <div className="container mx-auto px-4 max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-neon-purple flex items-center justify-center mx-auto mb-6">
            <Home className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="font-heading text-4xl font-bold mb-4">About <span className="gradient-text">RoomFinder</span></h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            India's most trusted platform for student accommodation. We connect students with verified room owners.
          </p>
        </motion.div>
        <section className="glass p-8 mb-12">
          <h2 className="font-heading text-2xl font-bold mb-4">Our Mission</h2>
          <p className="text-muted-foreground leading-relaxed">Every year, millions of students relocate for education. RoomFinder creates a transparent marketplace where students discover verified rooms near their colleges.</p>
        </section>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {values.map((v, i) => (
            <motion.div key={v.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="glass p-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3"><v.icon className="w-5 h-5 text-primary" /></div>
              <h3 className="font-heading font-semibold mb-2">{v.title}</h3>
              <p className="text-sm text-muted-foreground">{v.desc}</p>
            </motion.div>
          ))}
        </div>
        <div className="glass p-8 text-center">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[{ num: '500+', label: 'Rooms' }, { num: '1200+', label: 'Students' }, { num: '50+', label: 'Cities' }, { num: '200+', label: 'Owners' }].map(s => (
              <div key={s.label}><p className="text-2xl font-heading font-bold gradient-text">{s.num}</p><p className="text-sm text-muted-foreground">{s.label}</p></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
