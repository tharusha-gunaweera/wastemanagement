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
const mockSetDoc = jest.fn();
const mockDeleteDoc = jest.fn();
const mockCollection = jest.fn();
const mockDoc = jest.fn();
const mockUpdateDoc = jest.fn();
const mockGetDocs = jest.fn();
const mockQuery = jest.fn();
const mockWhere = jest.fn();
const mockOrderBy = jest.fn();

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
  getDoc: jest.fn(),
  serverTimestamp: jest.fn(() => new Date()),
  Timestamp: {
    fromDate: jest.fn((date) => date),
  },
}));

// NOW IMPORT EVERYTHING ELSE
import { TrashService } from './TrashService';
import { TrashObserver } from './TrashObserver';

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

describe('TrashService', () => {
  let trashService: TrashService;
  let mockObserver: TrashObserver;

  beforeEach(() => {
    // Clear singleton instance and get fresh instance
    (TrashService as any).instance = null;
    trashService = TrashService.getInstance();
    
    // Create mock observer
    mockObserver = {
      onTrashAdded: jest.fn(),
      onTrashDeleted: jest.fn(),
      onTrashStatsUpdated: jest.fn(),
    };
    
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup default mocks
    mockSetDoc.mockResolvedValue(undefined);
    mockDeleteDoc.mockResolvedValue(undefined);
    mockUpdateDoc.mockResolvedValue(undefined);
    mockGetDocs.mockResolvedValue({
      forEach: (callback: any) => [] // Empty by default
    });
    mockQuery.mockReturnValue({});
    mockWhere.mockReturnValue({});
    mockOrderBy.mockReturnValue({});
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = TrashService.getInstance();
      const instance2 = TrashService.getInstance();
      
      expect(instance1).toBe(instance2);
    });
  });

  describe('Observer Pattern', () => {
    it('should add observer successfully', () => {
      trashService.addObserver(mockObserver);
      
      // No direct way to check internal observers array, but no error should occur
      expect(() => trashService.addObserver(mockObserver)).not.toThrow();
    });

    it('should remove observer successfully', () => {
      trashService.addObserver(mockObserver);
      
      expect(() => trashService.removeObserver(mockObserver)).not.toThrow();
    });

    it('should remove all observers successfully', () => {
      trashService.addObserver(mockObserver);
      
      expect(() => trashService.removeAllObservers()).not.toThrow();
    });

    it('should notify observers when trash is added', async () => {
      // Arrange
      trashService.addObserver(mockObserver);
      
      const trashData = {
        bucketId: 'bucket123',
        bucketName: 'Test Bucket',
        userId: 'user123',
        userName: 'Test User',
        trashType: 'organic' as const,
        weight: 1,
        description: 'Food waste',
        createdAt: new Date(),
        status: 'added' as const
      };

      // Mock Firestore document reference
      const mockDocRef = { id: 'trash-123' };
      mockDoc.mockReturnValue(mockDocRef);
      mockCollection.mockReturnValue({
        doc: jest.fn(() => mockDocRef)
      });

      // Mock getBucketTrashItems to return empty array
      jest.spyOn(trashService, 'getBucketTrashItems').mockResolvedValue([]);

      // Act
      await trashService.addTrashToBucket(trashData);

      // Assert
      expect(mockObserver.onTrashAdded).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'trash-123',
          trashType: 'organic',
          bucketId: 'bucket123'
        })
      );
    });

    it('should notify observers when trash is deleted', async () => {
      // Arrange
      trashService.addObserver(mockObserver);

      // Mock Firestore document reference
      const mockDocRef = {};
      mockDoc.mockReturnValue(mockDocRef);

      // Act
      await trashService.deleteTrashItem('trash-123');

      // Assert
      expect(mockObserver.onTrashDeleted).toHaveBeenCalledWith('trash-123');
      expect(mockDoc).toHaveBeenCalledWith({}, 'trashes', 'trash-123');
      expect(mockDeleteDoc).toHaveBeenCalledWith(mockDocRef);
    });

    it('should notify observers when stats are updated', async () => {
      // Arrange
      trashService.addObserver(mockObserver);

      const mockTrashItems = [
        {
          id: '1',
          bucketId: 'bucket1',
          bucketName: 'Bucket 1',
          userId: 'user123',
          userName: 'Test User',
          trashType: 'organic' as const,
          weight: 1,
          description: 'Food waste',
          createdAt: new Date(),
          status: 'added' as const
        }
      ];

      // Mock getUserTrashItems
      mockGetDocs.mockResolvedValue({
        forEach: (callback: any) => mockTrashItems.forEach(item => callback({
          id: item.id,
          data: () => item
        }))
      });

      // Act
      await trashService.getUserTrashStats('user123');

      // Assert
      expect(mockObserver.onTrashStatsUpdated).toHaveBeenCalledWith(
        expect.objectContaining({
          totalTrash: 1,
          organic: 1,
          recyclable: 0,
          nonRecyclable: 0
        })
      );
    });

    it('should handle observer errors gracefully', async () => {
      // Arrange
      const errorObserver: TrashObserver = {
        onTrashAdded: jest.fn().mockImplementation(() => {
          throw new Error('Observer error');
        }),
        onTrashDeleted: jest.fn(),
        onTrashStatsUpdated: jest.fn(),
      };

      trashService.addObserver(errorObserver);
      trashService.addObserver(mockObserver); // Add a working observer too

      const trashData = {
        bucketId: 'bucket123',
        bucketName: 'Test Bucket',
        userId: 'user123',
        userName: 'Test User',
        trashType: 'organic' as const,
        weight: 1,
        description: 'Food waste',
        createdAt: new Date(),
        status: 'added' as const
      };

      // Mock Firestore
      const mockDocRef = { id: 'trash-123' };
      mockDoc.mockReturnValue(mockDocRef);
      mockCollection.mockReturnValue({
        doc: jest.fn(() => mockDocRef)
      });
      jest.spyOn(trashService, 'getBucketTrashItems').mockResolvedValue([]);

      // Act & Assert - Should not throw even if one observer fails
      await expect(trashService.addTrashToBucket(trashData)).resolves.not.toThrow();
      
      // Both observers should have been called (one with error, one without)
      expect(errorObserver.onTrashAdded).toHaveBeenCalled();
      expect(mockObserver.onTrashAdded).toHaveBeenCalled();
    });
  });

  describe('addTrashToBucket', () => {
    it('should successfully add organic trash to bucket', async () => {
      // Arrange
      const trashData = {
        bucketId: 'bucket123',
        bucketName: 'Test Bucket',
        userId: 'user123',
        userName: 'Test User',
        trashType: 'organic' as const,
        weight: 1,
        description: 'Food waste',
        createdAt: new Date(),
        status: 'added' as const
      };

      // Mock Firestore
      const mockDocRef = { id: 'trash-123' };
      mockDoc.mockReturnValue(mockDocRef);
      mockCollection.mockReturnValue({
        doc: jest.fn(() => mockDocRef)
      });

      // Mock getBucketTrashItems to return empty array
      jest.spyOn(trashService, 'getBucketTrashItems').mockResolvedValue([]);

      // Act
      const result = await trashService.addTrashToBucket(trashData);

      // Assert
      expect(result).toBe('trash-123');
      expect(mockSetDoc).toHaveBeenCalled();
    });

    it('should throw error for invalid trash type', async () => {
      // Arrange
      const trashData = {
        bucketId: 'bucket123',
        bucketName: 'Test Bucket',
        userId: 'user123',
        userName: 'Test User',
        trashType: 'invalid-type' as any,
        weight: 1,
        description: 'Test trash',
        createdAt: new Date(),
        status: 'added' as const
      };

      // Mock collection and doc
      const mockDocRef = { id: 'trash-123' };
      mockCollection.mockReturnValue({
        doc: jest.fn(() => mockDocRef)
      });

      // Mock setDoc to throw error
      mockSetDoc.mockRejectedValue(new Error('Invalid trash type'));

      // Act & Assert
      await expect(trashService.addTrashToBucket(trashData))
        .rejects.toThrow('Failed to add trash');
    });

    it('should handle Firestore connection errors', async () => {
      // Arrange
      const trashData = {
        bucketId: 'bucket123',
        bucketName: 'Test Bucket',
        userId: 'user123',
        userName: 'Test User',
        trashType: 'recyclable' as const,
        weight: 1,
        description: 'Plastic bottle',
        createdAt: new Date(),
        status: 'added' as const
      };

      // Mock setDoc to throw error
      mockSetDoc.mockRejectedValue(new Error('Firestore connection failed'));

      // Mock collection
      const mockDocRef = { id: 'trash-123' };
      mockCollection.mockReturnValue({
        doc: jest.fn(() => mockDocRef)
      });

      // Act & Assert
      await expect(trashService.addTrashToBucket(trashData))
        .rejects.toThrow('Failed to add trash');
    });
  });

  describe('getUserTrashStats', () => {
    it('should calculate correct statistics for mixed trash types', async () => {
      // Arrange
      const mockTrashItems = [
        { 
          id: '1', 
          bucketId: 'bucket1', 
          bucketName: 'Bucket 1', 
          userId: 'user123', 
          userName: 'Test User',
          trashType: 'organic' as const,
          weight: 1,
          description: 'Food waste',
          createdAt: new Date(),
          status: 'added' as const
        },
        { 
          id: '2', 
          bucketId: 'bucket1', 
          bucketName: 'Bucket 1', 
          userId: 'user123', 
          userName: 'Test User',
          trashType: 'organic' as const,
          weight: 1,
          description: 'Food waste',
          createdAt: new Date(),
          status: 'added' as const
        },
        { 
          id: '3', 
          bucketId: 'bucket1', 
          bucketName: 'Bucket 1', 
          userId: 'user123', 
          userName: 'Test User',
          trashType: 'recyclable' as const,
          weight: 1,
          description: 'Plastic',
          createdAt: new Date(),
          status: 'added' as const
        },
        { 
          id: '4', 
          bucketId: 'bucket1', 
          bucketName: 'Bucket 1', 
          userId: 'user123', 
          userName: 'Test User',
          trashType: 'non-recyclable' as const,
          weight: 1,
          description: 'Other waste',
          createdAt: new Date(),
          status: 'added' as const
        },
        { 
          id: '5', 
          bucketId: 'bucket1', 
          bucketName: 'Bucket 1', 
          userId: 'user123', 
          userName: 'Test User',
          trashType: 'recyclable' as const,
          weight: 1,
          description: 'Paper',
          createdAt: new Date(),
          status: 'added' as const
        },
      ];

      // Mock getUserTrashItems
      mockGetDocs.mockResolvedValue({
        forEach: (callback: any) => mockTrashItems.forEach(item => callback({
          id: item.id,
          data: () => item
        }))
      });

      // Act
      const stats = await trashService.getUserTrashStats('user123');

      // Assert
      expect(stats.totalTrash).toBe(5);
      expect(stats.organic).toBe(2);
      expect(stats.recyclable).toBe(2);
      expect(stats.nonRecyclable).toBe(1);
      expect(stats.lastUpdated).toBeInstanceOf(Date);
    });

    it('should return zero statistics for user with no trash', async () => {
      // Arrange
      mockGetDocs.mockResolvedValue({
        forEach: (callback: any) => [] // Empty array
      });

      // Act
      const stats = await trashService.getUserTrashStats('user123');

      // Assert
      expect(stats.totalTrash).toBe(0);
      expect(stats.organic).toBe(0);
      expect(stats.recyclable).toBe(0);
      expect(stats.nonRecyclable).toBe(0);
    });

    it('should handle errors when fetching trash items', async () => {
      // Arrange
      mockGetDocs.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(trashService.getUserTrashStats('user123'))
        .rejects.toThrow('Failed to fetch trash statistics');
    });
  });

  describe('deleteTrashItem', () => {
    it('should successfully delete trash item', async () => {
      // Arrange
      const mockDocRef = {};
      mockDoc.mockReturnValue(mockDocRef);

      // Act
      await trashService.deleteTrashItem('trash123');

      // Assert
      expect(mockDoc).toHaveBeenCalledWith({}, 'trashes', 'trash123');
      expect(mockDeleteDoc).toHaveBeenCalledWith(mockDocRef);
    });

    it('should throw error when deleting non-existent trash item', async () => {
      // Arrange
      mockDeleteDoc.mockRejectedValue(new Error('Document not found'));
      mockDoc.mockReturnValue({});

      // Act & Assert
      await expect(trashService.deleteTrashItem('non-existent-id'))
        .rejects.toThrow('Failed to delete trash item');
    });
  });

  describe('trash type helpers', () => {
    it('should return correct icon for each trash type', () => {
      expect(trashService.getTrashTypeIcon('organic')).toBe('🍎');
      expect(trashService.getTrashTypeIcon('recyclable')).toBe('♻️');
      expect(trashService.getTrashTypeIcon('non-recyclable')).toBe('🚫');
      expect(trashService.getTrashTypeIcon('unknown')).toBe('🗑️');
    });

    it('should return correct color for each trash type', () => {
      expect(trashService.getTrashTypeColor('organic')).toBe('#4CAF50');
      expect(trashService.getTrashTypeColor('recyclable')).toBe('#2196F3');
      expect(trashService.getTrashTypeColor('non-recyclable')).toBe('#F44336');
      expect(trashService.getTrashTypeColor('unknown')).toBe('#9E9E9E');
    });

    it('should return correct name for each trash type', () => {
      expect(trashService.getTrashTypeName('organic')).toBe('Organic Waste');
      expect(trashService.getTrashTypeName('recyclable')).toBe('Recyclable');
      expect(trashService.getTrashTypeName('non-recyclable')).toBe('Non-Recyclable');
      expect(trashService.getTrashTypeName('unknown')).toBe('Unknown');
    });
  });

  describe('getUserTrashItems', () => {
    it('should return user trash items', async () => {
      // Arrange
      const mockTrashItems = [
        {
          id: 'trash1',
          bucketId: 'bucket1',
          bucketName: 'Test Bucket',
          userId: 'user123',
          userName: 'Test User',
          trashType: 'organic' as const,
          weight: 1,
          description: 'Food waste',
          createdAt: new Date(),
          status: 'added' as const
        }
      ];

      // Mock Firestore query
      mockGetDocs.mockResolvedValue({
        forEach: (callback: any) => mockTrashItems.forEach(item => callback({
          id: item.id,
          data: () => item
        }))
      });

      // Act
      const result = await trashService.getUserTrashItems('user123');

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('trash1');
      expect(result[0].trashType).toBe('organic');
    });
  });

  describe('getBucketTrashItems', () => {
    it('should return bucket trash items', async () => {
      // Arrange
      const mockTrashItems = [
        {
          id: 'trash1',
          bucketId: 'bucket1',
          bucketName: 'Test Bucket',
          userId: 'user123',
          userName: 'Test User',
          trashType: 'organic' as const,
          weight: 1,
          description: 'Food waste',
          createdAt: new Date(),
          status: 'added' as const
        }
      ];

      // Mock Firestore query
      mockGetDocs.mockResolvedValue({
        forEach: (callback: any) => mockTrashItems.forEach(item => callback({
          id: item.id,
          data: () => item
        }))
      });

      // Act
      const result = await trashService.getBucketTrashItems('bucket1');

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('trash1');
      expect(result[0].bucketId).toBe('bucket1');
    });
  });
});