import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, IconButton, Text, TextInput } from 'react-native-paper';

const MyDataScreen: React.FC = () => {
  const router = useRouter();
  const [nome, setNome] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [telefone, setTelefone] = React.useState('');
  const [endereco, setEndereco] = React.useState('');

  return (
    <View style={styles.container}>
      {/* Cabeçalho */}
      <View style={styles.header}>
        <IconButton icon="arrow-left" size={24} onPress={() => router.push('/profile')} />
        <Text variant="headlineSmall" style={styles.headerTitle}>Meus Dados</Text>
      </View>

      {/* Formulário */}
      <View style={styles.formContainer}>
        <Text variant="titleSmall" style={styles.label}>Nome Completo</Text>
        <TextInput
          mode="outlined"
          value={nome}
          onChangeText={setNome}
          placeholder=""
        />

        <Text variant="titleSmall" style={styles.label}>E-mail</Text>
        <TextInput
          mode="outlined"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          placeholder=""
        />

        <Text variant="titleSmall" style={styles.label}>Telefone</Text>
        <TextInput
          mode="outlined"
          value={telefone}
          onChangeText={setTelefone}
          keyboardType="phone-pad"
          placeholder="(XX) XXXX-XXXX"
        />

        <Text variant="titleSmall" style={styles.label}>Endereço (opcional)</Text>
        <TextInput
          mode="outlined"
          value={endereco}
          onChangeText={setEndereco}
          multiline
          numberOfLines={4}
          style={{ height: 100 }}
          placeholder=""
        />
      </View>

      {/* Botão de salvar */}
      <Button
        mode="contained"
        onPress={() => console.log('Salvar dados')}
        style={styles.saveButton}
        labelStyle={styles.saveButtonText}
        icon="content-save"
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
  formContainer: {
    padding: 16,
  },
  label: {
    marginTop: 15,
    marginBottom: 5,
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

export default MyDataScreen;
