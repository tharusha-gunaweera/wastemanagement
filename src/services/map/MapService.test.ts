// MOCK EXPO MODULES FIRST
jest.mock('expo-constants', () => ({}));
jest.mock('expo-location', () => ({}));
jest.mock('expo-font', () => ({}));
jest.mock('expo', () => ({}));

// MOCK FIREBASE MODULES
jest.mock('../../config/FirebaseConfig', () => ({
  db: {},
}));
jest.mock('firebase/auth', () => ({
  getReactNativePersistence: jest.fn(),
  initializeAuth: jest.fn(),
}));
jest.mock('firebase/app', () => ({}));
jest.mock('@react-native-async-storage/async-storage', () => ({}));

// MOCK REACT NATIVE MODULES
jest.mock('react-native', () => ({}));
jest.mock('react-native-gesture-handler', () => ({}));

// MOCK FIREBASE/FIRESTORE
const mockCollection = jest.fn();
const mockDoc = jest.fn();
const mockSetDoc = jest.fn();
const mockGetDocs = jest.fn();
const mockUpdateDoc = jest.fn();
const mockDeleteDoc = jest.fn();
const mockQuery = jest.fn();
const mockWhere = jest.fn();
const mockOrderBy = jest.fn();
const mockGetDoc = jest.fn();

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  collection: mockCollection,
  doc: mockDoc,
  setDoc: mockSetDoc,
  getDocs: mockGetDocs,
  updateDoc: mockUpdateDoc,
  deleteDoc: mockDeleteDoc,
  query: mockQuery,
  where: mockWhere,
  orderBy: mockOrderBy,
  getDoc: mockGetDoc,
  Timestamp: {
    fromDate: jest.fn((date) => date),
  },
}));

// NOW IMPORT EVERYTHING ELSE
import { MapService } from './MapService';

// COMPLETE console suppression
beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'info').mockImplementation(() => {});
  jest.spyOn(console, 'debug').mockImplementation(() => {});
});

afterAll(() => {
  jest.restoreAllMocks();
});

describe('MapService - Driver Map System', () => {
  let mapService: MapService;

  beforeEach(() => {
    // Clear singleton instance and get fresh instance
    (MapService as any).instance = null;
    mapService = MapService.getInstance();
    
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup default mocks
    mockSetDoc.mockResolvedValue(undefined);
    mockUpdateDoc.mockResolvedValue(undefined);
    mockDeleteDoc.mockResolvedValue(undefined);
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = MapService.getInstance();
      const instance2 = MapService.getInstance();
      
      expect(instance1).toBe(instance2);
    });
  });

  describe('getAllBinLocations', () => {
    it('should return all bin locations with correct status', async () => {
      // Arrange
      const mockBuckets = [
        {
          id: 'bucket1',
          data: () => ({
            name: 'Bin 1',
            bucketId: '123456',
            latitude: 6.9271,
            longitude: 79.8612,
            fillPercentage: 20,
            location: 'Location 1',
            lastUpdated: new Date()
          })
        },
        {
          id: 'bucket2',
          data: () => ({
            name: 'Bin 2',
            bucketId: '123457',
            latitude: 6.9272,
            longitude: 79.8613,
            fillPercentage: 80,
            location: 'Location 2',
            lastUpdated: new Date()
          })
        }
      ];

      const mockQuerySnapshot = {
        forEach: (callback: any) => mockBuckets.forEach(callback)
      };

      // Mock the entire query chain
      mockCollection.mockReturnValue({});
      mockOrderBy.mockReturnValue({});
      mockQuery.mockReturnValue(mockQuerySnapshot);
      mockGetDocs.mockResolvedValue(mockQuerySnapshot);

      // Act
      const locations = await mapService.getAllBinLocations();

      // Assert
      expect(locations).toHaveLength(2);
      expect(locations[0].status).toBe('low');
      expect(locations[1].status).toBe('full');
      expect(mockCollection).toHaveBeenCalledWith({}, 'buckets');
      expect(mockOrderBy).toHaveBeenCalledWith('lastUpdated', 'desc');
    });

    it('should handle empty bin locations', async () => {
      // Arrange
      const mockQuerySnapshot = {
        forEach: (callback: any) => {} // No buckets
      };

      // Mock the entire query chain
      mockCollection.mockReturnValue({});
      mockOrderBy.mockReturnValue({});
      mockQuery.mockReturnValue(mockQuerySnapshot);
      mockGetDocs.mockResolvedValue(mockQuerySnapshot);

      // Act
      const locations = await mapService.getAllBinLocations();

      // Assert
      expect(locations).toHaveLength(0);
    });

    it('should handle buckets without location data', async () => {
      // Arrange
      const mockBuckets = [
        {
          id: 'bucket1',
          data: () => ({
            name: 'Bin 1',
            bucketId: '123456',
            // Missing latitude and longitude
            fillPercentage: 50,
            location: 'Location 1',
            lastUpdated: new Date()
          })
        }
      ];

      const mockQuerySnapshot = {
        forEach: (callback: any) => mockBuckets.forEach(callback)
      };

      // Mock the entire query chain
      mockCollection.mockReturnValue({});
      mockOrderBy.mockReturnValue({});
      mockQuery.mockReturnValue(mockQuerySnapshot);
      mockGetDocs.mockResolvedValue(mockQuerySnapshot);

      // Act
      const locations = await mapService.getAllBinLocations();

      // Assert
      expect(locations).toHaveLength(0); // Should filter out buckets without location
    });

    it('should handle errors when fetching bin locations', async () => {
      // Arrange
      mockGetDocs.mockRejectedValue(new Error('Database error'));
      mockCollection.mockReturnValue({});
      mockOrderBy.mockReturnValue({});
      mockQuery.mockReturnValue({});

      // Act & Assert
      await expect(mapService.getAllBinLocations())
        .rejects.toThrow('Failed to fetch bin locations');
    });
  });

  describe('markBinAsCollected', () => {
    it('should reset bin fill percentage after collection', async () => {
      // Arrange
      const bucketId = 'bucket123';
      const mockUpdateDocFn = jest.fn().mockResolvedValue(undefined);

      // Mock updateDoc directly - this is what the service actually calls
      mockUpdateDoc.mockImplementation(mockUpdateDocFn);

      // Mock doc to return a document reference
      const mockDocRef = {};
      mockDoc.mockReturnValue(mockDocRef);

      // Act
      await mapService.markBinAsCollected(bucketId);

      // Assert - Check that updateDoc was called with correct parameters
      expect(mockUpdateDoc).toHaveBeenCalledWith(mockDocRef, {
        fillPercentage: 0,
        lastUpdated: expect.any(Object)
      });
      expect(mockDoc).toHaveBeenCalledWith({}, 'buckets', bucketId);
    });

    it('should handle errors during bin collection', async () => {
      // Arrange
      const bucketId = 'bucket123';

      // Mock updateDoc to throw error directly
      mockUpdateDoc.mockRejectedValue(new Error('Update failed'));

      // Mock doc to return a document reference
      mockDoc.mockReturnValue({});

      // Act & Assert
      await expect(mapService.markBinAsCollected(bucketId))
        .rejects.toThrow('Failed to mark bin as collected');
    });
  });

  describe('collection requests', () => {
    it('should create collection request successfully', async () => {
      // Arrange
      const requestData = {
        bucketId: 'bucket123',
        bucketName: 'Test Bin',
        driverId: 'driver123',
        driverName: 'Test Driver',
        location: {
          latitude: 6.9271,
          longitude: 79.8612,
          address: '123 Main Street, Colombo'
        },
        status: 'pending' as const,
        requestedAt: new Date()
      };

      // Mock document reference
      const mockDocRef = { id: 'request-123' };
      mockDoc.mockReturnValue(mockDocRef);

      // Mock collection to return proper structure
      const mockCollectionRef = { doc: mockDoc };
      mockCollection.mockReturnValue(mockCollectionRef);

      // Act
      const result = await mapService.createCollectionRequest(requestData);

      // Assert
      expect(result).toBe('request-123');
      expect(mockCollection).toHaveBeenCalledWith({}, 'collectionRequests');
      expect(mockSetDoc).toHaveBeenCalled();
    });

    it('should handle collection request creation errors', async () => {
      // Arrange
      const requestData = {
        bucketId: 'bucket123',
        bucketName: 'Test Bin',
        driverId: 'driver123',
        driverName: 'Test Driver',
        location: {
          latitude: 6.9271,
          longitude: 79.8612,
          address: '123 Main Street, Colombo'
        },
        status: 'pending' as const,
        requestedAt: new Date()
      };

      // Mock setDoc to throw error
      mockSetDoc.mockRejectedValue(new Error('Firestore error'));
      mockCollection.mockReturnValue({
        doc: () => ({ id: 'request-123' })
      });

      // Act & Assert
      await expect(mapService.createCollectionRequest(requestData))
        .rejects.toThrow('Failed to create collection request');
    });
  });

  describe('getDriverCollectionRequests', () => {
    it('should return driver collection requests', async () => {
      // Arrange
      const driverId = 'driver123';
      const mockRequests = [
        {
          id: 'request1',
          data: () => ({
            bucketId: 'bucket123',
            bucketName: 'Test Bin',
            driverId: driverId,
            driverName: 'Test Driver',
            location: {
              latitude: 6.9271,
              longitude: 79.8612,
              address: '123 Main Street, Colombo'
            },
            status: 'pending',
            requestedAt: new Date()
          })
        }
      ];

      const mockQuerySnapshot = {
        forEach: (callback: any) => mockRequests.forEach(callback)
      };

      // Mock the query chain
      mockCollection.mockReturnValue({});
      mockWhere.mockReturnValue({});
      mockOrderBy.mockReturnValue({});
      mockQuery.mockReturnValue(mockQuerySnapshot);
      mockGetDocs.mockResolvedValue(mockQuerySnapshot);

      // Act
      const requests = await mapService.getDriverCollectionRequests(driverId);

      // Assert
      expect(requests).toHaveLength(1);
      expect(requests[0].driverId).toBe(driverId);
      expect(mockWhere).toHaveBeenCalledWith('driverId', '==', driverId);
    });

    it('should handle errors when fetching driver requests', async () => {
      // Arrange
      const driverId = 'driver123';
      
      mockGetDocs.mockRejectedValue(new Error('Database error'));
      mockCollection.mockReturnValue({});
      mockWhere.mockReturnValue({});
      mockOrderBy.mockReturnValue({});
      mockQuery.mockReturnValue({});

      // Act & Assert
      await expect(mapService.getDriverCollectionRequests(driverId))
        .rejects.toThrow('Failed to fetch collection requests');
    });
  });

  describe('updateCollectionRequestStatus', () => {
    it('should update collection request status to completed', async () => {
      // Arrange
      const requestId = 'request123';
      const status = 'completed';
      const mockUpdateDocFn = jest.fn().mockResolvedValue(undefined);

      mockUpdateDoc.mockImplementation(mockUpdateDocFn);
      mockDoc.mockReturnValue({});

      // Act
      await mapService.updateCollectionRequestStatus(requestId, status);

      // Assert
      expect(mockUpdateDoc).toHaveBeenCalledWith(
        {},
        {
          status: 'completed',
          collectedAt: expect.any(Object)
        }
      );
      expect(mockDoc).toHaveBeenCalledWith({}, 'collectionRequests', requestId);
    });

    it('should update collection request status to pending without collectedAt', async () => {
      // Arrange
      const requestId = 'request123';
      const status = 'pending';
      const mockUpdateDocFn = jest.fn().mockResolvedValue(undefined);

      mockUpdateDoc.mockImplementation(mockUpdateDocFn);
      mockDoc.mockReturnValue({});

      // Act
      await mapService.updateCollectionRequestStatus(requestId, status);

      // Assert
      expect(mockUpdateDoc).toHaveBeenCalledWith(
        {},
        { status: 'pending' }
      );
    });

    it('should handle errors when updating collection request', async () => {
      // Arrange
      const requestId = 'request123';
      const status = 'completed';

      mockUpdateDoc.mockRejectedValue(new Error('Update failed'));
      mockDoc.mockReturnValue({});

      // Act & Assert
      await expect(mapService.updateCollectionRequestStatus(requestId, status))
        .rejects.toThrow('Failed to update collection request');
    });
  });
});