"use client";

import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDocs,
  query,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import {
  Appbar,
  Button,
  Card,
  Divider,
  List,
  Modal,
  Portal,
  Text,
  TextInput,
} from "react-native-paper";
import { LoadingScreen } from "../../components/LoadingScreen";
import { MedicationCard } from "../../components/MedicationCard";
import { db } from "../../config/firebase";
import { useAuth } from "../../contexts/AuthContext";
import { colors } from "../../theme/colors";
import { formatDate, formatTime } from "../../utils/date";
import { getFrequencyHours, getFrequencyText } from "../../utils/medication";

interface Medication {
  id: string;
  name: string;
  dosage: string;
  time: string;
  nextTime?: Date;
  nextTimestamp?: any; // Timestamp original do Firestore
  todaySchedules: Date[];
  allDosesTaken: boolean;
  tipoFrequencia: number;
}

export default function Home() {
  const { user } = useAuth();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [showCustomTimeModal, setShowCustomTimeModal] = useState(false);
  const [selectedMedication, setSelectedMedication] =
    useState<Medication | null>(null);
  const [customDate, setCustomDate] = useState("");
  const [customTime, setCustomTime] = useState("");

  useEffect(() => {
    if (user) {
      loadTodayMedications();
    }
  }, [user]);

  const loadTodayMedications = async () => {
    if (!user) {
      console.log("❌ Usuário não autenticado");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const now = new Date();
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date(now);
      todayEnd.setHours(23, 59, 59, 999);

      console.log("=== CARREGANDO MEDICAMENTOS ===");
      console.log("Usuário:", user.uid);
      console.log("Hoje início:", todayStart);
      console.log("Hoje fim:", todayEnd);

      // Buscar apenas medicamentos do usuário logado
      const medicamentosQuery = query(
        collection(db, "medicamentos"),
        where("userId", "==", user.uid),
        where("inativo", "==", false)
      );
      const medicamentosSnapshot = await getDocs(medicamentosQuery);

      console.log("Medicamentos encontrados:", medicamentosSnapshot.size);

      const meds: Medication[] = [];

      for (const docSnap of medicamentosSnapshot.docs) {
        const data = docSnap.data();
        console.log("\n--- Processando medicamento ---");
        console.log("Nome:", data.nome);
        console.log("Tipo frequência:", data.tipo_frequencia);
        console.log("UserId:", data.userId);
        console.log("Horários raw:", data.horarios);

        // Verificar se horarios existe e é um array
        if (!data.horarios || !Array.isArray(data.horarios)) {
          console.log("❌ Medicamento sem horários válidos");
          continue;
        }

        // Processar horários
        const scheduleData: { date: Date; timestamp: any }[] = [];

        for (const horario of data.horarios) {
          try {
            const date = horario.toDate();
            scheduleData.push({
              date: date,
              timestamp: horario, // Manter o timestamp original
            });
            console.log("Horário processado:", date);
          } catch (error) {
            console.log("Erro ao processar horário:", error);
          }
        }

        // Filtrar apenas horários de hoje
        const todaySchedules = scheduleData.filter(
          (item) => item.date >= todayStart && item.date <= todayEnd
        );

        console.log("Horários de hoje:", todaySchedules.length);

        if (todaySchedules.length > 0) {
          // Próximo horário a ser tomado (maior ou igual à hora atual)
          const pendingSchedules = todaySchedules.filter(
            (item) => item.date >= now
          );
          pendingSchedules.sort((a, b) => a.date.getTime() - b.date.getTime());

          const nextSchedule = pendingSchedules[0];
          const allDosesTaken = !nextSchedule;

          console.log("Próximo horário:", nextSchedule?.date);
          console.log("Todas doses tomadas:", allDosesTaken);

          meds.push({
            id: docSnap.id,
            name: data.nome,
            dosage: `${data.dose} ${data.unidade}`,
            time: nextSchedule ? formatTime(nextSchedule.date) : "",
            nextTime: nextSchedule?.date,
            nextTimestamp: nextSchedule?.timestamp,
            todaySchedules: todaySchedules.map((item) => item.date),
            allDosesTaken: allDosesTaken,
            tipoFrequencia: data.tipo_frequencia || 0,
          });
        }
      }

      // Ordenar medicamentos
      meds.sort((a, b) => {
        if (a.allDosesTaken && !b.allDosesTaken) return 1;
        if (!a.allDosesTaken && b.allDosesTaken) return -1;
        if (a.nextTime && b.nextTime)
          return a.nextTime.getTime() - b.nextTime.getTime();
        return 0;
      });

      console.log("=== RESULTADO FINAL ===");
      console.log("Total de medicamentos:", meds.length);
      meds.forEach((med) => {
        console.log(
          `${med.name}: ${med.allDosesTaken ? "Completo" : med.time}`
        );
      });

      setMedications(meds);
    } catch (error) {
      console.error("Erro ao carregar medicamentos:", error);
      Alert.alert("Erro", "Não foi possível carregar os medicamentos");
    } finally {
      setLoading(false);
    }
  };

  const handleTaken = (medication: Medication) => {
    console.log("\n=== BOTÃO TOMADO CLICADO ===");
    console.log("Medicamento:", medication.name);
    console.log("Próximo horário:", medication.nextTime);
    console.log("Timestamp:", medication.nextTimestamp);
    console.log("Tipo frequência:", medication.tipoFrequencia);

    if (!medication.nextTime || !medication.nextTimestamp) {
      console.log("❌ Erro: Dados incompletos");
      Alert.alert("Erro", "Não há horário definido para este medicamento");
      return;
    }

    const now = new Date();
    Alert.alert(
      "Confirmar",
      `Você tomou ${medication.name} agora (${formatTime(now)})?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          onPress: () => confirmTaken(medication),
        },
      ]
    );
  };

  const confirmTaken = async (medication: Medication) => {
    console.log("\n=== CONFIRMANDO MEDICAMENTO ===");

    if (!medication.nextTime || !medication.nextTimestamp) {
      console.log("❌ Dados incompletos");
      Alert.alert("Erro", "Dados do medicamento incompletos");
      return;
    }

    if (!user) {
      Alert.alert("Erro", "Usuário não autenticado");
      return;
    }

    try {
      const now = new Date();
      console.log("Hora atual:", now);
      console.log("Medicamento ID:", medication.id);
      console.log("Tipo frequência:", medication.tipoFrequencia);
      console.log("Usuário:", user.uid);

      // 1. Salvar na tabela medicamentos_dose
      console.log("📝 Salvando dose tomada...");
      const doseData = {
        nome: medication.name,
        data_dose: Timestamp.fromDate(now),
        userId: user.uid, // Vincular ao usuário
      };
      console.log("Dados da dose:", doseData);

      const doseDoc = await addDoc(
        collection(db, "medicamentos_dose"),
        doseData
      );
      console.log("✅ Dose salva com ID:", doseDoc.id);

      // 2. Remover o horário atual
      console.log("🗑️ Removendo horário atual...");
      const medRef = doc(db, "medicamentos", medication.id);

      console.log("Timestamp a ser removido:", medication.nextTimestamp);
      await updateDoc(medRef, {
        horarios: arrayRemove(medication.nextTimestamp),
      });
      console.log("✅ Horário removido");

      // 3. Calcular e adicionar próxima dose
      if (medication.tipoFrequencia === 4) {
        console.log("🔧 Tipo personalizado - abrindo modal");
        setSelectedMedication(medication);
        setCustomDate(formatDate(now));
        setCustomTime(formatTime(now));
        setShowCustomTimeModal(true);
        return;
      } else {
        const hoursToAdd = getFrequencyHours(medication.tipoFrequencia);
        console.log("⏰ Horas para adicionar:", hoursToAdd);

        if (hoursToAdd === 0) {
          console.log("❌ Tipo de frequência inválido");
          Alert.alert("Erro", "Tipo de frequência não reconhecido");
          return;
        }

        const nextDose = new Date(now.getTime() + hoursToAdd * 60 * 60 * 1000);
        const nextDoseTimestamp = Timestamp.fromDate(nextDose);

        console.log("Próxima dose:", nextDose);
        console.log("Próximo timestamp:", nextDoseTimestamp);

        // Adicionar próxima dose
        console.log("➕ Adicionando próxima dose...");
        await updateDoc(medRef, {
          horarios: arrayUnion(nextDoseTimestamp),
        });
        console.log("✅ Próxima dose adicionada");

        // Recarregar medicamentos
        console.log("🔄 Recarregando medicamentos...");
        await loadTodayMedications();

        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        if (nextDose > todayEnd) {
          Alert.alert(
            "Sucesso",
            `Medicamento tomado! Próxima dose: ${formatDate(
              nextDose
            )} às ${formatTime(nextDose)}`
          );
        } else {
          Alert.alert(
            "Sucesso",
            `Medicamento tomado! Próxima dose hoje às ${formatTime(nextDose)}`
          );
        }
      }
    } catch (error: any) {
      console.error("❌ ERRO ao confirmar medicamento:", error);
      console.error("Stack:", error.stack);
      console.error("Message:", error.message);
      Alert.alert(
        "Erro",
        `Não foi possível confirmar o medicamento.\n\nDetalhes: ${error.message}`
      );
    }
  };

  const handleCustomTimeConfirm = async () => {
    if (!selectedMedication || !customDate || !customTime) {
      Alert.alert("Erro", "Por favor, preencha data e horário");
      return;
    }

    try {
      console.log("Confirmando horário personalizado...");

      // Validar formato
      const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
      const timeRegex = /^\d{2}:\d{2}$/;

      if (!dateRegex.test(customDate) || !timeRegex.test(customTime)) {
        Alert.alert("Erro", "Formato inválido. Use DD/MM/AAAA e HH:MM");
        return;
      }

      // Converter para Date
      const [day, month, year] = customDate.split("/").map(Number);
      const [hours, minutes] = customTime.split(":").map(Number);
      const nextDose = new Date(year, month - 1, day, hours, minutes);
      const nextDoseTimestamp = Timestamp.fromDate(nextDose);

      console.log("Próxima dose personalizada:", nextDose);

      const medRef = doc(db, "medicamentos", selectedMedication.id);
      await updateDoc(medRef, {
        horarios: arrayUnion(nextDoseTimestamp),
      });

      await loadTodayMedications();

      setShowCustomTimeModal(false);
      setSelectedMedication(null);
      setCustomDate("");
      setCustomTime("");

      Alert.alert(
        "Sucesso",
        `Medicamento tomado! Próxima dose: ${formatDate(
          nextDose
        )} às ${formatTime(nextDose)}`
      );
    } catch (error: any) {
      console.error("Erro ao definir horário personalizado:", error);
      Alert.alert("Erro", "Não foi possível definir o horário personalizado");
    }
  };

  const handlePostpone = (medication: Medication) => {
    setSelectedMedication(medication);
    setShowTimeModal(true);
  };

  const getAvailableTimes = () => {
    const now = new Date();
    const times = [];

    for (let i = 1; i <= 12; i++) {
      const newTime = new Date(now.getTime() + i * 30 * 60 * 1000);
      const hours = newTime.getHours();
      const minutes = newTime.getMinutes();

      if (hours < 24) {
        const timeString = `${hours.toString().padStart(2, "0")}:${minutes
          .toString()
          .padStart(2, "0")}`;
        times.push(timeString);
      }
    }

    return times;
  };

  const selectNewTime = async (newTimeString: string) => {
    if (!selectedMedication || !selectedMedication.nextTimestamp) return;

    try {
      const [hours, minutes] = newTimeString.split(":").map(Number);
      const now = new Date();
      const newTime = new Date(now);
      newTime.setHours(hours, minutes, 0, 0);
      const newTimeTimestamp = Timestamp.fromDate(newTime);

      const medRef = doc(db, "medicamentos", selectedMedication.id);

      await updateDoc(medRef, {
        horarios: arrayRemove(selectedMedication.nextTimestamp),
      });
      await updateDoc(medRef, {
        horarios: arrayUnion(newTimeTimestamp),
      });

      await loadTodayMedications();
      Alert.alert("Sucesso", "Horário atualizado com sucesso!");
    } catch (error: any) {
      console.error("Erro ao adiar medicamento:", error);
      Alert.alert("Erro", "Não foi possível adiar o medicamento");
    }

    setShowTimeModal(false);
    setSelectedMedication(null);
  };

  // Se não há usuário autenticado
  if (!user) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Text style={styles.loadingText}>Usuário não autenticado</Text>
      </View>
    );
  }

  if (loading) {
    return <LoadingScreen message="Carregando medicamentos..." />;
  }

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Appbar.Content title="Dose Certa" titleStyle={styles.headerTitle} />
      </Appbar.Header>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text variant="headlineSmall" style={styles.sectionTitle}>
          Medicamentos de Hoje
        </Text>

        {medications.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content style={styles.emptyContent}>
              <Text variant="bodyLarge" style={styles.emptyText}>
                Nenhum medicamento para hoje
              </Text>
            </Card.Content>
          </Card>
        ) : (
          medications.map((medication) => (
            <MedicationCard
              key={medication.id}
              name={medication.name}
              dosage={medication.dosage}
              time={medication.time}
              frequency={getFrequencyText(medication.tipoFrequencia)}
              onTaken={() => handleTaken(medication)}
              onPostpone={() => handlePostpone(medication)}
            />
          ))
        )}
      </ScrollView>

      {/* Modal para adiar horário */}
      <Portal>
        <Modal
          visible={showTimeModal}
          onDismiss={() => setShowTimeModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Text variant="titleLarge" style={styles.modalTitle}>
            Selecionar novo horário
          </Text>
          <Text variant="bodyMedium" style={styles.modalSubtitle}>
            Escolha um dos horários disponíveis:
          </Text>

          <ScrollView
            style={styles.timeList}
            showsVerticalScrollIndicator={false}
          >
            {getAvailableTimes().map((time, index) => (
              <View key={time}>
                <List.Item
                  title={time}
                  left={(props) => <List.Icon {...props} icon="clock" />}
                  onPress={() => selectNewTime(time)}
                  style={styles.timeItem}
                />
                {index < getAvailableTimes().length - 1 && <Divider />}
              </View>
            ))}
          </ScrollView>

          <Button
            mode="outlined"
            onPress={() => setShowTimeModal(false)}
            style={styles.cancelButton}
          >
            Cancelar
          </Button>
        </Modal>
      </Portal>

      {/* Modal para horário personalizado */}
      <Portal>
        <Modal
          visible={showCustomTimeModal}
          onDismiss={() => setShowCustomTimeModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Text variant="titleLarge" style={styles.modalTitle}>
            Próxima dose personalizada
          </Text>
          <Text variant="bodyMedium" style={styles.modalSubtitle}>
            Defina quando será a próxima dose:
          </Text>

          <TextInput
            label="Data (DD/MM/AAAA)"
            value={customDate}
            onChangeText={setCustomDate}
            style={styles.input}
            placeholder="22/06/2025"
          />

          <TextInput
            label="Horário (HH:MM)"
            value={customTime}
            onChangeText={setCustomTime}
            style={styles.input}
            placeholder="14:30"
          />

          <View style={styles.customModalButtons}>
            <Button
              mode="outlined"
              onPress={() => setShowCustomTimeModal(false)}
              style={styles.cancelButton}
            >
              Cancelar
            </Button>
            <Button
              mode="contained"
              onPress={handleCustomTimeConfirm}
              style={styles.confirmButton}
            >
              Confirmar
            </Button>
          </View>
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    color: colors.onSurface,
  },
  header: {
    backgroundColor: colors.surface,
    elevation: 0,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.onSurface,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  sectionTitle: {
    marginBottom: 20,
    color: colors.onSurface,
    fontWeight: "600",
  },
  emptyCard: {
    backgroundColor: colors.surface,
    elevation: 1,
  },
  emptyContent: {
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    color: colors.onSurfaceVariant,
    textAlign: "center",
  },
  modalContainer: {
    backgroundColor: colors.surface,
    padding: 20,
    margin: 20,
    borderRadius: 12,
    maxHeight: "70%",
  },
  modalTitle: {
    textAlign: "center",
    marginBottom: 8,
    color: colors.onSurface,
  },
  modalSubtitle: {
    textAlign: "center",
    marginBottom: 20,
    color: colors.onSurfaceVariant,
  },
  timeList: {
    maxHeight: 300,
    marginBottom: 20,
  },
  timeItem: {
    paddingVertical: 8,
  },
  input: {
    marginBottom: 16,
  },
  customModalButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
  },
  confirmButton: {
    flex: 1,
  },
});
