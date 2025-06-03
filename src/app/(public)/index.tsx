import { Link } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';

export default function Splash() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* <Image 
          source={require('../../../assets/logo.png')} 
          style={styles.logo}
          resizeMode="contain"
        /> */}
        <Text variant="headlineLarge" style={styles.title}>
          Dose Certa
        </Text>
        <Text variant="bodyLarge" style={styles.subtitle}>
          Seu aliado no controle de medicamentos,{'\n'}
          garantindo que você nunca perca uma dose.
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <Link href="/login" asChild>
          <Button 
            mode="contained" 
          >
            Entrar
          </Button>
        </Link>
        
        <Link href="/register" asChild>
          <Button 
            mode="outlined" 
          >
            Cadastrar
          </Button>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 24,
  },
  title: {
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 32,
  },
  buttonContainer: {
    gap: 12,
    marginBottom: 20,
  },
  button: {
    borderRadius: 100,
  },
  buttonContent: {
    height: 48,
  },
});