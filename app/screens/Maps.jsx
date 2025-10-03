import axios from 'axios';
import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';

const MapScreen = () => {
  const [region, setRegion] = useState({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  
  const [deliveries, setDeliveries] = useState([]);
  const [address, setAddress] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [showDeliveryList, setShowDeliveryList] = useState(false);
  const [optimizedRoute, setOptimizedRoute] = useState([]);

  // Get user's current location
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Need location permission to get your current location');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      const userLoc = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        id: 'user',
        title: 'Your Location',
        type: 'user'
      };
      setUserLocation(userLoc);
      setRegion({
        ...region,
        latitude: userLoc.latitude,
        longitude: userLoc.longitude,
      });
    })();
  }, []);

  // Geocode address to coordinates
  const geocodeAddress = async () => {
    if (!address.trim()) {
      Alert.alert('Error', 'Please enter an address');
      return;
    }

    try {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`
      );

      if (response.data && response.data.length > 0) {
        const firstResult = response.data[0];
        const newDelivery = {
          id: Date.now().toString(),
          latitude: parseFloat(firstResult.lat),
          longitude: parseFloat(firstResult.lon),
          address: firstResult.display_name,
          completed: false,
          type: 'delivery'
        };

        setDeliveries(prev => [...prev, newDelivery]);
        setAddress('');
        
        // Center map on new delivery
        setRegion({
          latitude: parseFloat(firstResult.lat),
          longitude: parseFloat(firstResult.lon),
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        });

        Alert.alert('Success', 'Delivery location added!');
      } else {
        Alert.alert('Error', 'Address not found. Please try a different address.');
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      Alert.alert('Error', 'Failed to geocode address. Please try again.');
    }
  };

  // Remove a delivery location
  const removeDelivery = (id) => {
    setDeliveries(prev => prev.filter(delivery => delivery.id !== id));
    setOptimizedRoute([]); // Clear route when deliveries change
  };

  // Mark delivery as completed
  const toggleDeliveryCompletion = (id) => {
    setDeliveries(prev => 
      prev.map(delivery => 
        delivery.id === id 
          ? { ...delivery, completed: !delivery.completed }
          : delivery
      )
    );
  };

  // Calculate raw distance between two points (for optimization)
  const calculateRawDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Calculate total distance for a route
  const calculateTotalDistance = (route) => {
    let totalDistance = 0;
    for (let i = 0; i < route.length - 1; i++) {
      totalDistance += calculateRawDistance(
        route[i].latitude,
        route[i].longitude,
        route[i + 1].latitude,
        route[i + 1].longitude
      );
    }
    return totalDistance.toFixed(2);
  };

  // Improved route optimization using nearest neighbor algorithm
  const optimizeRoute = () => {
    if (deliveries.length === 0) {
      Alert.alert('Info', 'No deliveries to optimize');
      return;
    }

    if (!userLocation) {
      Alert.alert('Error', 'Need your current location to optimize route');
      return;
    }

    // Create a copy of deliveries to work with
    const unvisited = [...deliveries];
    const optimizedOrder = [];
    
    // Start from user location
    let currentLocation = userLocation;
    
    // Nearest neighbor algorithm - always go to the closest unvisited location
    while (unvisited.length > 0) {
      // Find the closest delivery to current location
      let closestIndex = 0;
      let closestDistance = calculateRawDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        unvisited[0].latitude,
        unvisited[0].longitude
      );

      for (let i = 1; i < unvisited.length; i++) {
        const distance = calculateRawDistance(
          currentLocation.latitude,
          currentLocation.longitude,
          unvisited[i].latitude,
          unvisited[i].longitude
        );
        
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = i;
        }
      }

      // Add the closest delivery to optimized route
      const closestDelivery = unvisited[closestIndex];
      optimizedOrder.push(closestDelivery);
      
      // Remove from unvisited and set as new current location
      unvisited.splice(closestIndex, 1);
      currentLocation = closestDelivery;
    }

    // Create route coordinates for the polyline
    const routeCoords = [
      userLocation,
      ...optimizedOrder
    ].map(loc => ({
      latitude: loc.latitude,
      longitude: loc.longitude
    }));

    setOptimizedRoute(routeCoords);
    
    // Update deliveries order to match optimized route
    setDeliveries(optimizedOrder);
    
    Alert.alert(
      'Route Optimized!', 
      `Found the most efficient delivery sequence!\nTotal distance: ${calculateTotalDistance(routeCoords)} km`
    );
  };

  // Clear all deliveries
  const clearAllDeliveries = () => {
    setDeliveries([]);
    setOptimizedRoute([]);
  };

  // Calculate formatted distance between two points for display
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const distance = calculateRawDistance(lat1, lon1, lat2, lon2);
    return distance.toFixed(2);
  };

  const getMarkerColor = (delivery) => {
    if (delivery.type === 'user') return 'blue';
    return delivery.completed ? 'green' : 'red';
  };

  return (
    <View style={styles.container}>
      {/* Beautiful Search Bar - Moved Higher */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInnerContainer}>
          <View style={styles.searchIconContainer}>
            <Text style={styles.searchIcon}>📍</Text>
          </View>
          <TextInput
            style={styles.searchInput}
            placeholder="Where to deliver today?"
            placeholderTextColor="#999"
            value={address}
            onChangeText={setAddress}
            onSubmitEditing={geocodeAddress}
          />
          <TouchableOpacity 
            style={[
              styles.searchButton, 
              address.trim() ? styles.searchButtonActive : styles.searchButtonInactive
            ]} 
            onPress={geocodeAddress}
            disabled={!address.trim()}
          >
            <Text style={styles.searchButtonText}>Add</Text>
          </TouchableOpacity>
        </View>
        {deliveries.length > 0 && (
          <View style={styles.deliveryCountBadge}>
            <Text style={styles.deliveryCountText}>
              {deliveries.length} delivery{deliveries.length !== 1 ? 's' : ''} added
            </Text>
          </View>
        )}
      </View>

      {/* Map */}
      <MapView style={styles.map} region={region}>
        {/* User Location Marker */}
        {userLocation && (
          <Marker
            coordinate={userLocation}
            title="Your Location"
            pinColor={getMarkerColor(userLocation)}
          />
        )}
        
        {/* Delivery Location Markers */}
        {deliveries.map((delivery, index) => (
          <Marker
            key={delivery.id}
            coordinate={delivery}
            title={`Delivery ${index + 1}`}
            description={delivery.address}
            pinColor={getMarkerColor(delivery)}
          />
        ))}
        
        {/* Optimized Route Line */}
        {optimizedRoute.length > 0 && (
          <Polyline
            coordinates={optimizedRoute}
            strokeColor="#FF6B6B"
            strokeWidth={4}
            lineDashPattern={[10, 5]}
          />
        )}
      </MapView>

      {/* Action Buttons - Bottom Right Corner */}
      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.deliveriesButton]} 
          onPress={() => setShowDeliveryList(true)}
        >
          <Text style={styles.actionButtonIcon}>📋</Text>
          <Text style={styles.actionButtonText}><List></List></Text>
          {deliveries.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{deliveries.length}</Text>
            </View>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.optimizeButton]} 
          onPress={optimizeRoute}
        >
          <Text style={styles.actionButtonIcon}>🚀</Text>
          <Text style={styles.actionButtonText}>Optimize</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, styles.clearButton]} 
          onPress={clearAllDeliveries}
        >
          <Text style={styles.actionButtonIcon}>🗑️</Text>
          <Text style={styles.actionButtonText}>Clear All</Text>
        </TouchableOpacity>
      </View>

      {/* Delivery List Modal */}
      <Modal
        visible={showDeliveryList}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <KeyboardAvoidingView 
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Delivery List</Text>
              {optimizedRoute.length > 0 && (
                <Text style={styles.modalSubtitle}>Optimized Route</Text>
              )}
            </View>
            <TouchableOpacity 
              onPress={() => setShowDeliveryList(false)}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {optimizedRoute.length > 0 && (
            <View style={styles.routeInfo}>
              <Text style={styles.routeInfoText}>
                📍 Total Route: {calculateTotalDistance(optimizedRoute)} km
              </Text>
            </View>
          )}

          <FlatList
            data={deliveries}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => (
              <View style={[
                styles.deliveryItem,
                item.completed && styles.completedDeliveryItem
              ]}>
                <View style={styles.deliveryIndicator}>
                  <View style={[
                    styles.deliveryNumber,
                    item.completed && styles.completedDeliveryNumber
                  ]}>
                    <Text style={styles.deliveryNumberText}>
                      {index + 1}
                    </Text>
                  </View>
                  {index < deliveries.length - 1 && !item.completed && (
                    <View style={styles.deliveryLine} />
                  )}
                </View>
                <View style={styles.deliveryInfo}>
                  <Text style={styles.deliveryAddress} numberOfLines={2}>
                    {item.address}
                  </Text>
                  {userLocation && (
                    <Text style={styles.deliveryDistance}>
                      📏 {calculateDistance(
                        userLocation.latitude,
                        userLocation.longitude,
                        item.latitude,
                        item.longitude
                      )} km away
                    </Text>
                  )}
                </View>
                
                <View style={styles.deliveryActions}>
                  <TouchableOpacity 
                    style={[
                      styles.statusButton, 
                      item.completed ? styles.completedButton : styles.pendingButton
                    ]}
                    onPress={() => toggleDeliveryCompletion(item.id)}
                  >
                    <Text style={styles.statusButtonText}>
                      {item.completed ? '✓ Delivered' : 'Pending'}
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.removeButton}
                    onPress={() => removeDelivery(item.id)}
                  >
                    <Text style={styles.removeButtonText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateEmoji}>📭</Text>
                <Text style={styles.emptyStateText}>
                  No deliveries added yet
                </Text>
                <Text style={styles.emptyStateSubtext}>
                  Add addresses above to get started!
                </Text>
              </View>
            }
          />
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Beautiful Search Bar Styles - Moved Higher
  searchContainer: {
    position: 'absolute',
    top: 15, // Moved from 50 to 15 - much higher!
    left: 20,
    right: 20,
    zIndex: 1,
  },
  searchInnerContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 25,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  searchIconContainer: {
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchIcon: {
    fontSize: 18,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: '#333',
    paddingHorizontal: 8,
  },
  searchButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  searchButtonActive: {
    backgroundColor: '#FF6B6B',
  },
  searchButtonInactive: {
    backgroundColor: '#E0E0E0',
  },
  searchButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  deliveryCountBadge: {
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 8,
    marginLeft: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  deliveryCountText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  // Action Buttons
  actionButtonsContainer: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    zIndex: 1,
    alignItems: 'flex-end',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
    minWidth: 160,
  },
  deliveriesButton: {
    backgroundColor: '#4ECDC4',
  },
  optimizeButton: {
    backgroundColor: '#FFA726',
  },
  clearButton: {
    backgroundColor: '#FF6B6B',
  },
  actionButtonIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    flex: 1,
  },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    marginLeft: 8,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  map: {
    flex: 1,
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fafafa',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#4ECDC4',
    fontWeight: '600',
    marginTop: 2,
  },
  routeInfo: {
    backgroundColor: '#E8F4FD',
    padding: 16,
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4ECDC4',
  },
  routeInfoText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2C3E50',
    textAlign: 'center',
  },
  closeButton: {
    padding: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#666',
    fontSize: 18,
    fontWeight: 'bold',
  },
  // Delivery List Styles
  deliveryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f8f8',
    backgroundColor: 'white',
  },
  completedDeliveryItem: {
    backgroundColor: '#f8fff8',
    opacity: 0.8,
  },
  deliveryIndicator: {
    alignItems: 'center',
    marginRight: 12,
  },
  deliveryNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4ECDC4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  completedDeliveryNumber: {
    backgroundColor: '#6BCF7F',
  },
  deliveryNumberText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  deliveryLine: {
    width: 2,
    height: 20,
    backgroundColor: '#E0E0E0',
  },
  deliveryInfo: {
    flex: 1,
    marginRight: 10,
  },
  deliveryAddress: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
    marginBottom: 4,
  },
  deliveryDistance: {
    fontSize: 12,
    color: '#666',
  },
  deliveryActions: {
    alignItems: 'flex-end',
  },
  statusButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginBottom: 6,
  },
  pendingButton: {
    backgroundColor: '#FFE66D',
  },
  completedButton: {
    backgroundColor: '#6BCF7F',
  },
  statusButtonText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#333',
  },
  removeButton: {
    padding: 4,
  },
  removeButtonText: {
    color: '#FF6B6B',
    fontSize: 11,
    fontWeight: 'bold',
  },
  emptyState: {
    padding: 60,
    alignItems: 'center',
  },
  emptyStateEmoji: {
    fontSize: 50,
    marginBottom: 16,
  },
  emptyStateText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
  },
});

export default MapScreen;