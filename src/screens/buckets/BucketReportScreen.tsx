import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootStackParamList } from '../../../app';
import { Button } from '../../components/common/Button';
import { Colors } from '../../constants/Colors';
import { TechnicianRequest, TrashBucket } from '../../models/User';
import { AuthService } from '../../services/auth/AuthService';
import { BucketService } from '../../services/bucket/BucketService';

type BucketReportScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Dashboard'
>;

interface Props {
  navigation: BucketReportScreenNavigationProp;
}

const BucketReportScreen: React.FC<Props> = ({ navigation }) => {
  const [buckets, setBuckets] = useState<TrashBucket[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittedRequests, setSubmittedRequests] = useState<Set<string>>(new Set());

  const bucketService = BucketService.getInstance();
  const authService = new AuthService();
  const currentUser = authService.getCurrentUser();

  useEffect(() => {
    loadAllBuckets();
  }, []);

  const loadAllBuckets = async () => {
    try {
      setLoading(true);
      // Get ALL buckets from ALL users
      const allBuckets = await bucketService.getAllBuckets();
      
      // Update health metrics for each bucket
      const updatedBuckets = await Promise.all(
        allBuckets.map(async (bucket) => {
          try {
            const updatedBucket = await bucketService.updateBucketHealth(bucket.id);
            return updatedBucket;
          } catch (error) {
            console.error(`Error updating health for bucket ${bucket.id}:`, error);
            return bucket; // Return original bucket if update fails
          }
        })
      );
      
      setBuckets(updatedBuckets);
    } catch (error) {
      console.error('Error loading all buckets:', error);
      Alert.alert('Error', 'Failed to load bucket health data');
    } finally {
      setLoading(false);
    }
  };

  const handleContactTechnician = (bucket: TrashBucket) => {
    Alert.alert(
      'Contact Technician',
      `Report battery issue for ${bucket.name}?\n\nBattery level is critical at ${bucket.batteryLevel}%`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Submit Request', 
          onPress: () => createTechnicianRequest(bucket) 
        },
      ]
    );
  };

  const createTechnicianRequest = async (bucket: TrashBucket) => {
    try {
      if (currentUser) {
        const requestData: Omit<TechnicianRequest, 'id'> = {
          bucketId: bucket.id,
          bucketName: bucket.name,
          userId: currentUser.uid,
          userName: currentUser.displayName || currentUser.email || 'Unknown User',
          issueType: 'battery',
          description: `Battery level critical at ${bucket.batteryLevel}%. Requires immediate attention.`,
          priority: 'critical',
          status: 'pending',
          createdAt: new Date(),
          updatedAt: new Date()
        };

        await bucketService.createTechnicianRequest(requestData);
        
        // Add to submitted requests to show the thank you message
        setSubmittedRequests(prev => new Set(prev).add(bucket.id));
        
        // Show success message
        Alert.alert(
          'Request Submitted',
          'Thank you for reporting the issue. Our technician will contact you soon.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error creating technician request:', error);
      Alert.alert('Error', 'Failed to submit technician request');
    }
  };

  const getStats = () => {
    const totalBuckets = buckets.length;
    const lowBatteryBuckets = buckets.filter(b => b.batteryLevel < 10).length;
    const reportedBuckets = buckets.filter(b => submittedRequests.has(b.id)).length;
    const offlineBuckets = buckets.filter(b => !b.isOnline).length;

    return { totalBuckets, lowBatteryBuckets, reportedBuckets, offlineBuckets };
  };

  const stats = getStats();

  const getBatteryIcon = (level: number) => {
    if (level >= 80) return '🔋';
    if (level >= 50) return '🪫';
    if (level >= 20) return '🪫';
    return '🪫'; // Low battery
  };

  const getBatteryColor = (level: number) => {
    if (level >= 50) return Colors.primary;
    if (level >= 20) return '#FFA500';
    return Colors.error;
  };

  const getSignalBars = (strength: number) => {
    return '📶'.repeat(strength) + '◽'.repeat(5 - strength);
  };

  const getOwnerInfo = (bucket: TrashBucket) => {
    // In a real app, you might want to fetch user details by userId
    // For now, just show the user ID or a generic message
    return bucket.userId === currentUser?.uid ? 'Your Bin' : `User: ${bucket.userId.substring(0, 8)}...`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>System Health Dashboard</Text>
        
      </View>

      <ScrollView style={styles.content}>
        {/* Health Overview Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="trash-outline" size={24} color={Colors.primary} />
            <Text style={styles.statNumber}>{stats.totalBuckets}</Text>
            <Text style={styles.statLabel}>Total Bins</Text>
          </View>
          
          <View style={styles.statCard}>
            <Ionicons name="battery-dead" size={24} color={Colors.error} />
            <Text style={styles.statNumber}>{stats.lowBatteryBuckets}</Text>
            <Text style={styles.statLabel}>Low Battery</Text>
          </View>
          
          <View style={styles.statCard}>
            <Ionicons name="warning" size={24} color="#FFA500" />
            <Text style={styles.statNumber}>{stats.offlineBuckets}</Text>
            <Text style={styles.statLabel}>Offline</Text>
          </View>
          
          <View style={styles.statCard}>
            <Ionicons name="construct-outline" size={24} color={Colors.primary} />
            <Text style={styles.statNumber}>{stats.reportedBuckets}</Text>
            <Text style={styles.statLabel}>Reported</Text>
          </View>
        </View>

        {/* Bin Health Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>All Bin Health Status</Text>
          {buckets.map((bucket) => {
            const hasLowBattery = bucket.batteryLevel < 10;
            const hasReported = submittedRequests.has(bucket.id);
            const isOwnedByCurrentUser = bucket.userId === currentUser?.uid;

            return (
              <View key={bucket.id} style={styles.healthCard}>
                <View style={styles.healthHeader}>
                  <View style={styles.bucketInfo}>
                    <View style={styles.bucketTitleRow}>
                      <Text style={styles.bucketName}>{bucket.name}</Text>
                      {isOwnedByCurrentUser && (
                        <View style={styles.ownerBadge}>
                          <Text style={styles.ownerBadgeText}>Your Bin</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.bucketId}>ID: {bucket.bucketId}</Text>
                    <Text style={styles.bucketLocation}>{bucket.location}</Text>
                    <Text style={styles.ownerInfo}>{getOwnerInfo(bucket)}</Text>
                  </View>
                  <View style={styles.statusIndicator}>
                    <Text style={[
                      styles.statusText,
                      { color: bucket.isOnline ? Colors.primary : Colors.error }
                    ]}>
                      {bucket.isOnline ? '🟢 Online' : '🔴 Offline'}
                    </Text>
                  </View>
                </View>

                {/* Health Metrics */}
                <View style={styles.healthMetrics}>
                  <View style={styles.metricRow}>
                    <Text style={styles.metricLabel}>Battery Level:</Text>
                    <View style={styles.metricValueContainer}>
                      <Text style={styles.metricIcon}>{getBatteryIcon(bucket.batteryLevel)}</Text>
                      <Text style={[
                        styles.metricValue,
                        { color: getBatteryColor(bucket.batteryLevel) }
                      ]}>
                        {bucket.batteryLevel}%
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.metricRow}>
                    <Text style={styles.metricLabel}>Sensor Uptime:</Text>
                    <Text style={styles.metricValue}>
                      {bucket.sensorUptime}%
                    </Text>
                  </View>
                  
                  <View style={styles.metricRow}>
                    <Text style={styles.metricLabel}>Signal Strength:</Text>
                    <Text style={styles.metricValue}>
                      {getSignalBars(bucket.signalStrength)}
                    </Text>
                  </View>

                  <View style={styles.metricRow}>
                    <Text style={styles.metricLabel}>Fill Level:</Text>
                    <Text style={styles.metricValue}>
                      {bucket.fillPercentage}%
                    </Text>
                  </View>
                </View>

                {/* Low Battery Warning - Only show Contact Technician if battery < 10% AND not already reported */}
                {hasLowBattery && !hasReported && (
                  <View style={styles.contactContainer}>
                    <View style={styles.warningHeader}>
                      <Ionicons name="warning" size={20} color={Colors.error} />
                      <Text style={styles.warningTitle}>Low Battery Alert</Text>
                    </View>
                    <Text style={styles.warningText}>
                      Battery is critically low at {bucket.batteryLevel}%. This may affect bin monitoring.
                    </Text>
                    <Button
                      title="Contact Technician"
                      onPress={() => handleContactTechnician(bucket)}
                      variant="primary"
                      fullWidth={true}
                    />
                  </View>
                )}

                {/* Thank you message after reporting */}
                {hasLowBattery && hasReported && (
                  <View style={styles.thankYouContainer}>
                    <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
                    <Text style={styles.thankYouText}>
                      Thank you for reporting. Technician will contact you soon.
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
          
          {buckets.length === 0 && !loading && (
            <View style={styles.emptyContainer}>
              <Ionicons name="analytics-outline" size={64} color={Colors.text.secondary} />
              <Text style={styles.emptyText}>No bin data available</Text>
              <Text style={styles.emptySubtext}>No bins found in the system</Text>
            </View>
          )}

          {loading && (
            <View style={styles.emptyContainer}>
              <Ionicons name="refresh" size={64} color={Colors.text.secondary} />
              <Text style={styles.emptyText}>Loading bin data...</Text>
              <Text style={styles.emptySubtext}>Please wait</Text>
            </View>
          )}
        </View>
      </ScrollView>
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
  content: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 15,
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
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
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primary,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginTop: 4,
  },
  section: {
    padding: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 15,
  },
  healthCard: {
    backgroundColor: Colors.surface,
    marginBottom: 15,
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  healthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  bucketInfo: {
    flex: 1,
  },
  bucketTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  bucketName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginRight: 8,
  },
  ownerBadge: {
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  ownerBadgeText: {
    fontSize: 10,
    color: Colors.primary,
    fontWeight: '600',
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
  ownerInfo: {
    fontSize: 12,
    color: Colors.text.secondary,
    fontStyle: 'italic',
  },
  statusIndicator: {
    alignItems: 'flex-end',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  healthMetrics: {
    marginBottom: 15,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 14,
    color: Colors.text.secondary,
    flex: 1,
  },
  metricValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
  metricIcon: {
    marginRight: 6,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
  },
  contactContainer: {
    backgroundColor: '#FFF3E0',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFA500',
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.error,
    marginLeft: 8,
  },
  warningText: {
    fontSize: 14,
    color: Colors.text.primary,
    marginBottom: 12,
    lineHeight: 20,
  },
  thankYouContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  thankYouText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
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
});

export default BucketReportScreen;