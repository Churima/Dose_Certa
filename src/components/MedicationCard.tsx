import React from "react";
import { StyleSheet, View } from "react-native";
import { Card, IconButton, Text } from "react-native-paper";

interface MedicationCardProps {
  name: string;
  dosage: string;
  time: string;
  frequency: string;
  onTaken: () => void;
  onPostpone: () => void;
}

export const MedicationCard: React.FC<MedicationCardProps> = ({
  name,
  dosage,
  time,
  frequency,
  onTaken,
  onPostpone,
}) => (
  <Card style={styles.card}>
    <Card.Content>
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text variant="titleMedium">{name}</Text>
          <Text variant="bodyMedium">Dose: {dosage}</Text>
          <Text variant="bodySmall">Horário: {time}</Text>
          <Text variant="bodySmall">Frequência: {frequency}</Text>
        </View>
        <View style={styles.actions}>
          <IconButton
            icon="check"
            onPress={onTaken}
            accessibilityLabel="Tomar"
          />
          <IconButton
            icon="clock"
            onPress={onPostpone}
            accessibilityLabel="Adiar"
          />
        </View>
      </View>
    </Card.Content>
  </Card>
);

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
  },
});
