import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Search, Shield, MapPin, MessageCircle, ArrowRight, Star, Home } from 'lucide-react';
import RoomCard from '@/components/RoomCard';
import { useApp } from '@/contexts/AppContext';

const Index = () => {
  const { rooms, roomsLoaded, roomsError } = useApp();
  const featuredRooms = rooms.filter((room) => room.approvalStatus === 'approved' && room.status === 'available').slice(0, 3);

  const features = [
    { icon: Search, title: 'Smart Search', desc: 'Search by city, college access, amenities, and availability in one pass.' },
    { icon: Shield, title: 'Verified Listings', desc: 'Only approved rooms make it to the public marketplace.' },
    { icon: MapPin, title: 'Location Clarity', desc: 'View nearby colleges, neighborhoods, and map-based room placement.' },
    { icon: MessageCircle, title: 'Protected Conversations', desc: 'Students and owners chat only after a booking is accepted.' },
  ];

  return (
    <div className="min-h-screen pt-16">
      <section className="hero-backdrop relative min-h-[calc(100svh-4rem)] overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(182,255,214,0.18),transparent_24%)]" />
        <div className="container mx-auto h-full px-4 relative">
          <div className="min-h-[calc(100svh-4rem)] flex items-center">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="max-w-2xl text-white"
            >
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm backdrop-blur-md"
              >
                <Home className="w-4 h-4" />
                Trusted student housing across India
              </motion.div>
              <h1 className="mt-6 font-heading text-5xl md:text-7xl font-bold leading-[0.95]">
                Find Your Dream Room Near Campus you call home.
              </h1>
              <p className="mt-6 max-w-xl text-base md:text-lg text-white/82">
                Explore approved rooms, review exact locations, complete secure payments, and move from booking request to agreement without the usual mess.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Link to="/rooms" className="btn-neon inline-flex items-center justify-center gap-2">
                  <Search className="w-4 h-4" /> Explore Rooms <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/auth" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/10 px-6 py-3 font-heading font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/16">
                  List Your Room
                </Link>
              </div>
              <div className="mt-12 grid grid-cols-3 gap-6 max-w-xl">
                {[{ num: '500+', label: 'Rooms listed' }, { num: '1.2k+', label: 'Students placed' }, { num: '50+', label: 'Cities covered' }].map((stat) => (
                  <div key={stat.label}>
                    <p className="text-2xl md:text-3xl font-heading font-bold">{stat.num}</p>
                    <p className="text-sm text-white/70">{stat.label}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="font-heading text-3xl font-bold mb-3">Why <span className="gradient-text">Havenly Spaces</span> works</h2>
            <p className="text-muted-foreground">A cleaner booking journey for students, owners, and admins.</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                className="glass p-6 text-left"
              >
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-heading font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="font-heading text-3xl font-bold">Featured <span className="gradient-text">Rooms</span></h2>
              <p className="text-muted-foreground mt-1">Approved rooms ready for booking right now.</p>
            </div>
            <Link to="/rooms" className="btn-neon-outline text-sm py-2 hidden md:inline-flex items-center gap-2">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          {!roomsLoaded ? (
            <div className="glass p-12 text-center text-muted-foreground">Loading featured rooms...</div>
          ) : roomsError ? (
            <div className="glass p-12 text-center space-y-2">
              <p className="font-medium text-foreground">Featured rooms are unavailable right now.</p>
              <p className="text-sm text-muted-foreground">Supabase returned: {roomsError}</p>
            </div>
          ) : featuredRooms.length === 0 ? (
            <div className="glass p-12 text-center text-muted-foreground">No rooms available yet. Be the first to list one.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredRooms.map((room, index) => (
                <RoomCard key={room.id} room={room} index={index} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-heading text-3xl font-bold mb-12">What students <span className="gradient-text">say</span></h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: 'Sneha Joshi', text: 'The location and booking flow felt much more trustworthy than the usual student rental hunt.', rating: 5 },
              { name: 'Rohan Gupta', text: 'Being able to pay and keep the agreement in the same dashboard made the process much easier.', rating: 5 },
              { name: 'Aisha Khan', text: 'The room data, maps, and approval system saved me from wasting time on fake listings.', rating: 4 },
            ].map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.12 }}
                className="glass p-6"
              >
                <div className="flex gap-1 mb-3 justify-center">
                  {Array.from({ length: testimonial.rating }).map((_, starIndex) => (
                    <Star key={starIndex} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mb-4 italic">"{testimonial.text}"</p>
                <p className="font-heading font-semibold text-sm">{testimonial.name}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
