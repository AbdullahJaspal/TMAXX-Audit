import React, { useState } from 'react';
import { View, Button, SafeAreaView } from 'react-native';
import SquadCreateModal from '@/components/squads/SquadCreateModal';

export default function TestSquadModalScreen() {
  const [visible, setVisible] = useState(false);

  return (
    <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Button title="Show Squad Create Modal" onPress={() => setVisible(true)} />
      <SquadCreateModal
        visible={visible}
        onClose={() => setVisible(false)}
        onCreateSquad={() => setVisible(false)}
      />
    </SafeAreaView>
  );
} 