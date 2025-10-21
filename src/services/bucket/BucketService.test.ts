// MOCK EXPO MODULES FIRST
jest.mock('expo-constants', () => ({}));
jest.mock('expo-location', () => ({}));
jest.mock('expo-font', () => ({}));
jest.mock('expo', () => ({}));

// MOCK FIREBASE MODULES
jest.mock('../../config/FirebaseConfig', () => ({
  db: {},
}));
jest.mock('firebase/auth', () => ({}));
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
import { BucketService } from './BucketService';

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

describe('BucketService - Bucket Creation & Driver Assignment', () => {
  let bucketService: BucketService;

  beforeEach(() => {
    // Clear singleton instance and get fresh instance
    (BucketService as any).instance = null;
    bucketService = BucketService.getInstance();
    
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup default mocks
    mockSetDoc.mockResolvedValue(undefined);
    mockUpdateDoc.mockResolvedValue(undefined);
    mockDeleteDoc.mockResolvedValue(undefined);
  });

  describe('getAllBuckets', () => {
    it('should return all buckets from all users', async () => {
      // Arrange
      const mockBuckets = [
        {
          id: 'bucket1',
          name: 'Test Bucket 1',
          bucketId: '123456',
          userId: 'user1',
          fillPercentage: 50,
          capacity: 100,
          location: 'Location 1',
          createdAt: new Date(),
          lastUpdated: new Date(),
          isAssigned: false,
          sensorUptime: 95,
          batteryLevel: 80,
          signalStrength: 4,
          isOnline: true,
          lastMaintenance: new Date()
        },
        {
          id: 'bucket2',
          name: 'Test Bucket 2',
          bucketId: '654321',
          userId: 'user2',
          fillPercentage: 30,
          capacity: 100,
          location: 'Location 2',
          createdAt: new Date(),
          lastUpdated: new Date(),
          isAssigned: false,
          sensorUptime: 98,
          batteryLevel: 60,
          signalStrength: 5,
          isOnline: true,
          lastMaintenance: new Date()
        }
      ];

      // Mock Firestore query to return all buckets
      mockGetDocs.mockResolvedValue({
        forEach: (callback: any) => mockBuckets.forEach(bucket => callback({
          id: bucket.id,
          data: () => bucket
        }))
      });

      // Mock the query chain properly
      const mockQueryResult = {};
      mockQuery.mockReturnValue(mockQueryResult);
      mockOrderBy.mockReturnValue(mockQueryResult);

      // Mock collection to return a queryable object
      const mockCollectionRef = {};
      mockCollection.mockReturnValue(mockCollectionRef);

      // Act
      const result = await bucketService.getAllBuckets();

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Test Bucket 1');
      expect(result[1].name).toBe('Test Bucket 2');
      
      // Verify the query was built correctly
      expect(mockCollection).toHaveBeenCalledWith({}, 'buckets');
      expect(mockOrderBy).toHaveBeenCalledWith('lastUpdated', 'desc');
      expect(mockQuery).toHaveBeenCalledWith(mockCollectionRef, mockQueryResult);
    });

    it('should handle errors when fetching all buckets', async () => {
      // Arrange
      mockGetDocs.mockRejectedValue(new Error('Database error'));
      
      // Mock the query chain
      const mockQueryResult = {};
      mockQuery.mockReturnValue(mockQueryResult);
      mockOrderBy.mockReturnValue(mockQueryResult);
      mockCollection.mockReturnValue({});

      // Act & Assert
      await expect(bucketService.getAllBuckets())
        .rejects.toThrow('Failed to fetch all buckets');
    });

    it('should return empty array when no buckets exist', async () => {
      // Arrange
      mockGetDocs.mockResolvedValue({
        forEach: (callback: any) => [] // No buckets
      });
      
      // Mock the query chain
      const mockQueryResult = {};
      mockQuery.mockReturnValue(mockQueryResult);
      mockOrderBy.mockReturnValue(mockQueryResult);
      mockCollection.mockReturnValue({});

      // Act
      const result = await bucketService.getAllBuckets();

      // Assert
      expect(result).toHaveLength(0);
    });
  });

  describe('createBucket', () => {
    it('should create bucket with valid data', async () => {
      // Arrange
      const bucketData = {
        name: 'Test Bucket',
        bucketId: '123456',
        userId: 'user123',
        fillPercentage: 0,
        capacity: 100,
        location: 'Test Location',
        createdAt: new Date(),
        lastUpdated: new Date(),
        isAssigned: false,
        sensorUptime: 100,
        batteryLevel: 100,
        signalStrength: 5,
        isOnline: true,
        lastMaintenance: new Date()
      };

      // Mock the document reference with an ID
      const mockDocRef = { id: 'mock-bucket-id-123' };
      mockDoc.mockReturnValue(mockDocRef);

      // Mock collection to return proper structure
      const mockCollectionRef = { doc: mockDoc };
      mockCollection.mockReturnValue(mockCollectionRef);

      // Mock isBucketIdUnique to return true
      jest.spyOn(bucketService, 'isBucketIdUnique').mockResolvedValue(true);

      // Act
      const result = await bucketService.createBucket(bucketData);

      // Assert - Check that collection was called with correct arguments
      const collectionCalls = mockCollection.mock.calls;
      const hasBucketsCall = collectionCalls.some((call: any[]) => 
        call.includes('buckets')
      );
      expect(hasBucketsCall).toBe(true);
      expect(mockDoc).toHaveBeenCalled();
      expect(mockSetDoc).toHaveBeenCalled();
      expect(result).toBe('mock-bucket-id-123');
    });

    it('should reject bucket with duplicate ID', async () => {
      // Arrange
      const bucketData = {
        name: 'Test Bucket',
        bucketId: '123456',
        userId: 'user123',
        fillPercentage: 0,
        capacity: 100,
        location: 'Test Location',
        createdAt: new Date(),
        lastUpdated: new Date(),
        isAssigned: false,
        sensorUptime: 100,
        batteryLevel: 100,
        signalStrength: 5,
        isOnline: true,
        lastMaintenance: new Date()
      };

      // Mock isBucketIdUnique to return false (duplicate)
      jest.spyOn(bucketService, 'isBucketIdUnique').mockResolvedValue(false);

      // Act & Assert
      await expect(bucketService.createBucket(bucketData))
        .rejects.toThrow('Bucket ID already exists');
    });

    it('should reject invalid bucket ID format', async () => {
      // Arrange
      const bucketData = {
        name: 'Test Bucket',
        bucketId: '123', // Too short
        userId: 'user123',
        fillPercentage: 0,
        capacity: 100,
        location: 'Test Location',
        createdAt: new Date(),
        lastUpdated: new Date(),
        isAssigned: false,
        sensorUptime: 100,
        batteryLevel: 100,
        signalStrength: 5,
        isOnline: true,
        lastMaintenance: new Date()
      };

      // Act & Assert
      await expect(bucketService.createBucket(bucketData))
        .rejects.toThrow('Bucket ID must be exactly 6 digits');
    });

    it('should reject non-numeric bucket ID', async () => {
      // Arrange
      const bucketData = {
        name: 'Test Bucket',
        bucketId: 'ABC123', // Contains letters
        userId: 'user123',
        fillPercentage: 0,
        capacity: 100,
        location: 'Test Location',
        createdAt: new Date(),
        lastUpdated: new Date(),
        isAssigned: false,
        sensorUptime: 100,
        batteryLevel: 100,
        signalStrength: 5,
        isOnline: true,
        lastMaintenance: new Date()
      };

      // Act & Assert
      await expect(bucketService.createBucket(bucketData))
        .rejects.toThrow('Bucket ID must be exactly 6 digits');
    });
  });

  describe('assignDriver', () => {
    it('should successfully assign driver to bucket', async () => {
      // Arrange
      const bucketId = 'bucket123';
      const driverId = 'driver123';
      const driverName = 'Test Driver';

      // Track ALL Firebase calls
      const firebaseCalls: any[] = [];
      
      // Mock bucket document update
      const mockUpdateDocFn = jest.fn().mockResolvedValue(undefined);
      
      // Mock assignedDrivers document
      const mockSetDocFn = jest.fn().mockResolvedValue(undefined);

      // Mock doc function to track calls
      mockDoc.mockImplementation((dbInstance: any, collectionPath: string, docId?: string) => {
        firebaseCalls.push({ type: 'doc', collectionPath, docId });
        
        if (collectionPath === 'buckets' && docId === bucketId) {
          return { update: mockUpdateDocFn };
        }
        if (collectionPath === 'assignedDrivers' && !docId) {
          return { id: 'assignment-123', set: mockSetDocFn };
        }
        return { update: jest.fn(), set: jest.fn() };
      });

      // Mock collection to track calls
      mockCollection.mockImplementation((dbInstance: any, collectionName: string) => {
        firebaseCalls.push({ type: 'collection', collectionName });
        
        if (collectionName === 'assignedDrivers') {
          return {
            doc: () => ({ id: 'assignment-123', set: mockSetDocFn })
          };
        }
        return { doc: jest.fn() };
      });

      // Mock updateDoc for bucket update
      mockUpdateDoc.mockImplementation(mockUpdateDocFn);

      // Mock setDoc for assignment creation
      mockSetDoc.mockImplementation(mockSetDocFn);

      // Act
      await bucketService.assignDriver(bucketId, driverId, driverName);

      // Assert - Check that the correct Firebase operations were performed
      const hasBucketDocCall = firebaseCalls.some((call: any) => 
        call.type === 'doc' && call.collectionPath === 'buckets' && call.docId === bucketId
      );
      const hasAssignedDriversCollectionCall = firebaseCalls.some((call: any) => 
        call.type === 'collection' && call.collectionName === 'assignedDrivers'
      );
      
      expect(hasBucketDocCall).toBe(true);
      expect(hasAssignedDriversCollectionCall).toBe(true);
      expect(mockUpdateDocFn).toHaveBeenCalled();
      expect(mockSetDocFn).toHaveBeenCalled();
    });
  });

  describe('bucket health monitoring', () => {
    it('should update bucket health metrics correctly', async () => {
      // Arrange
      const bucketId = 'bucket123';
      const mockBucketData = {
        name: 'Test Bucket',
        bucketId: '123456',
        userId: 'user123',
        fillPercentage: 50,
        capacity: 100,
        location: 'Test Location',
        createdAt: new Date(),
        isAssigned: false,
        sensorUptime: 100,
        batteryLevel: 100,
        signalStrength: 5,
        isOnline: true,
        lastMaintenance: new Date()
      };

      // Mock getDoc to return existing bucket
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockBucketData
      });

      // Mock updateDoc
      const mockUpdateDocFn = jest.fn().mockResolvedValue(undefined);
      mockUpdateDoc.mockImplementation(mockUpdateDocFn);

      // Mock doc to return a document reference
      const mockDocRef = {
        get: mockGetDoc
      };
      mockDoc.mockReturnValue(mockDocRef);

      // Act
      const result = await bucketService.updateBucketHealth(bucketId);

      // Assert
      const docCalls = mockDoc.mock.calls;
      const hasBucketCall = docCalls.some((call: any[]) => 
        call.includes('buckets') && call.includes(bucketId)
      );
      expect(hasBucketCall).toBe(true);
      expect(mockUpdateDoc).toHaveBeenCalled();
      expect(result.fillPercentage).toBeGreaterThanOrEqual(50);
      expect(result.fillPercentage).toBeLessThanOrEqual(100);
    });

    it('should throw error when bucket not found during health update', async () => {
      // Arrange
      const bucketId = 'non-existent-bucket';
      
      // Mock getDoc to return non-existent bucket
      mockGetDoc.mockResolvedValue({
        exists: () => false,
        data: () => null
      });

      mockDoc.mockReturnValue({
        get: mockGetDoc
      });

      // Act & Assert
      await expect(bucketService.updateBucketHealth(bucketId))
        .rejects.toThrow('Failed to update bucket health');
    });
  });

  describe('getUserBuckets', () => {
    it('should return user buckets correctly', async () => {
      // Arrange
      const userId = 'user123';
      const mockBuckets = [
        {
          id: 'bucket1',
          name: 'User Bucket 1',
          bucketId: '111111',
          userId: userId,
          fillPercentage: 30,
          capacity: 100,
          location: 'User Location',
          createdAt: new Date(),
          lastUpdated: new Date(),
          isAssigned: false,
          sensorUptime: 90,
          batteryLevel: 70,
          signalStrength: 4,
          isOnline: true,
          lastMaintenance: new Date()
        }
      ];

      // Mock Firestore query
      mockGetDocs.mockResolvedValue({
        forEach: (callback: any) => mockBuckets.forEach(bucket => callback({
          id: bucket.id,
          data: () => bucket
        }))
      });

      // Mock the query chain
      const mockQueryResult = {};
      mockQuery.mockReturnValue(mockQueryResult);
      mockWhere.mockReturnValue(mockQueryResult);
      mockOrderBy.mockReturnValue(mockQueryResult);
      mockCollection.mockReturnValue({});

      // Act
      const result = await bucketService.getUserBuckets(userId);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('User Bucket 1');
      expect(result[0].userId).toBe(userId);
      expect(mockWhere).toHaveBeenCalledWith('userId', '==', userId);
    });
  });

  describe('isBucketIdUnique', () => {
    it('should return true for unique bucket ID', async () => {
      // Arrange
      const bucketId = '123456';
      
      mockGetDocs.mockResolvedValue({
        empty: true // No existing buckets with this ID
      });

      // Mock the query chain
      const mockQueryResult = {};
      mockQuery.mockReturnValue(mockQueryResult);
      mockWhere.mockReturnValue(mockQueryResult);
      mockCollection.mockReturnValue({});

      // Act
      const result = await bucketService.isBucketIdUnique(bucketId);

      // Assert
      expect(result).toBe(true);
      expect(mockWhere).toHaveBeenCalledWith('bucketId', '==', bucketId);
    });

    it('should return false for duplicate bucket ID', async () => {
      // Arrange
      const bucketId = '123456';
      
      mockGetDocs.mockResolvedValue({
        empty: false // Bucket with this ID already exists
      });

      // Mock the query chain
      const mockQueryResult = {};
      mockQuery.mockReturnValue(mockQueryResult);
      mockWhere.mockReturnValue(mockQueryResult);
      mockCollection.mockReturnValue({});

      // Act
      const result = await bucketService.isBucketIdUnique(bucketId);

      // Assert
      expect(result).toBe(false);
    });
  });
});