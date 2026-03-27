import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import RoomCard from '@/components/RoomCard';

const Wishlist = () => {
  const { rooms, roomsLoaded, wishlist, wishlistLoaded } = useApp();
  const wishlistedRooms = rooms.filter((room) => wishlist.includes(room.id));

  return (
    <div className="min-h-screen pt-20 pb-10">
      <div className="container mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-heading text-3xl font-bold mb-2">
            <Heart className="w-8 h-8 inline-block mr-2 text-red-400" />
            My <span className="gradient-text">Wishlist</span>
          </h1>
          <p className="text-muted-foreground mb-8">{wishlistedRooms.length} saved rooms</p>
        </motion.div>

        {!roomsLoaded || !wishlistLoaded ? (
          <div className="glass p-12 text-center text-muted-foreground">Loading wishlist...</div>
        ) : wishlistedRooms.length === 0 ? (
          <div className="glass p-12 text-center text-muted-foreground">
            <Heart className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>No rooms in your wishlist yet.</p>
            <p className="text-sm mt-1">Click the heart icon on any room to save it.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlistedRooms.map((room, index) => <RoomCard key={room.id} room={room} index={index} />)}
          </div>
        )}
      </div>
    </div>
  );
};

export default Wishlist;
