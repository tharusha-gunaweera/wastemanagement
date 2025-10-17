import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootStackParamList } from '../../../app';
import { Button } from '../../components/common/Button';
import { Colors } from '../../constants/Colors';
import { BinLocation } from '../../models/User';
import { AuthService } from '../../services/auth/AuthService';
import { MapService } from '../../services/map/MapService';

type MapScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Dashboard'
>;

interface Props {
  navigation: MapScreenNavigationProp;
}

const MapScreen: React.FC<Props> = ({ navigation }) => {
  const [binLocations, setBinLocations] = useState<BinLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBin, setSelectedBin] = useState<BinLocation | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [collecting, setCollecting] = useState(false);

  const mapService = new MapService();
  const authService = new AuthService();
  const currentUser = authService.getCurrentUser();

  // Default coordinates (you can set this to your city's coordinates)
  const defaultRegion = {
    latitude: 6.9271,
    longitude: 79.8612,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  useEffect(() => {
    loadBinLocations();
  }, []);

  const loadBinLocations = async () => {
    try {
      setLoading(true);
      const locations = await mapService.getAllBinLocations();
      setBinLocations(locations);
    } catch (error) {
      console.error('Error loading bin locations:', error);
      Alert.alert('Error', 'Failed to load bin locations');
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

  const handleMarkerPress = (bin: BinLocation) => {
    setSelectedBin(bin);
    setModalVisible(true);
  };

  const handleCollectGarbage = async () => {
    if (!selectedBin) return;

    try {
      setCollecting(true);
      
      // Mark bin as collected (reset fill percentage to 0)
      await mapService.markBinAsCollected(selectedBin.id);
      
      // If user is a driver, create collection request
      if (currentUser?.accessLevel === 2) {
        const requestData = {
          bucketId: selectedBin.id,
          bucketName: selectedBin.name,
          driverId: currentUser.uid,
          driverName: currentUser.displayName || currentUser.email || 'Unknown Driver',
          location: {
            latitude: selectedBin.latitude,
            longitude: selectedBin.longitude,
            address: selectedBin.address
          },
          status: 'completed' as const,
          requestedAt: new Date(),
          collectedAt: new Date()
        };

        await mapService.createCollectionRequest(requestData);
      }

      Alert.alert('Success', 'Garbage collection recorded successfully!');
      setModalVisible(false);
      setSelectedBin(null);
      loadBinLocations(); // Refresh the map
    } catch (error) {
      console.error('Error collecting garbage:', error);
      Alert.alert('Error', 'Failed to record garbage collection');
    } finally {
      setCollecting(false);
    }
  };

  const renderMarkers = () => {
    return binLocations.map((bin) => (
      <Marker
        key={bin.id}
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
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Bin Locations Map</Text>
        <Button
          title="Refresh"
          onPress={loadBinLocations}
          variant="outline"
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
                  
                  <Text style={styles.lastUpdated}>
                    Last Updated: {selectedBin.lastUpdated.toLocaleString()}
                  </Text>
                </View>

                {/* Garbage Collection Button - Only show for full bins */}
                {selectedBin.status === 'full' && (
                  <View style={styles.collectionSection}>
                    <Text style={styles.collectionTitle}>
                      This bin is full and ready for collection
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

                {/* Show message for non-full bins */}
                {selectedBin.status !== 'full' && (
                  <View style={styles.infoSection}>
                    <Ionicons name="information-circle" size={24} color={Colors.primary} />
                    <Text style={styles.infoText}>
                      This bin is {getStatusText(selectedBin.status).toLowerCase()} and doesn't require immediate collection.
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
  lastUpdated: {
    fontSize: 12,
    color: Colors.text.secondary,
    fontStyle: 'italic',
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