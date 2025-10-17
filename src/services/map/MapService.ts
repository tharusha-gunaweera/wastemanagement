import { collection, doc, getDocs, orderBy, query, setDoc, Timestamp, updateDoc, where } from 'firebase/firestore';
import { db } from '../../config/FirebaseConfig';
import { BinLocation, CollectionRequest } from '../../models/User';

export class MapService {
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

  // Get all bin locations for the map
  async getAllBinLocations(): Promise<BinLocation[]> {
    try {
      const bucketsQuery = query(
        collection(db, 'buckets'),
        orderBy('lastUpdated', 'desc')
      );
      
      const querySnapshot = await getDocs(bucketsQuery);
      const binLocations: BinLocation[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        
        // Only include buckets that have location data
        if (data.location && data.latitude && data.longitude) {
          const fillPercentage = data.fillPercentage || 0;
          let status: 'empty' | 'low' | 'medium' | 'full';
          
          if (fillPercentage === 0) status = 'empty';
          else if (fillPercentage < 30) status = 'low';
          else if (fillPercentage < 70) status = 'medium';
          else status = 'full';
          
          binLocations.push({
            id: doc.id,
            bucketId: data.bucketId,
            name: data.name,
            latitude: data.latitude,
            longitude: data.longitude,
            fillPercentage: fillPercentage,
            status: status,
            lastUpdated: this.safeDateConversion(data.lastUpdated),
            address: data.address || data.location
          });
        }
      });
      
      return binLocations;
    } catch (error) {
      console.error('Error getting bin locations:', error);
      throw new Error('Failed to fetch bin locations');
    }
  }

  // Create collection request
  async createCollectionRequest(requestData: Omit<CollectionRequest, 'id'>): Promise<string> {
    try {
      const requestRef = doc(collection(db, 'collectionRequests'));
      
      const requestWithTimestamp = {
        ...requestData,
        requestedAt: Timestamp.fromDate(requestData.requestedAt),
        collectedAt: requestData.collectedAt ? Timestamp.fromDate(requestData.collectedAt) : null
      };

      await setDoc(requestRef, requestWithTimestamp);
      return requestRef.id;
    } catch (error) {
      console.error('Error creating collection request:', error);
      throw new Error('Failed to create collection request');
    }
  }

  // Mark bin as collected (reset fill percentage to 0)
  async markBinAsCollected(bucketId: string): Promise<void> {
    try {
      const bucketRef = doc(db, 'buckets', bucketId);
      
      await updateDoc(bucketRef, {
        fillPercentage: 0,
        lastUpdated: Timestamp.fromDate(new Date())
      });
    } catch (error) {
      console.error('Error marking bin as collected:', error);
      throw new Error('Failed to mark bin as collected');
    }
  }

  // Get collection requests for driver
  async getDriverCollectionRequests(driverId: string): Promise<CollectionRequest[]> {
    try {
      const requestsQuery = query(
        collection(db, 'collectionRequests'),
        where('driverId', '==', driverId),
        orderBy('requestedAt', 'desc')
      );
      
      const querySnapshot = await getDocs(requestsQuery);
      const requests: CollectionRequest[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        requests.push({
          id: doc.id,
          bucketId: data.bucketId,
          bucketName: data.bucketName,
          driverId: data.driverId,
          driverName: data.driverName,
          location: data.location,
          status: data.status,
          requestedAt: this.safeDateConversion(data.requestedAt),
          collectedAt: data.collectedAt ? this.safeDateConversion(data.collectedAt) : undefined
        });
      });
      
      return requests;
    } catch (error) {
      console.error('Error getting collection requests:', error);
      throw new Error('Failed to fetch collection requests');
    }
  }

  // Update collection request status
  async updateCollectionRequestStatus(requestId: string, status: CollectionRequest['status']): Promise<void> {
    try {
      const requestRef = doc(db, 'collectionRequests', requestId);
      const updateData: any = { status };
      
      if (status === 'completed') {
        updateData.collectedAt = Timestamp.fromDate(new Date());
      }
      
      await updateDoc(requestRef, updateData);
    } catch (error) {
      console.error('Error updating collection request:', error);
      throw new Error('Failed to update collection request');
    }
  }
}