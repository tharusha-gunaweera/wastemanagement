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

export class TrashService {
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
      
      // Update bucket fill percentage
      await this.updateBucketFillPercentage(trashData.bucketId);
      
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
      
      const stats: TrashStats = {
        totalTrash: trashItems.length,
        organic: trashItems.filter(item => item.trashType === 'organic').length,
        recyclable: trashItems.filter(item => item.trashType === 'recyclable').length,
        nonRecyclable: trashItems.filter(item => item.trashType === 'non-recyclable').length,
        lastUpdated: new Date()
      };
      
      return stats;
    } catch (error) {
      console.error('Error getting trash stats:', error);
      throw new Error('Failed to fetch trash statistics');
    }
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