import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import RoomCard from '@/components/RoomCard';
import { useApp } from '@/contexts/AppContext';

const FACILITIES = ['WiFi', 'AC', 'Parking', 'Laundry', 'Kitchen', 'Gym', 'CCTV', 'Power Backup', 'Furnished', 'Geyser'];

const Rooms = () => {
  const { rooms, roomsLoaded, roomsError } = useApp();
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>([]);
  const [roomType, setRoomType] = useState<string>('all');

  const visibleRooms = useMemo(() => rooms.filter((room) => room.approvalStatus === 'approved'), [rooms]);
  const cities = useMemo(() => [...new Set(visibleRooms.map((room) => room.city))], [visibleRooms]);

  const filtered = useMemo(() => {
    return visibleRooms.filter((room) => {
      const matchSearch = !search
        || room.title.toLowerCase().includes(search.toLowerCase())
        || room.city.toLowerCase().includes(search.toLowerCase())
        || room.area.toLowerCase().includes(search.toLowerCase())
        || (room.college && room.college.toLowerCase().includes(search.toLowerCase()));

      const matchPrice = room.price >= priceRange[0] && room.price <= priceRange[1];
      const matchFacilities = selectedFacilities.length === 0 || selectedFacilities.every((facility) => room.facilities.includes(facility));
      const matchType = roomType === 'all' || room.roomType === roomType;

      return matchSearch && matchPrice && matchFacilities && matchType;
    });
  }, [priceRange, roomType, search, selectedFacilities, visibleRooms]);

  return (
    <div className="min-h-screen pt-20 pb-10">
      <div className="container mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-heading text-3xl font-bold mb-2">Explore <span className="gradient-text">Rooms</span></h1>
          <p className="text-muted-foreground mb-6">Find the perfect accommodation near your campus</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass p-4 mb-8"
        >
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by city, area, or college..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-3 rounded-xl border transition-all flex items-center gap-2 ${showFilters ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary border-border text-muted-foreground hover:text-foreground'}`}
            >
              <SlidersHorizontal className="w-4 h-4" /> Filters
            </button>
          </div>

          <div className="flex gap-2 mt-3 flex-wrap">
            {cities.map((city) => (
              <button
                key={city}
                onClick={() => setSearch(search === city ? '' : city)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${search === city ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}
              >
                {city}
              </button>
            ))}
          </div>

          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="mt-4 pt-4 border-t border-border space-y-4"
            >
              <div>
                <label className="text-sm font-medium mb-2 block">Price Range: Rs{priceRange[0]} - Rs{priceRange[1]}</label>
                <input
                  type="range"
                  min={0}
                  max={10000}
                  step={500}
                  value={priceRange[1]}
                  onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value, 10)])}
                  className="w-full accent-primary"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Room Type</label>
                <div className="flex gap-2">
                  {['all', 'single', 'shared'].map((type) => (
                    <button
                      key={type}
                      onClick={() => setRoomType(type)}
                      className={`px-4 py-2 rounded-xl text-sm transition-all ${roomType === type ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}
                    >
                      {type === 'all' ? 'All' : type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Facilities</label>
                <div className="flex gap-2 flex-wrap">
                  {FACILITIES.map((facility) => (
                    <button
                      key={facility}
                      onClick={() => setSelectedFacilities((prev) => prev.includes(facility) ? prev.filter((item) => item !== facility) : [...prev, facility])}
                      className={`px-3 py-1.5 rounded-lg text-xs transition-all ${selectedFacilities.includes(facility) ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}
                    >
                      {facility}
                    </button>
                  ))}
                </div>
              </div>

              {(selectedFacilities.length > 0 || roomType !== 'all') && (
                <button
                  onClick={() => {
                    setSelectedFacilities([]);
                    setRoomType('all');
                    setPriceRange([0, 10000]);
                  }}
                  className="text-xs text-primary flex items-center gap-1 hover:underline"
                >
                  <X className="w-3 h-3" /> Clear all filters
                </button>
              )}
            </motion.div>
          )}
        </motion.div>

        {!roomsLoaded ? (
          <div className="glass p-12 text-center text-muted-foreground">Loading rooms...</div>
        ) : roomsError ? (
          <div className="glass p-12 text-center space-y-2">
            <p className="text-foreground font-medium">Room data could not be loaded.</p>
            <p className="text-sm text-muted-foreground">Supabase returned: {roomsError}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass p-12 text-center">
            <p className="text-muted-foreground">
              {rooms.length === 0
                ? 'No rooms exist in Supabase yet. Sign in as an owner and add one from the dashboard.'
                : visibleRooms.length === 0
                  ? 'Rooms exist, but none are approved by admin yet.'
                  : 'No rooms match your criteria.'}
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4">{filtered.length} room{filtered.length !== 1 ? 's' : ''} found</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((room, index) => <RoomCard key={room.id} room={room} index={index} />)}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Rooms;
