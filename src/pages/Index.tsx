import { motion, useScroll, useTransform, useSpring, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Search, Shield, MapPin, MessageCircle, Star, Building2, DoorOpen, ClipboardList, CreditCard, FileText, Zap, Users, TrendingUp, Clock, BadgeCheck } from 'lucide-react';
import RoomCard from '@/components/RoomCard';
import { useApp } from '@/contexts/AppContext';
import { useRef, useEffect, useState } from 'react';

// ─── Reusable animation variants ────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1], delay: i * 0.1 },
  }),
};

const fadeIn = {
  hidden: { opacity: 0 },
  show: (i = 0) => ({
    opacity: 1,
    transition: { duration: 0.55, ease: 'easeOut', delay: i * 0.08 },
  }),
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.88 },
  show: (i = 0) => ({
    opacity: 1,
    scale: 1,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: i * 0.1 },
  }),
};

// ─── Floating orbs for hero background ──────────────────────────────────────

const FloatingOrb = ({ style, duration = 8, delay = 0 }) => (
  <motion.div
    className="absolute rounded-full pointer-events-none"
    style={style}
    animate={{
      y: [0, -28, 0, 18, 0],
      x: [0, 14, -10, 0],
      scale: [1, 1.06, 0.97, 1.03, 1],
    }}
    transition={{
      duration,
      delay,
      repeat: Infinity,
      ease: 'easeInOut',
    }}
  />
);

// ─── How It Works — 4-step process ──────────────────────────────────────────

const HOW_STEPS = [
  {
    num: '01',
    icon: Search,
    title: 'Search & Filter',
    desc: 'Browse verified rooms by city, college proximity, budget, and amenities. Powerful filters cut the noise instantly.',
    color: 'from-emerald-500/20 to-emerald-500/5',
    accent: 'text-emerald-400',
    border: 'border-emerald-500/20',
  },
  {
    num: '02',
    icon: ClipboardList,
    title: 'Request a Booking',
    desc: 'Send a booking request directly to the owner. No middlemen, no brokerage. Your request stays private until accepted.',
    color: 'from-sky-500/20 to-sky-500/5',
    accent: 'text-sky-400',
    border: 'border-sky-500/20',
  },
  {
    num: '03',
    icon: CreditCard,
    title: 'Secure Payment',
    desc: 'Pay safely through the platform. Funds are held securely until your move-in is confirmed — zero risk either side.',
    color: 'from-violet-500/20 to-violet-500/5',
    accent: 'text-violet-400',
    border: 'border-violet-500/20',
  },
  {
    num: '04',
    icon: FileText,
    title: 'Agreement & Move In',
    desc: 'Digital rental agreement generated automatically. Download, sign, and move in — everything in one dashboard.',
    color: 'from-amber-500/20 to-amber-500/5',
    accent: 'text-amber-400',
    border: 'border-amber-500/20',
  },
];

// ─── Trust metrics strip ──────────────────────────────────────────────────────

const TRUST_ITEMS = [
  { icon: BadgeCheck, label: 'Admin-verified listings only', color: 'text-emerald-400' },
  { icon: Zap, label: 'Instant booking requests', color: 'text-amber-400' },
  { icon: Users, label: '1,200+ students housed', color: 'text-sky-400' },
  { icon: TrendingUp, label: '50+ cities & growing', color: 'text-violet-400' },
  { icon: Clock, label: 'Avg. 2-day booking turnaround', color: 'text-rose-400' },
  { icon: Shield, label: 'Zero brokerage, ever', color: 'text-teal-400' },
];

// ─── Animated counter ────────────────────────────────────────────────────────

const AnimatedCounter = ({ target, suffix = '' }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!inView) return;
    const num = parseFloat(target);
    const isDecimal = target.includes('.');
    let start = 0;
    const duration = 1800;
    const step = 16;
    const increment = num / (duration / step);
    const timer = setInterval(() => {
      start += increment;
      if (start >= num) {
        setCount(num);
        clearInterval(timer);
      } else {
        setCount(isDecimal ? parseFloat(start.toFixed(1)) : Math.floor(start));
      }
    }, step);
    return () => clearInterval(timer);
  }, [inView, target]);

  const display = target.includes('.') ? count.toFixed(1) : count;
  return <span ref={ref}>{display}{suffix}</span>;
};

// ─── Magnetic button effect ──────────────────────────────────────────────────

const MagneticLink = ({ to, className, children }) => {
  const ref = useRef(null);
  const x = useSpring(0, { stiffness: 200, damping: 18 });
  const y = useSpring(0, { stiffness: 200, damping: 18 });

  const handleMouse = (e) => {
    const rect = ref.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    x.set((e.clientX - cx) * 0.35);
    y.set((e.clientY - cy) * 0.35);
  };

  const reset = () => { x.set(0); y.set(0); };

  return (
    <motion.div ref={ref} onMouseMove={handleMouse} onMouseLeave={reset} style={{ x, y, display: 'inline-block' }}>
      <Link to={to} className={className}>{children}</Link>
    </motion.div>
  );
};

// ─── Main component ──────────────────────────────────────────────────────────

const Index = () => {
  const { rooms, roomsLoaded, roomsError } = useApp();
  const featuredRooms = rooms
    .filter((room) => room.approvalStatus === 'approved' && room.status === 'available')
    .slice(0, 3);

  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  const features = [
    { icon: Search, title: 'Smart Search', desc: 'Search by city, college access, amenities, and availability in one pass.' },
    { icon: Shield, title: 'Verified Listings', desc: 'Only approved rooms make it to the public marketplace.' },
    { icon: MapPin, title: 'Location Clarity', desc: 'View nearby colleges, neighborhoods, and map-based room placement.' },
    { icon: MessageCircle, title: 'Protected Conversations', desc: 'Students and owners chat only after a booking is accepted.' },
  ];

  return (
    <div className="min-h-screen pt-16 overflow-x-hidden">

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section ref={heroRef} className="hero-backdrop relative min-h-[calc(100svh-4rem)] overflow-hidden">

        {/* Radial overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(182,255,214,0.18),transparent_24%)]" />

        {/* Floating ambient orbs */}
        <FloatingOrb
          duration={10} delay={0}
          style={{ width: 420, height: 420, top: '-80px', right: '-60px', background: 'radial-gradient(circle, rgba(182,255,214,0.13) 0%, transparent 70%)' }}
        />
        <FloatingOrb
          duration={14} delay={2.5}
          style={{ width: 280, height: 280, bottom: '15%', right: '18%', background: 'radial-gradient(circle, rgba(100,200,255,0.10) 0%, transparent 70%)' }}
        />
        <FloatingOrb
          duration={9} delay={1}
          style={{ width: 180, height: 180, top: '35%', left: '5%', background: 'radial-gradient(circle, rgba(182,255,214,0.08) 0%, transparent 70%)' }}
        />

        {/* Parallax content wrapper */}
        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="container mx-auto h-full px-4 relative">
          <div className="flex min-h-[calc(100svh-4rem)] items-center py-8 sm:py-0">
            <div className="max-w-2xl text-white">

              {/* Badge */}
              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="show"
                custom={0}
                className="inline-flex max-w-full items-center gap-2 rounded-full border border-white/18 bg-white/10 px-3 py-2 text-xs shadow-[0_12px_40px_rgba(15,23,42,0.16)] backdrop-blur-md sm:px-4 sm:text-sm"
              >
                <motion.span
                  animate={{ y: [0, -2, 0], scale: [1, 1.06, 1] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/12"
                >
                  <Building2 className="w-3.5 h-3.5" />
                </motion.span>
                Trusted student housing across India
              </motion.div>

              {/* Headline — word-by-word reveal */}
              <motion.h1
                variants={fadeUp}
                initial="hidden"
                animate="show"
                custom={1}
                className="mt-6 font-heading text-4xl font-bold leading-[0.98] sm:text-5xl md:text-7xl"
              >
                {['Find', 'Your', 'Dream', 'Room', 'Near', 'Campus', 'you', 'call', 'home.'].map((word, i) => (
                  <motion.span
                    key={i}
                    className="inline-block mr-[0.22em]"
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.35 + i * 0.07 }}
                  >
                    {word}
                  </motion.span>
                ))}
              </motion.h1>

              {/* Sub-copy */}
              <motion.p
                variants={fadeUp}
                initial="hidden"
                animate="show"
                custom={3}
                className="mt-6 max-w-xl text-sm text-white/82 sm:text-base md:text-lg"
              >
                Explore approved rooms, review exact locations, complete secure payments, and move from booking request to agreement without the usual mess.
              </motion.p>

              {/* CTAs */}
              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="show"
                custom={4}
                className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4"
              >
                <MagneticLink to="/rooms" className="btn-neon inline-flex w-full items-center justify-center gap-2 sm:w-auto">
                  <Search className="w-4 h-4" /> Explore Rooms <DoorOpen className="w-4 h-4" />
                </MagneticLink>
                <MagneticLink
                  to="/auth"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/10 px-6 py-3 font-heading font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/16 sm:w-auto"
                >
                  List Your Room
                </MagneticLink>
              </motion.div>

              {/* Stats */}
              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="show"
                custom={5}
                className="mt-10 grid max-w-xl grid-cols-3 gap-3 sm:mt-12 sm:gap-6"
              >
                {[
                  { num: '500', suffix: '+', label: 'Rooms listed' },
                  { num: '1.2', suffix: 'k+', label: 'Students placed' },
                  { num: '50', suffix: '+', label: 'Cities covered' },
                ].map((stat) => (
                  <motion.div
                    key={stat.label}
                    whileHover={{ scale: 1.06 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                  >
                    <p className="text-xl font-heading font-bold sm:text-2xl md:text-3xl">
                      <AnimatedCounter target={stat.num} suffix={stat.suffix} />
                    </p>
                    <p className="text-xs text-white/70 sm:text-sm">{stat.label}</p>
                  </motion.div>
                ))}
              </motion.div>

            </div>

            <motion.div
              initial={{ opacity: 0, x: 34 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.95, delay: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="pointer-events-none absolute right-4 top-1/2 hidden w-[25rem] -translate-y-1/2 xl:block"
            >
              <div className="relative h-[28rem]">
                <motion.div
                  className="absolute right-0 top-0 h-[26rem] w-[21rem] rounded-[2.5rem] border border-white/14 bg-white/8 shadow-[0_30px_80px_rgba(8,15,28,0.22)] backdrop-blur-[18px]"
                  animate={{ y: [0, -10, 0], rotate: [0, -1, 0] }}
                  transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <div className="absolute inset-x-8 top-8 h-px bg-gradient-to-r from-transparent via-white/45 to-transparent" />
                  <div className="absolute left-8 top-16 h-24 w-[8.5rem] rounded-[1.4rem] border border-white/10 bg-white/10" />
                  <div className="absolute right-8 top-20 h-20 w-24 rounded-[1.25rem] border border-white/10 bg-white/10" />
                  <div className="absolute inset-x-8 bottom-10 h-16 rounded-[1.6rem] border border-white/10 bg-white/10" />
                </motion.div>

                <motion.div
                  className="absolute bottom-6 left-0 w-[15rem] rounded-[1.75rem] border border-emerald-200/20 bg-white/10 px-5 py-4 shadow-[0_22px_60px_rgba(8,15,28,0.16)] backdrop-blur-md"
                  animate={{ y: [0, 8, 0] }}
                  transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <p className="text-xs uppercase tracking-[0.24em] text-white/60">Platform clarity</p>
                  <p className="mt-3 text-lg font-heading font-semibold text-white">Premium room discovery, cleaner than classifieds.</p>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.2, duration: 0.8 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
            className="w-5 h-8 rounded-full border-2 border-white/30 flex items-start justify-center pt-1.5"
          >
            <div className="w-1 h-2 rounded-full bg-white/60" />
          </motion.div>
        </motion.div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────────────────── */}
      <section className="py-24 relative overflow-hidden">
        {/* Subtle background gradient blob */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full opacity-20"
            style={{ background: 'radial-gradient(ellipse, rgba(16,185,129,0.15) 0%, transparent 70%)' }} />
        </div>

        <div className="container mx-auto px-4 relative">
          {/* Section header */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="text-center mb-16"
          >
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="inline-block text-xs font-semibold uppercase tracking-[0.18em] text-primary/70 mb-3"
            >
              Simple · Fast · Secure
            </motion.span>
            <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">
              Your room in <span className="gradient-text">4 easy steps</span>
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              From search to signed agreement — no agents, no hidden fees, no confusion.
            </p>
          </motion.div>

          {/* Steps grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            {/* Connector line (desktop) */}
            <div className="hidden lg:block absolute top-10 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent pointer-events-none" />

            {HOW_STEPS.map((step, index) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 36 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-30px' }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: index * 0.12 }}
                whileHover={{ y: -10, transition: { type: 'spring', stiffness: 280, damping: 20 } }}
                className={`glass p-6 rounded-2xl border ${step.border} relative group cursor-default`}
              >
                {/* Step number — large faded bg */}
                <span className="absolute top-4 right-4 font-heading font-bold text-5xl text-white/4 select-none leading-none">
                  {step.num}
                </span>

                {/* Icon circle */}
                <motion.div
                  className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center mb-5 border ${step.border}`}
                  whileHover={{ rotate: [0, -8, 8, -4, 0], scale: 1.1 }}
                  transition={{ duration: 0.45 }}
                >
                  <step.icon className={`w-6 h-6 ${step.accent}`} />
                </motion.div>

                {/* Step label */}
                <div className={`text-xs font-semibold uppercase tracking-widest mb-2 ${step.accent}`}>
                  Step {step.num}
                </div>

                <h3 className="font-heading font-semibold text-base mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>

                {/* Animated bottom line */}
                <motion.div
                  className={`mt-5 h-[2px] rounded-full bg-gradient-to-r ${step.color}`}
                  initial={{ scaleX: 0, originX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.7, delay: index * 0.12 + 0.3, ease: [0.22, 1, 0.36, 1] }}
                />
              </motion.div>
            ))}
          </div>

          {/* CTA below steps */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-center mt-12"
          >
            <Link to="/rooms" className="btn-neon inline-flex items-center gap-2">
              <Search className="w-4 h-4" /> Start Searching Now <DoorOpen className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── TRUST STRIP ───────────────────────────────────────────────────── */}
      <section className="py-10 border-y border-white/5 overflow-hidden">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4"
          >
            {TRUST_ITEMS.map((item, index) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.07, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ scale: 1.05, transition: { type: 'spring', stiffness: 300 } }}
                className="flex flex-col items-center gap-2 text-center group cursor-default"
              >
                <motion.div
                  className="w-10 h-10 rounded-xl glass flex items-center justify-center"
                  whileHover={{ rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 0.4 }}
                >
                  <item.icon className={`w-5 h-5 ${item.color}`} />
                </motion.div>
                <p className="text-xs text-muted-foreground leading-snug font-medium">{item.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── FEATURES ──────────────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            className="text-center mb-12"
          >
            <h2 className="font-heading text-3xl font-bold mb-3">
              Why <span className="gradient-text">Havenly Spaces</span> works
            </h2>
            <p className="text-muted-foreground">A cleaner booking journey for students, owners, and admins.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                variants={scaleIn}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: '-40px' }}
                custom={index}
                whileHover={{
                  y: -8,
                  boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
                  transition: { type: 'spring', stiffness: 260, damping: 18 },
                }}
                className="glass p-6 text-left cursor-default"
              >
                <motion.div
                  className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4"
                  whileHover={{ rotate: [0, -10, 10, -5, 0], scale: 1.12 }}
                  transition={{ duration: 0.5 }}
                >
                  <feature.icon className="w-6 h-6 text-primary" />
                </motion.div>
                <h3 className="font-heading font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>

                {/* Animated underline on hover */}
                <motion.div
                  className="mt-4 h-[2px] rounded-full bg-primary/40"
                  initial={{ scaleX: 0, originX: 0 }}
                  whileHover={{ scaleX: 1 }}
                  transition={{ duration: 0.35 }}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED ROOMS ────────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6 }}
            className="mb-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <h2 className="font-heading text-2xl font-bold sm:text-3xl">
                Featured <span className="gradient-text">Rooms</span>
              </h2>
              <p className="text-muted-foreground mt-1">Approved rooms ready for booking right now.</p>
            </div>
            <motion.div
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <Link to="/rooms" className="btn-neon-outline inline-flex items-center gap-2 self-start text-sm py-2 md:hidden">
                View All <DoorOpen className="w-4 h-4" />
              </Link>
              <Link to="/rooms" className="btn-neon-outline text-sm py-2 hidden md:inline-flex items-center gap-2">
                View All <DoorOpen className="w-4 h-4" />
              </Link>
            </motion.div>
          </motion.div>

          <AnimatePresence mode="wait">
            {!roomsLoaded ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="glass p-12 text-center text-muted-foreground"
              >
                {/* Pulsing skeleton dots */}
                <div className="flex justify-center gap-2 mb-3">
                  {[0, 0.2, 0.4].map((d, i) => (
                    <motion.div
                      key={i}
                      className="w-2.5 h-2.5 rounded-full bg-primary/40"
                      animate={{ scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 1, delay: d, repeat: Infinity }}
                    />
                  ))}
                </div>
                Loading featured rooms...
              </motion.div>
            ) : roomsError ? (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="glass p-12 text-center space-y-2"
              >
                <p className="font-medium text-foreground">Featured rooms are unavailable right now.</p>
                <p className="text-sm text-muted-foreground">Supabase returned: {roomsError}</p>
              </motion.div>
            ) : featuredRooms.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass p-12 text-center text-muted-foreground"
              >
                No rooms available yet. Be the first to list one.
              </motion.div>
            ) : (
              <motion.div
                key="rooms"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {featuredRooms.map((room, index) => (
                  <motion.div
                    key={room.id}
                    variants={scaleIn}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, margin: '-30px' }}
                    custom={index}
                    whileHover={{ y: -6, transition: { type: 'spring', stiffness: 260, damping: 20 } }}
                  >
                    <RoomCard room={room} index={index} />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* ── TESTIMONIALS ──────────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="font-heading text-3xl font-bold mb-12"
          >
            What students <span className="gradient-text">say</span>
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: 'Sneha Joshi', text: 'The location and booking flow felt much more trustworthy than the usual student rental hunt.', rating: 5 },
              { name: 'Rohan Gupta', text: 'Being able to pay and keep the agreement in the same dashboard made the process much easier.', rating: 5 },
              { name: 'Aisha Khan', text: 'The room data, maps, and approval system saved me from wasting time on fake listings.', rating: 4 },
            ].map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: '-40px' }}
                custom={index}
                whileHover={{
                  y: -8,
                  scale: 1.02,
                  transition: { type: 'spring', stiffness: 280, damping: 18 },
                }}
                className="glass p-6 cursor-default"
              >
                {/* Stars with stagger */}
                <div className="flex gap-1 mb-3 justify-center">
                  {Array.from({ length: testimonial.rating }).map((_, starIndex) => (
                    <motion.div
                      key={starIndex}
                      initial={{ opacity: 0, scale: 0, rotate: -30 }}
                      whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                      viewport={{ once: true }}
                      transition={{
                        duration: 0.4,
                        delay: index * 0.12 + starIndex * 0.07,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                    >
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    </motion.div>
                  ))}
                </div>

                <motion.p
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.12 + 0.3, duration: 0.5 }}
                  className="text-sm text-muted-foreground mb-4 italic"
                >
                  "{testimonial.text}"
                </motion.p>

                <motion.p
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.12 + 0.45, duration: 0.45 }}
                  className="font-heading font-semibold text-sm"
                >
                  {testimonial.name}
                </motion.p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
};

export default Index;
