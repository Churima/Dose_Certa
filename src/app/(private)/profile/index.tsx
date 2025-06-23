import { useAuth } from "@/src/contexts/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Button } from "react-native-paper";

const ProfileScreen = () => {
  const navigation = useNavigation();
  const { logout } = useAuth();
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Perfil</Text>
      </View>

      <View style={styles.optionsContainer}>
        <TouchableOpacity
          style={styles.optionItem}
          onPress={() => {
            navigation.navigate("(private)/");
          }}
        >
          <Ionicons name="person-outline" size={24} color="black" />
          <View style={styles.optionTextContainer}>
            <Text style={styles.optionTitle}>Meus Dados</Text>
            <Text style={styles.optionDescription}>
              Editar informações básicas
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.optionItem}
          onPress={() => navigation.navigate("Settings")}
        >
          <Ionicons name="settings-outline" size={24} color="black" />
          <View style={styles.optionTextContainer}>
            <Text style={styles.optionTitle}>Configurações</Text>
            <Text style={styles.optionDescription}>
              Notificações e acessibilidade
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <Button mode="contained" onPress={logout}>
        <Text style={styles.logoutButtonText}>Sair da Conta</Text>
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
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
    marginLeft: 16,
  },
  optionsContainer: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  optionTextContainer: {
    marginLeft: 15,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  optionDescription: {
    fontSize: 12,
    color: "#666",
  },
  logoutButton: {
    backgroundColor: "#62B1F6",
    padding: 15,
    borderRadius: 8,
    marginHorizontal: 16,
    marginTop: 30,
    alignItems: "center",
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
