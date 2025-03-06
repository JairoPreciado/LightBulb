import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, Alert, StyleSheet, TouchableOpacity, FlatList, AppState } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { auth, db } from '../../../firebaseConfiguration';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import { BackgroundFetchResult, BackgroundFetchStatus } from 'expo-background-fetch';
import '../../../backgroundtask'; // Importa el archivo de tareas en segundo plano

const BACKGROUND_FETCH_TASK = 'background-fetch';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

interface Schedule {
  id: string;
  on: string;
  off: string;
  expiresAt: string;
  notificationIds: string[];
}

const Programar: React.FC = () => {
  const router = useRouter();
  const { deviceName, pin, deviceKey } = useLocalSearchParams<{ deviceName: string; pin: string; deviceKey: string }>();

  const [turnOnTime, setTurnOnTime] = useState({ hour: '', minute: '' });
  const [turnOffTime, setTurnOffTime] = useState({ hour: '', minute: '' });
  const [scheduleList, setScheduleList] = useState<Schedule[]>([]);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    if (!deviceName || !pin || !deviceKey) {
      Alert.alert('Error', 'No se recibieron los datos del dispositivo.');
      router.back();
    }
  }, [deviceName, pin, deviceKey, router]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    registerBackgroundFetch();

    const loadSchedules = async () => {
      try {
        const userId = auth.currentUser?.uid;
        if (!userId) {
          console.error('No hay usuario autenticado.');
          return;
        }

        const userRef = doc(db, 'BD', userId);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const pinSchedules = userSnap.data()?.devices?.[pin]?.horarios || {};
          const formattedSchedules: Schedule[] = Object.entries(pinSchedules).map(([key, value]: [string, any]) => ({
            id: key,
            on: value.on,
            off: value.off,
            expiresAt: value.expiresAt,
            notificationIds: value.notificationIds || [],
          }));
          setScheduleList(formattedSchedules);
        } else {
          console.error('No se encontró el usuario en Firebase.');
        }
      } catch (error) {
        console.error('Error al cargar las programaciones desde Firebase:', error);
      }
    };

    loadSchedules();

    requestNotificationPermission();
  }, [pin]);

  const handleAppStateChange = (nextAppState: any) => {
    appState.current = nextAppState;
  };

  const requestNotificationPermission = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permisos denegados', 'No se pueden enviar notificaciones sin permisos.');
    }
  };

  useEffect(() => {
    const interval = setInterval(checkExpiredSchedules, 5000); // Verificar cada 5 segundos
    return () => clearInterval(interval);
  }, [scheduleList]);

  const checkExpiredSchedules = async () => {
    const now = new Date();

    const nonExpiredSchedules = scheduleList.filter((schedule) => {
      const expiresAt = new Date(schedule.expiresAt);
      return expiresAt > now;
    });

    const expiredSchedules = scheduleList.filter((schedule) => {
      const expiresAt = new Date(schedule.expiresAt);
      return expiresAt <= now;
    });

    if (expiredSchedules.length > 0) {
      // Cancelar notificaciones de programaciones expiradas
      for (const schedule of expiredSchedules) {
        for (const notificationId of schedule.notificationIds) {
          await Notifications.cancelScheduledNotificationAsync(notificationId);
        }
      }

      // Actualizar estado y Firebase
      setScheduleList(nonExpiredSchedules);

      const firebaseSchedules = nonExpiredSchedules.reduce((acc: { [key: string]: any }, schedule) => {
        acc[schedule.id] = {
          on: schedule.on,
          off: schedule.off,
          expiresAt: schedule.expiresAt,
          notificationIds: schedule.notificationIds,
        };
        return acc;
      }, {});

      saveSchedulesToFirebase(firebaseSchedules);
    }
  };

  const validateInput = (value: string, max: number): string => {
    const numericValue = value.replace(/[^0-9]/g, '');
    if (numericValue === '') return '';
    const number = Math.min(Number(numericValue), max);
    return `${number}`;
  };

  const saveSchedulesToFirebase = async (updatedSchedules: any) => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        console.error('No hay usuario autenticado.');
        return;
      }

      const userRef = doc(db, 'BD', userId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        const devices = userData.devices || {};
        const updatedPinSchedules = { ...devices[pin], horarios: updatedSchedules };

        await setDoc(userRef, { devices: { ...devices, [pin]: updatedPinSchedules } }, { merge: true });
        console.log('Programaciones guardadas exitosamente en Firebase.');

        const photonId = userData.photonId || null;
        const apiKey = userData.apiKey || null;

        if (photonId && apiKey) {
          const updatedDevices = { ...devices, [pin]: updatedPinSchedules };
          await sendToParticle(photonId, apiKey, updatedDevices);
        } else {
          console.error('No se encontró el photonId o apiKey en Firebase.');
        }
      } else {
        console.error('No se encontró el usuario en Firebase.');
      }
    } catch (error) {
      console.error('Error al guardar las programaciones en Firebase:', error);
    }
  };

  const sendToParticle = async (photonId: string, apiKey: string, devices: any) => {
    try {
      const horariosString = JSON.stringify(devices);

      const response = await fetch(`https://api.particle.io/v1/devices/${photonId}/actualizarHorarios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Bearer ${apiKey}`,
        },
        body: `args=${encodeURIComponent(horariosString)}`,
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Horarios enviados a Particle correctamente:', data);
      } else {
        const errorData = await response.json();
        console.error('Error al enviar horarios a Particle:', errorData);
      }
    } catch (error) {
      console.error('Error al enviar datos a Particle:', error);
    }
  };

  const handleSaveSchedule = async () => {
    const turnOnHour = Number(turnOnTime.hour);
    const turnOnMinute = Number(turnOnTime.minute);
    const turnOffHour = Number(turnOffTime.hour);
    const turnOffMinute = Number(turnOffTime.minute);

    if (!turnOnTime.hour || !turnOnTime.minute || !turnOffTime.hour || !turnOffTime.minute) {
      Alert.alert('Error', 'Por favor completa todos los campos.');
      return;
    }

    if (scheduleList.length > 0) {
      Alert.alert('Programación existente', 'Solo puedes tener una programación activa a la vez.');
      return;
    }

    const newScheduleId = `Horario_${Date.now()}`;

    const newSchedule: Schedule = {
      id: newScheduleId,
      on: `${turnOnHour}:${turnOnMinute.toString().padStart(2, '0')}`,
      off: `${turnOffHour}:${turnOffMinute.toString().padStart(2, '0')}`,
      expiresAt: calculateExpiration(turnOffHour, turnOffMinute),
      notificationIds: [],
    };

    // Programar notificaciones
    const notificationIds = await scheduleNotifications(newSchedule);

    newSchedule.notificationIds = notificationIds; // Error resuelto

    const updatedSchedules = [newSchedule];
    setScheduleList(updatedSchedules);

    const firebaseSchedules = updatedSchedules.reduce((acc: { [key: string]: any }, schedule) => {
      acc[schedule.id] = {
        on: schedule.on,
        off: schedule.off,
        expiresAt: schedule.expiresAt,
        notificationIds: schedule.notificationIds,
      };
      return acc;
    }, {});

    saveSchedulesToFirebase(firebaseSchedules);

    Alert.alert('Programación Guardada', `Encender a las ${newSchedule.on}\nApagar a las ${newSchedule.off}`);
    setTurnOnTime({ hour: '', minute: '' });
    setTurnOffTime({ hour: '', minute: '' });
  };

  const scheduleNotifications = async (schedule: Schedule) => {
    const notificationIds: string[] = [];
  
    const onDate = getNextOccurrence(schedule.on);
    const offDate = getNextOccurrence(schedule.off);
  
    console.log('Programando notificación de encendido para:', onDate);
    console.log('Programando notificación de apagado para:', offDate);
  
    const onNotificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Dispositivo Encendido',
        body: `El dispositivo ${deviceName} se ha encendido a las ${schedule.on}`,
      },
      trigger: onDate,
    });
  
    const offNotificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Dispositivo Apagado',
        body: `El dispositivo ${deviceName} se ha apagado a las ${schedule.off}`,
      },
      trigger: offDate,
    });
  
    notificationIds.push(onNotificationId, offNotificationId);
  
    return notificationIds;
  }; 

  const getNextOccurrence = (time: string) => {
    const [hour, minute] = time.split(':').map(Number);
    const now = new Date();
    let scheduledTime = new Date();

    scheduledTime.setHours(hour, minute, 0, 0);

    if (scheduledTime <= now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    return scheduledTime;
  };

  const calculateExpiration = (hour: number, minute: number) => {
    const now = new Date();
    let expiration = new Date();
  
    expiration.setHours(hour, minute, 0, 0);
  
    if (expiration <= now) {
      expiration.setDate(expiration.getDate() + 1);
    }
  
    // Añadir 1 minuto después de la hora de apagado
    expiration = new Date(expiration.getTime() + 1 * 60 * 1000); // Añadir 1 minuto
  
    return expiration.toISOString();
  };  

  const handleDeleteSchedule = async (id: string) => {
    const scheduleToDelete = scheduleList.find((item) => item.id === id);

    if (scheduleToDelete) {
      for (const notificationId of scheduleToDelete.notificationIds) {
        await Notifications.cancelScheduledNotificationAsync(notificationId);
      }
    }

    const updatedSchedules = scheduleList.filter((item) => item.id !== id);
    setScheduleList(updatedSchedules);

    const firebaseSchedules = updatedSchedules.reduce((acc: { [key: string]: any }, schedule) => {
      acc[schedule.id] = {
        on: schedule.on,
        off: schedule.off,
        expiresAt: schedule.expiresAt,
        notificationIds: schedule.notificationIds,
      };
      return acc;
    }, {});

    saveSchedulesToFirebase(firebaseSchedules);

    Alert.alert('Eliminado', 'Programación eliminada con éxito.');
  };

  const registerBackgroundFetch = async () => {
    const status = await BackgroundFetch.getStatusAsync();
    if (status === BackgroundFetchStatus.Restricted || status === BackgroundFetchStatus.Denied) {
      console.log('Background execution is disabled');
      return;
    }

    const task = await TaskManager.isTaskRegisteredAsync(BACKGROUND_FETCH_TASK);
    if (!task) {
      await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
        minimumInterval: 1 * 60, // 15 minutos
        stopOnTerminate: false,
        startOnBoot: true,
      });
    }
  };

  TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
    console.log('Background fetch task running');
    await checkExpiredSchedules();
    return BackgroundFetchResult.NewData;
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Programar Horario para {deviceName} (Pin: {pin})</Text>

      <Text style={styles.label}>Hora de encendido</Text>
      <View style={styles.timeInputContainer}>
        <TextInput
          style={styles.timeInput}
          placeholder="HH"
          value={turnOnTime.hour}
          keyboardType="numeric"
          maxLength={2}
          onChangeText={(text) => setTurnOnTime({ ...turnOnTime, hour: validateInput(text, 23) })}
        />
        <Text style={styles.separator}>:</Text>
        <TextInput
          style={styles.timeInput}
          placeholder="MM"
          value={turnOnTime.minute}
          keyboardType="numeric"
          maxLength={2}
          onChangeText={(text) => setTurnOnTime({ ...turnOnTime, minute: validateInput(text, 59) })}
        />
      </View>

      <Text style={styles.label}>Hora de apagado</Text>
      <View style={styles.timeInputContainer}>
        <TextInput
          style={styles.timeInput}
          placeholder="HH"
          value={turnOffTime.hour}
          keyboardType="numeric"
          maxLength={2}
          onChangeText={(text) => setTurnOffTime({ ...turnOffTime, hour: validateInput(text, 23) })}
        />
        <Text style={styles.separator}>:</Text>
        <TextInput
          style={styles.timeInput}
          placeholder="MM"
          value={turnOffTime.minute}
          keyboardType="numeric"
          maxLength={2}
          onChangeText={(text) => setTurnOffTime({ ...turnOffTime, minute: validateInput(text, 59) })}
        />
      </View>

      <TouchableOpacity style={styles.secondaryButton} onPress={handleSaveSchedule}>
        <Text style={styles.secondaryButtonText}>Guardar Programación</Text>
      </TouchableOpacity>

      <FlatList
        data={scheduleList}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.scheduleItem}>
            <Text style={styles.scheduleText}>
              Encender: {item.on} - Apagar: {item.off}
            </Text>
            <TouchableOpacity onPress={() => handleDeleteSchedule(item.id)}>
              <Text style={styles.deleteText}>Eliminar</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>←</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F5F5F5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
  },
  timeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  timeInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginHorizontal: 5,
    width: 60,
    textAlign: 'center',
    backgroundColor: '#fff',
  },
  separator: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: '#007BFF',
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginHorizontal: 5,
    marginTop: 20,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  scheduleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 5,
    marginVertical: 5,
  },
  scheduleText: {
    fontSize: 16,
    color: '#333',
  },
  deleteText: {
    color: 'red',
    fontSize: 14,
  },
  backButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#ddd',
    borderRadius: 5,
  },
  backButtonText: {
    fontSize: 18,
    color: '#333',
  },
});

export default Programar;
