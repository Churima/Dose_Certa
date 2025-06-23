import { useAuth } from "@/src/contexts/AuthContext";
import { useRouter } from "expo-router";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";
import React from "react";
import { Alert, StyleSheet, View } from "react-native";
import { Button, TextInput } from "react-native-paper";
import { ScreenHeader } from "../../../components/ScreenHeader";

const MyDataScreen: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSave = async () => {
    if (!user) {
      Alert.alert("Erro", "Usuário não autenticado");
      return;
    }

    // Verificar se a senha atual foi fornecida
    if (!currentPassword) {
      Alert.alert("Erro", "Por favor, insira sua senha atual");
      return;
    }

    // Verificar se a nova senha foi fornecida
    if (!newPassword) {
      Alert.alert("Erro", "Por favor, insira a nova senha");
      return;
    }

    // Verificar se as senhas coincidem
    if (newPassword !== confirmPassword) {
      Alert.alert("Erro", "As senhas não coincidem");
      return;
    }

    // Verificar se a nova senha tem pelo menos 6 caracteres
    if (newPassword.length < 6) {
      Alert.alert("Erro", "A nova senha deve ter pelo menos 6 caracteres");
      return;
    }

    // Verificar se a nova senha é diferente da atual
    if (currentPassword === newPassword) {
      Alert.alert("Erro", "A nova senha deve ser diferente da senha atual");
      return;
    }

    setIsLoading(true);

    try {
      // Reautenticar o usuário com a senha atual
      const credential = EmailAuthProvider.credential(
        user.email!,
        currentPassword
      );
      await reauthenticateWithCredential(user, credential);

      // Atualizar a senha
      await updatePassword(user, newPassword);

      // Limpar campos
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      Alert.alert("Sucesso", "Senha atualizada com sucesso!", [
        { text: "OK", onPress: () => router.push("/profile") },
      ]);
    } catch (error: any) {
      console.error("Erro ao atualizar senha:", error);

      let errorMessage = "Erro ao atualizar senha";

      if (error.code === "auth/wrong-password") {
        errorMessage = "Senha atual incorreta";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "A nova senha é muito fraca";
      } else if (error.code === "auth/requires-recent-login") {
        errorMessage =
          "Por segurança, faça login novamente para alterar a senha";
      }

      Alert.alert("Erro", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Cabeçalho */}
      <ScreenHeader
        title="Alterar Senha"
        onBack={() => router.push("/profile")}
      />

      {/* Formulário */}
      <View style={styles.formContainer}>
        <TextInput
          label="Senha Atual"
          value={currentPassword}
          onChangeText={setCurrentPassword}
          secureTextEntry
          mode="outlined"
          style={styles.input}
        />

        <TextInput
          label="Nova Senha"
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
          mode="outlined"
          style={styles.input}
        />

        <TextInput
          label="Confirmar Nova Senha"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          mode="outlined"
          style={styles.input}
        />
      </View>

      {/* Botão de salvar */}
      <Button
        mode="contained"
        onPress={handleSave}
        style={styles.saveButton}
        labelStyle={styles.saveButtonText}
        icon="content-save"
        loading={isLoading}
        disabled={isLoading}
      >
        Alterar Senha
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  formContainer: {
    padding: 16,
    gap: 10,
  },
  input: {
    marginBottom: 8,
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
    color: "#fff",
  },
});

export default MyDataScreen;
