import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    FlatList,
    StyleSheet,
    Alert,
    ActivityIndicator,
    Image
} from 'react-native';

const CommunityListScreen = ({ navigation }) => {
    const [communities, setCommunities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [joining, setJoining] = useState(null);

    // Mock data - replace with actual API call
    const mockCommunities = [
        {
            id: '1',
            name: 'Teens Support Group',
            description: 'A safe space for teenagers to discuss period health',
            memberCount: 1250,
            image: '👧',
            isPublic: true
        },
        {
            id: '2',
            name: 'PCOS Warriors',
            description: 'Support group for people with PCOS',
            memberCount: 890,
            image: '💪',
            isPublic: true
        },
        {
            id: '3',
            name: 'First Time Moms',
            description: 'Postpartum and period discussions for new moms',
            memberCount: 2100,
            image: '👶',
            isPublic: false
        },
        {
            id: '4',
            name: 'Endometriosis Support',
            description: 'Community for endometriosis awareness and support',
            memberCount: 1500,
            image: '❤️',
            isPublic: true
        }
    ];

    // Mock user communities - replace with actual API call
    const mockUserCommunities = [
        { communityId: '1', status: 'approved' },
        { communityId: '2', status: 'pending' }
    ];

    useEffect(() => {
        loadCommunities();
    }, []);

    const loadCommunities = async () => {
        try {
            // Simulate API call
            setTimeout(() => {
                const communitiesWithStatus = mockCommunities.map(community => {
                    const userCommunity = mockUserCommunities.find(uc => uc.communityId === community.id);
                    return {
                        ...community,
                        userStatus: userCommunity ? userCommunity.status : 'not_joined'
                    };
                });
                setCommunities(communitiesWithStatus);
                setLoading(false);
            }, 1000);
        } catch (error) {
            Alert.alert('Error', 'Failed to load communities');
            setLoading(false);
        }
    };

    const handleJoinCommunity = async (communityId) => {
        setJoining(communityId);
        
        try {
            // Simulate API call to join community
            setTimeout(() => {
                setCommunities(prev => prev.map(community => 
                    community.id === communityId 
                        ? { ...community, userStatus: 'pending' }
                        : community
                ));
                setJoining(null);
                Alert.alert('Success', 'Join request sent! Waiting for admin approval.');
            }, 1500);
        } catch (error) {
            Alert.alert('Error', 'Failed to join community');
            setJoining(null);
        }
    };

    const handleOpenChat = (communityId) => {
        navigation.navigate('CommunityChat', { communityId });
    };

    const renderCommunityItem = ({ item }) => (
        <View style={styles.communityCard}>
            <View style={styles.communityHeader}>
                <Text style={styles.communityEmoji}>{item.image}</Text>
                <View style={styles.communityInfo}>
                    <Text style={styles.communityName}>{item.name}</Text>
                    <Text style={styles.communityDescription}>{item.description}</Text>
                    <Text style={styles.memberCount}>{item.memberCount.toLocaleString()} members</Text>
                    <Text style={styles.privacyBadge}>
                        {item.isPublic ? 'Public' : 'Private'}
                    </Text>
                </View>
            </View>

            <View style={styles.actionContainer}>
                {item.userStatus === 'not_joined' && (
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
                )}

                {item.userStatus === 'pending' && (
                    <View style={styles.pendingContainer}>
                        <Text style={styles.pendingText}>Pending Approval</Text>
                        <Text style={styles.pendingSubText}>Waiting for admin</Text>
                    </View>
                )}

                {item.userStatus === 'approved' && (
                    <TouchableOpacity
                        style={styles.chatButton}
                        onPress={() => handleOpenChat(item.id)}
                    >
                        <Text style={styles.chatButtonText}>Open Chat</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );

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
            <View style={styles.header}>
                <Text style={styles.title}>Communities</Text>
                <Text style={styles.subtitle}>
                    Join supportive communities and connect with others
                </Text>
            </View>

            <FlatList
                data={communities}
                renderItem={renderCommunityItem}
                keyExtractor={item => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContainer}
            />
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
    pendingContainer: {
        alignItems: 'center',
        paddingVertical: 12,
        backgroundColor: '#FEF3C7',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#F59E0B',
    },
    pendingText: {
        color: '#92400E',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    pendingSubText: {
        color: '#92400E',
        fontSize: 12,
        opacity: 0.8,
    },
    chatButton: {
        backgroundColor: '#8B5CF6',
        borderRadius: 12,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    chatButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default CommunityListScreen;