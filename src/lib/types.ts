export type UserRole = 'student' | 'owner' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export interface Room {
  id: string;
  ownerId: string;
  ownerName: string;
  title: string;
  description: string;
  price: number;
  city: string;
  area: string;
  college?: string;
  latitude: number;
  longitude: number;
  images: string[];
  facilities: string[];
  roomType: 'single' | 'shared';
  status: 'available' | 'occupied';
  rating: number;
  reviewCount: number;
  nearbyPlaces?: string[];
  createdAt: string;
}

export type BookingStatus = 'pending' | 'accepted' | 'rejected';

export interface Booking {
  id: string;
  roomId: string;
  studentId: string;
  studentName: string;
  ownerId: string;
  status: BookingStatus;
  createdAt: string;
  room?: Room;
}

export interface ChatMessage {
  id: string;
  bookingId: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}
