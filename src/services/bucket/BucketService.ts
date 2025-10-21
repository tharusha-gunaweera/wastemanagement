import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  Timestamp,
  updateDoc,
  where
} from 'firebase/firestore';
import { db } from '../../config/FirebaseConfig';
import { TechnicianRequest, TrashBucket, User } from '../../models/User';

export class BucketService {
  // Singleton instance
  private static instance: BucketService;

  // Private constructor to prevent direct construction
  private constructor() {
    // Initialization code if needed
  }

  // Static method to get the singleton instance
  public static getInstance(): BucketService {
    if (!BucketService.instance) {
      BucketService.instance = new BucketService();
    }
    return BucketService.instance;
  }

  // Safe date conversion helper
  private safeDateConversion(dateValue: any): Date {
    try {
      if (dateValue && typeof dateValue.toDate === 'function') {
        return dateValue.toDate();
      } else if (dateValue) {
        return new Date(dateValue);
      } else {
        return new Date();
      }
    } catch (error) {
      console.warn('Date conversion error, using current date:', error);
      return new Date();
    }
  }

  // Get all buckets for a user
  async getUserBuckets(userId: string): Promise<TrashBucket[]> {
    try {
      const bucketsQuery = query(
        collection(db, 'buckets'),
        where('userId', '==', userId),
        orderBy('lastUpdated', 'desc')
      );
      
      const querySnapshot = await getDocs(bucketsQuery);
      const buckets: TrashBucket[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        buckets.push({
          id: doc.id,
          name: data.name,
          bucketId: data.bucketId,
          userId: data.userId,
          fillPercentage: data.fillPercentage || 0,
          capacity: data.capacity || 0,
          location: data.location || '',
          createdAt: this.safeDateConversion(data.createdAt),
          lastUpdated: this.safeDateConversion(data.lastUpdated),
          isAssigned: data.isAssigned || false,
          assignedDriverId: data.assignedDriverId,
          sensorUptime: data.sensorUptime || 100,
          batteryLevel: data.batteryLevel || 100,
          signalStrength: data.signalStrength || 5,
          isOnline: data.isOnline !== undefined ? data.isOnline : true,
          lastMaintenance: this.safeDateConversion(data.lastMaintenance)
        });
      });
      
      return buckets;
    } catch (error) {
      console.error('Error getting user buckets:', error);
      throw new Error('Failed to fetch buckets');
    }
  }

  // NEW METHOD: Get all buckets from all users (for admin/reporting)
  async getAllBuckets(): Promise<TrashBucket[]> {
    try {
      const bucketsQuery = query(
        collection(db, 'buckets'),
        orderBy('lastUpdated', 'desc')
      );
      
      const querySnapshot = await getDocs(bucketsQuery);
      const buckets: TrashBucket[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        buckets.push({
          id: doc.id,
          name: data.name,
          bucketId: data.bucketId,
          userId: data.userId,
          fillPercentage: data.fillPercentage || 0,
          capacity: data.capacity || 0,
          location: data.location || '',
          createdAt: this.safeDateConversion(data.createdAt),
          lastUpdated: this.safeDateConversion(data.lastUpdated),
          isAssigned: data.isAssigned || false,
          assignedDriverId: data.assignedDriverId,
          sensorUptime: data.sensorUptime || 100,
          batteryLevel: data.batteryLevel || 100,
          signalStrength: data.signalStrength || 5,
          isOnline: data.isOnline !== undefined ? data.isOnline : true,
          lastMaintenance: this.safeDateConversion(data.lastMaintenance)
        });
      });
      
      return buckets;
    } catch (error) {
      console.error('Error getting all buckets:', error);
      throw new Error('Failed to fetch all buckets');
    }
  }

  // Check if bucket ID already exists
  async isBucketIdUnique(bucketId: string): Promise<boolean> {
    try {
      const bucketsQuery = query(
        collection(db, 'buckets'),
        where('bucketId', '==', bucketId)
      );
      
      const querySnapshot = await getDocs(bucketsQuery);
      return querySnapshot.empty;
    } catch (error) {
      console.error('Error checking bucket ID uniqueness:', error);
      throw new Error('Failed to check bucket ID');
    }
  }

  // Create new bucket with health metrics
  async createBucket(bucketData: Omit<TrashBucket, 'id'>): Promise<string> {
    try {
      // Validate bucket ID
      if (bucketData.bucketId.length !== 6 || !/^\d+$/.test(bucketData.bucketId)) {
        throw new Error('Bucket ID must be exactly 6 digits');
      }

      // Check if bucket ID is unique
      const isUnique = await this.isBucketIdUnique(bucketData.bucketId);
      if (!isUnique) {
        throw new Error('Bucket ID already exists');
      }

      const bucketRef = doc(collection(db, 'buckets'));
      
      // Generate initial health metrics
      const bucketWithHealthMetrics = {
        ...bucketData,
        sensorUptime: 100, // Start with perfect uptime
        batteryLevel: 100, // Start with full battery
        signalStrength: 5, // Start with excellent signal
        isOnline: true,
        lastMaintenance: Timestamp.fromDate(new Date()),
        createdAt: Timestamp.fromDate(bucketData.createdAt),
        lastUpdated: Timestamp.fromDate(bucketData.lastUpdated)
      };

      await setDoc(bucketRef, bucketWithHealthMetrics);
      return bucketRef.id;
    } catch (error) {
      console.error('Error creating bucket:', error);
      throw error;
    }
  }

  // Keep this method for backward compatibility with MyBucketsScreen
  async updateBucketFillPercentage(bucketId: string): Promise<number> {
    try {
      const bucketRef = doc(db, 'buckets', bucketId);
      const bucketDoc = await getDoc(bucketRef);
      
      if (!bucketDoc.exists()) {
        throw new Error('Bucket not found');
      }

      const currentData = bucketDoc.data();
      const currentFill = currentData.fillPercentage || 0;
      
      // Generate random increment between 5% and 20%, but don't exceed 100%
      const randomIncrement = Math.floor(Math.random() * 16) + 5;
      const newFill = Math.min(currentFill + randomIncrement, 100);
      
      await updateDoc(bucketRef, {
        fillPercentage: newFill,
        lastUpdated: Timestamp.fromDate(new Date())
      });

      return newFill;
    } catch (error) {
      console.error('Error updating bucket fill percentage:', error);
      throw new Error('Failed to update bucket');
    }
  }

  // Update bucket with random health degradation (for BucketReportScreen)
  async updateBucketHealth(bucketId: string): Promise<TrashBucket> {
    try {
      const bucketRef = doc(db, 'buckets', bucketId);
      const bucketDoc = await getDoc(bucketRef);
      
      if (!bucketDoc.exists()) {
        throw new Error('Bucket not found');
      }

      const currentData = bucketDoc.data();
      
      // Random health degradation
      const sensorUptime = Math.max(0, (currentData.sensorUptime || 100) - (Math.random() * 5));
      const batteryLevel = Math.max(0, (currentData.batteryLevel || 100) - (Math.random() * 3));
      const signalStrength = Math.max(1, Math.round((currentData.signalStrength || 5) - (Math.random() * 0.5)));
      const isOnline = Math.random() > 0.1; // 90% chance to stay online
      
      // Random fill percentage increase
      const currentFill = currentData.fillPercentage || 0;
      const randomIncrement = Math.floor(Math.random() * 16) + 5;
      const fillPercentage = Math.min(currentFill + randomIncrement, 100);

      const updateData = {
        fillPercentage,
        sensorUptime: Math.round(sensorUptime * 10) / 10,
        batteryLevel: Math.round(batteryLevel * 10) / 10,
        signalStrength,
        isOnline,
        lastUpdated: Timestamp.fromDate(new Date())
      };

      await updateDoc(bucketRef, updateData);

      return {
        id: bucketId,
        name: currentData.name,
        bucketId: currentData.bucketId,
        userId: currentData.userId,
        fillPercentage,
        capacity: currentData.capacity,
        location: currentData.location,
        createdAt: this.safeDateConversion(currentData.createdAt),
        lastUpdated: new Date(),
        isAssigned: currentData.isAssigned || false,
        assignedDriverId: currentData.assignedDriverId,
        sensorUptime: updateData.sensorUptime,
        batteryLevel: updateData.batteryLevel,
        signalStrength: updateData.signalStrength,
        isOnline: updateData.isOnline,
        lastMaintenance: this.safeDateConversion(currentData.lastMaintenance)
      };
    } catch (error) {
      console.error('Error updating bucket health:', error);
      throw new Error('Failed to update bucket health');
    }
  }

  // Assign driver to bucket
  async assignDriver(bucketId: string, driverId: string, driverName: string): Promise<void> {
    try {
      const bucketRef = doc(db, 'buckets', bucketId);
      const assignmentRef = doc(collection(db, 'assignedDrivers'));
      
      // Update bucket
      await updateDoc(bucketRef, {
        isAssigned: true,
        assignedDriverId: driverId
      });

      // Create assignment record
      const assignment = {
        bucketId,
        driverId,
        driverName,
        assignedAt: Timestamp.fromDate(new Date()),
        status: 'pending'
      };

      await setDoc(assignmentRef, assignment);
    } catch (error) {
      console.error('Error assigning driver:', error);
      throw new Error('Failed to assign driver');
    }
  }

  // Get available drivers
  async getAvailableDrivers(): Promise<User[]> {
    try {
      const usersQuery = query(
        collection(db, 'users'),
        where('accessLevel', '==', 2)
      );
      
      const querySnapshot = await getDocs(usersQuery);
      const drivers: User[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        
        drivers.push({
          uid: doc.id,
          email: data.email || '',
          displayName: data.displayName || '',
          phoneNumber: data.phoneNumber || '',
          accessLevel: data.accessLevel || 1,
          createdAt: this.safeDateConversion(data.createdAt)
        });
      });
      
      return drivers;
    } catch (error) {
      console.error('Error getting drivers:', error);
      throw new Error('Failed to fetch drivers');
    }
  }

  // Create technician request
  async createTechnicianRequest(requestData: Omit<TechnicianRequest, 'id'>): Promise<string> {
    try {
      const requestRef = doc(collection(db, 'technicianRequests'));
      
      const requestWithTimestamp = {
        ...requestData,
        createdAt: Timestamp.fromDate(requestData.createdAt),
        updatedAt: Timestamp.fromDate(requestData.updatedAt)
      };

      await setDoc(requestRef, requestWithTimestamp);
      return requestRef.id;
    } catch (error) {
      console.error('Error creating technician request:', error);
      throw new Error('Failed to create technician request');
    }
  }

  // Get all technician requests (for admin)
  async getAllTechnicianRequests(): Promise<TechnicianRequest[]> {
    try {
      const requestsQuery = query(
        collection(db, 'technicianRequests'),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(requestsQuery);
      const requests: TechnicianRequest[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        requests.push({
          id: doc.id,
          bucketId: data.bucketId,
          bucketName: data.bucketName,
          userId: data.userId,
          userName: data.userName,
          issueType: data.issueType,
          description: data.description,
          priority: data.priority,
          status: data.status,
          createdAt: this.safeDateConversion(data.createdAt),
          updatedAt: this.safeDateConversion(data.updatedAt)
        });
      });
      
      return requests;
    } catch (error) {
      console.error('Error getting technician requests:', error);
      throw new Error('Failed to fetch technician requests');
    }
  }

  // Update technician request status
  async updateTechnicianRequestStatus(requestId: string, status: TechnicianRequest['status']): Promise<void> {
    try {
      const requestRef = doc(db, 'technicianRequests', requestId);
      await updateDoc(requestRef, {
        status,
        updatedAt: Timestamp.fromDate(new Date())
      });
    } catch (error) {
      console.error('Error updating technician request:', error);
      throw new Error('Failed to update technician request');
    }
  }

  // Delete bucket
  async deleteBucket(bucketId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'buckets', bucketId));
    } catch (error) {
      console.error('Error deleting bucket:', error);
      throw new Error('Failed to delete bucket');
    }
  }
}