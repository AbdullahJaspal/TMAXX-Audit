import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSentry } from '@/contexts/SentryContext';

export default function SentryTest() {
  const { captureError, captureMessage, addBreadcrumb, nativeCrash, isReady } = useSentry();

  const testError = () => {
    try {
      throw new Error('My first Sentry error!');
    } catch (error) {
      captureError(error as Error, {
        tags: { test: 'manual_error' },
        extra: { timestamp: new Date().toISOString() },
      });
    }
  };

  const testMessage = () => {
    captureMessage('Test message from Sentry', 'info', {
      tags: { test: 'manual_message' },
      extra: { timestamp: new Date().toISOString() },
    });
  };

  const testBreadcrumb = () => {
    addBreadcrumb({
      message: 'User clicked test button',
      category: 'user_action',
      level: 'info',
      data: { button: 'test_breadcrumb', timestamp: new Date().toISOString() },
    });
  };

  const testNativeCrash = () => {
    nativeCrash();
  };

  if (!isReady) {
    return (
      <View style={styles.container}>
        <Text style={styles.status}>Sentry: Initializing...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.status}>Sentry: Ready ✅</Text>
      
      <TouchableOpacity style={styles.button} onPress={testError}>
        <Text style={styles.buttonText}>Test Error</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.button} onPress={testMessage}>
        <Text style={styles.buttonText}>Test Message</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.button} onPress={testBreadcrumb}>
        <Text style={styles.buttonText}>Test Breadcrumb</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.dangerButton} onPress={testNativeCrash}>
        <Text style={styles.buttonText}>Test Native Crash</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    margin: 10,
  },
  status: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    marginVertical: 5,
  },
  dangerButton: {
    backgroundColor: '#FF3B30',
    padding: 12,
    borderRadius: 8,
    marginVertical: 5,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '600',
  },
}); 