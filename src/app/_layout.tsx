import { Stack } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { AuthProvider } from '../contexts/AuthContext';
import { theme } from '../theme/colors';

export default function RootLayout() {
  return (
    <AuthProvider>
      <PaperProvider theme={theme}>
        <Stack screenOptions={{
          headerShadowVisible: false,
          headerTransparent: true,
        }}>
          <Stack.Screen
            name="(public)/index"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="(private)"
            options={{
              headerShown: false,
            }}
          />
        </Stack>
      </PaperProvider>
    </AuthProvider>
  );
}
