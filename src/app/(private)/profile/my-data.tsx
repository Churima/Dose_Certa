
import React from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { StackNavigationProp } from '@react-navigation/stack';

type RootStackParamList = {
  MyData: undefined;
};

type MyDataScreenNavigationProp = StackNavigationProp<RootStackParamList, 'MyData'>;

type Props = {
  navigation: MyDataScreenNavigationProp;
};

const MyDataScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Meus Dados</Text>
      </View>

      <View style={styles.formContainer}>
        <Text style={styles.label}>Nome Completo</Text>
        <TextInput style={styles.input} placeholder="" />

        <Text style={styles.label}>E-mail</Text>
        <TextInput style={styles.input} placeholder="" keyboardType="email-address" />

        <Text style={styles.label}>Telefone</Text>
        <TextInput style={styles.input} placeholder="(XX) XXXX-XXXX" keyboardType="phone-pad" />

        <Text style={styles.label}>Endereço (opcional)</Text>
        <TextInput style={styles.textArea} multiline={true} numberOfLines={4} />
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
  formContainer: {
    padding: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    height: 100,
    textAlignVertical: 'top',
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

export default MyDataScreen;


