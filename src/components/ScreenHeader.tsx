import React from "react";
import { StyleSheet, View } from "react-native";
import { IconButton, Text } from "react-native-paper";

interface ScreenHeaderProps {
  title: string;
  onBack: () => void;
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title,
  onBack,
}) => (
  <View style={styles.header}>
    <IconButton icon="arrow-left" size={24} onPress={onBack} />
    <Text variant="headlineSmall" style={styles.headerTitle}>
      {title}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerTitle: {
    fontWeight: "bold",
    marginLeft: 8,
  },
});
