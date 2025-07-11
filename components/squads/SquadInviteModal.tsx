import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Share, Platform, KeyboardAvoidingView } from 'react-native';
import Colors from '@/constants/Colors';
import { Copy, Share as ShareIcon, X } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useSquad } from '@/contexts/SquadContext';
import { useAnalytics } from '@/contexts/AnalyticsContext';
import { ANALYTICS_EVENTS } from '@/lib/analytics';

type SquadInviteModalProps = {
  visible: boolean;
  onClose: () => void;
};

const SquadInviteModal: React.FC<SquadInviteModalProps> = ({
  visible,
  onClose,
}) => {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { squadData } = useSquad();
  const { track } = useAnalytics();
  const [copied, setCopied] = useState(false);
  const [copiedMsg, setCopiedMsg] = useState(false);

  if (!visible) return null;

  const squadCode = squadData?.invite_code || '';
  const inviteMessage = `Join my Squad on Tmaxx and let's level up together. 💪 Download Tmaxx and use code ${squadCode} to join me! https://tmaxx.app/squad`;

  const handleCopy = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(squadCode);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
    
    // Track copy code action
    track(ANALYTICS_EVENTS.SQUAD_INVITE_CODE_COPIED, {
      squad_code: squadCode,
      squad_id: squadData?.squad_id,
      squad_name: squadData?.name,
      copy_source: 'invite_modal',
    });
  };

  const handleCopyMessage = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(inviteMessage);
    }
    setCopiedMsg(true);
    setTimeout(() => setCopiedMsg(false), 1500);
    
    // Track copy invite message action
    track(ANALYTICS_EVENTS.SQUAD_INVITE_MESSAGE_COPIED, {
      squad_code: squadCode,
      squad_id: squadData?.squad_id,
      squad_name: squadData?.name,
      copy_source: 'invite_modal',
    });
  };

  const handleShare = async () => {
    try {
      await Share.share({ message: inviteMessage });
      
      // Track share menu opened
      track(ANALYTICS_EVENTS.SQUAD_SHARE_MENU_OPENED, {
        squad_code: squadCode,
        squad_id: squadData?.squad_id,
        squad_name: squadData?.name,
        share_source: 'invite_modal',
      });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent={true}
      presentationStyle="overFullScreen"
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { backgroundColor: colors.cardBackground }]}>
          <Text style={[styles.title, { color: colors.text }]}>Invite Friends to Your Squad</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>Share your squad code with friends to build your inner circle</Text>

          <View style={[styles.codeBox, { backgroundColor: colors.background }]}>
            <Text style={[styles.code, { color: colors.text }]}>{squadCode}</Text>
            <TouchableOpacity style={[styles.copyButton, { backgroundColor: colors.tint }]} onPress={handleCopy}>
              <Copy size={18} color="#fff" />
              <Text style={styles.copyButtonText}>{copied ? 'Copied!' : 'Copy Code'}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={[styles.shareButton, { backgroundColor: colors.tint }]} onPress={handleShare}>
            <ShareIcon size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.shareButtonText}>Open Share Menu</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.copyMsgButton, { borderColor: colors.border }]} onPress={handleCopyMessage}>
            <Copy size={18} color={colors.text} style={{ marginRight: 8 }} />
            <Text style={[styles.copyMsgButtonText, { color: colors.text }]}>{copiedMsg ? 'Copied!' : 'Copy Invite Message'}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onClose} style={styles.maybeLaterButton}>
            <Text style={[styles.maybeLaterText, { color: colors.muted }]}>Maybe Later</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContainer: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  title: {
    fontSize: 22,
    fontFamily: 'Inter-Bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    marginBottom: 20,
    color: '#7B8CA6',
  },
  codeBox: {
    width: '100%',
    borderRadius: 16,
    padding: 18,
    marginBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 0,
  },
  code: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    letterSpacing: 2,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3FB4F6',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginLeft: 8,
  },
  copyButtonText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 6,
  },
  shareButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    marginBottom: 12,
    marginTop: 2,
  },
  shareButtonText: {
    color: '#fff',
    fontSize: 17,
    fontFamily: 'Inter-SemiBold',
  },
  copyMsgButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: 10,
    backgroundColor: 'transparent',
  },
  copyMsgButtonText: {
    fontSize: 17,
    fontFamily: 'Inter-SemiBold',
  },
  maybeLaterButton: {
    marginTop: 6,
    alignSelf: 'center',
  },
  maybeLaterText: {
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    color: '#7B8CA6',
    textAlign: 'center',
  },
});

export default SquadInviteModal;