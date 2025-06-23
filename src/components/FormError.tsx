import React from "react";
import { StyleSheet, Text } from "react-native";

interface FormErrorProps {
  message?: string;
}

export const FormError: React.FC<FormErrorProps> = ({ message }) => {
  if (!message) return null;
  return <Text style={styles.error}>{message}</Text>;
};

const styles = StyleSheet.create({
  error: {
    color: "red",
    textAlign: "center",
    marginBottom: 16,
  },
});
