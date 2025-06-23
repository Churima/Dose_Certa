import { db } from "@/src/config/firebase";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import { useCallback, useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { FAB, Text } from "react-native-paper";
import { MedicineListItem } from "../../components/MedicineListItem";
import { useAuth } from "../../contexts/AuthContext";
import { getFrequencyText } from "../../utils/medication";

const FREQUENCIES = [
  "A cada 6 horas",
  "A cada 8 horas",
  "A cada 12 horas",
  "A cada 24 horas",
  "Personalizado",
];

export default function MedicinesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [medicines, setMedicines] = useState<any[]>([]);

  const fetchMedicines = async () => {
    if (!user) {
      return;
    }

    try {
      const allSnapshot = await getDocs(collection(db, "medicamentos"));

      const data = allSnapshot.docs
        .map((doc) => {
          const d = doc.data();

          return {
            id: doc.id,
            name: d.nome,
            frequency: FREQUENCIES[d.tipo_frequencia] ?? "Desconhecida",
            dosage: `${d.dose}${d.unidade}`,
            inativo: d.inativo ?? false,
            userId: d.userId,
          };
        })
        .filter((med) => {
          const isActive = !med.inativo;
          const belongsToUser = med.userId === user.uid;
          const isOldMedicine = !med.userId;

          return isActive && (belongsToUser || isOldMedicine);
        });

      data.forEach((med, index) => {
        console.log(
          `${index + 1}. ${med.name} (${med.userId || "sem userId"})`
        );
      });

      setMedicines(data);
    } catch (error) {
      console.error("Erro ao buscar medicamentos:", error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchMedicines();
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      if (user) {
        fetchMedicines();
      }
    }, [user])
  );

  const handleEdit = async (id: string) => {
    if (!user) {
      Alert.alert("Erro", "Usuário não autenticado");
      return;
    }

    try {
      const ref = doc(db, "medicamentos", id);
      const snapshot = await getDoc(ref);
      const data = snapshot.data();

      if (!data) {
        Alert.alert("Erro", "Medicamento não encontrado.");
        return;
      }

      if (!data.userId) {
        await updateDoc(ref, { userId: user.uid });
      } else if (data.userId !== user.uid) {
        Alert.alert(
          "Erro",
          "Você não tem permissão para editar este medicamento."
        );
        return;
      }

      router.push({ pathname: "/medicine-register", params: { id } });
    } catch (error) {
      console.error("Erro ao verificar permissão:", error);
      Alert.alert("Erro", "Não foi possível verificar as permissões.");
    }
  };

  const handleAdd = () => {
    router.push({ pathname: "/medicine-register" });
  };

  const handleSoftDelete = async (id: string) => {
    if (!user) {
      Alert.alert("Erro", "Usuário não autenticado");
      return;
    }

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
              const snapshot = await getDoc(ref);
              const data = snapshot.data();

              if (!data) {
                Alert.alert("Erro", "Medicamento não encontrado.");
                return;
              }

              if (data.userId && data.userId !== user.uid) {
                Alert.alert(
                  "Erro",
                  "Você não tem permissão para excluir este medicamento."
                );
                return;
              }

              await updateDoc(ref, { inativo: true });
              fetchMedicines();
            } catch (error) {
              console.error("Erro ao excluir medicamento:", error);
              Alert.alert("Erro", "Não foi possível excluir o medicamento.");
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
          <MedicineListItem
            key={item.id}
            name={item.name}
            frequency={getFrequencyText(item.tipo_frequencia)}
            dosage={item.dosage}
            onEdit={() => handleEdit(item.id)}
            onDelete={() => handleSoftDelete(item.id)}
          />
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
