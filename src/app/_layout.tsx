import { Stack } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { theme } from '../theme/colors';

export default function RootLayout() {
  return (
    <PaperProvider theme={theme}>
      <Stack screenOptions={{ headerShown: false }} />
    </PaperProvider>
  );
}
