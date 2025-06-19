import { Stack } from "expo-router";
import { PaperProvider } from "react-native-paper";
import { AuthProvider } from "../contexts/AuthContext";
import { theme } from "../theme/colors";

export default function RootLayout() {
  return (
    <AuthProvider>
      <PaperProvider theme={theme}>
        <Stack
          screenOptions={{
            headerShadowVisible: false,
            headerTransparent: true,
            animation: "ios_from_right",
          }}
        >
          <Stack.Screen
            name="sign-in"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="(public)/index"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="(public)/login"
            options={{
              title: "Login",
            }}
          />

          <Stack.Screen
            name="(public)/register"
            options={{
              title: "Registrar-se",
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
