import React from "react";
import { StyleSheet, View } from "react-native";
import { IconButton, Text } from "react-native-paper";

interface TimeListProps {
  times: string[];
  onRemove: (idx: number) => void;
}

export const TimeList: React.FC<TimeListProps> = ({ times, onRemove }) => (
  <View style={styles.timesList}>
    {times.map((t, idx) => (
      <View key={idx} style={styles.timeItem}>
        <Text>{t}</Text>
        <IconButton icon="close" size={16} onPress={() => onRemove(idx)} />
      </View>
    ))}
  </View>
);

const styles = StyleSheet.create({
  timesList: {
    marginBottom: 8,
  },
  timeItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f2f4f8",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 4,
  },
});
