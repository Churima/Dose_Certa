import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
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
  KeyboardAvoidingView,
  Platform,
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

import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { TimeList } from "../../components/TimeList";

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

  const initialFormState = {
    name: "",
    dose: "",
    unit: "",
    frequency: "",
    showFrequency: false,
    times: [] as string[],
    showTimeDialog: false,
    newTime: "",
    instructions: "",
    isSaving: false,
  };

  const [form, setForm] = useState(initialFormState);

  useFocusEffect(
    React.useCallback(() => {
      return () => {
        setForm(initialFormState);
      };
    }, [])
  );

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

            setForm((prev) => ({
              ...prev,
              name: data.nome || "",
              dose: data.dose?.toString() || "",
              unit: data.unidade || "",
              frequency: FREQUENCIES[data.tipo_frequencia] || "",
              instructions: data.instrucoes_adicionais || "",
              times: (data.horarios || []).map((h: Timestamp) => {
                const date = h.toDate();
                return `${String(date.getHours()).padStart(2, "0")}:${String(
                  date.getMinutes()
                ).padStart(2, "0")}`;
              }),
            }));
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
    setForm((prev) => ({
      ...prev,
      name: text.length > 0 ? text.charAt(0).toUpperCase() + text.slice(1) : "",
    }));
  };

  const handleDoseChange = (text: string) => {
    if (/^[0-9]*\.?[0-9]*$/.test(text)) {
      setForm((prev) => ({ ...prev, dose: text }));
    }
  };

  const handleTimeChange = (text: string) => {
    const cleaned = text.replace(/[^\d]/g, "");
    if (cleaned.length <= 2) {
      setForm((prev) => ({ ...prev, newTime: cleaned }));
    } else {
      setForm((prev) => ({
        ...prev,
        newTime: `${cleaned.slice(0, 2)}:${cleaned.slice(2, 4)}`,
      }));
    }
  };

  const handleAddTime = () => {
    if (form.newTime) {
      let timeToAdd = form.newTime;

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

      setForm((prev) => ({
        ...prev,
        times: [...prev.times, formattedTime],
        newTime: "",
        showTimeDialog: false,
      }));
    }
  };

  const handleRemoveTime = (idx: number) => {
    setForm((prev) => ({
      ...prev,
      times: prev.times.filter((_, i) => i !== idx),
    }));
  };

  const handleSave = async () => {
    if (!user) {
      Alert.alert("Erro", "Usuário não autenticado. Faça login novamente.");
      return;
    }

    if (!form.name || !form.dose || !form.unit || !form.frequency) {
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

    setForm((prev) => ({ ...prev, isSaving: true }));
    try {
      const horariosTimestamps = form.times.map((t) => {
        const [hour, minute] = t.split(":").map(Number);
        const date = new Date();
        date.setHours(hour, minute, 0, 0);
        return Timestamp.fromDate(date);
      });

      const medicineData = {
        nome: form.name,
        dose: Number(form.dose),
        unidade: form.unit,
        tipo_frequencia: FREQUENCIES.indexOf(form.frequency),
        horarios: horariosTimestamps,
        inativo: false,
        instrucoes_adicionais: form.instructions,
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
      setForm((prev) => ({ ...prev, isSaving: false }));
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.headerTitle}>
          {medicineId ? "Editar medicamento" : "Novo medicamento"}
        </Text>
      </View>
      <KeyboardAwareScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <TextInput
          label="Nome do medicamento"
          value={form.name}
          onChangeText={handleNameChange}
          style={styles.input}
          mode="outlined"
        />
        <View style={styles.row}>
          <TextInput
            label="Dose"
            value={form.dose}
            onChangeText={handleDoseChange}
            style={[styles.input, { flex: 1, marginRight: 8 }]}
            mode="outlined"
            keyboardType="decimal-pad"
          />
          <TextInput
            label="Unidade"
            value={form.unit}
            onChangeText={(text) =>
              setForm((prev) => ({ ...prev, unit: text.toLowerCase() }))
            }
            style={[styles.input, { flex: 1, marginLeft: 8 }]}
            mode="outlined"
          />
        </View>
        <TouchableOpacity
          onPress={() => setForm((prev) => ({ ...prev, showFrequency: true }))}
          activeOpacity={0.7}
        >
          <TextInput
            label="Frequência"
            value={form.frequency}
            style={styles.input}
            mode="outlined"
            editable={false}
            right={<TextInput.Icon icon="chevron-down" />}
            pointerEvents="none"
          />
        </TouchableOpacity>
        <Portal>
          <Dialog
            visible={form.showFrequency}
            onDismiss={() =>
              setForm((prev) => ({ ...prev, showFrequency: false }))
            }
          >
            <Dialog.Title>Selecione a frequência</Dialog.Title>
            <Dialog.Content>
              {FREQUENCIES.map((freq) => (
                <List.Item
                  key={freq}
                  title={freq}
                  onPress={() => {
                    setForm((prev) => ({
                      ...prev,
                      frequency: freq,
                      showFrequency: false,
                    }));
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
            onPress={() =>
              setForm((prev) => ({ ...prev, showTimeDialog: true }))
            }
          />
        </View>
        {form.times.length > 0 && (
          <TimeList times={form.times} onRemove={handleRemoveTime} />
        )}
        <Portal>
          <Dialog
            visible={form.showTimeDialog}
            onDismiss={() =>
              setForm((prev) => ({ ...prev, showTimeDialog: false }))
            }
          >
            <Dialog.Title>Adicionar horário</Dialog.Title>
            <Dialog.Content>
              <TextInput
                label="Horário (HH:MM)"
                value={form.newTime}
                onChangeText={handleTimeChange}
                keyboardType="number-pad"
                maxLength={5}
                mode="outlined"
              />
            </Dialog.Content>
            <Dialog.Actions>
              <Button
                onPress={() =>
                  setForm((prev) => ({ ...prev, showTimeDialog: false }))
                }
              >
                Cancelar
              </Button>
              <Button onPress={handleAddTime}>Adicionar</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
        <TextInput
          label="Instruções adicionais (opcional)"
          value={form.instructions}
          onChangeText={(text) =>
            setForm((prev) => ({ ...prev, instructions: text }))
          }
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
          disabled={form.isSaving}
          loading={form.isSaving}
        >
          {medicineId ? "Salvar alterações" : "Salvar"}
        </Button>
      </KeyboardAwareScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
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
