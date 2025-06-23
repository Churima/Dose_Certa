import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface ProfileOptionItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  onPress: () => void;
}

export const ProfileOptionItem: React.FC<ProfileOptionItemProps> = ({
  icon,
  title,
  description,
  onPress,
}) => (
  <TouchableOpacity style={styles.optionItem} onPress={onPress}>
    <Ionicons name={icon} size={24} color="black" />
    <View style={styles.optionTextContainer}>
      <Text style={styles.optionTitle}>{title}</Text>
      <Text style={styles.optionDescription}>{description}</Text>
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
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
});
