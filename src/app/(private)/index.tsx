"use client"

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
} from "firebase/firestore"
import { useEffect, useState } from "react"
import { Alert, ScrollView, StyleSheet, View } from "react-native"
import {
  ActivityIndicator,
  Appbar,
  Button,
  Card,
  Divider,
  IconButton,
  List,
  Modal,
  Portal,
  Text,
  TextInput,
} from "react-native-paper"
import { db } from "../../config/firebase"
import { colors } from "../../theme/colors"

interface Medication {
  id: string
  name: string
  dosage: string
  time: string
  nextTime?: Date
  nextTimestamp?: any // Timestamp original do Firestore
  todaySchedules: Date[]
  allDosesTaken: boolean
  tipoFrequencia: number
}

export default function Home() {
  const [medications, setMedications] = useState<Medication[]>([])
  const [loading, setLoading] = useState(true)
  const [showTimeModal, setShowTimeModal] = useState(false)
  const [showCustomTimeModal, setShowCustomTimeModal] = useState(false)
  const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null)
  const [customDate, setCustomDate] = useState("")
  const [customTime, setCustomTime] = useState("")

  useEffect(() => {
    loadTodayMedications()
  }, [])

  const loadTodayMedications = async () => {
    try {
      setLoading(true)
      const now = new Date()
      const todayStart = new Date(now)
      todayStart.setHours(0, 0, 0, 0)
      const todayEnd = new Date(now)
      todayEnd.setHours(23, 59, 59, 999)

      console.log("=== CARREGANDO MEDICAMENTOS ===")
      console.log("Hoje início:", todayStart)
      console.log("Hoje fim:", todayEnd)

      // Buscar todos os medicamentos
      const medicamentosQuery = query(collection(db, "medicamentos"))
      const medicamentosSnapshot = await getDocs(medicamentosQuery)

      console.log("Medicamentos encontrados:", medicamentosSnapshot.size)

      const meds: Medication[] = []

      for (const docSnap of medicamentosSnapshot.docs) {
        const data = docSnap.data()
        console.log("\n--- Processando medicamento ---")
        console.log("Nome:", data.nome)
        console.log("Tipo frequência:", data.tipo_frequencia)
        console.log("Horários raw:", data.horarios)

        // Verificar se horarios existe e é um array
        if (!data.horarios || !Array.isArray(data.horarios)) {
          console.log("❌ Medicamento sem horários válidos")
          continue
        }

        // Processar horários
        const scheduleData: { date: Date; timestamp: any }[] = []

        for (const horario of data.horarios) {
          try {
            const date = horario.toDate()
            scheduleData.push({
              date: date,
              timestamp: horario, // Manter o timestamp original
            })
            console.log("Horário processado:", date)
          } catch (error) {
            console.log("Erro ao processar horário:", error)
          }
        }

        // Filtrar apenas horários de hoje
        const todaySchedules = scheduleData.filter((item) => item.date >= todayStart && item.date <= todayEnd)

        console.log("Horários de hoje:", todaySchedules.length)

        if (todaySchedules.length > 0) {
          // Próximo horário a ser tomado (maior ou igual à hora atual)
          const pendingSchedules = todaySchedules.filter((item) => item.date >= now)
          pendingSchedules.sort((a, b) => a.date.getTime() - b.date.getTime())

          const nextSchedule = pendingSchedules[0]
          const allDosesTaken = !nextSchedule

          console.log("Próximo horário:", nextSchedule?.date)
          console.log("Todas doses tomadas:", allDosesTaken)

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
          })
        }
      }

      // Ordenar medicamentos
      meds.sort((a, b) => {
        if (a.allDosesTaken && !b.allDosesTaken) return 1
        if (!a.allDosesTaken && b.allDosesTaken) return -1
        if (a.nextTime && b.nextTime) return a.nextTime.getTime() - b.nextTime.getTime()
        return 0
      })

      console.log("=== RESULTADO FINAL ===")
      console.log("Total de medicamentos:", meds.length)
      meds.forEach((med) => {
        console.log(`${med.name}: ${med.allDosesTaken ? "Completo" : med.time}`)
      })

      setMedications(meds)
    } catch (error) {
      console.error("Erro ao carregar medicamentos:", error)
      Alert.alert("Erro", "Não foi possível carregar os medicamentos")
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (date: Date) => {
    return `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`
  }

  const formatDate = (date: Date) => {
    return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear()}`
  }

  const getFrequencyHours = (tipoFrequencia: number): number => {
    switch (tipoFrequencia) {
      case 0:
        return 6 // A cada 6 horas
      case 1:
        return 8 // A cada 8 horas
      case 2:
        return 12 // A cada 12 horas
      case 3:
        return 24 // A cada 24 horas
      default:
        return 0 // Personalizado
    }
  }

  const getFrequencyText = (tipoFrequencia: number): string => {
    switch (tipoFrequencia) {
      case 0:
        return "A cada 6 horas"
      case 1:
        return "A cada 8 horas"
      case 2:
        return "A cada 12 horas"
      case 3:
        return "A cada 24 horas"
      case 4:
        return "Personalizado"
      default:
        return "Não definido"
    }
  }

  const handleTaken = (medication: Medication) => {
    console.log("\n=== BOTÃO TOMADO CLICADO ===")
    console.log("Medicamento:", medication.name)
    console.log("Próximo horário:", medication.nextTime)
    console.log("Timestamp:", medication.nextTimestamp)
    console.log("Tipo frequência:", medication.tipoFrequencia)

    if (!medication.nextTime || !medication.nextTimestamp) {
      console.log("❌ Erro: Dados incompletos")
      Alert.alert("Erro", "Não há horário definido para este medicamento")
      return
    }

    const now = new Date()
    Alert.alert("Confirmar", `Você tomou ${medication.name} agora (${formatTime(now)})?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Confirmar",
        onPress: () => confirmTaken(medication),
      },
    ])
  }

  const confirmTaken = async (medication: Medication) => {
    console.log("\n=== CONFIRMANDO MEDICAMENTO ===")

    if (!medication.nextTime || !medication.nextTimestamp) {
      console.log("❌ Dados incompletos")
      Alert.alert("Erro", "Dados do medicamento incompletos")
      return
    }

    try {
      const now = new Date()
      console.log("Hora atual:", now)
      console.log("Medicamento ID:", medication.id)
      console.log("Tipo frequência:", medication.tipoFrequencia)

      // 1. Salvar na tabela medicamentos_dose
      console.log("📝 Salvando dose tomada...")
      const doseData = {
        nome: medication.name,
        data_dose: Timestamp.fromDate(now),
      }
      console.log("Dados da dose:", doseData)

      const doseDoc = await addDoc(collection(db, "medicamentos_dose"), doseData)
      console.log("✅ Dose salva com ID:", doseDoc.id)

      // 2. Remover o horário atual
      console.log("🗑️ Removendo horário atual...")
      const medRef = doc(db, "medicamentos", medication.id)

      console.log("Timestamp a ser removido:", medication.nextTimestamp)
      await updateDoc(medRef, {
        horarios: arrayRemove(medication.nextTimestamp),
      })
      console.log("✅ Horário removido")

      // 3. Calcular e adicionar próxima dose
      if (medication.tipoFrequencia === 4) {
        console.log("🔧 Tipo personalizado - abrindo modal")
        setSelectedMedication(medication)
        setCustomDate(formatDate(now))
        setCustomTime(formatTime(now))
        setShowCustomTimeModal(true)
        return
      } else {
        const hoursToAdd = getFrequencyHours(medication.tipoFrequencia)
        console.log("⏰ Horas para adicionar:", hoursToAdd)

        if (hoursToAdd === 0) {
          console.log("❌ Tipo de frequência inválido")
          Alert.alert("Erro", "Tipo de frequência não reconhecido")
          return
        }

        const nextDose = new Date(now.getTime() + hoursToAdd * 60 * 60 * 1000)
        const nextDoseTimestamp = Timestamp.fromDate(nextDose)

        console.log("Próxima dose:", nextDose)
        console.log("Próximo timestamp:", nextDoseTimestamp)

        // Adicionar próxima dose
        console.log("➕ Adicionando próxima dose...")
        await updateDoc(medRef, {
          horarios: arrayUnion(nextDoseTimestamp),
        })
        console.log("✅ Próxima dose adicionada")

        // Recarregar medicamentos
        console.log("🔄 Recarregando medicamentos...")
        await loadTodayMedications()

        const todayEnd = new Date()
        todayEnd.setHours(23, 59, 59, 999)

        if (nextDose > todayEnd) {
          Alert.alert("Sucesso", `Medicamento tomado! Próxima dose: ${formatDate(nextDose)} às ${formatTime(nextDose)}`)
        } else {
          Alert.alert("Sucesso", `Medicamento tomado! Próxima dose hoje às ${formatTime(nextDose)}`)
        }
      }
    } catch (error) {
      console.error("❌ ERRO ao confirmar medicamento:", error)
    }
  }

  const handleCustomTimeConfirm = async () => {
    if (!selectedMedication || !customDate || !customTime) {
      Alert.alert("Erro", "Por favor, preencha data e horário")
      return
    }

    try {
      console.log("Confirmando horário personalizado...")

      // Validar formato
      const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/
      const timeRegex = /^\d{2}:\d{2}$/

      if (!dateRegex.test(customDate) || !timeRegex.test(customTime)) {
        Alert.alert("Erro", "Formato inválido. Use DD/MM/AAAA e HH:MM")
        return
      }

      // Converter para Date
      const [day, month, year] = customDate.split("/").map(Number)
      const [hours, minutes] = customTime.split(":").map(Number)
      const nextDose = new Date(year, month - 1, day, hours, minutes)
      const nextDoseTimestamp = Timestamp.fromDate(nextDose)

      console.log("Próxima dose personalizada:", nextDose)

      const medRef = doc(db, "medicamentos", selectedMedication.id)
      await updateDoc(medRef, {
        horarios: arrayUnion(nextDoseTimestamp),
      })

      await loadTodayMedications()

      setShowCustomTimeModal(false)
      setSelectedMedication(null)
      setCustomDate("")
      setCustomTime("")

      Alert.alert("Sucesso", `Medicamento tomado! Próxima dose: ${formatDate(nextDose)} às ${formatTime(nextDose)}`)
    } catch (error) {
      console.error("Erro ao definir horário personalizado:", error)
      Alert.alert("Erro", "Não foi possível definir o horário personalizado")
    }
  }

  const handlePostpone = (medication: Medication) => {
    setSelectedMedication(medication)
    setShowTimeModal(true)
  }

  const getAvailableTimes = () => {
    const now = new Date()
    const times = []

    for (let i = 1; i <= 12; i++) {
      const newTime = new Date(now.getTime() + i * 30 * 60 * 1000)
      const hours = newTime.getHours()
      const minutes = newTime.getMinutes()

      if (hours < 24) {
        const timeString = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`
        times.push(timeString)
      }
    }

    return times
  }

  const selectNewTime = async (newTimeString: string) => {
    if (!selectedMedication || !selectedMedication.nextTimestamp) return

    try {
      const [hours, minutes] = newTimeString.split(":").map(Number)
      const now = new Date()
      const newTime = new Date(now)
      newTime.setHours(hours, minutes, 0, 0)
      const newTimeTimestamp = Timestamp.fromDate(newTime)

      const medRef = doc(db, "medicamentos", selectedMedication.id)

      await updateDoc(medRef, {
        horarios: arrayRemove(selectedMedication.nextTimestamp),
      })
      await updateDoc(medRef, {
        horarios: arrayUnion(newTimeTimestamp),
      })

      await loadTodayMedications()
      Alert.alert("Sucesso", "Horário atualizado com sucesso!")
    } catch (error) {
      console.error("Erro ao adiar medicamento:", error)
      Alert.alert("Erro", "Não foi possível adiar o medicamento")
    }

    setShowTimeModal(false)
    setSelectedMedication(null)
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Carregando medicamentos...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Appbar.Content title="Dose Certa" titleStyle={styles.headerTitle} />
        <Appbar.Action icon="cog" onPress={() => {}} />
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
            <Card
              key={medication.id}
              style={[styles.medicationCard, medication.allDosesTaken && styles.completedMedicationCard]}
            >
              <Card.Content>
                <View style={styles.medicationHeader}>
                  <View style={styles.medicationInfo}>
                    <View
                      style={[styles.pillIconContainer, medication.allDosesTaken && styles.completedPillIconContainer]}
                    >
                      <IconButton
                        icon={medication.allDosesTaken ? "check-circle" : "pill"}
                        size={24}
                        iconColor={colors.primary}
                        style={{ margin: 0 }}
                      />
                    </View>
                    <View style={styles.medicationDetails}>
                      <Text
                        variant="titleMedium"
                        style={[styles.medicationName, medication.allDosesTaken && styles.completedText]}
                      >
                        {medication.name}
                      </Text>
                      <Text
                        variant="bodyMedium"
                        style={[styles.medicationDosage, medication.allDosesTaken && styles.completedText]}
                      >
                        {medication.dosage}
                      </Text>
                      <Text variant="bodySmall" style={styles.frequencyInfo}>
                        {getFrequencyText(medication.tipoFrequencia)}
                      </Text>
                    </View>
                  </View>
                  {!medication.allDosesTaken && medication.nextTime && (
                    <Text variant="titleLarge" style={styles.medicationTime}>
                      {medication.time}
                    </Text>
                  )}
                  {medication.allDosesTaken && (
                    <View style={styles.completedBadge}>
                      <IconButton icon="check-circle" size={32} iconColor={colors.primary} style={{ margin: 0 }} />
                    </View>
                  )}
                </View>

                {!medication.allDosesTaken && medication.nextTime && (
                  <View style={styles.buttonContainer}>
                    <Button
                      mode="contained"
                      onPress={() => handleTaken(medication)}
                      style={styles.takenButton}
                      contentStyle={styles.buttonContent}
                    >
                      Tomado
                    </Button>
                    <Button
                      mode="outlined"
                      onPress={() => handlePostpone(medication)}
                      style={styles.postponeButton}
                      contentStyle={styles.buttonContent}
                      textColor={colors.onSurfaceVariant}
                    >
                      Adiar
                    </Button>
                  </View>
                )}

                {medication.allDosesTaken && (
                  <View style={styles.completedContainer}>
                    <Text variant="bodyMedium" style={styles.completedMessage}>
                      Todas as doses do dia foram tomadas
                    </Text>
                  </View>
                )}
              </Card.Content>
            </Card>
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

          <ScrollView style={styles.timeList} showsVerticalScrollIndicator={false}>
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

          <Button mode="outlined" onPress={() => setShowTimeModal(false)} style={styles.cancelButton}>
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
            <Button mode="outlined" onPress={() => setShowCustomTimeModal(false)} style={styles.cancelButton}>
              Cancelar
            </Button>
            <Button mode="contained" onPress={handleCustomTimeConfirm} style={styles.confirmButton}>
              Confirmar
            </Button>
          </View>
        </Modal>
      </Portal>
    </View>
  )
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
  medicationCard: {
    marginBottom: 16,
    backgroundColor: colors.surface,
    elevation: 1,
  },
  completedMedicationCard: {
    backgroundColor: colors.surfaceVariant,
    opacity: 0.7,
  },
  medicationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  medicationInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  pillIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryContainer,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  completedPillIconContainer: {
    backgroundColor: colors.primaryContainer,
  },
  medicationDetails: {
    flex: 1,
  },
  medicationName: {
    color: colors.onSurface,
    fontWeight: "600",
    marginBottom: 2,
  },
  medicationDosage: {
    color: colors.onSurfaceVariant,
    marginBottom: 2,
  },
  frequencyInfo: {
    color: colors.onSurfaceVariant,
    fontSize: 12,
  },
  completedText: {
    color: colors.onSurfaceVariant,
  },
  medicationTime: {
    color: colors.onSurface,
    fontWeight: "600",
  },
  completedBadge: {
    alignItems: "center",
    justifyContent: "center",
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
  },
  takenButton: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  postponeButton: {
    flex: 1,
    borderColor: colors.outline,
  },
  buttonContent: {
    height: 40,
  },
  completedContainer: {
    alignItems: "center",
    padding: 8,
  },
  completedMessage: {
    color: colors.onSurfaceVariant,
    fontStyle: "italic",
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
})
