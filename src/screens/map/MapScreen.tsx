import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../../app';
import { Colors } from '../../constants/Colors';
import { Button } from '../../components/common/Button';
import { MapService } from '../../services/map/MapService';
import { BinLocation, CollectionRequest } from '../../models/User';
import { AuthService } from '../../services/auth/AuthService';
import { db } from '../../config/FirebaseConfig';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  doc, 
  getDoc, 
  updateDoc, 
  addDoc, 
  serverTimestamp 
} from "firebase/firestore";

type MapScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Dashboard'
>;

interface Props {
  navigation: MapScreenNavigationProp;
}

interface AssignedBin extends BinLocation {
  assignmentId: string;
  driverName: string;
  assignedAt: Date;
}

// Firestore data interfaces
interface FirestoreBucket {
  name?: string;
  bucketId?: string;
  userId?: string;
  fillPercentage?: number;
  capacity?: number;
  location?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  createdAt?: any;
  lastUpdated?: any;
  isAssigned?: boolean;
  assignedDriverId?: string;
  sensorUptime?: number;
  batteryLevel?: number;
  signalStrength?: number;
  isOnline?: boolean;
  lastMaintenance?: any;
}

interface FirestoreAssignment {
  bucketId: string;
  driverId: string;
  driverName: string;
  assignedAt: any;
  status: string;
  completedAt?: any;
}

const MapScreen: React.FC<Props> = ({ navigation }) => {
  const [binLocations, setBinLocations] = useState<BinLocation[]>([]);
  const [assignedBins, setAssignedBins] = useState<AssignedBin[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBin, setSelectedBin] = useState<AssignedBin | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [collecting, setCollecting] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'assigned'>('assigned');

  const mapService = new MapService();
  const authService = new AuthService();
  const currentUser = authService.getCurrentUser();

  // Sri Lanka bounds for random locations
  const sriLankaBounds = {
    north: 9.831,   // Jaffna
    south: 5.919,   // Hambantota
    west: 79.521,   // Colombo
    east: 81.879    // Trincomalee
  };

  // Default coordinates (Center of Sri Lanka)
  const defaultRegion = {
    latitude: 7.8731,
    longitude: 80.7718,
    latitudeDelta: 2.0,
    longitudeDelta: 2.0,
  };

  useEffect(() => {
    loadAssignedBins();
    loadAllBins();
  }, []);

  const generateRandomLocationInSriLanka = () => {
    const latitude = sriLankaBounds.south + Math.random() * (sriLankaBounds.north - sriLankaBounds.south);
    const longitude = sriLankaBounds.west + Math.random() * (sriLankaBounds.east - sriLankaBounds.west);
    return { latitude, longitude };
  };

  const getRandomAddress = () => {
    const cities = [
      'Colombo', 'Kandy', 'Galle', 'Jaffna', 'Negombo', 'Trincomalee',
      'Anuradhapura', 'Polonnaruwa', 'Matara', 'Hambantota', 'Ratnapura',
      'Badulla', 'Nuwara Eliya', 'Kurunegala', 'Puttalam', 'Batticaloa'
    ];
    const streets = ['Main Street', 'Galle Road', 'Kandy Road', 'Lake Road', 'Beach Road', 'Temple Street'];
    
    return `${streets[Math.floor(Math.random() * streets.length)]}, ${cities[Math.floor(Math.random() * cities.length)]}`;
  };

  const loadAssignedBins = async () => {
    try {
      if (!currentUser) return;

      const assignedDriversQuery = query(
        collection(db, 'assignedDrivers'),
        where('driverId', '==', currentUser.uid),
        where('status', '==', 'pending')
      );

      const querySnapshot = await getDocs(assignedDriversQuery);
      const assignedBinsData: AssignedBin[] = [];

      for (const assignmentDoc of querySnapshot.docs) {
        const assignment = assignmentDoc.data() as FirestoreAssignment;
        
        // Get bucket details
        const bucketDoc = await getDoc(doc(db, 'buckets', assignment.bucketId));

        if (bucketDoc.exists()) {
          const bucketData = bucketDoc.data() as FirestoreBucket;
          const randomLocation = generateRandomLocationInSriLanka();
          
          assignedBinsData.push({
            id: assignment.bucketId,
            assignmentId: assignmentDoc.id,
            bucketId: assignment.bucketId,
            name: bucketData?.name || 'Unknown Bin',
            latitude: bucketData?.latitude || randomLocation.latitude,
            longitude: bucketData?.longitude || randomLocation.longitude,
            fillPercentage: bucketData?.fillPercentage || 100,
            status: 'full' as const,
            lastUpdated: new Date(),
            address: bucketData?.address || bucketData?.location || getRandomAddress(),
            driverName: assignment.driverName,
            assignedAt: assignment.assignedAt?.toDate() || new Date()
          });
        }
      }

      setAssignedBins(assignedBinsData);
    } catch (error) {
      console.error('Error loading assigned bins:', error);
      Alert.alert('Error', 'Failed to load assigned bins');
    }
  };

  const loadAllBins = async () => {
    try {
      const locations = await mapService.getAllBinLocations();
      setBinLocations(locations);
    } catch (error) {
      console.error('Error loading all bin locations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMarkerColor = (status: BinLocation['status']) => {
    switch (status) {
      case 'empty': return Colors.primary; // Green
      case 'low': return '#4CAF50'; // Light green
      case 'medium': return '#FF9800'; // Orange
      case 'full': return '#8B0000'; // Maroon
      default: return Colors.text.secondary;
    }
  };

  const getStatusText = (status: BinLocation['status']) => {
    switch (status) {
      case 'empty': return 'Empty';
      case 'low': return 'Low';
      case 'medium': return 'Medium';
      case 'full': return 'Full';
      default: return 'Unknown';
    }
  };

  const handleMarkerPress = (bin: AssignedBin) => {
    setSelectedBin(bin);
    setModalVisible(true);
  };

  const handleCollectGarbage = async () => {
    if (!selectedBin) return;

    try {
      setCollecting(true);
      
      // Mark bin as collected (reset fill percentage to 0)
      await mapService.markBinAsCollected(selectedBin.bucketId);
      
      // Update assignment status to completed
      await updateDoc(doc(db, 'assignedDrivers', selectedBin.assignmentId), {
        status: 'completed',
        completedAt: serverTimestamp()
      });

      // Create collection request
      if (currentUser) {
        const requestData = {
          bucketId: selectedBin.bucketId,
          bucketName: selectedBin.name,
          driverId: currentUser.uid,
          driverName: currentUser.displayName || currentUser.email || 'Unknown Driver',
          location: {
            latitude: selectedBin.latitude,
            longitude: selectedBin.longitude,
            address: selectedBin.address
          },
          status: 'completed' as const,
          requestedAt: serverTimestamp(),
          collectedAt: serverTimestamp()
        };

        await addDoc(collection(db, 'collectionRequests'), requestData);
      }

      Alert.alert('Success', 'Garbage collection recorded successfully!');
      setModalVisible(false);
      setSelectedBin(null);
      
      // Refresh the lists
      loadAssignedBins();
      loadAllBins();
    } catch (error) {
      console.error('Error collecting garbage:', error);
      Alert.alert('Error', 'Failed to record garbage collection');
    } finally {
      setCollecting(false);
    }
  };

  const renderMarkers = () => {
    if (activeTab === 'assigned') {
      // Show only assigned bins for the driver
      return assignedBins.map((bin) => (
        <Marker
          key={bin.assignmentId}
          coordinate={{
            latitude: bin.latitude,
            longitude: bin.longitude,
          }}
          onPress={() => handleMarkerPress(bin)}
        >
          <View style={[styles.marker, { backgroundColor: getMarkerColor(bin.status) }]}>
            <Ionicons name="trash" size={16} color={Colors.text.inverse} />
          </View>
        </Marker>
      ));
    } else {
      // Show all bins
      return binLocations.map((bin) => (
        <Marker
          key={bin.id}
          coordinate={{
            latitude: bin.latitude,
            longitude: bin.longitude,
          }}
          onPress={() => handleMarkerPress({ 
            ...bin, 
            assignmentId: '', 
            driverName: '', 
            assignedAt: new Date() 
          })}
        >
          <View style={[styles.marker, { backgroundColor: getMarkerColor(bin.status) }]}>
            <Ionicons name="trash" size={16} color={Colors.text.inverse} />
          </View>
        </Marker>
      ));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Bin Locations Map</Text>
        <Button
          title="Refresh"
          onPress={() => {
            loadAssignedBins();
            loadAllBins();
          }}
          variant="outline"
          fullWidth={false}
        />
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <Button
          title="My Assigned Bins"
          onPress={() => setActiveTab('assigned')}
          variant={activeTab === 'assigned' ? 'primary' : 'outline'}
          fullWidth={false}
        />
        <Button
          title="All Bins"
          onPress={() => setActiveTab('all')}
          variant={activeTab === 'all' ? 'primary' : 'outline'}
          fullWidth={false}
        />
      </View>

      {/* Map Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: Colors.primary }]} />
          <Text style={styles.legendText}>Empty</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#4CAF50' }]} />
          <Text style={styles.legendText}>Low</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#FF9800' }]} />
          <Text style={styles.legendText}>Medium</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#8B0000' }]} />
          <Text style={styles.legendText}>Full</Text>
        </View>
      </View>

      {/* Assigned Bins Info */}
      {activeTab === 'assigned' && (
        <View style={styles.assignedInfo}>
          <Ionicons name="information-circle" size={20} color={Colors.primary} />
          <Text style={styles.assignedInfoText}>
            {assignedBins.length} bin(s) assigned to you
          </Text>
        </View>
      )}

      {/* Map View */}
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={defaultRegion}
          showsUserLocation={true}
          showsMyLocationButton={true}
        >
          {renderMarkers()}
        </MapView>
      </View>

      {/* Bin Details Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Bin Details</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={Colors.text.primary} />
              </TouchableOpacity>
            </View>

            {selectedBin && (
              <ScrollView style={styles.modalBody}>
                <View style={styles.binInfo}>
                  <Text style={styles.binName}>{selectedBin.name}</Text>
                  <Text style={styles.binId}>ID: {selectedBin.bucketId}</Text>
                  <Text style={styles.binAddress}>{selectedBin.address}</Text>
                  
                  <View style={styles.statusContainer}>
                    <View style={[
                      styles.statusIndicator,
                      { backgroundColor: getMarkerColor(selectedBin.status) }
                    ]} />
                    <Text style={styles.statusText}>
                      Status: {getStatusText(selectedBin.status)}
                    </Text>
                  </View>
                  
                  <Text style={styles.fillPercentage}>
                    Fill Level: {selectedBin.fillPercentage}%
                  </Text>

                  {/* Assignment Info */}
                  {activeTab === 'assigned' && (
                    <View style={styles.assignmentInfo}>
                      <Text style={styles.assignmentTitle}>Assignment Details</Text>
                      <Text style={styles.assignmentText}>
                        Assigned to: {selectedBin.driverName}
                      </Text>
                      <Text style={styles.assignmentText}>
                        Assigned on: {selectedBin.assignedAt.toLocaleDateString()}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Garbage Collection Button - Only show for assigned full bins */}
                {activeTab === 'assigned' && selectedBin.status === 'full' && (
                  <View style={styles.collectionSection}>
                    <Text style={styles.collectionTitle}>
                      This bin is assigned to you and ready for collection
                    </Text>
                    <Button
                      title="Mark as Collected"
                      onPress={handleCollectGarbage}
                      variant="primary"
                      loading={collecting}
                      disabled={collecting}
                    />
                  </View>
                )}

                {/* Show message for non-full bins or when viewing all bins */}
                {(activeTab === 'all' || selectedBin.status !== 'full') && (
                  <View style={styles.infoSection}>
                    <Ionicons name="information-circle" size={24} color={Colors.primary} />
                    <Text style={styles.infoText}>
                      {activeTab === 'all' 
                        ? 'This bin is not assigned to you.' 
                        : `This bin is ${getStatusText(selectedBin.status).toLowerCase()} and ready for collection.`
                      }
                    </Text>
                  </View>
                )}
              </ScrollView>
            )}
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
  tabContainer: {
    flexDirection: 'row',
    padding: 15,
    gap: 10,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 10,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 4,
  },
  legendText: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
  assignedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#E3F2FD',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  assignedInfoText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
    marginLeft: 8,
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  marker: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.text.inverse,
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
  binInfo: {
    marginBottom: 20,
  },
  binName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  binId: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  binAddress: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 12,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  fillPercentage: {
    fontSize: 14,
    color: Colors.text.primary,
    marginBottom: 4,
  },
  assignmentInfo: {
    backgroundColor: Colors.background,
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 10,
  },
  assignmentTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 6,
  },
  assignmentText: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginBottom: 2,
  },
  collectionSection: {
    backgroundColor: Colors.background,
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  collectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 12,
    textAlign: 'center',
  },
  infoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  infoText: {
    fontSize: 14,
    color: Colors.text.primary,
    marginLeft: 8,
    flex: 1,
  },
});

export default MapScreen;