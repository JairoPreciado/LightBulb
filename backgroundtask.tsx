// backgroundTasks.ts

import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import * as Notifications from 'expo-notifications';
import { BackgroundFetchResult } from 'expo-background-fetch';
import { auth, db } from './firebaseConfiguration'; // Ajusta la ruta según la ubicación real
import { doc, getDoc, setDoc } from 'firebase/firestore';

const BACKGROUND_FETCH_TASK = 'background-fetch';

TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  console.log('Background fetch task running');

  try {
    await checkExpiredSchedules();
    return BackgroundFetchResult.NewData;
  } catch (error) {
    console.error('Error in background task:', error);
    return BackgroundFetchResult.Failed;
  }
});

const checkExpiredSchedules = async () => {
  const now = new Date();

  const userId = auth.currentUser?.uid;
  if (!userId) {
    console.error('No authenticated user in background task.');
    return;
  }

  const userRef = doc(db, 'BD', userId);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    const userData = userSnap.data();
    const devices = userData.devices || {};

    let schedulesChanged = false;

    for (const pin in devices) {
      const device = devices[pin];
      const horarios = device.horarios || {};

      const nonExpiredSchedules: { [key: string]: any } = {};
      const expiredSchedules: any[] = [];

      for (const scheduleId in horarios) {
        const schedule = horarios[scheduleId];
        const expiresAt = new Date(schedule.expiresAt);

        if (expiresAt > now) {
          nonExpiredSchedules[scheduleId] = schedule;
        } else {
          expiredSchedules.push(schedule);
        }
      }

      if (expiredSchedules.length > 0) {
        // Cancelar notificaciones de programaciones expiradas
        for (const schedule of expiredSchedules) {
          for (const notificationId of schedule.notificationIds) {
            await Notifications.cancelScheduledNotificationAsync(notificationId);
          }
        }

        // Actualizar los horarios del dispositivo
        devices[pin].horarios = nonExpiredSchedules;
        schedulesChanged = true;
      }
    }

    if (schedulesChanged) {
      // Guardar los horarios actualizados en Firebase
      await setDoc(userRef, { devices }, { merge: true });
      console.log('Horarios actualizados en la tarea en segundo plano.');
    }
  } else {
    console.error('Datos de usuario no encontrados en Firebase en la tarea en segundo plano.');
  }
};
