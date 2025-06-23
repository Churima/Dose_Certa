import React from "react";
import { StyleSheet, View } from "react-native";
import { ActivityIndicator, Text } from "react-native-paper";
import { colors } from "../theme/colors";

interface LoadingScreenProps {
  message?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ message }) => (
  <View style={styles.container}>
    <ActivityIndicator size="large" color={colors.primary} />
    {message && <Text style={styles.text}>{message}</Text>}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
  text: {
    marginTop: 16,
    color: colors.onSurface,
    textAlign: "center",
  },
});
