import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Divider, IconButton, Switch, Text } from 'react-native-paper';

const SettingsScreen = () => {
  const router = useRouter();
  const [isRemindersEnabled, setIsRemindersEnabled] = React.useState(false);

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
          </View>
          <Text style={styles.optionValue}>15 minutos</Text>
        </View>
        <Divider />
      </View>

      {/* Botão Salvar */}
      <Button
        mode="contained"
        icon="content-save"
        onPress={() => console.log('Salvar configurações')}
        style={styles.saveButton}
        labelStyle={styles.saveButtonText}
      >
        Salvar
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
  },
  optionValue: {
    fontSize: 16,
    color: '#666',
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
