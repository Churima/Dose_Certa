import React from "react";
import { StyleSheet } from "react-native";
import { Card, Text } from "react-native-paper";

interface PharmacyCardProps {
  name: string;
  vicinity: string;
  phone?: string;
}

export const PharmacyCard: React.FC<PharmacyCardProps> = ({
  name,
  vicinity,
  phone,
}) => (
  <Card style={styles.card}>
    <Card.Title title={name} />
    <Card.Content>
      <Text>{vicinity}</Text>
      <Text>{phone}</Text>
    </Card.Content>
  </Card>
);

const styles = StyleSheet.create({
  card: {
    marginBottom: 10,
  },
});
