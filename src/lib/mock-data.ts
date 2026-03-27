import { Room, User, Booking, Notification } from './types';

export const FACILITIES = ['WiFi', 'AC', 'Parking', 'Laundry', 'Kitchen', 'Gym', 'CCTV', 'Power Backup', 'Furnished', 'Geyser'];

export const mockRooms: Room[] = [
  {
    id: '1', ownerId: 'owner1', ownerName: 'Rahul Sharma',
    title: 'Spacious Single Room near MIT College',
    description: 'A beautiful, well-ventilated room with modern amenities. Perfect for students who value comfort and proximity to campus.',
    price: 4500, city: 'Pune', area: 'Kothrud', college: 'MIT College',
    latitude: 18.5074, longitude: 73.8077,
    images: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
    ],
    facilities: ['WiFi', 'AC', 'Furnished', 'Power Backup'],
    roomType: 'single', status: 'available', rating: 4.5, reviewCount: 23,
    nearbyPlaces: ['MIT College - 500m', 'City Hospital - 1km', 'Metro Station - 800m'],
    createdAt: '2024-01-15',
  },
  {
    id: '2', ownerId: 'owner1', ownerName: 'Rahul Sharma',
    title: 'Cozy Shared Room with Great View',
    description: 'Share this spacious room with a like-minded student. Includes all modern amenities and a balcony with city views.',
    price: 3000, city: 'Pune', area: 'Hinjewadi', college: 'PICT College',
    latitude: 18.5912, longitude: 73.7390,
    images: [
      'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800',
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800',
    ],
    facilities: ['WiFi', 'Parking', 'Kitchen', 'Laundry'],
    roomType: 'shared', status: 'available', rating: 4.2, reviewCount: 15,
    nearbyPlaces: ['PICT College - 1km', 'Hinjewadi IT Park - 2km'],
    createdAt: '2024-02-10',
  },
  {
    id: '3', ownerId: 'owner2', ownerName: 'Priya Patel',
    title: 'Premium Studio near VIT Campus',
    description: 'Fully furnished studio apartment with attached bathroom. Walk to campus in 5 minutes.',
    price: 7000, city: 'Pune', area: 'Kondhwa', college: 'VIT Pune',
    latitude: 18.4575, longitude: 73.8950,
    images: [
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800',
      'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=800',
    ],
    facilities: ['WiFi', 'AC', 'Furnished', 'Gym', 'CCTV', 'Geyser'],
    roomType: 'single', status: 'occupied', rating: 4.8, reviewCount: 42,
    nearbyPlaces: ['VIT Pune - 300m', 'Magarpatta City - 1.5km', 'Aga Khan Hospital - 3km'],
    createdAt: '2024-01-20',
  },
  {
    id: '4', ownerId: 'owner2', ownerName: 'Priya Patel',
    title: 'Budget-Friendly Shared Accommodation',
    description: 'Affordable and clean shared room ideal for students on a budget. Includes basic amenities.',
    price: 2500, city: 'Mumbai', area: 'Andheri', college: 'DJ Sanghvi',
    latitude: 19.1136, longitude: 72.8697,
    images: [
      'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800',
    ],
    facilities: ['WiFi', 'Power Backup', 'Laundry'],
    roomType: 'shared', status: 'available', rating: 3.9, reviewCount: 8,
    nearbyPlaces: ['DJ Sanghvi College - 2km', 'Andheri Station - 1km'],
    createdAt: '2024-03-01',
  },
  {
    id: '5', ownerId: 'owner1', ownerName: 'Rahul Sharma',
    title: 'Modern Room with Rooftop Access',
    description: 'Enjoy a modern living space with rooftop garden access. Great community of student residents.',
    price: 5500, city: 'Mumbai', area: 'Powai', college: 'IIT Bombay',
    latitude: 19.1334, longitude: 72.9133,
    images: [
      'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800',
      'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?w=800',
    ],
    facilities: ['WiFi', 'AC', 'Gym', 'CCTV', 'Parking', 'Furnished'],
    roomType: 'single', status: 'available', rating: 4.6, reviewCount: 31,
    nearbyPlaces: ['IIT Bombay - 1km', 'Hiranandani Hospital - 500m', 'Powai Lake - 800m'],
    createdAt: '2024-02-28',
  },
  {
    id: '6', ownerId: 'owner2', ownerName: 'Priya Patel',
    title: 'Compact Room in Heart of City',
    description: 'Well-connected location with all public transport nearby. Ideal for students who travel across the city.',
    price: 3800, city: 'Bangalore', area: 'Koramangala', college: 'Christ University',
    latitude: 12.9352, longitude: 77.6245,
    images: [
      'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800',
    ],
    facilities: ['WiFi', 'Furnished', 'Kitchen', 'Geyser'],
    roomType: 'single', status: 'available', rating: 4.1, reviewCount: 12,
    nearbyPlaces: ['Christ University - 1.5km', 'Forum Mall - 800m', 'Metro Station - 600m'],
    createdAt: '2024-03-05',
  },
];

export const mockUsers: Record<string, User> = {
  student1: { id: 'student1', name: 'Amit Kumar', email: 'amit@example.com', role: 'student' },
  owner1: { id: 'owner1', name: 'Rahul Sharma', email: 'rahul@example.com', role: 'owner' },
};

export const mockBookings: Booking[] = [
  {
    id: 'b1', roomId: '1', studentId: 'student1', studentName: 'Amit Kumar',
    ownerId: 'owner1', status: 'pending', createdAt: '2024-03-10',
  },
];

export const mockNotifications: Notification[] = [
  {
    id: 'n1', userId: 'owner1', title: 'New Booking Request',
    message: 'Amit Kumar has requested to book "Spacious Single Room near MIT College"',
    read: false, createdAt: '2024-03-10T10:30:00',
  },
];
