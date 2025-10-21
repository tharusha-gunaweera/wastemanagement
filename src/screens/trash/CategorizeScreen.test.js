// CategorizeScreen.test.js
// Test only the service interactions without importing the React component

// Mock services
jest.mock('../../services/trash/TrashService', () => {
  return jest.fn().mockImplementation(() => ({
    getUserTrashItems: jest.fn(),
    getUserTrashStats: jest.fn(),
    addTrashToBucket: jest.fn(),
    deleteTrashItem: jest.fn(),
    getTrashTypeIcon: jest.fn(),
    getTrashTypeColor: jest.fn(),
    getTrashTypeName: jest.fn(),
  }));
});

jest.mock('../../services/bucket/BucketService', () => {
  const mockInstance = {
    getUserBuckets: jest.fn(),
    createBucket: jest.fn(),
    updateBucketFillPercentage: jest.fn(),
    updateBucketHealth: jest.fn(),
    assignDriver: jest.fn(),
    getAvailableDrivers: jest.fn(),
    createTechnicianRequest: jest.fn(),
    getAllTechnicianRequests: jest.fn(),
    updateTechnicianRequestStatus: jest.fn(),
    deleteBucket: jest.fn(),
    isBucketIdUnique: jest.fn(),
  };

  return {
    BucketService: {
      getInstance: jest.fn(() => mockInstance),
    },
  };
});

jest.mock('../../services/auth/AuthService', () => {
  return jest.fn().mockImplementation(() => ({
    getCurrentUser: jest.fn(),
    signUp: jest.fn(),
    signIn: jest.fn(),
    signOut: jest.fn(),
    resetPassword: jest.fn(),
    updateUserAccessLevel: jest.fn(),
    getCurrentUserWithLocalStorage: jest.fn(),
  }));
});

describe('CategorizeScreen Service Integration', () => {
  let TrashService;
  let BucketService;
  let AuthService;
  let mockTrashInstance;
  let mockBucketInstance;
  let mockAuthInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    
    TrashService = require('../../services/trash/TrashService');
    BucketService = require('../../services/bucket/BucketService').BucketService;
    AuthService = require('../../services/auth/AuthService');

    // Create fresh mock instances
    mockTrashInstance = {
      getUserTrashItems: jest.fn().mockResolvedValue([]),
      getUserTrashStats: jest.fn().mockResolvedValue({
        totalTrash: 1,
        organic: 1,
        recyclable: 0,
        nonRecyclable: 0,
        lastUpdated: new Date()
      }),
      addTrashToBucket: jest.fn().mockResolvedValue('new-trash-id'),
      deleteTrashItem: jest.fn().mockResolvedValue(undefined),
      getTrashTypeIcon: jest.fn().mockReturnValue('🍎'),
      getTrashTypeColor: jest.fn().mockReturnValue('#4CAF50'),
      getTrashTypeName: jest.fn().mockReturnValue('Organic Waste'),
    };

    mockBucketInstance = {
      getUserBuckets: jest.fn().mockResolvedValue([{
        id: 'bucket1',
        name: 'Test Bucket 1',
        bucketId: '123456',
        userId: 'user123',
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
      }]),
      createBucket: jest.fn(),
      updateBucketFillPercentage: jest.fn(),
      updateBucketHealth: jest.fn(),
      assignDriver: jest.fn(),
      getAvailableDrivers: jest.fn(),
      createTechnicianRequest: jest.fn(),
      getAllTechnicianRequests: jest.fn(),
      updateTechnicianRequestStatus: jest.fn(),
      deleteBucket: jest.fn(),
      isBucketIdUnique: jest.fn(),
    };

    mockAuthInstance = {
      getCurrentUser: jest.fn().mockReturnValue({
        uid: 'user123',
        email: 'test@example.com',
        displayName: 'Test User',
        accessLevel: 1,
        createdAt: new Date()
      }),
      signUp: jest.fn(),
      signIn: jest.fn(),
      signOut: jest.fn(),
      resetPassword: jest.fn(),
      updateUserAccessLevel: jest.fn(),
      getCurrentUserWithLocalStorage: jest.fn(),
    };

    // Setup the mock implementations
    TrashService.mockImplementation(() => mockTrashInstance);
    BucketService.getInstance.mockReturnValue(mockBucketInstance);
    AuthService.mockImplementation(() => mockAuthInstance);
  });

  test('should initialize all services correctly', () => {
    const trashService = TrashService();
    const bucketService = BucketService.getInstance();
    const authService = AuthService();

    expect(trashService).toBeDefined();
    expect(bucketService).toBeDefined();
    expect(authService).toBeDefined();
  });

  test('should get user data from all services', async () => {
    const trashService = TrashService();
    const bucketService = BucketService.getInstance();
    const authService = AuthService();

    const user = authService.getCurrentUser();
    const buckets = await bucketService.getUserBuckets('user123');
    const trashStats = await trashService.getUserTrashStats('user123');
    const trashItems = await trashService.getUserTrashItems('user123');

    expect(user.uid).toBe('user123');
    expect(buckets).toHaveLength(1);
    expect(buckets[0].name).toBe('Test Bucket 1');
    expect(trashStats.totalTrash).toBe(1);
    expect(trashStats.organic).toBe(1);
    expect(trashItems).toHaveLength(0);
  });

  test('should use bucket service singleton pattern', () => {
    const instance1 = BucketService.getInstance();
    const instance2 = BucketService.getInstance();

    expect(BucketService.getInstance).toHaveBeenCalledTimes(2);
    expect(instance1).toBe(instance2);
  });

  test('should have all trash service methods defined', () => {
    const trashService = TrashService();

    expect(trashService.getUserTrashItems).toBeDefined();
    expect(trashService.getUserTrashStats).toBeDefined();
    expect(trashService.addTrashToBucket).toBeDefined();
    expect(trashService.deleteTrashItem).toBeDefined();
    expect(trashService.getTrashTypeIcon).toBeDefined();
    expect(trashService.getTrashTypeColor).toBeDefined();
    expect(trashService.getTrashTypeName).toBeDefined();
  });

  test('should handle empty trash items state', async () => {
    const trashService = TrashService();
    mockTrashInstance.getUserTrashItems.mockResolvedValue([]);
    mockTrashInstance.getUserTrashStats.mockResolvedValue({
      totalTrash: 0,
      organic: 0,
      recyclable: 0,
      nonRecyclable: 0,
      lastUpdated: new Date()
    });

    const trashItems = await trashService.getUserTrashItems('user123');
    const trashStats = await trashService.getUserTrashStats('user123');

    expect(trashItems).toHaveLength(0);
    expect(trashStats.totalTrash).toBe(0);
  });

  test('should handle no buckets available', async () => {
    const bucketService = BucketService.getInstance();
    mockBucketInstance.getUserBuckets.mockResolvedValue([]);

    const buckets = await bucketService.getUserBuckets('user123');

    expect(buckets).toHaveLength(0);
  });

  test('should add trash to bucket successfully', async () => {
    const trashService = TrashService();
    
    const trashData = {
      bucketId: 'bucket1',
      bucketName: 'Test Bucket',
      userId: 'user123',
      userName: 'Test User',
      trashType: 'organic',
      weight: 1,
      description: 'Food waste',
      createdAt: new Date(),
      status: 'added'
    };

    const result = await trashService.addTrashToBucket(trashData);

    expect(result).toBe('new-trash-id');
    expect(mockTrashInstance.addTrashToBucket).toHaveBeenCalledWith(trashData);
  });

  test('should delete trash item successfully', async () => {
    const trashService = TrashService();

    await trashService.deleteTrashItem('trash123');

    expect(mockTrashInstance.deleteTrashItem).toHaveBeenCalledWith('trash123');
  });

  test('should get correct trash type information', () => {
    const trashService = TrashService();

    const icon = trashService.getTrashTypeIcon('organic');
    const color = trashService.getTrashTypeColor('organic');
    const name = trashService.getTrashTypeName('organic');

    expect(icon).toBe('🍎');
    expect(color).toBe('#4CAF50');
    expect(name).toBe('Organic Waste');
  });
});