import { useAuth } from "@/src/contexts/AuthContext";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Button } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { ProfileOptionItem } from "../../../components/ProfileOptionItem";

const ProfileScreen = () => {
  const router = useRouter();
  const { logout } = useAuth();
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Perfil</Text>
      </View>

      <View style={styles.optionsContainer}>
        <ProfileOptionItem
          icon="person-outline"
          title="Meus Dados"
          description="Editar informações básicas"
          onPress={() => router.push("/profile/my-data")}
        />
        <ProfileOptionItem
          icon="settings-outline"
          title="Configurações"
          description="Notificações e acessibilidade"
          onPress={() => router.push("/profile/settings")}
        />
      </View>

      <Button mode="contained" onPress={logout} style={styles.logoutButton}>
        <Text style={styles.logoutButtonText}>Sair da Conta</Text>
      </Button>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  optionsContainer: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  logoutButton: {
    marginTop: 30,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  bottomNavBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    position: "absolute",
    bottom: 0,
    width: "100%",
    backgroundColor: "#fff",
  },
  navItem: {
    alignItems: "center",
  },
  navText: {
    fontSize: 10,
    color: "#666",
  },
});

export default ProfileScreen;
