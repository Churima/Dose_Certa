import { db } from "@/src/config/firebase";
import { useRouter } from "expo-router";
import { collection, doc, getDocs, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { FAB, IconButton, Text } from "react-native-paper";

const FREQUENCIES = [
  "A cada 6 horas",
  "A cada 8 horas",
  "A cada 12 horas",
  "A cada 24 horas",
  "Personalizado",
];

export default function MedicinesScreen() {
  const router = useRouter();
  const [medicines, setMedicines] = useState<any[]>([]);

  const fetchMedicines = async () => {
    try {
      const snapshot = await getDocs(collection(db, "medicamentos"));
      const data = snapshot.docs
        .map((doc) => {
          const d = doc.data();
          return {
            id: doc.id,
            name: d.nome,
            frequency: FREQUENCIES[d.tipo_frequencia] ?? "Desconhecida",
            dosage: `${d.dose}${d.unidade}`,
            inativo: d.inativo ?? false,
          };
        })
        .filter((med) => !med.inativo);

      setMedicines(data);
    } catch (error) {
      console.error("Erro ao buscar medicamentos:", error);
    }
  };

  useEffect(() => {
    fetchMedicines();
  }, []);

  const handleEdit = (id: string) => {
    router.push({ pathname: "/medicine-register", params: { id } });
  };

  const handleAdd = () => {
    router.push({ pathname: "/medicine-register" });
  };

  const handleSoftDelete = async (id: string) => {
    Alert.alert(
      "Excluir medicamento",
      "Tem certeza que deseja excluir este medicamento?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              const ref = doc(db, "medicamentos", id);
              await updateDoc(ref, { inativo: true });
              fetchMedicines();
            } catch (error) {
              console.error("Erro ao excluir medicamento:", error);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.headerTitle}>
          Remédios
        </Text>
      </View>
      <ScrollView style={{ flex: 1, paddingHorizontal: 20 }}>
        {medicines.map((item) => (
          <View key={item.id} style={styles.medicineItem}>
            <View style={{ flex: 1 }}>
              <Text style={styles.medicineName}>{item.name}</Text>
              <Text style={styles.medicineFrequency}>{item.frequency}</Text>
              <Text style={styles.medicineDosage}>{item.dosage}</Text>
            </View>
            <IconButton
              icon="pencil-outline"
              size={20}
              onPress={() => handleEdit(item.id)}
            />
            <IconButton
              icon="trash-can-outline"
              size={20}
              onPress={() => handleSoftDelete(item.id)}
            />
          </View>
        ))}
      </ScrollView>
      <FAB style={styles.fab} icon="plus" onPress={handleAdd} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 20,
  },
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
  fab: {
    position: "absolute",
    right: 24,
    bottom: 40,
    backgroundColor: "#4a90e2",
  },
});
