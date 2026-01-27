
export enum UserRole {
  ADMIN = 'ADMIN',
  CUSTOMER = 'CUSTOMER',
  TECHNICIAN = 'TECHNICIAN'
}

export enum RequestStatus {
  PENDING = 'PENDING',
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  EN_ROUTE = 'EN_ROUTE',
  STARTED = 'STARTED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  password?: string; // Added password field
  role: UserRole;
  approved: boolean;
  city?: string;
  bio?: string;
  avatar?: string;
  portfolio?: string[]; // Array of image URLs/Base64
  rating?: number;
  reviewCount?: number;
  completedRequests?: number; // Added counter for loyalty levels
}

export interface ServiceRequest {
  id: string;
  customerId: string;
  customerName: string;
  category: string;
  description: string;
  city: string;
  preferredTime: string;
  image?: string;
  status: RequestStatus;
  createdAt: number;
  acceptedBidId?: string;
}

export interface Bid {
  id: string;
  requestId: string;
  technicianId: string;
  technicianName: string;
  technicianRating: number;
  price: number;
  message: string;
  createdAt: number;
}

export interface Review {
  id: string;
  requestId: string;
  customerId: string;
  customerName: string;
  technicianId: string;
  rating: number;
  comment: string;
  createdAt: number;
}

export type MessageType = 'text' | 'image' | 'location';

export interface ChatMessage {
  id: string;
  requestId: string;
  senderId: string;
  senderName: string;
  type: MessageType;
  text?: string;
  mediaUrl?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  createdAt: number;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'bid' | 'status_update' | 'assignment';
  requestId: string;
  read: boolean;
  createdAt: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
}
