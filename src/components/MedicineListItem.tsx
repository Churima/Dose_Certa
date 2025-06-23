import React from "react";
import { StyleSheet, View } from "react-native";
import { IconButton, Text } from "react-native-paper";

interface MedicineListItemProps {
  name: string;
  frequency: string;
  dosage: string;
  onEdit: () => void;
  onDelete: () => void;
}

export const MedicineListItem: React.FC<MedicineListItemProps> = ({
  name,
  frequency,
  dosage,
  onEdit,
  onDelete,
}) => (
  <View style={styles.medicineItem}>
    <View style={{ flex: 1 }}>
      <Text style={styles.medicineName}>{name}</Text>
      <Text style={styles.medicineFrequency}>{frequency}</Text>
      <Text style={styles.medicineDosage}>{dosage}</Text>
    </View>
    <IconButton icon="pencil-outline" size={20} onPress={onEdit} />
    <IconButton icon="trash-can-outline" size={20} onPress={onDelete} />
  </View>
);

const styles = StyleSheet.create({
  medicineItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  medicineName: {
    fontWeight: "bold",
    fontSize: 16,
  },
  medicineFrequency: {
    color: "#4a6fa5",
    fontSize: 13,
  },
  medicineDosage: {
    color: "#8a8a8a",
    fontSize: 13,
  },
});
