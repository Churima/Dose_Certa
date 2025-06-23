import { Link, router } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, StyleSheet, View } from "react-native";
import { Button, Text, TextInput } from "react-native-paper";
import { FormError } from "../../components/FormError";
import { useAuth } from "../../contexts/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { signIn } = useAuth();

  async function handleLogin() {
    if (!email || !password) {
      setError("Por favor, preencha todos os campos");
      return;
    }

    try {
      setLoading(true);
      setError("");
      await signIn(email, password);
      router.replace("/(private)");
    } catch {
      setError("Email ou senha inválidos");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container}>
      <View style={styles.content}>
        <Text variant="headlineLarge" style={styles.title}>
          Login
        </Text>

        <TextInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          style={styles.input}
        />

        <TextInput
          label="Senha"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
        />

        <FormError message={error} />

        <Button
          mode="contained"
          onPress={handleLogin}
          loading={loading}
          disabled={loading}
          style={styles.button}
          contentStyle={styles.buttonContent}
          labelStyle={styles.buttonLabel}
        >
          Entrar
        </Button>

        <Link href="/register" asChild>
          <Button mode="text" style={styles.linkButton}>
            Não tem uma conta? Cadastre-se
          </Button>
        </Link>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  content: {
    flex: 1,
    justifyContent: "center",
  },
  title: {
    textAlign: "center",
    marginBottom: 32,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  buttonLabel: {
    fontSize: 18,
  },
  error: {
    color: "red",
    textAlign: "center",
    marginBottom: 16,
  },
  linkButton: {
    marginTop: 16,
  },
});
