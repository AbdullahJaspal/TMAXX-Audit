import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Platform,
  StatusBar,
  Image,
} from 'react-native';
import Colors from '@/constants/Colors';
import {
  Users,
  Trophy,
  Zap,
  UserPlus as UserPlus2,
  Hand as HandFist,
  MessageCircle,
  Heart,
  Check,
} from 'lucide-react-native';
import SquadProfileModal from '@/components/squads/SquadProfileModal';
import SquadInviteModal from '@/components/squads/SquadInviteModal';
import SquadEmptyState from '@/components/squads/SquadEmptyState';
import SquadCreateModal from '@/components/squads/SquadCreateModal';
import SquadJoinModal from '@/components/squads/SquadJoinModal';
import { useSquad } from '@/contexts/SquadContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useScreenTracking } from '@/components/analytics/withScreenTracking';
import { useAnalytics } from '@/contexts/AnalyticsContext';
import { useSentry } from '@/contexts/SentryContext';
import { logError } from '@/lib/sentry';
import { SCREEN_NAMES, ANALYTICS_EVENTS } from '@/lib/analytics';
import type { SquadMember } from '@/contexts/SquadContext';
import { getDisplayName, getAvatarLetter } from '@/lib/api/types';
import { formatRelativeTime } from '@/lib/utils/dateFormatters';
import { updateSquadName, boostUser, removeSquadMember } from '@/lib/supabase/squad';
import { useToast } from '@/contexts/ToastContext';

export default function SquadScreen() {
  const {
    squadMembers,
    hasJoinedSquad,
    refreshSquad,
    squadName,
    squadStreak,
    squadHabits,
    squadEnergy,
    feed,
    createSquad,
    squadId,
  } = useSquad();
  const { theme } = useTheme();
  const { showToast } = useToast();
  const { track } = useAnalytics();
  const { addBreadcrumb } = useSentry();
  const colors = Colors[theme];

  // Track screen view
  useScreenTracking(SCREEN_NAMES.SQUAD);

  // Test event to debug squad analytics
  React.useEffect(() => {
    track('squad_screen_loaded', {
      has_squad: hasJoinedSquad,
      squad_id: squadId,
      squad_name: squadName,
    });
  }, [hasJoinedSquad, squadId, squadName]);

  const [boostedMembers, setBoostedMembers] = useState<string[]>([]);
  const [likedPosts, setLikedPosts] = useState<string[]>([]);
  const [selectedMember, setSelectedMember] = useState<SquadMember | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(squadName);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshSquad();
    setRefreshing(false);
  }, [refreshSquad]);

  const handleCreateSquadClick = () => {
    // Track Create Squad button click
    track(ANALYTICS_EVENTS.SQUAD_CREATE_BUTTON_CLICKED, {
      screen: 'squad',
      has_existing_squad: hasJoinedSquad,
    });
    setShowCreateModal(true);
  };

  const handleJoinSquadClick = () => {
    // Track Join Squad button click
    track(ANALYTICS_EVENTS.SQUAD_JOIN_BUTTON_CLICKED, {
      screen: 'squad',
      has_existing_squad: hasJoinedSquad,
    });
    setShowJoinModal(true);
  };

  const handleBoost = async (memberName: string) => {
    if (!boostedMembers.includes(memberName) && squadId) {
      try {
        // Find the member's ID from the squadMembers array
        const member = squadMembers.find(m => getDisplayName(m.name) === memberName);
        if (!member) {
          showToast('Member not found', 'error');
          return;
        }

        const { error } = await boostUser(member.user_id, squadId);
        if (error) {
          showToast(error.message, 'error');
          return;
        }

        // Track successful boost
        track(ANALYTICS_EVENTS.SQUAD_MEMBER_BOOSTED, {
          boosted_member_name: memberName,
          boosted_member_id: member.user_id,
          boosted_member_streak: member.streak,
          squad_id: squadId,
          squad_name: squadName,
          boost_source: 'squad_member_list',
        });

        setBoostedMembers([...boostedMembers, memberName]);
        await refreshSquad();
        showToast(`You boosted ${memberName}'s energy! 💪`, 'success');
      } catch (err) {
        logError('Failed to boost squad member', err instanceof Error ? err : new Error(String(err)), {
          boosted_member_name: memberName,
          squad_id: squadId,
          context: 'squad_member_boost'
        });
        showToast('Failed to boost member. Please try again.', 'error');
      }
    }
  };

  const handleLike = (postId: string) => {
    if (!likedPosts.includes(postId)) {
      setLikedPosts([...likedPosts, postId]);
    }
  };

  const openProfile = (member: SquadMember) => {
    // Track profile opening
    track(ANALYTICS_EVENTS.SQUAD_PROFILE_OPENED, {
      member_name: getDisplayName(member.name),
      member_id: member.user_id,
      member_is_owner: member.is_owner,
      member_streak: member.streak,
      boost_source: 'squad_member_list',
    });
    setSelectedMember(member);
    setShowProfileModal(true);
  };

  const handleSaveSquadName = async () => {
    if (editedName.trim() && squadId) {
      try {
        const { error } = await updateSquadName(squadId, editedName.trim());
        if (error) {
          showToast(error.message, 'error');
          return;
        }
        await refreshSquad();
        setIsEditingName(false);
        showToast('Squad name updated successfully', 'success');
      } catch (err) {
        logError('Failed to update squad name', err instanceof Error ? err : new Error(String(err)), {
          squad_id: squadId,
          new_squad_name: editedName.trim(),
          context: 'squad_name_update'
        });
        showToast('Failed to update squad name. Please try again.', 'error');
      }
    }
  };

  const handleSquadCreated = async (name: string) => {
    try {
      // Track actual squad creation
      track(ANALYTICS_EVENTS.SQUAD_CREATED, {
        squad_name: name,
        creation_time: new Date().toISOString(),
        creation_source: 'squad_screen',
      });
      
      await createSquad(name);
      setShowCreateModal(false);
      setShowInviteModal(true);
    } catch (error) {
      logError('Failed to create squad', error instanceof Error ? error : new Error(String(error)), {
        squad_name: name,
        context: 'squad_creation'
      });
      // Track failed squad creation
      track(ANALYTICS_EVENTS.ERROR_OCCURRED, {
        error_context: 'squad_creation',
        squad_name: name,
        error_message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  const handleSquadJoined = async (squadCode: string) => {
    try {
      // Track actual squad joining
      track(ANALYTICS_EVENTS.SQUAD_JOINED, {
        squad_code: squadCode,
        join_time: new Date().toISOString(),
        join_source: 'squad_screen',
      });
    } catch (error) {
      logError('Error joining squad', error instanceof Error ? error : new Error(String(error)), {
        squad_code: squadCode,
        context: 'squad_joining'
      });
      // Track failed squad joining
      track(ANALYTICS_EVENTS.ERROR_OCCURRED, {
        error_context: 'squad_joining',
        squad_code: squadCode,
        error_message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  const handleRemoveMember = async (memberName: string) => {
    if (!squadId) return;
    try {
      const member = squadMembers.find(m => getDisplayName(m.name) === memberName);
      if (!member) {
        showToast('Member not found', 'error');
        return;
      }

      const { error } = await removeSquadMember(squadId, member.user_id);
      if (error) {
        showToast(error.message, 'error');
        return;
      }

      await refreshSquad();
      showToast(`${memberName} has been removed from the squad`, 'success');
      setShowProfileModal(false);
      setSelectedMember(null);
    } catch (err) {
      logError('Failed to remove squad member', err instanceof Error ? err : new Error(String(err)), {
        squad_id: squadId,
        member_name: memberName,
        context: 'squad_member_removal'
      });
      showToast('Failed to remove member. Please try again.', 'error');
    }
  };

  const renderMemberAvatar = (member: SquadMember) => {
    const displayName = getDisplayName(member.name);
    const avatarLetter = getAvatarLetter(member.name);

    return (
      <TouchableOpacity
        key={member.name}
        style={[styles.memberItem]}
        onPress={() => openProfile(member)}
      >
        <View style={[styles.avatar, { backgroundColor: colors.tint + '20' }]}>
          {member.avatar && typeof member.avatar === 'string' && member.avatar.trim() ? (
            <Image 
              source={{ uri: member.avatar }} 
              style={styles.avatarImage}
            />
          ) : (
            <View style={[styles.avatarLetterContainer, { backgroundColor: colors.tint }]}>
              <Text style={[styles.avatarText, { color: '#FFFFFF' }]}>
                {avatarLetter}
              </Text>
            </View>
          )}
          <TouchableOpacity
            style={[
              styles.boostButton,
              {
                backgroundColor: member.boosted || boostedMembers.includes(displayName)
                  ? colors.tint
                  : colors.tint + '20',
              },
            ]}
            onPress={async (e) => {
              e.stopPropagation();
              // Track boost action from member avatar
              track(ANALYTICS_EVENTS.SQUAD_MEMBER_BOOSTED, {
                boosted_member_name: displayName,
                boosted_member_id: member.user_id,
                boosted_member_streak: member.streak,
                boost_source: 'member_avatar',
              });
              await handleBoost(displayName);
            }}
            disabled={member.boosted || boostedMembers.includes(displayName)}
          >
            <HandFist
              size={14}
              color={member.boosted || boostedMembers.includes(displayName) ? '#fff' : colors.tint}
            />
          </TouchableOpacity>
        </View>
        <Text style={[styles.memberName, { color: colors.text }]}>
          {displayName}
        </Text>
        <Text style={[styles.streakText, { color: colors.success }]}>
          {member.streak > 0 ? `🔥 ${member.streak}` : ''}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderFeedItem = (feedItem: typeof feed[0], index: number) => {
    const displayName = getDisplayName(feedItem.name);
    const avatarLetter = getAvatarLetter(feedItem.name);
    const formattedTime = formatRelativeTime(feedItem.time);

    return (
      <View
        key={`${displayName}-${index}`}
        style={[styles.feedItem, { borderBottomColor: colors.border }]}
      >
        <View style={styles.feedHeader}>
          <View style={styles.feedUser}>
            <View style={[styles.feedAvatar, { backgroundColor: colors.tint + '20' }]}>
              {feedItem.avatar && typeof feedItem.avatar === 'string' && feedItem.avatar.trim() ? (
                <Image 
                  source={{ uri: feedItem.avatar }} 
                  style={styles.feedAvatarImage}
                />
              ) : (
                <View style={[styles.feedAvatarLetterContainer, { backgroundColor: colors.tint }]}>
                  <Text style={[styles.feedAvatarText, { color: '#FFFFFF' }]}>
                    {avatarLetter}
                  </Text>
                </View>
              )}
            </View>
            <View>
              <Text style={[styles.feedName, { color: colors.text }]}>
                {displayName}
              </Text>
              <Text style={[styles.feedTime, { color: colors.muted }]}>
                {formattedTime}
              </Text>
            </View>
          </View>
        </View>
        <Text style={[styles.feedContent, { color: colors.text }]}>
          {feedItem.text}
        </Text>
        <View style={styles.feedActions}>
          <TouchableOpacity 
            style={[styles.boostAction, { backgroundColor: colors.tint + '20' }]}
            onPress={async () => {
              // Track boost action from feed
              track(ANALYTICS_EVENTS.SQUAD_MEMBER_BOOSTED, {
                boosted_member_name: displayName,
                boost_source: 'squad_feed',
              });
              await handleBoost(displayName);
            }}
            disabled={boostedMembers.includes(displayName)}
          >
            <HandFist size={18} color={colors.tint} />
            <Text style={[styles.boostText, { color: colors.tint }]}>
              {boostedMembers.includes(displayName) ? 'Boosted!' : 'Boost'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 8 : 0, backgroundColor: colors.background }}>
      { !hasJoinedSquad ? (
        // -------- EMPTY STATE --------
        <SquadEmptyState
          onCreateSquad={handleCreateSquadClick}
          onJoinSquad={handleJoinSquadClick}
          onInvite={() => setShowInviteModal(true)}
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      ) : (
        // -------- SQUAD CONTENT --------
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.tint}
              colors={[colors.tint]}
            />
          }
        >
          <View style={styles.content}>
            <View style={styles.titleContainer}>
              {isEditingName ? (
                <View style={styles.editNameContainer}>
                  <TextInput
                    style={[
                      styles.nameInput,
                      {
                        color: colors.text,
                        backgroundColor: colors.cardBackground,
                      },
                    ]}
                    value={editedName}
                    onChangeText={setEditedName}
                    autoFocus
                    onBlur={handleSaveSquadName}
                    onSubmitEditing={handleSaveSquadName}
                  />
                  <TouchableOpacity
                    style={[styles.saveButton, { backgroundColor: colors.tint }]}
                    onPress={handleSaveSquadName}
                  >
                    <Check size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={() => {
                    setEditedName(squadName);
                    setIsEditingName(true);
                  }}
                >
                  <Text style={[styles.title, { color: colors.text }]}>
                    {squadName}
                  </Text>
                </TouchableOpacity>
              )}
              <Text style={[styles.subtitle, { color: colors.muted }]}>
                Consistency is contagious. Boost energy together.
              </Text>
            </View>

            {/* Members Row */}
            <View style={styles.topSection}>
              <View style={[styles.membersCard, { backgroundColor: colors.cardBackground }]}>
                <View style={styles.membersContainer}>
                  {squadMembers.map(renderMemberAvatar)}
                  <TouchableOpacity
                    style={styles.inviteButton}
                    onPress={() => {
                      // Track invite button click
                      track(ANALYTICS_EVENTS.SQUAD_INVITE_BUTTON_CLICKED, {
                        squad_id: squadId,
                        squad_name: squadName,
                        squad_member_count: squadMembers.length,
                        invite_source: 'squad_member_list',
                      });
                      setShowInviteModal(true);
                    }}
                  >
                    <View style={[styles.avatar, { backgroundColor: colors.border + '40' }]}>
                      <UserPlus2 size={20} color={colors.tint} />
                    </View>
                    <Text style={[styles.inviteText, { color: colors.tint }]}>Invite</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Overview */}
              <View style={[styles.overviewCard, { backgroundColor: colors.cardBackground }]}>
                <View style={styles.milestoneGrid}>
                  <View style={styles.milestoneItem}>
                    <Text style={styles.milestoneIcon}>🏆</Text>
                    <Text style={[styles.milestoneValue, { color: colors.text }]}>
                      {squadHabits}
                    </Text>
                    <Text style={[styles.milestoneLabel, { color: colors.muted }]}>
                      Total Habits
                    </Text>
                  </View>
                  <View style={styles.milestoneItem}>
                    <Text style={styles.milestoneIcon}>🔥</Text>
                    <Text style={[styles.milestoneValue, { color: colors.text }]}>
                      {squadStreak}
                    </Text>
                    <Text style={[styles.milestoneLabel, { color: colors.muted }]}>
                      Squad Streak
                    </Text>
                  </View>
                  <View style={styles.milestoneItem}>
                    <Text style={styles.milestoneIcon}>🚀</Text>
                    <Text style={[styles.milestoneValue, { color: colors.text }]}>
                      {squadEnergy}%
                    </Text>
                    <Text style={[styles.milestoneLabel, { color: colors.muted }]}>
                      Energy Boost
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Feed */}
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Squad Feed</Text>
            <View style={[styles.feedCard, { backgroundColor: colors.cardBackground }]}>
              {(Array.isArray(feed) ? feed : []).map((item, index) => renderFeedItem(item, index))}
            </View>
          </View>
        </ScrollView>
      )}


      {/* Modals */}
      <SquadCreateModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreateSquad={handleSquadCreated}
      />

      <SquadJoinModal
        visible={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        onSquadJoined={handleSquadJoined}
      />

      <SquadInviteModal
        visible={showInviteModal}
        onClose={() => setShowInviteModal(false)}
      />

      <SquadProfileModal
        visible={showProfileModal}
        onClose={() => {
          setShowProfileModal(false);
          setSelectedMember(null);
        }}
        member={selectedMember}
        onBoost={handleBoost}
        onRemove={handleRemoveMember}
        boostedMembers={boostedMembers}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingTop: 40 },
  titleContainer: { marginBottom: 24 },
  title: { fontSize: 28, fontFamily: 'Inter-Bold', marginBottom: 4 },
  subtitle: { fontSize: 16, fontFamily: 'Inter-Regular' },
  editNameContainer: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 },
  nameInput: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 28,
    fontFamily: 'Inter-Bold',
  },
  saveButton: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  topSection: { flexDirection: 'column', gap: 12, marginBottom: 24 },
  membersCard: {
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  membersContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  memberItem: { alignItems: 'center', width: 60 },
  avatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  avatarText: { fontSize: 16, fontFamily: 'Inter-SemiBold' },
  boostButton: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberName: { fontSize: 12, fontFamily: 'Inter-SemiBold', marginTop: 6, marginBottom: 1, textAlign: 'center' },
  streakText: { fontSize: 12, fontFamily: 'Inter-Medium' },
  inviteButton: { alignItems: 'center', width: 60 },
  inviteText: { fontSize: 12, fontFamily: 'Inter-Medium', marginTop: 6 },
  overviewCard: {
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  milestoneGrid: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  milestoneItem: { alignItems: 'center', flex: 1 },
  milestoneIcon: { fontSize: 20, marginBottom: 2 },
  milestoneValue: { fontSize: 20, fontFamily: 'Inter-Bold', marginVertical: 1 },
  milestoneLabel: { fontSize: 11, fontFamily: 'Inter-Medium', textAlign: 'center' },
  sectionTitle: { fontSize: 20, fontFamily: 'Inter-SemiBold', marginBottom: 16 },
  feedCard: { borderRadius: 16, overflow: 'hidden', marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  feedItem: { padding: 16, borderBottomWidth: 1 },
  feedHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  feedUser: { flexDirection: 'row', alignItems: 'center' },
  feedAvatar: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  feedAvatarText: { fontSize: 16, fontFamily: 'Inter-SemiBold' },
  feedName: { fontSize: 15, fontFamily: 'Inter-SemiBold', marginBottom: 2 },
  feedTime: { fontSize: 13, fontFamily: 'Inter-Regular' },
  achievementBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  achievementText: { fontSize: 12, fontFamily: 'Inter-Medium' },
  feedContent: { fontSize: 15, fontFamily: 'Inter-Regular', lineHeight: 22, marginBottom: 16 },
  feedActions: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  actionButton: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionText: { fontSize: 14, fontFamily: 'Inter-Medium' },
  boostAction: { flexDirection: 'row', alignItems: 'center', gap: 6, marginLeft: 'auto', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  boostText: { fontSize: 14, fontFamily: 'Inter-Medium' },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 22,
  },
  feedAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  avatarLetterContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
  },
  feedAvatarLetterContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
});
