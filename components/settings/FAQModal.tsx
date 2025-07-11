import React, { useEffect, useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking } from 'react-native';
import Colors from '@/constants/Colors';
import { X, Mail } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { getFAQs, FAQ } from '@/lib/supabase/settings';

type FAQModalProps = {
  visible: boolean;
  onClose: () => void;
};

export default function FAQModal({ visible, onClose }: FAQModalProps) {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      fetchFAQs();
    }
  }, [visible]);

  const fetchFAQs = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { faqs: fetchedFaqs, error } = await getFAQs();
      
      if (error) {
        console.error('Error fetching FAQs:', error);
        setError('Failed to load FAQs. Please try again.');
        return;
      }
      
      setFaqs(fetchedFaqs || []);
    } catch (err) {
      console.error('Error in fetchFAQs:', err);
      setError('Failed to load FAQs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleContact = () => {
    Linking.openURL('mailto:support@tmaxx.app');
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: colors.cardBackground }]}
            onPress={onClose}
          >
            <X size={20} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>
            Help & Support
          </Text>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.faqSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Frequently Asked Questions
            </Text>
            
            {loading && (
              <Text style={[styles.loadingText, { color: colors.muted }]}>
                Loading FAQs...
              </Text>
            )}
            
            {error && (
              <Text style={[styles.errorText, { color: colors.error }]}>
                {error}
              </Text>
            )}
            
            {!loading && !error && faqs.length === 0 && (
              <Text style={[styles.emptyText, { color: colors.muted }]}>
                No FAQs available at the moment.
              </Text>
            )}
            
            {!loading && !error && faqs.map((faq) => (
              <View 
                key={faq.id}
                style={[
                  styles.faqItem,
                  { backgroundColor: colors.cardBackground }
                ]}
              >
                <Text style={[styles.question, { color: colors.text }]}>
                  {faq.question}
                </Text>
                <Text style={[styles.answer, { color: colors.muted }]}>
                  {faq.answer}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.contactSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Need More Help?
            </Text>
            <TouchableOpacity
              style={[styles.contactButton, { backgroundColor: colors.tint }]}
              onPress={handleContact}
            >
              <Mail size={20} color="#fff" />
              <Text style={styles.contactButtonText}>
                Contact Support
              </Text>
            </TouchableOpacity>
            <Text style={[styles.contactInfo, { color: colors.muted }]}>
              Our support team typically responds within 24 hours
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 8,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  faqSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 16,
  },
  faqItem: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  question: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
  },
  answer: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
  },
  contactSection: {
    marginBottom: 40,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
  },
  contactButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  contactInfo: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
  loadingText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    paddingVertical: 20,
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    paddingVertical: 20,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    paddingVertical: 20,
  },
});