import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Alert, TouchableOpacity, Modal, TextInput, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../../app';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { CircularProgress } from '../../components/common/CircularProgress';
import { Colors } from '../../constants/Colors';
import { BucketService } from '../../services/bucket/BucketService'; // Import the class
import { TrashBucket, User } from '../../models/User';
import { AuthService } from '../../services/auth/AuthService';

type MyBucketsScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Dashboard'
>;

interface Props {
  navigation: MyBucketsScreenNavigationProp;
}

const MyBucketsScreen: React.FC<Props> = ({ navigation }) => {
  const [buckets, setBuckets] = useState<TrashBucket[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [driverModalVisible, setDriverModalVisible] = useState(false);
  const [selectedBucket, setSelectedBucket] = useState<TrashBucket | null>(null);
  const [drivers, setDrivers] = useState<User[]>([]);
  const [assigning, setAssigning] = useState(false);

  // New bucket form state
  const [newBucket, setNewBucket] = useState({
    name: '',
    bucketId: '',
    capacity: '',
    location: '',
  });

  // Use Singleton instance
  const bucketService = BucketService.getInstance(); // ✅ Singleton usage
  const authService = new AuthService();
  const currentUser = authService.getCurrentUser();

  useEffect(() => {
    loadBuckets();
  }, []);

  const loadBuckets = async () => {
    try {
      setLoading(true);
      if (currentUser) {
        const userBuckets = await bucketService.getUserBuckets(currentUser.uid);
        
        // Update fill percentage for each bucket using the correct method
        const updatedBuckets = await Promise.all(
          userBuckets.map(async (bucket) => {
            // Use updateBucketFillPercentage for MyBucketsScreen (only updates fill percentage)
            const updatedFill = await bucketService.updateBucketFillPercentage(bucket.id);
            return { ...bucket, fillPercentage: updatedFill };
          })
        );
        
        setBuckets(updatedBuckets);
      }
    } catch (error) {
      console.error('Error loading buckets:', error);
      Alert.alert('Error', 'Failed to load buckets');
    } finally {
      setLoading(false);
    }
  };

  // ... rest of your MyBucketsScreen code remains the same
  const handleCreateBucket = async () => {
    if (!newBucket.name || !newBucket.bucketId || !newBucket.capacity) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    if (newBucket.bucketId.length !== 6 || !/^\d+$/.test(newBucket.bucketId)) {
      Alert.alert('Error', 'Bucket ID must be exactly 6 digits');
      return;
    }

    try {
      if (currentUser) {
        const bucketData: Omit<TrashBucket, 'id'> = {
          name: newBucket.name,
          bucketId: newBucket.bucketId,
          userId: currentUser.uid,
          fillPercentage: 0,
          capacity: parseInt(newBucket.capacity),
          location: newBucket.location,
          createdAt: new Date(),
          lastUpdated: new Date(),
          isAssigned: false,
          sensorUptime: 100,
          batteryLevel: 100,
          signalStrength: 5,
          isOnline: true,
          lastMaintenance: new Date()
        };

        await bucketService.createBucket(bucketData);
        Alert.alert('Success', 'Bucket created successfully');
        setModalVisible(false);
        setNewBucket({ name: '', bucketId: '', capacity: '', location: '' });
        loadBuckets();
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create bucket');
    }
  };

  const handleAssignDriver = async (bucket: TrashBucket) => {
    if (bucket.fillPercentage < 90) {
      Alert.alert('Cannot Assign', 'Bucket must be at least 90% full to assign a driver');
      return;
    }

    try {
      setSelectedBucket(bucket);
      const availableDrivers = await bucketService.getAvailableDrivers();
      setDrivers(availableDrivers);
      setDriverModalVisible(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to load drivers');
    }
  };

  const assignDriverToBucket = async (driver: User) => {
    if (!selectedBucket) return;

    try {
      setAssigning(true);
      await bucketService.assignDriver(
        selectedBucket.id,
        driver.uid,
        driver.displayName || driver.email
      );
      
      Alert.alert('Success', `Driver ${driver.displayName} assigned to bucket`);
      setDriverModalVisible(false);
      setSelectedBucket(null);
      loadBuckets();
    } catch (error) {
      Alert.alert('Error', 'Failed to assign driver');
    } finally {
      setAssigning(false);
    }
  };

  // ... rest of your component code (render methods, styles, etc.)

  const renderBucketItem = ({ item }: { item: TrashBucket }) => (
    <View style={styles.bucketCard}>
      <View style={styles.bucketHeader}>
        <View style={styles.bucketInfo}>
          <Text style={styles.bucketName}>{item.name}</Text>
          <Text style={styles.bucketId}>ID: {item.bucketId}</Text>
          <Text style={styles.bucketLocation}>{item.location}</Text>
          <Text style={styles.bucketCapacity}>Capacity: {item.capacity}L</Text>
        </View>
        <CircularProgress 
          percentage={item.fillPercentage} 
          size={70}
          textSize={14}
        />
      </View>
      
      <View style={styles.bucketActions}>
        {item.fillPercentage >= 90 && !item.isAssigned && (
          <Button
            title="Assign Driver"
            onPress={() => handleAssignDriver(item)}
            variant="primary"
            fullWidth={false}
          />
        )}
        {item.isAssigned && (
          <Text style={styles.assignedText}>Driver Assigned</Text>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Trash Buckets</Text>
        <Button
          title="New Bucket"
          onPress={() => setModalVisible(true)}
          variant="primary"
          fullWidth={false}
        />
      </View>

      <FlatList
        data={buckets}
        renderItem={renderBucketItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshing={loading}
        onRefresh={loadBuckets}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="trash-outline" size={64} color={Colors.text.secondary} />
            <Text style={styles.emptyText}>No buckets yet</Text>
            <Text style={styles.emptySubtext}>Create your first trash bucket to get started</Text>
          </View>
        }
      />

      {/* Add Bucket Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Bucket</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={Colors.text.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Input
                label="Bucket Name"
                value={newBucket.name}
                onChangeText={(text) => setNewBucket({ ...newBucket, name: text })}
                placeholder="Enter bucket name"
              />
              
              <Input
                label="Bucket ID (6 digits)"
                value={newBucket.bucketId}
                onChangeText={(text) => setNewBucket({ ...newBucket, bucketId: text })}
                placeholder="Enter 6-digit ID"
                keyboardType="numeric"
                maxLength={6}
              />
              
              <Input
                label="Capacity (liters)"
                value={newBucket.capacity}
                onChangeText={(text) => setNewBucket({ ...newBucket, capacity: text })}
                placeholder="Enter capacity"
                keyboardType="numeric"
              />
              
              <Input
                label="Location (Optional)"
                value={newBucket.location}
                onChangeText={(text) => setNewBucket({ ...newBucket, location: text })}
                placeholder="Enter location"
              />

              <Button
                title="Create Bucket"
                onPress={handleCreateBucket}
                variant="primary"
              />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Assign Driver Modal */}
      <Modal
        visible={driverModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setDriverModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Assign Driver</Text>
              <TouchableOpacity onPress={() => setDriverModalVisible(false)}>
                <Ionicons name="close" size={24} color={Colors.text.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.driverListTitle}>Available Drivers:</Text>
              {drivers.map((driver) => (
                <TouchableOpacity
                  key={driver.uid}
                  style={styles.driverItem}
                  onPress={() => assignDriverToBucket(driver)}
                  disabled={assigning}
                >
                  <View style={styles.driverInfo}>
                    <Text style={styles.driverName}>
                      {driver.displayName || 'No Name'}
                    </Text>
                    <Text style={styles.driverEmail}>{driver.email}</Text>
                  </View>
                  {assigning && (
                    <Ionicons name="time" size={20} color={Colors.text.secondary} />
                  )}
                </TouchableOpacity>
              ))}
              {drivers.length === 0 && (
                <Text style={styles.noDriversText}>No drivers available</Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  listContent: {
    padding: 10,
  },
  bucketCard: {
    backgroundColor: Colors.surface,
    margin: 10,
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bucketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  bucketInfo: {
    flex: 1,
  },
  bucketName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  bucketId: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 2,
  },
  bucketLocation: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 2,
  },
  bucketCapacity: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
    marginBottom: 8,
  },
  bucketActions: {
    marginTop: 10,
  },
  assignedText: {
    color: Colors.primary,
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginTop: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  modalBody: {
    maxHeight: 400,
  },
  driverListTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 15,
  },
  driverItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: Colors.background,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  driverEmail: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  noDriversText: {
    textAlign: 'center',
    color: Colors.text.secondary,
    fontSize: 16,
    marginTop: 20,
  },
});

export default MyBucketsScreen;