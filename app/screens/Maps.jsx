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
import MapView, { Callout, Marker, Polyline } from 'react-native-maps';

// Sample menstrual products data
const menstrualProducts = [
  { id: 1, name: 'Regular Pads', emoji: '🔴' },
  { id: 2, name: 'Super Pads', emoji: '🔵' },
  { id: 3, name: 'Tampons', emoji: '⚪' },
  { id: 4, name: 'Menstrual Cups', emoji: '🥤' },
  { id: 5, name: 'Pantyliners', emoji: '🩲' },
  { id: 6, name: 'Period Panties', emoji: '👙' },
  { id: 7, name: 'Pain Relief', emoji: '💊' },
  { id: 8, name: 'Heating Pad', emoji: '🔥' }
];

// Generate random customer data for demo
const generateCustomerData = () => {
  const names = ['Emma Wilson', 'Sophia Chen', 'Maya Patel', 'Olivia Garcia', 'Isabella Kim', 'Ava Johnson', 'Mia Davis', 'Charlotte Brown'];
  const phones = ['+1-555-0101', '+1-555-0102', '+1-555-0103', '+1-555-0104', '+1-555-0105', '+1-555-0106', '+1-555-0107', '+1-555-0108'];
  
  const randomName = names[Math.floor(Math.random() * names.length)];
  const randomPhone = phones[Math.floor(Math.random() * phones.length)];
  
  // Generate random products (2-4 items)
  const productCount = Math.floor(Math.random() * 3) + 2;
  const selectedProducts = [];
  const availableProducts = [...menstrualProducts];
  
  for (let i = 0; i < productCount; i++) {
    const randomIndex = Math.floor(Math.random() * availableProducts.length);
    selectedProducts.push(availableProducts[randomIndex]);
    availableProducts.splice(randomIndex, 1);
  }
  
  // Generate random urgency
  const urgencies = ['Low', 'Medium', 'High'];
  const urgency = urgencies[Math.floor(Math.random() * urgencies.length)];
  
  return {
    name: randomName,
    phone: randomPhone,
    products: selectedProducts,
    urgency: urgency,
    specialInstructions: Math.random() > 0.7 ? 'Please ring doorbell twice' : 'Leave at front door',
    deliveryTime: `Within ${Math.floor(Math.random() * 4) + 1} hours`
  };
};

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
  const [selectedDelivery, setSelectedDelivery] = useState(null);

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
        const customerData = generateCustomerData();
        
        const newDelivery = {
          id: Date.now().toString(),
          latitude: parseFloat(firstResult.lat),
          longitude: parseFloat(firstResult.lon),
          address: firstResult.display_name,
          completed: false,
          type: 'delivery',
          customer: customerData
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
    setSelectedDelivery(null); // Close popup if open
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
    setSelectedDelivery(null);
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

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'High': return '#FF6B6B';
      case 'Medium': return '#FFA726';
      case 'Low': return '#4ECDC4';
      default: return '#4ECDC4';
    }
  };

  const handleCalloutPress = (delivery) => {
    setSelectedDelivery(delivery);
  };

  const closeCallout = () => {
    setSelectedDelivery(null);
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
            description="Tap for details"
            pinColor={getMarkerColor(delivery)}
            onCalloutPress={() => handleCalloutPress(delivery)}
          >
            <Callout tooltip={true}>
              <View style={styles.calloutContainer}>
                <Text style={styles.calloutTitle}>Delivery {index + 1}</Text>
                <Text style={styles.calloutAddress} numberOfLines={2}>
                  {delivery.address}
                </Text>
                <Text style={styles.calloutCustomer}>
                  👤 {delivery.customer.name}
                </Text>
                <Text style={styles.calloutTap}>Tap to view details →</Text>
              </View>
            </Callout>
          </Marker>
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

      {/* Delivery Details Popup Modal */}
      <Modal
        visible={!!selectedDelivery}
        animationType="slide"
        transparent={true}
        onRequestClose={closeCallout}
      >
        <View style={styles.popupOverlay}>
          <View style={styles.popupContainer}>
            {selectedDelivery && (
              <>
                <View style={styles.popupHeader}>
                  <Text style={styles.popupTitle}>Delivery Details</Text>
                  <TouchableOpacity onPress={closeCallout} style={styles.closePopupButton}>
                    <Text style={styles.closePopupText}>✕</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.customerSection}>
                  <Text style={styles.sectionTitle}>👤 Customer Information</Text>
                  <View style={styles.customerInfo}>
                    <Text style={styles.customerName}>{selectedDelivery.customer.name}</Text>
                    <Text style={styles.customerPhone}>📞 {selectedDelivery.customer.phone}</Text>
                    <View style={[styles.urgencyBadge, { backgroundColor: getUrgencyColor(selectedDelivery.customer.urgency) }]}>
                      <Text style={styles.urgencyText}>
                        ⚡ {selectedDelivery.customer.urgency} Priority
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.productsSection}>
                  <Text style={styles.sectionTitle}>🛍️ Requested Products</Text>
                  <View style={styles.productsList}>
                    {selectedDelivery.customer.products.map((product, index) => (
                      <View key={index} style={styles.productItem}>
                        <Text style={styles.productEmoji}>{product.emoji}</Text>
                        <Text style={styles.productName}>{product.name}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                <View style={styles.deliveryInfoSection}>
                  <Text style={styles.sectionTitle}>🚚 Delivery Information</Text>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Address:</Text>
                    <Text style={styles.infoValue}>{selectedDelivery.address}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Delivery Time:</Text>
                    <Text style={styles.infoValue}>{selectedDelivery.customer.deliveryTime}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Instructions:</Text>
                    <Text style={styles.infoValue}>{selectedDelivery.customer.specialInstructions}</Text>
                  </View>
                </View>

                <View style={styles.popupActions}>
                  <TouchableOpacity 
                    style={[styles.actionBtn, styles.callButton]}
                    onPress={() => Alert.alert('Call', `Calling ${selectedDelivery.customer.phone}`)}
                  >
                    <Text style={styles.actionBtnText}>📞 Call Customer</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.actionBtn, styles.navigateButton]}
                    onPress={() => Alert.alert('Navigate', `Navigating to ${selectedDelivery.address}`)}
                  >
                    <Text style={styles.actionBtnText}>🧭 Start Navigation</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.actionBtn, selectedDelivery.completed ? styles.undoButton : styles.completeButton]}
                    onPress={() => {
                      toggleDeliveryCompletion(selectedDelivery.id);
                      closeCallout();
                    }}
                  >
                    <Text style={styles.actionBtnText}>
                      {selectedDelivery.completed ? '↶ Mark Pending' : '✓ Mark Delivered'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Action Buttons - Bottom Right Corner */}
      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.deliveriesButton]} 
          onPress={() => setShowDeliveryList(true)}
        >
          <Text style={styles.actionButtonIcon}>📋</Text>
          <Text style={styles.actionButtonText}>Deliveries</Text>
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
                  <Text style={styles.customerNameSmall}>👤 {item.customer.name}</Text>
                  <View style={styles.productsPreview}>
                    {item.customer.products.slice(0, 3).map((product, idx) => (
                      <Text key={idx} style={styles.productPreview}>{product.emoji}</Text>
                    ))}
                    {item.customer.products.length > 3 && (
                      <Text style={styles.moreProducts}>+{item.customer.products.length - 3}</Text>
                    )}
                  </View>
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
  // Search Bar Styles
  searchContainer: {
    position: 'absolute',
    top: 15,
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
  // Callout Styles
  calloutContainer: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 12,
    width: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  calloutTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  calloutAddress: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
  },
  calloutCustomer: {
    fontSize: 12,
    color: '#4ECDC4',
    fontWeight: '600',
    marginBottom: 4,
  },
  calloutTap: {
    fontSize: 10,
    color: '#FF6B6B',
    fontStyle: 'italic',
  },
  // Popup Modal Styles
  popupOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  popupContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 0,
    width: '100%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  popupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fafafa',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  popupTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closePopupButton: {
    padding: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closePopupText: {
    color: '#666',
    fontSize: 18,
    fontWeight: 'bold',
  },
  customerSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  productsSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  deliveryInfoSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  customerInfo: {
    marginBottom: 8,
  },
  customerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  customerPhone: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  urgencyBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  urgencyText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  productsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 8,
  },
  productEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  productName: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    width: '30%',
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    width: '68%',
    flexWrap: 'wrap',
  },
  popupActions: {
    padding: 20,
    gap: 12,
  },
  actionBtn: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  callButton: {
    backgroundColor: '#4ECDC4',
  },
  navigateButton: {
    backgroundColor: '#FFA726',
  },
  completeButton: {
    backgroundColor: '#6BCF7F',
  },
  undoButton: {
    backgroundColor: '#FFE66D',
  },
  actionBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Rest of the styles remain the same...
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
  customerNameSmall: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  productsPreview: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productPreview: {
    fontSize: 14,
    marginRight: 4,
  },
  moreProducts: {
    fontSize: 11,
    color: '#999',
    fontStyle: 'italic',
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