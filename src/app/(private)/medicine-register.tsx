import { useLocalSearchParams, useRouter } from "expo-router";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import {
  Button,
  Dialog,
  IconButton,
  List,
  Portal,
  Text,
  TextInput,
} from "react-native-paper";
import { db } from "../../config/firebase";
import { useAuth } from "../../contexts/AuthContext";

import {
  cancelAllScheduledNotificationsForMedicine,
  requestNotificationPermissions,
  scheduleMedicineNotifications,
} from "../../notification/notification";

const FREQUENCIES = [
  "A cada 8 horas",
  "A cada 6 horas",
  "A cada 12 horas",
  "A cada 24 horas",
  "Personalizado",
];

export default function MedicineRegisterScreen() {
  const { id: medicineId } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  const [name, setName] = useState("");
  const [dose, setDose] = useState("");
  const [unit, setUnit] = useState("");
  const [frequency, setFrequency] = useState("");
  const [showFrequency, setShowFrequency] = useState(false);
  const [times, setTimes] = useState<string[]>([]);
  const [showTimeDialog, setShowTimeDialog] = useState(false);
  const [newTime, setNewTime] = useState("");
  const [instructions, setInstructions] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadMedicine = async () => {
      if (medicineId && user) {
        try {
          const ref = doc(db, "medicamentos", String(medicineId));
          const snapshot = await getDoc(ref);
          const data = snapshot.data();

          if (data) {
            if (data.userId !== user.uid) {
              Alert.alert(
                "Erro",
                "Você não tem permissão para editar este medicamento."
              );
              router.push("/medicines");
              return;
            }

            setName(data.nome || "");
            setDose(data.dose?.toString() || "");
            setUnit(data.unidade || "");
            setFrequency(FREQUENCIES[data.tipo_frequencia] || "");
            setInstructions(data.instrucoes_adicionais || "");
            const horarios = (data.horarios || []).map((h: Timestamp) => {
              const date = h.toDate();
              return `${String(date.getHours()).padStart(2, "0")}:${String(
                date.getMinutes()
              ).padStart(2, "0")}`;
            });
            setTimes(horarios);
          }
        } catch (error) {
          console.error("Erro ao carregar medicamento:", error);
          Alert.alert(
            "Erro",
            "Não foi possível carregar os dados do medicamento."
          );
        }
      }
    };

    loadMedicine();
  }, [medicineId, user]);

  const handleNameChange = (text: string) => {
    if (text.length > 0) {
      setName(text.charAt(0).toUpperCase() + text.slice(1));
    } else {
      setName("");
    }
  };

  const handleDoseChange = (text: string) => {
    if (/^[0-9]*\.?[0-9]*$/.test(text)) {
      setDose(text);
    }
  };

  const handleTimeChange = (text: string) => {
    const cleaned = text.replace(/[^\d]/g, "");
    if (cleaned.length <= 2) {
      setNewTime(cleaned);
    } else {
      setNewTime(`${cleaned.slice(0, 2)}:${cleaned.slice(2, 4)}`);
    }
  };

  const handleAddTime = () => {
    if (newTime) {
      let timeToAdd = newTime;

      if (/^\d{1,2}$/.test(timeToAdd)) {
        timeToAdd = `${timeToAdd}:00`;
      }

      const [hourStr, minuteStr] = timeToAdd.split(":");
      const hour = parseInt(hourStr, 10);
      const minute = parseInt(minuteStr, 10);

      if (
        timeToAdd.length !== 5 ||
        timeToAdd[2] !== ":" ||
        isNaN(hour) ||
        isNaN(minute) ||
        hour < 0 ||
        hour > 23 ||
        minute < 0 ||
        minute > 59
      ) {
        Alert.alert(
          "Hora Inválida",
          "Por favor, insira um horário válido no formato HH:MM."
        );
        return;
      }

      const formattedTime = `${String(hour).padStart(2, "0")}:${String(
        minute
      ).padStart(2, "0")}`;

      setTimes([...times, formattedTime]);
      setNewTime("");
      setShowTimeDialog(false);
    }
  };

  const handleRemoveTime = (idx: number) => {
    setTimes(times.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    if (!user) {
      Alert.alert("Erro", "Usuário não autenticado. Faça login novamente.");
      return;
    }

    if (!name || !dose || !unit || !frequency) {
      Alert.alert("Erro", "Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    // --- LÓGICA DE NOTIFICAÇÃO INICIA AQUI ---
    const permissionGranted = await requestNotificationPermissions();
    if (!permissionGranted) {
      const shouldSaveAnyway = await new Promise((resolve) =>
        Alert.alert(
          "Continuar sem Lembretes?",
          "Você não deu permissão para notificações. Deseja salvar o medicamento mesmo assim, sem receber lembretes?",
          [
            { text: "Não", onPress: () => resolve(false), style: "cancel" },
            { text: "Sim, salvar", onPress: () => resolve(true) },
          ]
        )
      );
      if (!shouldSaveAnyway) return;
    }
    // --- FIM DA LÓGICA DE PERMISSÃO ---

    setIsSaving(true);
    try {
      const horariosTimestamps = times.map((t) => {
        const [hour, minute] = t.split(":").map(Number);
        const date = new Date();
        date.setHours(hour, minute, 0, 0);
        return Timestamp.fromDate(date);
      });

      const medicineData = {
        nome: name,
        dose: Number(dose),
        unidade: unit,
        tipo_frequencia: FREQUENCIES.indexOf(frequency),
        horarios: horariosTimestamps,
        inativo: false,
        instrucoes_adicionais: instructions,
        userId: user.uid,
      };


      if (medicineId) {
        const ref = doc(db, "medicamentos", String(medicineId));
        await updateDoc(ref, medicineData);

        if (permissionGranted) {
          await cancelAllScheduledNotificationsForMedicine(String(medicineId));
          await scheduleMedicineNotifications({
            id: String(medicineId),
            ...medicineData,
          });
        }

        Alert.alert("Sucesso", "Medicamento atualizado com sucesso!");
      } else {
        const docRef = await addDoc(collection(db, "medicamentos"), {
          ...medicineData,
          data_criacao: Timestamp.now(),
        });

        if (permissionGranted) {
          await scheduleMedicineNotifications({
            id: docRef.id,
            ...medicineData,
          });
        }

        Alert.alert("Sucesso", "Medicamento salvo com sucesso!");
      }

      router.push("/medicines");
    } catch (error) {
      console.error("Erro ao salvar medicamento:", error);
      Alert.alert("Erro", "Não foi possível salvar as alterações.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.headerTitle}>
          {medicineId ? "Editar medicamento" : "Novo medicamento"}
        </Text>
      </View>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <TextInput
          label="Nome do medicamento"
          value={name}
          onChangeText={handleNameChange}
          style={styles.input}
          mode="outlined"
        />
        <View style={styles.row}>
          <TextInput
            label="Dose"
            value={dose}
            onChangeText={handleDoseChange}
            style={[styles.input, { flex: 1, marginRight: 8 }]}
            mode="outlined"
            keyboardType="decimal-pad"
          />
          <TextInput
            label="Unidade"
            value={unit}
            onChangeText={(text) => setUnit(text.toLowerCase())}
            style={[styles.input, { flex: 1, marginLeft: 8 }]}
            mode="outlined"
          />
        </View>
        <TouchableOpacity
          onPress={() => setShowFrequency(true)}
          activeOpacity={0.7}
        >
          <TextInput
            label="Frequência"
            value={frequency}
            style={styles.input}
            mode="outlined"
            editable={false}
            right={<TextInput.Icon icon="chevron-down" />}
            pointerEvents="none"
          />
        </TouchableOpacity>
        <Portal>
          <Dialog
            visible={showFrequency}
            onDismiss={() => setShowFrequency(false)}
          >
            <Dialog.Title>Selecione a frequência</Dialog.Title>
            <Dialog.Content>
              {FREQUENCIES.map((freq) => (
                <List.Item
                  key={freq}
                  title={freq}
                  onPress={() => {
                    setFrequency(freq);
                    setShowFrequency(false);
                  }}
                />
              ))}
            </Dialog.Content>
          </Dialog>
        </Portal>
        <Text style={styles.sectionTitle}>Horários</Text>
        <View style={styles.row}>
          <Text style={{ flex: 1, alignSelf: "center" }}>
            Adicionar horário
          </Text>
          <IconButton
            icon="plus"
            size={20}
            onPress={() => setShowTimeDialog(true)}
          />
        </View>
        {times.length > 0 && (
          <View style={styles.timesList}>
            {times.map((t, idx) => (
              <View key={idx} style={styles.timeItem}>
                <Text>{t}</Text>
                <IconButton
                  icon="close"
                  size={16}
                  onPress={() => handleRemoveTime(idx)}
                />
              </View>
            ))}
          </View>
        )}
        <Portal>
          <Dialog
            visible={showTimeDialog}
            onDismiss={() => setShowTimeDialog(false)}
          >
            <Dialog.Title>Adicionar horário</Dialog.Title>
            <Dialog.Content>
              <TextInput
                label="Horário (HH:MM)"
                value={newTime}
                onChangeText={handleTimeChange}
                keyboardType="number-pad"
                maxLength={5}
                mode="outlined"
              />
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setShowTimeDialog(false)}>Cancelar</Button>
              <Button onPress={handleAddTime}>Adicionar</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
        <TextInput
          label="Instruções adicionais (opcional)"
          value={instructions}
          onChangeText={setInstructions}
          style={styles.input}
          mode="outlined"
          multiline
          numberOfLines={3}
        />
        <Button
          mode="contained"
          style={styles.saveButton}
          onPress={handleSave}
          contentStyle={{ height: 48 }}
          disabled={isSaving}
          loading={isSaving}
        >
          {medicineId ? "Salvar alterações" : "Salvar"}
        </Button>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#fff",
    flexGrow: 1,
  },
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
  input: {
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  sectionTitle: {
    fontWeight: "bold",
    fontSize: 16,
    marginTop: 16,
    marginBottom: 4,
  },
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
  saveButton: {
    marginTop: 24,
    borderRadius: 100,
  },
});
