import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Dimensions, Image } from 'react-native';
import Colors from '@/constants/Colors';
import { X, Hand as HandFist, UserMinus, Crown } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { SquadMember } from '@/contexts/SquadContext';
import { getDisplayName, getAvatarLetter } from '@/lib/api/types';
import { useAnalytics } from '@/contexts/AnalyticsContext';
import { ANALYTICS_EVENTS } from '@/lib/analytics';

type SquadProfileModalProps = {
  visible: boolean;
  onClose: () => void;
  member: SquadMember | null;
  onBoost: (name: string) => void;
  onRemove: (name: string) => void;
  boostedMembers: string[];
};

const SquadProfileModal: React.FC<SquadProfileModalProps> = ({
  visible,
  onClose,
  member,
  onBoost,
  onRemove,
  boostedMembers,
}) => {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { track } = useAnalytics();

  if (!member) return null;

  const displayName = getDisplayName(member.name);
  const avatarLetter = getAvatarLetter(member.name);
  const isBoosted = member.boosted || boostedMembers.includes(displayName);

  const handleBoost = () => {
    // Track boost action from profile modal
    track(ANALYTICS_EVENTS.SQUAD_MEMBER_BOOSTED, {
      boosted_member_name: displayName,
      boosted_member_id: member.user_id,
      boosted_member_streak: member.streak,
      boost_source: 'profile_modal',
    });
    onBoost(displayName);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.cardBackground }]}>
          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: colors.background }]}
            onPress={onClose}
          >
            <X size={20} color={colors.text} />
          </TouchableOpacity>

          <View style={styles.content}>
            <View style={[styles.avatar, { backgroundColor: colors.tint + '20' }]}>
              {member.avatar ? (
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
            </View>

            <Text style={[styles.name, { color: colors.text }]}>
              {displayName}
            </Text>

            {member.is_owner && (
              <View style={[styles.ownerBadge, { backgroundColor: '#FFD700' }]}>
                <Crown size={16} color="#000000" />
                <Text style={styles.ownerBadgeText}>Squad Owner</Text>
              </View>
            )}

            <View style={styles.statsContainer}>
              <View style={[styles.statCard, { backgroundColor: colors.background }]}>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {member.streak}
                </Text>
                <Text style={[styles.statLabel, { color: colors.muted }]}>
                  Day Streak 🔥
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.boostButton,
                {
                  backgroundColor: isBoosted ? colors.background : colors.tint,
                  borderWidth: isBoosted ? 1 : 0,
                  borderColor: colors.tint,
                },
              ]}
              onPress={handleBoost}
              disabled={isBoosted}
            >
              <HandFist size={20} color={isBoosted ? colors.tint : '#fff'} />
              <Text
                style={[
                  styles.boostText,
                  { color: isBoosted ? colors.tint : '#fff' },
                ]}
              >
                {isBoosted ? 'Boosted!' : 'Boost Energy'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.removeButton, 
                { 
                  borderColor: colors.error,
                  opacity: member.is_owner ? 0.5 : 1,
                  backgroundColor: member.is_owner ? colors.background : 'transparent'
                }
              ]}
              onPress={() => {
                if (!member.is_owner) {
                  onRemove(displayName);
                  onClose();
                }
              }}
              disabled={member.is_owner}
            >
              <UserMinus size={20} color={colors.error} style={{ opacity: member.is_owner ? 0.5 : 1 }} />
              <Text style={[
                styles.removeText, 
                { 
                  color: colors.error,
                  opacity: member.is_owner ? 0.5 : 1 
                }
              ]}>
                {member.is_owner ? 'Cannot Remove Owner' : 'Remove from Squad'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: Dimensions.get('window').width - 48,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  content: {
    width: '100%',
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
  },
  name: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
    width: '100%',
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
  },
  boostButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  boostText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  removeText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  avatarLetterContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 40,
    backgroundColor: '#3FB4F6',
  },
  ownerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 24,
    gap: 6,
  },
  ownerBadgeText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#000000',
  },
});

export default SquadProfileModal;