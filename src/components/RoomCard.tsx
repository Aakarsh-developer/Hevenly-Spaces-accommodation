import { motion } from 'framer-motion';
import { Heart, MapPin, Star, Wifi, Wind, Car } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useApp, Room } from '@/contexts/AppContext';

const facilityIcons: Record<string, React.ReactNode> = {
  WiFi: <Wifi className="w-3 h-3" />,
  AC: <Wind className="w-3 h-3" />,
  Parking: <Car className="w-3 h-3" />,
};

interface RoomCardProps {
  room: Room;
  index?: number;
}

const RoomCard = ({ room, index = 0 }: RoomCardProps) => {
  const { profile, wishlist, toggleWishlist } = useApp();
  const isWishlisted = wishlist.includes(room.id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      className="glass group hover:neon-glow-sm transition-all duration-300 overflow-hidden"
    >
      <div className="relative h-48 overflow-hidden rounded-t-2xl">
        <img
          src={room.images[0] || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800'}
          alt={room.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        <div className="absolute top-3 left-3">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${room.status === 'available' ? 'status-available' : 'status-occupied'}`}>
            {room.status}
          </span>
        </div>
        {profile?.role === 'student' && (
          <motion.button
            whileTap={{ scale: 0.8 }}
            onClick={(e) => {
              e.preventDefault();
              void toggleWishlist(room.id);
            }}
            className="absolute top-3 right-3 p-2 rounded-full glass"
          >
            <Heart className={`w-4 h-4 transition-colors ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-foreground'}`} />
          </motion.button>
        )}
        <div className="absolute bottom-3 left-3">
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary/80 text-primary-foreground backdrop-blur-sm">
            {room.roomType}
          </span>
        </div>
      </div>

      <Link to={`/rooms/${room.id}`} className="block p-4">
        <h3 className="font-heading font-semibold text-base mb-1 line-clamp-1 group-hover:text-primary transition-colors">
          {room.title}
        </h3>
        <div className="flex items-center gap-1 text-muted-foreground text-sm mb-2">
          <MapPin className="w-3 h-3" />
          <span>{room.area}, {room.city}</span>
        </div>
        <div className="flex items-center gap-2 mb-3">
          {room.facilities.slice(0, 3).map((facility) => (
            <span key={facility} className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-secondary text-muted-foreground">
              {facilityIcons[facility] || null} {facility}
            </span>
          ))}
          {room.facilities.length > 3 && (
            <span className="text-xs text-muted-foreground">+{room.facilities.length - 3}</span>
          )}
        </div>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xl font-heading font-bold gradient-text">Rs{room.price.toLocaleString()}</span>
            <span className="text-xs text-muted-foreground">/month</span>
          </div>
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span className="text-sm font-medium">{room.rating}</span>
            <span className="text-xs text-muted-foreground">({room.reviewCount})</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default RoomCard;
