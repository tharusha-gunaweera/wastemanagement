export interface User {
  uid: string;
  email: string;
  displayName?: string;
  phoneNumber?: string;
  accessLevel: number; // 1 = Regular user, 2 = Driver, 3 = Admin
  createdAt: Date;
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface SignUpData extends AuthCredentials {
  displayName?: string;
  phoneNumber?: string;
}

export interface StoredUser {
  uid: string;
  email: string;
  displayName?: string;
  phoneNumber?: string;
  accessLevel: number;
  createdAt: string;
}

export interface TrashBucket {
  id: string;
  name: string;
  bucketId: string;
  userId: string;
  fillPercentage: number;
  capacity: number;
  location?: string;
  createdAt: Date;
  lastUpdated: Date;
  isAssigned: boolean;
  assignedDriverId?: string;
  
  // Health metrics
  sensorUptime: number;
  batteryLevel: number;
  lastMaintenance: Date;
  signalStrength: number;
  isOnline: boolean;
}

export interface AssignedDriver {
  id: string;
  bucketId: string;
  driverId: string;
  driverName: string;
  assignedAt: Date;
  status: 'pending' | 'collected' | 'cancelled';
}

export interface TechnicianRequest {
  id: string;
  bucketId: string;
  bucketName: string;
  userId: string;
  userName: string;
  issueType: 'sensor' | 'battery' | 'signal' | 'other';
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in-progress' | 'resolved' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

// Add to existing User.ts file

export interface BinLocation {
  id: string;
  bucketId: string;
  name: string;
  latitude: number;
  longitude: number;
  fillPercentage: number;
  status: 'empty' | 'low' | 'medium' | 'full';
  lastUpdated: Date;
  address?: string;
}

export interface CollectionRequest {
  id: string;
  bucketId: string;
  bucketName: string;
  driverId: string;
  driverName: string;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  requestedAt: Date;
  collectedAt?: Date;
}

// Add to existing User.ts

export interface TrashItem {
  id: string;
  bucketId: string;
  bucketName: string;
  userId: string;
  userName: string;
  trashType: 'organic' | 'recyclable' | 'non-recyclable';
  weight?: number; // in kg
  description?: string;
  createdAt: Date;
  status: 'added' | 'collected' | 'processed';
}

export interface TrashStats {
  totalTrash: number;
  organic: number;
  recyclable: number;
  nonRecyclable: number;
  lastUpdated: Date;
}