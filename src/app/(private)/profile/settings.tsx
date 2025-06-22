
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { StackNavigationProp } from '@react-navigation/stack';

type SettingsScreenProps = {
  navigation: StackNavigationProp<any>;
};

const SettingsScreen = ({ navigation }: SettingsScreenProps) => {
  const [isRemindersEnabled, setIsRemindersEnabled] = React.useState(false);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notificações</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Lembretes de Medicamentos</Text>
        <View style={styles.optionItem}>
          <View style={styles.optionTextContainer}>
            <Text style={styles.optionTitle}>Ativar Lembretes</Text>
            <Text style={styles.optionDescription}>Receba notificações para tomar seus medicamentos</Text>
          </View>
          <Switch
            trackColor={{ false: "#767577", true: "#81b0ff" }}
            thumbColor={isRemindersEnabled ? "#f5dd4b" : "#f4f3f4"}
            ios_backgroundColor="#3e3e3e"
            onValueChange={setIsRemindersEnabled}
            value={isRemindersEnabled}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Configurações de Lembretes</Text>
        <View style={styles.optionItem}>
          <View style={styles.optionTextContainer}>
            <Text style={styles.optionTitle}>Tempo de Antecedência</Text>
          </View>
          <Text style={styles.optionValue}>15 minutos</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.saveButton}>
        <Text style={styles.saveButtonText}>Salvar</Text>
      </TouchableOpacity>
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 16,
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
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
    backgroundColor: '#62B1F6',
    padding: 15,
    borderRadius: 8,
    marginHorizontal: 16,
    marginTop: 30,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SettingsScreen;


