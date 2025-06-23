import { db } from '@/src/config/firebase';
import { useAuth } from '@/src/contexts/AuthContext';
import { rescheduleAllUserNotifications } from '@/src/notification/notification';
import { useRouter } from 'expo-router';
import { collection, doc, getDoc, getDocs, query, setDoc, where } from 'firebase/firestore';
import React, { useEffect } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { Button, Divider, IconButton, Switch, Text, TextInput } from 'react-native-paper';

interface NotificationSettings {
  isRemindersEnabled: boolean;
  advanceTimeMinutes: number;
}

const SettingsScreen = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [isRemindersEnabled, setIsRemindersEnabled] = React.useState(false);
  const [advanceTimeMinutes, setAdvanceTimeMinutes] = React.useState('15');
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);

  // Carregar configurações do usuário
  useEffect(() => {
    const loadSettings = async () => {
      if (!user) return;

      try {
        const userDoc = doc(db, 'users', user.uid);
        const userSnapshot = await getDoc(userDoc);
        
        if (userSnapshot.exists()) {
          const data = userSnapshot.data();
          const settings = data.notificationSettings as NotificationSettings;
          
          if (settings) {
            setIsRemindersEnabled(settings.isRemindersEnabled || false);
            setAdvanceTimeMinutes(settings.advanceTimeMinutes?.toString() || '15');
          }
        }
      } catch (error) {
        console.error('Erro ao carregar configurações:', error);
      }
    };

    loadSettings();
  }, [user]);

  const handleSave = async () => {
    if (!user) {
      Alert.alert('Erro', 'Usuário não autenticado');
      return;
    }

    const advanceTime = parseInt(advanceTimeMinutes);
    if (isNaN(advanceTime) || advanceTime < 0 || advanceTime > 120) {
      Alert.alert('Erro', 'O tempo de antecedência deve estar entre 0 e 120 minutos');
      return;
    }

    setIsSaving(true);

    try {
      const settings: NotificationSettings = {
        isRemindersEnabled,
        advanceTimeMinutes: advanceTime,
      };

      const userDoc = doc(db, 'users', user.uid);
      await setDoc(userDoc, { 
        notificationSettings: settings,
        updatedAt: new Date()
      }, { merge: true });

      // Reagendar notificações com as novas configurações
      try {
        // Buscar todos os medicamentos do usuário
        const medicinesQuery = query(
          collection(db, 'medicamentos'),
          where('userId', '==', user.uid)
        );
        const medicinesSnapshot = await getDocs(medicinesQuery);
        const medicines = medicinesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Reagendar notificações
        await rescheduleAllUserNotifications(user.uid, medicines);
      } catch (notificationError) {
        console.error('Erro ao reagendar notificações:', notificationError);
        // Não falhar o salvamento se houver erro nas notificações
      }

      Alert.alert(
        'Sucesso', 
        'Configurações salvas com sucesso!',
        [{ text: 'OK', onPress: () => router.push('/profile') }]
      );

    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      Alert.alert('Erro', 'Não foi possível salvar as configurações');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAdvanceTimeChange = (text: string) => {
    // Permitir apenas números
    const cleaned = text.replace(/[^\d]/g, '');
    setAdvanceTimeMinutes(cleaned);
  };

  return (
    <View style={styles.container}>
      {/* Cabeçalho */}
      <View style={styles.header}>
        <IconButton icon="arrow-left" size={24} onPress={() => router.push('/profile')} />
        <Text variant="headlineSmall" style={styles.headerTitle}>Notificações</Text>
      </View>

      {/* Lembretes de Medicamentos */}
      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>Lembretes de Medicamentos</Text>
        <View style={styles.optionItem}>
          <View style={styles.optionTextContainer}>
            <Text style={styles.optionTitle}>Ativar Lembretes</Text>
            <Text style={styles.optionDescription}>
              Receba notificações para tomar seus medicamentos
            </Text>
          </View>
          <Switch
            value={isRemindersEnabled}
            onValueChange={setIsRemindersEnabled}
          />
        </View>
        <Divider />
      </View>

      {/* Configurações de Lembretes */}
      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>Configurações de Lembretes</Text>
        <View style={styles.optionItem}>
          <View style={styles.optionTextContainer}>
            <Text style={styles.optionTitle}>Tempo de Antecedência</Text>
            <Text style={styles.optionDescription}>
              Minutos antes do horário para receber o lembrete
            </Text>
          </View>
          <TextInput
            value={advanceTimeMinutes}
            onChangeText={handleAdvanceTimeChange}
            keyboardType="numeric"
            style={styles.timeInput}
            mode="outlined"
            dense
            disabled={!isRemindersEnabled}
          />
        </View>
        <Text style={styles.helpText}>
          {isRemindersEnabled 
            ? `Você receberá lembretes ${advanceTimeMinutes} minutos antes de cada horário`
            : 'Ative os lembretes para configurar o tempo de antecedência'
          }
        </Text>
        <Divider />
      </View>

      {/* Botão Salvar */}
      <Button
        mode="contained"
        icon="content-save"
        onPress={handleSave}
        style={styles.saveButton}
        labelStyle={styles.saveButtonText}
        loading={isSaving}
        disabled={isSaving}
      >
        Salvar Configurações
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontWeight: 'bold',
    marginLeft: 8,
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    marginBottom: 10,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  optionTextContainer: {
    flex: 1,
    marginRight: 10,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  optionDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  optionValue: {
    fontSize: 16,
    color: '#666',
  },
  timeInput: {
    width: 80,
    textAlign: 'center',
  },
  helpText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 8,
    marginBottom: 8,
  },
  saveButton: {
    marginHorizontal: 16,
    marginTop: 30,
    borderRadius: 8,
    paddingVertical: 6,
  },
  saveButtonText: {
    fontSize: 16,
    color: '#fff',
  },
});

export default SettingsScreen;
