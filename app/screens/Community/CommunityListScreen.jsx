import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    FlatList,
    StyleSheet,
    Alert,
    ActivityIndicator,
    Modal,
    TextInput,
    ScrollView
} from 'react-native';
import { 
    collection, 
    addDoc, 
    getDocs, 
    doc, 
    updateDoc, 
    onSnapshot, 
    arrayUnion, 
    arrayRemove, 
    increment, 
    serverTimestamp 
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db, auth } from '../../../FirebaseConfig';

const CommunityListScreen = ({ navigation }) => {
    const [communities, setCommunities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [joining, setJoining] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [creating, setCreating] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);

    // Create community form state
    const [communityForm, setCommunityForm] = useState({
        name: '',
        description: '',
        locationData: '',
        isPublic: true
    });

    useEffect(() => {
        // Get current user
        const user = getAuth().currentUser;
        setCurrentUser(user);
        
        // Load communities from Firebase
        loadCommunities();
        
        // Set up real-time listener
        const unsubscribe = setupCommunityListener();
        
        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, []);

    // Real-time listener for communities
    const setupCommunityListener = () => {
        return onSnapshot(collection(db, 'communities'),
            (querySnapshot) => {
                const communitiesData = [];
                querySnapshot.forEach((doc) => {
                    communitiesData.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });
                setCommunities(communitiesData);
                setLoading(false);
            },
            (error) => {
                console.error('Error listening to communities:', error);
                Alert.alert('Error', 'Failed to load communities');
                setLoading(false);
            }
        );
    };

    // Load communities from Firebase
    const loadCommunities = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, 'communities'));

            const communitiesData = [];
            querySnapshot.forEach((doc) => {
                communitiesData.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            setCommunities(communitiesData);
            setLoading(false);
        } catch (error) {
            console.error('Error loading communities:', error);
            Alert.alert('Error', 'Failed to load communities');
            setLoading(false);
        }
    };

    // Create community function
    const handleCreateCommunity = async () => {
        if (!communityForm.name.trim()) {
            Alert.alert('Error', 'Please enter community name');
            return;
        }

        if (!currentUser) {
            Alert.alert('Error', 'You must be logged in to create a community');
            return;
        }

        setCreating(true);

        try {
            const communityData = {
                Name: communityForm.name,
                Description: communityForm.description,
                LocationData: communityForm.locationData,
                creator: currentUser.uid,
                Members: [currentUser.uid],
                isPublic: communityForm.isPublic,
                memberCount: 1,
                createdAt: serverTimestamp(),
                image: '👥'
            };

            // Add community to Firestore
            const docRef = await addDoc(collection(db, 'communities'), communityData);

            console.log('Community created with ID:', docRef.id);
            
            Alert.alert('Success', 'Community created successfully!');
            setShowCreateModal(false);
            resetForm();
            
        } catch (error) {
            console.error('Error creating community:', error);
            Alert.alert('Error', 'Failed to create community');
        } finally {
            setCreating(false);
        }
    };

    // Join community function
    const handleJoinCommunity = async (communityId) => {
        if (!currentUser) {
            Alert.alert('Error', 'You must be logged in to join a community');
            return;
        }

        setJoining(communityId);

        try {
            const communityRef = doc(db, 'communities', communityId);
            
            // Add user to members array
            await updateDoc(communityRef, {
                Members: arrayUnion(currentUser.uid),
                memberCount: increment(1)
            });

            Alert.alert('Success', 'Successfully joined the community!');
            
        } catch (error) {
            console.error('Error joining community:', error);
            Alert.alert('Error', 'Failed to join community');
        } finally {
            setJoining(null);
        }
    };

    // Leave community function
    const handleLeaveCommunity = async (communityId) => {
        if (!currentUser) {
            Alert.alert('Error', 'You must be logged in to leave a community');
            return;
        }

        try {
            const communityRef = doc(db, 'communities', communityId);
            
            // Remove user from members array
            await updateDoc(communityRef, {
                Members: arrayRemove(currentUser.uid),
                memberCount: increment(-1)
            });

            Alert.alert('Success', 'You have left the community');
            
        } catch (error) {
            console.error('Error leaving community:', error);
            Alert.alert('Error', 'Failed to leave community');
        }
    };

    // Check if current user is a member of a community
    const isUserMember = (community) => {
        if (!currentUser) return false;
        return community.Members && community.Members.includes(currentUser.uid);
    };

    // Check if current user is the creator of a community
    const isUserCreator = (community) => {
        if (!currentUser) return false;
        return community.creator === currentUser.uid;
    };

    const resetForm = () => {
        setCommunityForm({
            name: '',
            description: '',
            locationData: '',
            isPublic: true
        });
    };

    const handleOpenChat = (communityId) => {
        navigation.navigate('CommunityChat', { communityId });
    };

    const renderCommunityItem = ({ item }) => {
        const isMember = isUserMember(item);
        const isCreator = isUserCreator(item);

        return (
            <View style={styles.communityCard}>
                <View style={styles.communityHeader}>
                    <Text style={styles.communityEmoji}>{item.image || '👥'}</Text>
                    <View style={styles.communityInfo}>
                        <Text style={styles.communityName}>{item.Name}</Text>
                        <Text style={styles.communityDescription}>{item.Description}</Text>
                        {item.LocationData && (
                            <Text style={styles.locationText}>📍 {item.LocationData}</Text>
                        )}
                        <Text style={styles.memberCount}>{item.memberCount || 1} members</Text>
                        <Text style={styles.privacyBadge}>
                            {item.isPublic ? 'Public' : 'Private'}
                        </Text>
                        {isCreator && (
                            <Text style={styles.creatorBadge}>👑 Admin</Text>
                        )}
                    </View>
                </View>

                <View style={styles.actionContainer}>
                    {!isMember ? (
                        <TouchableOpacity
                            style={styles.joinButton}
                            onPress={() => handleJoinCommunity(item.id)}
                            disabled={joining === item.id}
                        >
                            {joining === item.id ? (
                                <ActivityIndicator color="#FFFFFF" size="small" />
                            ) : (
                                <Text style={styles.joinButtonText}>Join Community</Text>
                            )}
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.memberActions}>
                            <TouchableOpacity
                                style={styles.chatButton}
                                onPress={() => handleOpenChat(item.id)}
                            >
                                <Text style={styles.chatButtonText}>Open Chat</Text>
                            </TouchableOpacity>
                            
                            {!isCreator && (
                                <TouchableOpacity
                                    style={styles.leaveButton}
                                    onPress={() => handleLeaveCommunity(item.id)}
                                >
                                    <Text style={styles.leaveButtonText}>Leave</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    )}
                </View>
            </View>
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#EC4899" />
                <Text style={styles.loadingText}>Loading communities...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header with Create Button */}
            <View style={styles.header}>
                <Text style={styles.title}>Communities</Text>
                <Text style={styles.subtitle}>
                    Join supportive communities or create your own
                </Text>
                <TouchableOpacity
                    style={styles.createButton}
                    onPress={() => setShowCreateModal(true)}
                >
                    <Text style={styles.createButtonText}>+ Create Community</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={communities}
                renderItem={renderCommunityItem}
                keyExtractor={item => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContainer}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No communities found</Text>
                        <Text style={styles.emptySubText}>
                            Be the first to create a community!
                        </Text>
                    </View>
                }
            />

            {/* Create Community Modal */}
            <Modal
                visible={showCreateModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowCreateModal(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Create Community</Text>
                        
                        <ScrollView style={styles.formContainer}>
                            {/* Community Name */}
                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Community Name *</Text>
                                <TextInput
                                    style={styles.textInput}
                                    placeholder="Enter community name"
                                    value={communityForm.name}
                                    onChangeText={(text) => setCommunityForm(prev => ({ ...prev, name: text }))}
                                />
                            </View>

                            {/* Description */}
                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Description</Text>
                                <TextInput
                                    style={[styles.textInput, styles.textArea]}
                                    placeholder="Describe your community"
                                    value={communityForm.description}
                                    onChangeText={(text) => setCommunityForm(prev => ({ ...prev, description: text }))}
                                    multiline
                                    numberOfLines={3}
                                />
                            </View>

                            {/* Location Data */}
                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Location</Text>
                                <TextInput
                                    style={styles.textInput}
                                    placeholder="Enter location (e.g., Colombo, Sri Lanka)"
                                    value={communityForm.locationData}
                                    onChangeText={(text) => setCommunityForm(prev => ({ ...prev, locationData: text }))}
                                />
                            </View>

                            {/* Privacy Setting */}
                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Privacy Setting</Text>
                                <View style={styles.privacyOptions}>
                                    <TouchableOpacity
                                        style={[
                                            styles.privacyOption,
                                            communityForm.isPublic && styles.privacyOptionSelected
                                        ]}
                                        onPress={() => setCommunityForm(prev => ({ ...prev, isPublic: true }))}
                                    >
                                        <Text style={[
                                            styles.privacyOptionText,
                                            communityForm.isPublic && styles.privacyOptionTextSelected
                                        ]}>
                                            Public
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[
                                            styles.privacyOption,
                                            !communityForm.isPublic && styles.privacyOptionSelected
                                        ]}
                                        onPress={() => setCommunityForm(prev => ({ ...prev, isPublic: false }))}
                                    >
                                        <Text style={[
                                            styles.privacyOptionText,
                                            !communityForm.isPublic && styles.privacyOptionTextSelected
                                        ]}>
                                            Private
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Action Buttons */}
                            <View style={styles.modalActions}>
                                <TouchableOpacity
                                    style={styles.cancelButton}
                                    onPress={() => {
                                        setShowCreateModal(false);
                                        resetForm();
                                    }}
                                    disabled={creating}
                                >
                                    <Text style={styles.cancelButtonText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.createModalButton, creating && styles.createModalButtonDisabled]}
                                    onPress={handleCreateCommunity}
                                    disabled={creating}
                                >
                                    {creating ? (
                                        <ActivityIndicator color="#FFFFFF" size="small" />
                                    ) : (
                                        <Text style={styles.createModalButtonText}>Create</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FDF2F8',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FDF2F8',
    },
    loadingText: {
        marginTop: 12,
        color: '#6B7280',
        fontSize: 16,
    },
    header: {
        padding: 20,
        paddingTop: 60,
        backgroundColor: '#FFFFFF',
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#EC4899',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#6B7280',
        lineHeight: 22,
        marginBottom: 16,
    },
    createButton: {
        backgroundColor: '#8B5CF6',
        borderRadius: 12,
        paddingVertical: 12,
        alignItems: 'center',
    },
    createButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    listContainer: {
        padding: 16,
    },
    communityCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 3,
    },
    communityHeader: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    communityEmoji: {
        fontSize: 40,
        marginRight: 16,
    },
    communityInfo: {
        flex: 1,
    },
    communityName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 4,
    },
    communityDescription: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 8,
        lineHeight: 20,
    },
    locationText: {
        fontSize: 12,
        color: '#8B5CF6',
        fontWeight: '500',
        marginBottom: 4,
    },
    memberCount: {
        fontSize: 12,
        color: '#EC4899',
        fontWeight: '500',
    },
    privacyBadge: {
        fontSize: 12,
        color: '#8B5CF6',
        fontWeight: '500',
        marginTop: 4,
    },
    creatorBadge: {
        fontSize: 11,
        color: '#F59E0B',
        fontWeight: '500',
        marginTop: 2,
    },
    actionContainer: {
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        paddingTop: 16,
    },
    joinButton: {
        backgroundColor: '#EC4899',
        borderRadius: 12,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    joinButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    memberActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    chatButton: {
        backgroundColor: '#8B5CF6',
        borderRadius: 12,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
        flex: 2,
        marginRight: 8,
    },
    chatButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    leaveButton: {
        backgroundColor: '#EF4444',
        borderRadius: 12,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
    },
    leaveButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: 'bold',
    },
    emptyContainer: {
        alignItems: 'center',
        padding: 40,
    },
    emptyText: {
        fontSize: 18,
        color: '#6B7280',
        marginBottom: 8,
    },
    emptySubText: {
        fontSize: 14,
        color: '#9CA3AF',
        textAlign: 'center',
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        maxHeight: '80%',
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#EC4899',
        marginBottom: 20,
        textAlign: 'center',
    },
    formContainer: {
        maxHeight: 400,
    },
    inputContainer: {
        marginBottom: 16,
    },
    label: {
        fontSize: 16,
        fontWeight: '500',
        color: '#1F2937',
        marginBottom: 8,
    },
    textInput: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: '#1F2937',
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    privacyOptions: {
        flexDirection: 'row',
        gap: 12,
    },
    privacyOption: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        padding: 12,
        alignItems: 'center',
    },
    privacyOptionSelected: {
        backgroundColor: '#EC4899',
        borderColor: '#EC4899',
    },
    privacyOptionText: {
        color: '#6B7280',
        fontSize: 16,
    },
    privacyOptionTextSelected: {
        color: '#FFFFFF',
        fontWeight: '500',
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 20,
    },
    cancelButton: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
        padding: 12,
        alignItems: 'center',
    },
    cancelButtonText: {
        color: '#6B7280',
        fontSize: 16,
        fontWeight: '500',
    },
    createModalButton: {
        flex: 2,
        backgroundColor: '#EC4899',
        borderRadius: 8,
        padding: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    createModalButtonDisabled: {
        opacity: 0.6,
    },
    createModalButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default CommunityListScreen;