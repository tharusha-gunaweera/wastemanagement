import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootStackParamList } from '../../../app';
import { Button } from '../../components/common/Button';
import { Colors } from '../../constants/Colors';
import { TechnicianRequest } from '../../models/User';
import { AuthService } from '../../services/auth/AuthService';
import { BucketService } from '../../services/bucket/BucketService';

type AdminDashboardScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Dashboard'
>;

interface Props {
  navigation: AdminDashboardScreenNavigationProp;
}

const AdminDashboardScreen: React.FC<Props> = ({ navigation }) => {
  const [technicianRequests, setTechnicianRequests] = useState<TechnicianRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'requests' | 'users' | 'buckets'>('requests');

  const bucketService = BucketService.getInstance();
  const authService = new AuthService();

  useEffect(() => {
    loadTechnicianRequests();
  }, []);

  const loadTechnicianRequests = async () => {
    try {
      setLoading(true);
      const requests = await bucketService.getAllTechnicianRequests();
      setTechnicianRequests(requests);
    } catch (error) {
      console.error('Error loading technician requests:', error);
      Alert.alert('Error', 'Failed to load technician requests');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRequestStatus = async (requestId: string, newStatus: TechnicianRequest['status']) => {
    try {
      await bucketService.updateTechnicianRequestStatus(requestId, newStatus);
      Alert.alert('Success', `Request status updated to ${newStatus}`);
      loadTechnicianRequests();
    } catch (error) {
      console.error('Error updating request status:', error);
      Alert.alert('Error', 'Failed to update request status');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return Colors.error;
      case 'high': return '#FF6B35';
      case 'medium': return '#FFA500';
      case 'low': return Colors.primary;
      default: return Colors.text.secondary;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#FFA500';
      case 'in-progress': return Colors.primary;
      case 'resolved': return Colors.primary;
      case 'cancelled': return Colors.error;
      default: return Colors.text.secondary;
    }
  };

  const renderTechnicianRequest = ({ item }: { item: TechnicianRequest }) => (
    <View style={styles.requestCard}>
      <View style={styles.requestHeader}>
        <View style={styles.requestInfo}>
          <Text style={styles.bucketName}>{item.bucketName}</Text>
          <Text style={styles.requestId}>Request ID: {item.id.slice(-8)}</Text>
          <Text style={styles.userInfo}>Submitted by: {item.userName}</Text>
        </View>
        <View style={styles.statusBadges}>
          <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) }]}>
            <Text style={styles.badgeText}>{item.priority.toUpperCase()}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.badgeText}>{item.status.toUpperCase()}</Text>
          </View>
        </View>
      </View>

      <View style={styles.requestDetails}>
        <Text style={styles.issueType}>Issue Type: {item.issueType}</Text>
        <Text style={styles.description}>{item.description}</Text>
        <Text style={styles.timestamp}>
          Submitted: {item.createdAt.toLocaleDateString()} at {item.createdAt.toLocaleTimeString()}
        </Text>
      </View>

      <View style={styles.requestActions}>
        {item.status === 'pending' && (
          <>
            <Button
              title="Start Work"
              onPress={() => handleUpdateRequestStatus(item.id, 'in-progress')}
              variant="primary"
              fullWidth={false}
            />
            <Button
              title="Cancel"
              onPress={() => handleUpdateRequestStatus(item.id, 'cancelled')}
              variant="outline"
              fullWidth={false}
            />
          </>
        )}
        {item.status === 'in-progress' && (
          <Button
            title="Mark Resolved"
            onPress={() => handleUpdateRequestStatus(item.id, 'resolved')}
            variant="primary"
            fullWidth={false}
          />
        )}
        {(item.status === 'resolved' || item.status === 'cancelled') && (
          <Text style={styles.finalStatus}>
            Request {item.status === 'resolved' ? 'completed' : 'cancelled'}
          </Text>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Admin Dashboard</Text>
        <Button
          title="Refresh"
          onPress={loadTechnicianRequests}
          variant="outline"
          fullWidth={false}
        />
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <Button
          title="Technician Requests"
          onPress={() => setActiveTab('requests')}
          variant={activeTab === 'requests' ? 'primary' : 'outline'}
          fullWidth={false}
        />
        <Button
          title="User Management"
          onPress={() => setActiveTab('users')}
          variant={activeTab === 'users' ? 'primary' : 'outline'}
          fullWidth={false}
        />
        <Button
          title="All Buckets"
          onPress={() => setActiveTab('buckets')}
          variant={activeTab === 'buckets' ? 'primary' : 'outline'}
          fullWidth={false}
        />
      </View>

      {activeTab === 'requests' && (
        <View style={styles.content}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {technicianRequests.filter(r => r.status === 'pending').length}
              </Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {technicianRequests.filter(r => r.status === 'in-progress').length}
              </Text>
              <Text style={styles.statLabel}>In Progress</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {technicianRequests.filter(r => r.status === 'resolved').length}
              </Text>
              <Text style={styles.statLabel}>Resolved</Text>
            </View>
          </View>

          <FlatList
            data={technicianRequests}
            renderItem={renderTechnicianRequest}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            refreshing={loading}
            onRefresh={loadTechnicianRequests}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="construct-outline" size={64} color={Colors.text.secondary} />
                <Text style={styles.emptyText}>No technician requests</Text>
                <Text style={styles.emptySubtext}>All systems are operational</Text>
              </View>
            }
          />
        </View>
      )}

      {activeTab === 'users' && (
        <View style={styles.placeholderContainer}>
          <Ionicons name="people-outline" size={64} color={Colors.text.secondary} />
          <Text style={styles.placeholderText}>User Management</Text>
          <Text style={styles.placeholderSubtext}>Manage users and their access levels</Text>
        </View>
      )}

      {activeTab === 'buckets' && (
        <View style={styles.placeholderContainer}>
          <Ionicons name="trash-outline" size={64} color={Colors.text.secondary} />
          <Text style={styles.placeholderText}>All Buckets</Text>
          <Text style={styles.placeholderSubtext}>View and manage all system buckets</Text>
        </View>
      )}
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
  content: {
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: Colors.surface,
    margin: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
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
  listContent: {
    padding: 15,
  },
  requestCard: {
    backgroundColor: Colors.surface,
    marginBottom: 15,
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  requestInfo: {
    flex: 1,
  },
  bucketName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  requestId: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginBottom: 2,
  },
  userInfo: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
  statusBadges: {
    alignItems: 'flex-end',
    gap: 5,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: Colors.text.inverse,
  },
  requestDetails: {
    marginBottom: 15,
  },
  issueType: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 5,
  },
  description: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 5,
  },
  timestamp: {
    fontSize: 12,
    color: Colors.text.secondary,
    fontStyle: 'italic',
  },
  requestActions: {
    flexDirection: 'row',
    gap: 10,
  },
  finalStatus: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
    textAlign: 'center',
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
  placeholderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  placeholderText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginTop: 16,
  },
  placeholderSubtext: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginTop: 8,
  },
});

export default AdminDashboardScreen;