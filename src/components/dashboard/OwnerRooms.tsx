import { useApp } from '@/contexts/AppContext';
import { motion } from 'framer-motion';

const OwnerRooms = () => {
  const { user, rooms, updateRoomStatus } = useApp();
  const myRooms = rooms.filter((room) => room.owner_id === user?.id);

  return (
    <div>
      <h2 className="font-heading text-xl font-semibold mb-4">My Rooms ({myRooms.length})</h2>
      {myRooms.length === 0 ? (
        <div className="glass p-8 text-center text-muted-foreground">No rooms listed yet. Add your first room!</div>
      ) : (
        <div className="space-y-4">
          {myRooms.map((room, index) => (
            <motion.div
              key={room.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass p-4 flex flex-col md:flex-row gap-4"
            >
              <img
                src={room.images[0] || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800'}
                alt={room.title}
                className="w-full md:w-40 h-28 object-cover rounded-xl"
              />
              <div className="flex-1">
                <h3 className="font-heading font-semibold">{room.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {room.area}, {room.city} • Rs{room.price.toLocaleString()}/mo
                </p>
                <div className="flex flex-wrap items-center gap-3 mt-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${room.status === 'available' ? 'status-available' : 'status-occupied'}`}>
                    {room.status}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    room.approvalStatus === 'approved'
                      ? 'bg-emerald-500/10 text-emerald-600'
                      : room.approvalStatus === 'rejected'
                        ? 'bg-destructive/10 text-destructive'
                        : 'status-pending'
                  }`}>
                    {room.approvalStatus === 'approved' ? 'approved' : room.approvalStatus === 'rejected' ? 'rejected' : 'pending review'}
                  </span>
                  <button
                    onClick={() => updateRoomStatus(room.id, room.status === 'available' ? 'occupied' : 'available')}
                    className="text-xs px-3 py-1 rounded-full bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Toggle Status
                  </button>
                </div>
                {room.approvalStatus !== 'approved' && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    {room.approvalStatus === 'pending'
                      ? 'This room is hidden from students until an admin approves it.'
                      : 'This room was rejected by admin and is hidden from students.'}
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OwnerRooms;
