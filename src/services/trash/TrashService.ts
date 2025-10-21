import { db } from '../../config/FirebaseConfig';
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  updateDoc, 
  query, 
  where, 
  orderBy,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';
import { TrashItem, TrashStats } from '../../models/User';
import { TrashObserver } from './TrashObserver';

export class TrashService {
  // Singleton instance
  private static instance: TrashService;

  // Observer pattern
  private observers: TrashObserver[] = [];

  // Private constructor to prevent direct construction
  private constructor() {
    // Initialization code if needed
  }

  // Static method to get the singleton instance
  public static getInstance(): TrashService {
    if (!TrashService.instance) {
      TrashService.instance = new TrashService();
    }
    return TrashService.instance;
  }

  // Observer management methods
  public addObserver(observer: TrashObserver): void {
    if (!this.observers.includes(observer)) {
      this.observers.push(observer);
      console.log('TrashObserver added. Total observers:', this.observers.length);
    }
  }

  public removeObserver(observer: TrashObserver): void {
    this.observers = this.observers.filter(obs => obs !== observer);
    console.log('TrashObserver removed. Total observers:', this.observers.length);
  }

  public removeAllObservers(): void {
    this.observers = [];
    console.log('All TrashObservers removed');
  }

  // Notification methods
  private notifyTrashAdded(trashItem: TrashItem): void {
    console.log('Notifying observers about new trash item:', trashItem.id);
    this.observers.forEach(observer => {
      try {
        observer.onTrashAdded(trashItem);
      } catch (error) {
        console.error('Error notifying observer onTrashAdded:', error);
      }
    });
  }

  private notifyTrashDeleted(trashId: string): void {
    console.log('Notifying observers about deleted trash item:', trashId);
    this.observers.forEach(observer => {
      try {
        observer.onTrashDeleted(trashId);
      } catch (error) {
        console.error('Error notifying observer onTrashDeleted:', error);
      }
    });
  }

  private notifyTrashStatsUpdated(stats: TrashStats): void {
    console.log('Notifying observers about updated trash stats');
    this.observers.forEach(observer => {
      try {
        observer.onTrashStatsUpdated(stats);
      } catch (error) {
        console.error('Error notifying observer onTrashStatsUpdated:', error);
      }
    });
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

  // Add trash item to a bucket
  async addTrashToBucket(trashData: Omit<TrashItem, 'id'>): Promise<string> {
    try {
      const trashRef = doc(collection(db, 'trashes'));
      
      const trashWithTimestamp = {
        ...trashData,
        createdAt: serverTimestamp(),
      };

      await setDoc(trashRef, trashWithTimestamp);
      
      // Create the complete trash item for notification
      const trashItem: TrashItem = {
        ...trashData,
        id: trashRef.id,
        createdAt: trashData.createdAt, // Use original date since serverTimestamp is pending
      };

      // Update bucket fill percentage
      await this.updateBucketFillPercentage(trashData.bucketId);
      
      // Notify observers
      this.notifyTrashAdded(trashItem);
      
      return trashRef.id;
    } catch (error) {
      console.error('Error adding trash:', error);
      throw new Error('Failed to add trash');
    }
  }

  // Get all trash items for a user
  async getUserTrashItems(userId: string): Promise<TrashItem[]> {
    try {
      const trashQuery = query(
        collection(db, 'trashes'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(trashQuery);
      const trashItems: TrashItem[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        trashItems.push({
          id: doc.id,
          bucketId: data.bucketId,
          bucketName: data.bucketName,
          userId: data.userId,
          userName: data.userName,
          trashType: data.trashType,
          weight: data.weight || 0,
          description: data.description || '',
          createdAt: this.safeDateConversion(data.createdAt),
          status: data.status || 'added'
        });
      });
      
      return trashItems;
    } catch (error) {
      console.error('Error getting user trash items:', error);
      throw new Error('Failed to fetch trash items');
    }
  }

  // Get trash items for a specific bucket
  async getBucketTrashItems(bucketId: string): Promise<TrashItem[]> {
    try {
      const trashQuery = query(
        collection(db, 'trashes'),
        where('bucketId', '==', bucketId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(trashQuery);
      const trashItems: TrashItem[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        trashItems.push({
          id: doc.id,
          bucketId: data.bucketId,
          bucketName: data.bucketName,
          userId: data.userId,
          userName: data.userName,
          trashType: data.trashType,
          weight: data.weight || 0,
          description: data.description || '',
          createdAt: this.safeDateConversion(data.createdAt),
          status: data.status || 'added'
        });
      });
      
      return trashItems;
    } catch (error) {
      console.error('Error getting bucket trash items:', error);
      throw new Error('Failed to fetch bucket trash items');
    }
  }

  // Get user trash statistics
  async getUserTrashStats(userId: string): Promise<TrashStats> {
    try {
      const trashItems = await this.getUserTrashItems(userId);
      const stats = this.calculateStats(trashItems);
      
      // Notify observers about stats update
      this.notifyTrashStatsUpdated(stats);
      
      return stats;
    } catch (error) {
      console.error('Error getting trash stats:', error);
      throw new Error('Failed to fetch trash statistics');
    }
  }

  // Helper method to calculate statistics
  private calculateStats(trashItems: TrashItem[]): TrashStats {
    return {
      totalTrash: trashItems.length,
      organic: trashItems.filter(item => item.trashType === 'organic').length,
      recyclable: trashItems.filter(item => item.trashType === 'recyclable').length,
      nonRecyclable: trashItems.filter(item => item.trashType === 'non-recyclable').length,
      lastUpdated: new Date()
    };
  }

  // Update bucket fill percentage when trash is added
  private async updateBucketFillPercentage(bucketId: string): Promise<void> {
    try {
      const trashItems = await this.getBucketTrashItems(bucketId);
      const recentTrashCount = trashItems.filter(item => {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        return item.createdAt > oneWeekAgo;
      }).length;

      // Increase fill percentage based on recent trash count (max 100%)
      const newFillPercentage = Math.min(100, recentTrashCount * 5);
      
      await updateDoc(doc(db, 'buckets', bucketId), {
        fillPercentage: newFillPercentage,
        lastUpdated: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating bucket fill percentage:', error);
    }
  }

  // Delete trash item
  async deleteTrashItem(trashId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'trashes', trashId));
      
      // Notify observers
      this.notifyTrashDeleted(trashId);
    } catch (error) {
      console.error('Error deleting trash item:', error);
      throw new Error('Failed to delete trash item');
    }
  }

  // Get trash type icon
  getTrashTypeIcon(trashType: string): string {
    switch (trashType) {
      case 'organic':
        return '🍎';
      case 'recyclable':
        return '♻️';
      case 'non-recyclable':
        return '🚫';
      default:
        return '🗑️';
    }
  }

  // Get trash type color
  getTrashTypeColor(trashType: string): string {
    switch (trashType) {
      case 'organic':
        return '#4CAF50'; // Green
      case 'recyclable':
        return '#2196F3'; // Blue
      case 'non-recyclable':
        return '#F44336'; // Red
      default:
        return '#9E9E9E'; // Gray
    }
  }

  // Get trash type name
  getTrashTypeName(trashType: string): string {
    switch (trashType) {
      case 'organic':
        return 'Organic Waste';
      case 'recyclable':
        return 'Recyclable';
      case 'non-recyclable':
        return 'Non-Recyclable';
      default:
        return 'Unknown';
    }
  }
}

export default TrashService;