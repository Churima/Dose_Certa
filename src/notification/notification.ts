import * as Notifications from 'expo-notifications';
import { Timestamp, doc, getDoc } from 'firebase/firestore';
import { Platform } from 'react-native';
import { db } from '../config/firebase';

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

interface NotificationSettings {
  isRemindersEnabled: boolean;
  advanceTimeMinutes: number;
}

/**
 * Carrega as configurações de notificação do usuário.
 * @param {string} userId - O ID do usuário.
 * @returns {Promise<NotificationSettings>} As configurações do usuário.
 */
async function loadUserNotificationSettings(userId: string): Promise<NotificationSettings> {
  try {
    const userDoc = doc(db, 'users', userId);
    const userSnapshot = await getDoc(userDoc);
    
    if (userSnapshot.exists()) {
      const data = userSnapshot.data();
      const settings = data.notificationSettings as NotificationSettings;
      
      if (settings) {
        return {
          isRemindersEnabled: settings.isRemindersEnabled || false,
          advanceTimeMinutes: settings.advanceTimeMinutes || 15,
        };
      }
    }
  } catch (error) {
    console.error('Erro ao carregar configurações de notificação:', error);
  }
  
  // Configurações padrão se não encontrar
  return {
    isRemindersEnabled: true,
    advanceTimeMinutes: 15,
  };
}

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
  userId: string; // Adicionando userId para carregar configurações
}

/**
 * Agenda notificações diárias para um medicamento.
 * @param {MedicineForNotification} medicine - O objeto do medicamento.
 */
export async function scheduleMedicineNotifications(medicine: MedicineForNotification) {
  // Carregar configurações do usuário
  const settings = await loadUserNotificationSettings(medicine.userId);
  
  // Se os lembretes estão desabilitados, não agenda notificações
  if (!settings.isRemindersEnabled) {
    console.log('Lembretes desabilitados pelo usuário');
    return;
  }

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

    // --- Notificação "Chegando Perto" (usando configuração do usuário) ---
    if (settings.advanceTimeMinutes > 0) {
      const soonDate = new Date();
      soonDate.setHours(hour, minute, 0, 0);
      soonDate.setMinutes(soonDate.getMinutes() - settings.advanceTimeMinutes);
      const identifierSoon = `${medicine.id}-${horarioTimestamp.toMillis()}-soon`;
      await Notifications.scheduleNotificationAsync({
          content: {
              title: '⏰ Lembrete de remédio em breve',
              body: `Seu remédio ${medicine.nome} deve ser tomado em ${settings.advanceTimeMinutes} minutos.`,
              data: { medicineId: medicine.id },
          },
          trigger: {
              type: Notifications.SchedulableTriggerInputTypes.DAILY,
              hour: soonDate.getHours(),
              minute: soonDate.getMinutes(),
          },
          identifier: identifierSoon,
      });
    }

    // --- Notificação "Atrasado" (30 minutos depois) ---
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
  console.log(`Notificações agendadas para ${medicine.nome} (antecedência: ${settings.advanceTimeMinutes}min)`);
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

/**
 * Reagenda todas as notificações de um usuário baseado nas novas configurações.
 * @param {string} userId - O ID do usuário.
 * @param {any[]} medicines - Lista de medicamentos do usuário.
 */
export async function rescheduleAllUserNotifications(userId: string, medicines: any[]) {
    try {
        // Cancelar todas as notificações existentes
        const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
        for (const notification of scheduledNotifications) {
            if (notification.identifier && notification.identifier.includes(userId)) {
                await Notifications.cancelScheduledNotificationAsync(notification.identifier);
            }
        }

        // Carregar configurações do usuário
        const settings = await loadUserNotificationSettings(userId);
        
        // Se os lembretes estão desabilitados, não reagenda
        if (!settings.isRemindersEnabled) {
            console.log('Lembretes desabilitados - não reagendando notificações');
            return;
        }

        // Reagendar notificações para cada medicamento ativo
        for (const medicine of medicines) {
            if (!medicine.inativo) {
                await scheduleMedicineNotifications({
                    id: medicine.id,
                    nome: medicine.nome,
                    dose: medicine.dose,
                    unidade: medicine.unidade,
                    horarios: medicine.horarios,
                    userId: userId,
                });
            }
        }

        console.log(`Notificações reagendadas para ${medicines.length} medicamentos`);
    } catch (error) {
        console.error('Erro ao reagendar notificações:', error);
    }
}
