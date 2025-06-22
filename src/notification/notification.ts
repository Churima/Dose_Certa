import * as Notifications from 'expo-notifications';
import { Timestamp } from 'firebase/firestore';
import { Platform } from 'react-native';

// CORREÇÃO 1: Adicionando as propriedades que o erro de tipo indicou estarem faltando.
// Isso garante compatibilidade com a sua versão da biblioteca.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    // Adicionando as propriedades que a sua versão exige
    shouldShowBanner: true, 
    shouldShowList: true,
  }),
});

/**
 * Solicita permissão para enviar notificações.
 * @returns {Promise<boolean>} Retorna true se a permissão for concedida, false caso contrário.
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return false;
  }
  
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  return true;
}

// Interface para os dados do medicamento.
interface MedicineForNotification {
  id: string;
  nome: string;
  dose: number;
  unidade: string;
  horarios: Timestamp[];
}

/**
 * Agenda notificações diárias para um medicamento.
 * @param {MedicineForNotification} medicine - O objeto do medicamento.
 */
export async function scheduleMedicineNotifications(medicine: MedicineForNotification) {
  await cancelAllScheduledNotificationsForMedicine(medicine.id);

  for (const horarioTimestamp of medicine.horarios) {
    const horarioDate = horarioTimestamp.toDate();
    const hour = horarioDate.getHours();
    const minute = horarioDate.getMinutes();
    
    // --- Notificação "No Horário" ---
    const identifierOnTime = `${medicine.id}-${horarioTimestamp.toMillis()}-ontime`;
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '💊 Hora do seu remédio!',
        body: `Não se esqueça de tomar ${medicine.dose}${medicine.unidade} de ${medicine.nome}.`,
        data: { medicineId: medicine.id },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
      identifier: identifierOnTime,
    });

    // --- Notificação "Chegando Perto" ---
    const soonDate = new Date();
    soonDate.setHours(hour, minute, 0, 0);
    soonDate.setMinutes(soonDate.getMinutes() - 15);
    const identifierSoon = `${medicine.id}-${horarioTimestamp.toMillis()}-soon`;
    await Notifications.scheduleNotificationAsync({
        content: {
            title: '⏰ Lembrete de remédio em breve',
            body: `Seu remédio ${medicine.nome} deve ser tomado em 15 minutos.`,
            data: { medicineId: medicine.id },
        },
        trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour: soonDate.getHours(),
            minute: soonDate.getMinutes(),
        },
        identifier: identifierSoon,
    });

    // --- Notificação "Atrasado" ---
    const lateDate = new Date();
    lateDate.setHours(hour, minute, 0, 0);
    lateDate.setMinutes(lateDate.getMinutes() + 30);
    const identifierLate = `${medicine.id}-${horarioTimestamp.toMillis()}-late`;
    await Notifications.scheduleNotificationAsync({
        content: {
            title: '⚠️ Verificação de medicamento',
            body: `Você se lembrou de tomar seu ${medicine.nome} às ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}?`,
            data: { medicineId: medicine.id },
        },
        trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour: lateDate.getHours(),
            minute: lateDate.getMinutes(),
        },
        identifier: identifierLate,
    });
  }
  console.log(`Notificações agendadas para ${medicine.nome}`);
}

/**
 * Cancela todas as notificações agendadas para um medicamento específico.
 * @param {string} medicineId - O ID do documento do medicamento.
 */
export async function cancelAllScheduledNotificationsForMedicine(medicineId: string) {
    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
    let count = 0;
    for (const notification of scheduledNotifications) {
        if (notification.identifier && notification.identifier.startsWith(medicineId)) {
            await Notifications.cancelScheduledNotificationAsync(notification.identifier);
            count++;
        }
    }
    console.log(`${count} notificações canceladas para o medicamento ${medicineId}`);
}
