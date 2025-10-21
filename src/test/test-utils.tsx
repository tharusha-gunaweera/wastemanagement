import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Mock data factories
export const mockBucket = (overrides = {}) => ({
  id: 'bucket123',
  name: 'Test Bucket',
  bucketId: '123456',
  userId: 'user123',
  fillPercentage: 75,
  capacity: 100,
  location: 'Test Location',
  createdAt: new Date('2023-01-01'),
  lastUpdated: new Date('2023-01-01'),
  isAssigned: false,
  sensorUptime: 95,
  batteryLevel: 80,
  signalStrength: 4,
  isOnline: true,
  lastMaintenance: new Date('2023-01-01'),
  ...overrides
});

export const mockTrashItem = (overrides = {}) => ({
  id: 'trash123',
  bucketId: 'bucket123',
  bucketName: 'Test Bucket',
  userId: 'user123',
  userName: 'Test User',
  trashType: 'organic' as const,
  weight: 1,
  description: 'Organic waste',
  createdAt: new Date('2023-01-01'),
  status: 'added' as const,
  ...overrides
});

export const mockUser = (overrides = {}) => ({
  uid: 'user123',
  email: 'test@example.com',
  displayName: 'Test User',
  accessLevel: 1,
  createdAt: new Date('2023-01-01'),
  ...overrides
});

export const mockDriver = (overrides = {}) => ({
  uid: 'driver123',
  email: 'driver@example.com',
  displayName: 'Test Driver',
  accessLevel: 2,
  createdAt: new Date('2023-01-01'),
  ...overrides
});

// Custom wrapper with all providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        {children}
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

// Custom render function
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything from testing library
export * from '@testing-library/react-native';

// Override render method
export { customRender as render };

// Navigation test utilities
export const createTestNavigationProps = (props = {}) => ({
  navigation: {
    navigate: jest.fn(),
    goBack: jest.fn(),
    push: jest.fn(),
    pop: jest.fn(),
    replace: jest.fn(),
    reset: jest.fn(),
    setOptions: jest.fn(),
    dispatch: jest.fn(),
    isFocused: jest.fn(),
    addListener: jest.fn(),
    removeListener: jest.fn(),
    getState: jest.fn(),
  },
  route: {
    key: 'test-key',
    name: 'TestScreen',
    params: {},
    ...props,
  },
});