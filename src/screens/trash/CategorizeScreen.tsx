import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootStackParamList } from '../../../app';
import { Button } from '../../components/common/Button';
import { Colors } from '../../constants/Colors';
import { TrashBucket, TrashItem, TrashStats } from '../../models/User';
import { AuthService } from '../../services/auth/AuthService';
import { BucketService } from '../../services/bucket/BucketService';
import { TrashService } from '../../services/trash/TrashService';
import { TrashObserver } from '../../services/trash/TrashObserver';

type CategorizeScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Dashboard'
>;

interface Props {
  navigation: CategorizeScreenNavigationProp;
}

// Custom hook for trash observer
const useTrashObserver = () => {
  const [trashItems, setTrashItems] = useState<TrashItem[]>([]);
  const [trashStats, setTrashStats] = useState<TrashStats | null>(null);
  
  const trashObserver: TrashObserver = {
    onTrashAdded: useCallback((trashItem: TrashItem) => {
      console.log('Trash added notification received:', trashItem.id);
      setTrashItems(prev => [trashItem, ...prev]);
      setTrashStats(prev => {
        if (!prev) {
          return {
            totalTrash: 1,
            organic: trashItem.trashType === 'organic' ? 1 : 0,
            recyclable: trashItem.trashType === 'recyclable' ? 1 : 0,
            nonRecyclable: trashItem.trashType === 'non-recyclable' ? 1 : 0,
            lastUpdated: new Date()
          };
        }
        return {
          totalTrash: prev.totalTrash + 1,
          organic: prev.organic + (trashItem.trashType === 'organic' ? 1 : 0),
          recyclable: prev.recyclable + (trashItem.trashType === 'recyclable' ? 1 : 0),
          nonRecyclable: prev.nonRecyclable + (trashItem.trashType === 'non-recyclable' ? 1 : 0),
          lastUpdated: new Date()
        };
      });
    }, []),

    onTrashDeleted: useCallback((trashId: string) => {
      console.log('Trash deleted notification received:', trashId);
      setTrashItems(prev => prev.filter(item => item.id !== trashId));
      setTrashStats(prev => {
        if (!prev) return null;
        const remainingItems = trashItems.filter(item => item.id !== trashId);
        return {
          totalTrash: remainingItems.length,
          organic: remainingItems.filter(item => item.trashType === 'organic').length,
          recyclable: remainingItems.filter(item => item.trashType === 'recyclable').length,
          nonRecyclable: remainingItems.filter(item => item.trashType === 'non-recyclable').length,
          lastUpdated: new Date()
        };
      });
    }, [trashItems]),

    onTrashStatsUpdated: useCallback((stats: TrashStats) => {
      console.log('Trash stats updated notification received');
      setTrashStats(stats);
    }, [])
  };

  return { trashItems, setTrashItems, trashStats, setTrashStats, trashObserver };
};

const CategorizeScreen: React.FC<Props> = ({ navigation }) => {
  const [buckets, setBuckets] = useState<TrashBucket[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [bucketModalVisible, setBucketModalVisible] = useState(false);
  const [selectedBucket, setSelectedBucket] = useState<TrashBucket | null>(null);
  const [addingTrash, setAddingTrash] = useState(false);

  const { 
    trashItems, 
    setTrashItems, 
    trashStats, 
    setTrashStats, 
    trashObserver 
  } = useTrashObserver();

  const trashService = TrashService.getInstance();
  const bucketService = BucketService.getInstance();
  const authService = new AuthService();
  const currentUser = authService.getCurrentUser();

  useEffect(() => {
    // Register observer
    trashService.addObserver(trashObserver);
    loadData();

    // Cleanup: remove observer on unmount
    return () => {
      trashService.removeObserver(trashObserver);
    };
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      if (currentUser) {
        const [userBuckets, userTrashItems, userStats] = await Promise.all([
          bucketService.getUserBuckets(currentUser.uid),
          trashService.getUserTrashItems(currentUser.uid),
          trashService.getUserTrashStats(currentUser.uid)
        ]);
        
        setBuckets(userBuckets);
        setTrashItems(userTrashItems);
        setTrashStats(userStats);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTrash = () => {
    if (buckets.length === 0) {
      Alert.alert('No Buckets', 'Please create a bucket first before adding trash.');
      return;
    }
    setBucketModalVisible(true);
  };

  const handleSelectBucket = (bucket: TrashBucket) => {
    setSelectedBucket(bucket);
    setBucketModalVisible(false);
    setModalVisible(true);
  };

  const handleSelectTrashType = async (trashType: 'organic' | 'recyclable' | 'non-recyclable') => {
    if (!selectedBucket || !currentUser) return;

    try {
      setAddingTrash(true);
      
      const trashData: Omit<TrashItem, 'id'> = {
        bucketId: selectedBucket.id,
        bucketName: selectedBucket.name,
        userId: currentUser.uid,
        userName: currentUser.displayName || currentUser.email || 'Unknown User',
        trashType: trashType,
        weight: 1, 
        description: `${trashService.getTrashTypeName(trashType)} waste added`,
        createdAt: new Date(),
        status: 'added'
      };

      await trashService.addTrashToBucket(trashData);
      
      Alert.alert(
        'Success', 
        `${trashService.getTrashTypeName(trashType)} waste added to ${selectedBucket.name}!`,
        [{ text: 'OK' }] // No need for loadData - observer will handle update
      );
      
      setModalVisible(false);
      setSelectedBucket(null);
    } catch (error) {
      console.error('Error adding trash:', error);
      Alert.alert('Error', 'Failed to add trash');
    } finally {
      setAddingTrash(false);
    }
  };

  const handleDeleteTrash = (trashItem: TrashItem) => {
    Alert.alert(
      'Delete Trash Item',
      'Are you sure you want to delete this trash item?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await trashService.deleteTrashItem(trashItem.id);
              // No need to call loadData - observer will handle the update
              Alert.alert('Success', 'Trash item deleted successfully');
            } catch (error) {
              console.error('Error deleting trash:', error);
              Alert.alert('Error', 'Failed to delete trash item');
            }
          }
        },
      ]
    );
  };

  const renderTrashItem = ({ item }: { item: TrashItem }) => (
    <View style={styles.trashCard}>
      <View style={styles.trashHeader}>
        <View style={[
          styles.trashTypeIndicator,
          { backgroundColor: trashService.getTrashTypeColor(item.trashType) }
        ]}>
          <Text style={styles.trashTypeIcon}>
            {trashService.getTrashTypeIcon(item.trashType)}
          </Text>
        </View>
        <View style={styles.trashInfo}>
          <Text style={styles.trashType}>
            {trashService.getTrashTypeName(item.trashType)}
          </Text>
          <Text style={styles.bucketNameText}>Bucket: {item.bucketName}</Text>
          <Text style={styles.trashDescription}>{item.description}</Text>
          <Text style={styles.trashDate}>
            Added: {item.createdAt.toLocaleDateString()} at {item.createdAt.toLocaleTimeString()}
          </Text>
        </View>
      </View>
      <TouchableOpacity 
        style={styles.deleteButton}
        onPress={() => handleDeleteTrash(item)}
      >
        <Ionicons name="trash-outline" size={20} color={Colors.error} />
      </TouchableOpacity>
    </View>
  );

  const renderBucketItem = ({ item }: { item: TrashBucket }) => (
    <TouchableOpacity 
      style={styles.bucketCard}
      onPress={() => handleSelectBucket(item)}
    >
      <View style={styles.bucketInfo}>
        <Text style={styles.bucketNameText}>{item.name}</Text>
        <Text style={styles.bucketId}>ID: {item.bucketId}</Text>
        <Text style={styles.bucketLocationText}>{item.location}</Text>
        <Text style={styles.bucketFill}>
          Fill Level: {item.fillPercentage}%
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={Colors.text.secondary} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Categorize Trash</Text>
        <Button
          title="Add Trash"
          onPress={handleAddTrash}
          variant="primary"
          fullWidth={false}
        />
      </View>

      <ScrollView style={styles.content}>
        {/* Trash Statistics */}
        {trashStats && (
          <View style={styles.statsContainer}>
            <Text style={styles.sectionTitle}>Your Trash Statistics</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{trashStats.totalTrash}</Text>
                <Text style={styles.statLabel}>Total Items</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: '#4CAF50' }]}>
                  {trashStats.organic}
                </Text>
                <Text style={styles.statLabel}>Organic</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: '#2196F3' }]}>
                  {trashStats.recyclable}
                </Text>
                <Text style={styles.statLabel}>Recyclable</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: '#F44336' }]}>
                  {trashStats.nonRecyclable}
                </Text>
                <Text style={styles.statLabel}>Non-Recyclable</Text>
              </View>
            </View>
          </View>
        )}

        {/* Recent Trash Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Trash Items</Text>
          {trashItems.length > 0 ? (
            <FlatList
              data={trashItems.slice(0, 10)} 
              renderItem={renderTrashItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="trash-outline" size={64} color={Colors.text.secondary} />
              <Text style={styles.emptyText}>No trash items yet</Text>
              <Text style={styles.emptySubtext}>
                Start by adding your first trash item!
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bucket Selection Modal */}
      <Modal
        visible={bucketModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setBucketModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Bucket</Text>
              <TouchableOpacity onPress={() => setBucketModalVisible(false)}>
                <Ionicons name="close" size={24} color={Colors.text.primary} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={buckets}
              renderItem={renderBucketItem}
              keyExtractor={(item) => item.id}
              style={styles.modalBody}
            />
          </View>
        </View>
      </Modal>

      {/* Trash Type Selection Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Trash Type</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={Colors.text.primary} />
              </TouchableOpacity>
            </View>
            <View style={styles.trashTypeContainer}>
              <Text style={styles.modalSubtitle}>
                Adding to: {selectedBucket?.name}
              </Text>
              
              <TouchableOpacity 
                style={[styles.trashTypeCard, { backgroundColor: '#E8F5E8' }]}
                onPress={() => handleSelectTrashType('organic')}
                disabled={addingTrash}
              >
                <Text style={styles.trashTypeIconLarge}>🍎</Text>
                <View style={styles.trashTypeInfo}>
                  <Text style={styles.trashTypeTitle}>Organic Waste</Text>
                  <Text style={styles.trashTypeDescription}>
                    Food scraps, garden waste, biodegradable materials
                  </Text>
                </View>
                {addingTrash && <ActivityIndicator size="small" color={Colors.primary} />}
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.trashTypeCard, { backgroundColor: '#E3F2FD' }]}
                onPress={() => handleSelectTrashType('recyclable')}
                disabled={addingTrash}
              >
                <Text style={styles.trashTypeIconLarge}>♻️</Text>
                <View style={styles.trashTypeInfo}>
                  <Text style={styles.trashTypeTitle}>Recyclable</Text>
                  <Text style={styles.trashTypeDescription}>
                    Plastic, paper, glass, metal that can be recycled
                  </Text>
                </View>
                {addingTrash && <ActivityIndicator size="small" color={Colors.primary} />}
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.trashTypeCard, { backgroundColor: '#FFEBEE' }]}
                onPress={() => handleSelectTrashType('non-recyclable')}
                disabled={addingTrash}
              >
                <Text style={styles.trashTypeIconLarge}>🚫</Text>
                <View style={styles.trashTypeInfo}>
                  <Text style={styles.trashTypeTitle}>Non-Recyclable</Text>
                  <Text style={styles.trashTypeDescription}>
                    Items that cannot be recycled or composted
                  </Text>
                </View>
                {addingTrash && <ActivityIndicator size="small" color={Colors.primary} />}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// Keep all your existing styles exactly as they were
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
  content: {
    flex: 1,
  },
  statsContainer: {
    padding: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    backgroundColor: Colors.surface,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 4,
  },
  section: {
    padding: 15,
  },
  trashCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  trashHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  trashTypeIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  trashTypeIcon: {
    fontSize: 16,
  },
  trashInfo: {
    flex: 1,
  },
  trashType: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 2,
  },
  bucketNameText: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 2,
  },
  trashDescription: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginBottom: 2,
  },
  trashDate: {
    fontSize: 10,
    color: Colors.text.secondary,
    fontStyle: 'italic',
  },
  deleteButton: {
    padding: 8,
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
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  modalBody: {
    padding: 20,
  },
  bucketCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bucketInfo: {
    flex: 1,
  },
  bucketId: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginBottom: 2,
  },
  bucketLocationText: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginBottom: 2,
  },
  bucketFill: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
  },
  trashTypeContainer: {
    padding: 20,
  },
  modalSubtitle: {
    fontSize: 16,
    color: Colors.text.secondary,
    marginBottom: 20,
    textAlign: 'center',
  },
  trashTypeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  trashTypeIconLarge: {
    fontSize: 32,
    marginRight: 15,
  },
  trashTypeInfo: {
    flex: 1,
  },
  trashTypeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  trashTypeDescription: {
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
});

export default CategorizeScreen;