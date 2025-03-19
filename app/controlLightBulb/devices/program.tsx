"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { View, Text, TextInput, Alert, StyleSheet, TouchableOpacity, FlatList, AppState } from "react-native"
import { useRouter, useLocalSearchParams } from "expo-router"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { auth, db } from "../../../firebaseConfiguration"
import * as Notifications from "expo-notifications"
import * as TaskManager from "expo-task-manager"
import * as BackgroundFetch from "expo-background-fetch"
import { BackgroundFetchResult, BackgroundFetchStatus } from "expo-background-fetch"
import "../../../backgroundtask"
import Navbar from "../../components/navbar"
import SettingsModal from "../settings-modal"

const BACKGROUND_FETCH_TASK = "background-fetch"

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

interface Schedule {
  id: string
  on: string
  off: string
  expiresAt: string
  notificationIds: string[]
}

const Programar: React.FC = () => {
  const router = useRouter()
  const { deviceName, pin, deviceKey } = useLocalSearchParams<{
    deviceName: string
    pin: string
    deviceKey: string
  }>()

  const [turnOnTime, setTurnOnTime] = useState({ hour: "", minute: "" })
  const [turnOffTime, setTurnOffTime] = useState({ hour: "", minute: "" })
  const [scheduleList, setScheduleList] = useState<Schedule[]>([])
  const [modalVisible, setModalVisible] = useState(false)
  const appState = useRef(AppState.currentState)

  // Validar que se hayan recibido todos los parámetros
  useEffect(() => {
    if (!deviceName || !pin || !deviceKey) {
      Alert.alert("Error", "No se recibieron todos los datos del dispositivo.")
      router.back()
    }
  }, [deviceName, pin, deviceKey, router])

  // Registrar background fetch, cargar programaciones y pedir permisos de notificación cuando cambia el pin
  useEffect(() => {
    registerBackgroundFetch()
    loadSchedules()
    requestNotificationPermission()
  }, [pin])

  // Verificar programaciones expiradas cada 5 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      checkExpiredSchedules()
    }, 5000)
    return () => clearInterval(interval)
  }, [scheduleList])

  const loadSchedules = async () => {
    try {
      const userId = auth.currentUser?.uid
      if (!userId) return
      const userRef = doc(db, "BD", userId)
      const userSnap = await getDoc(userRef)
      if (userSnap.exists()) {
        const data = userSnap.data()
        // Leer las programaciones almacenadas en Devices.[deviceKey].subdevices.[pin].horarios
        const pinSchedules = data.Devices?.[deviceKey]?.subdevices?.[pin]?.horarios || {}
        const loadedSchedules: Schedule[] = Object.entries(pinSchedules).map(([key, value]: [string, any]) => ({
          id: key,
          on: value.on,
          off: value.off,
          expiresAt: value.expiresAt,
          notificationIds: value.notificationIds || [],
        }))
        setScheduleList(loadedSchedules)
      } else {
        console.error("No se encontró información del usuario en Firebase.")
      }
    } catch (error) {
      console.error("Error al cargar programaciones:", error)
    }
  }

  const handleSettingsPress = () => {
    setModalVisible(true)
  }

  const registerBackgroundFetch = async () => {
    const status = await BackgroundFetch.getStatusAsync()
    if (status === BackgroundFetchStatus.Restricted || status === BackgroundFetchStatus.Denied) {
      console.log("Background fetch deshabilitado")
      return
    }
    const taskRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_FETCH_TASK)
    if (!taskRegistered) {
      await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
        minimumInterval: 60, // en segundos
        stopOnTerminate: false,
        startOnBoot: true,
      })
    }
  }

  TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
    console.log("Background fetch task running")
    await checkExpiredSchedules()
    return BackgroundFetchResult.NewData
  })

  const requestNotificationPermission = async () => {
    const { status } = await Notifications.requestPermissionsAsync()
    if (status !== "granted") {
      Alert.alert("Permisos denegados", "No se pueden enviar notificaciones sin permisos.")
    }
  }

  const checkExpiredSchedules = async () => {
    const now = new Date()
    const validSchedules = scheduleList.filter((schedule) => new Date(schedule.expiresAt) > now)
    const expiredSchedules = scheduleList.filter((schedule) => new Date(schedule.expiresAt) <= now)

    for (const schedule of expiredSchedules) {
      for (const notifId of schedule.notificationIds) {
        await Notifications.cancelScheduledNotificationAsync(notifId)
      }
    }
    if (expiredSchedules.length > 0) {
      setScheduleList(validSchedules)
      const firebaseSchedules = validSchedules.reduce((acc: { [key: string]: any }, schedule) => {
        acc[schedule.id] = {
          on: schedule.on,
          off: schedule.off,
          expiresAt: schedule.expiresAt,
          notificationIds: schedule.notificationIds,
        }
        return acc
      }, {})
      await saveSchedulesToSubdeviceAndParticle(firebaseSchedules)
    }
  }
// esto falla porque usar un photon 2, o por que le da la gana? //// pendiente
  const validateInput = (value: string, max: number): string => {
    const numericValue = value.replace(/[^0-9]/g, "")
    if (!numericValue) return ""
    const number = Math.min(Number(numericValue), max)
    return number.toString()
  }

  const handleSaveSchedule = async () => {
    const turnOnHour = Number(turnOnTime.hour)
    const turnOnMinute = Number(turnOnTime.minute)
    const turnOffHour = Number(turnOffTime.hour)
    const turnOffMinute = Number(turnOffTime.minute)

    if (!turnOnTime.hour || !turnOnTime.minute || !turnOffTime.hour || !turnOffTime.minute) {
      Alert.alert("Error", "Por favor completa todos los campos.")
      return
    }

    if (scheduleList.length > 0) {
      Alert.alert("Programación existente", "Solo puedes tener una programación activa a la vez.")
      return
    }

    const newScheduleId = `Horario_${Date.now()}`
    const newSchedule: Schedule = {
      id: newScheduleId,
      on: `${turnOnHour}:${turnOnMinute.toString().padStart(2, "0")}`,
      off: `${turnOffHour}:${turnOffMinute.toString().padStart(2, "0")}`,
      expiresAt: calculateExpiration(turnOffHour, turnOffMinute),
      notificationIds: [],
    }

    const notificationIds = await scheduleNotifications(newSchedule)
    newSchedule.notificationIds = notificationIds
    const updatedSchedules = [newSchedule]
    setScheduleList(updatedSchedules)

    const firebaseSchedules = updatedSchedules.reduce((acc: { [key: string]: any }, schedule) => {
      acc[schedule.id] = {
        on: schedule.on,
        off: schedule.off,
        expiresAt: schedule.expiresAt,
        notificationIds: schedule.notificationIds,
      }
      return acc
    }, {})

    await saveSchedulesToSubdeviceAndParticle(firebaseSchedules)

    Alert.alert("Programación Guardada", `Encender a las ${newSchedule.on}\nApagar a las ${newSchedule.off}`)
    setTurnOnTime({ hour: "", minute: "" })
    setTurnOffTime({ hour: "", minute: "" })
  }

  const scheduleNotifications = async (schedule: Schedule): Promise<string[]> => {
    const notificationIds: string[] = []
    const onDate = getNextOccurrence(schedule.on)
    const offDate = getNextOccurrence(schedule.off)
    console.log("Notificación encendido programada para:", onDate)
    console.log("Notificación apagado programada para:", offDate)

    const onNotificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Subdispositivo Encendido",
        body: `El subdispositivo ${deviceName} (Pin ${pin}) se encendió a las ${schedule.on}`,
      },
      trigger: onDate,
    })
    const offNotificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Subdispositivo Apagado",
        body: `El subdispositivo ${deviceName} (Pin ${pin}) se apagó a las ${schedule.off}`,
      },
      trigger: offDate,
    })
    notificationIds.push(onNotificationId, offNotificationId)
    return notificationIds
  }

  const getNextOccurrence = (time: string) => {
    const [hour, minute] = time.split(":").map(Number)
    const now = new Date()
    const scheduledTime = new Date()
    scheduledTime.setHours(hour, minute, 0, 0)
    if (scheduledTime <= now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1)
    }
    return scheduledTime
  }

  const calculateExpiration = (hour: number, minute: number) => {
    const now = new Date()
    let expiration = new Date()
    expiration.setHours(hour, minute, 0, 0)
    if (expiration <= now) {
      expiration.setDate(expiration.getDate() + 1)
    }
    // Añadir 1 minuto extra después de la hora de apagado
    expiration = new Date(expiration.getTime() + 1 * 60 * 1000)
    return expiration.toISOString()
  }

  // Guardar programaciones en Firestore (dentro del subdispositivo) y enviar a Particle
  const saveSchedulesToSubdeviceAndParticle = async (schedules: Record<string, any>) => {
    try {
      const userId = auth.currentUser?.uid
      if (!userId) return
      const userRef = doc(db, "BD", userId)
      const userSnap = await getDoc(userRef)
      if (!userSnap.exists()) {
        console.error("No se encontró el usuario en Firebase.")
        return
      }
      const userData = userSnap.data() || {}
      const devices = userData.Devices || {}
      const deviceData = devices[deviceKey] || {}
      const subdevices = deviceData.subdevices || {}
      const subdeviceData = subdevices[pin] || {}

      const updatedSubdevice = {
        ...subdeviceData,
        horarios: schedules,
      }

      const updatedDevice = {
        ...deviceData,
        subdevices: {
          ...subdevices,
          [pin]: updatedSubdevice,
        },
      }

      await setDoc(userRef, { Devices: { ...devices, [deviceKey]: updatedDevice } }, { merge: true })

      console.log("Programaciones guardadas en Firestore dentro del subdispositivo.")

      // Aquí obtenemos photonId y apikey desde el dispositivo, no desde la raíz
      const { photonId, apikey } = deviceData
      if (!photonId || !apikey) {
        console.error("No se encontró photonId o apikey en el dispositivo.")
        return
      }

      const toParticle = {
        [pin]: {
          horarios: schedules,
        },
      }

      await sendToParticle(photonId, apikey, toParticle)
    } catch (error) {
      console.error("Error guardando programaciones:", error)
    }
  }

  const sendToParticle = async (photonId: string, apiKey: string, schedulesObj: any) => {
    try {
      const schedulesString = JSON.stringify(schedulesObj)
      const response = await fetch(`https://api.particle.io/v1/devices/${photonId}/actualizarHorarios`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Bearer ${apiKey}`,
        },
        body: `args=${encodeURIComponent(schedulesString)}`,
      })
      if (!response.ok) {
        const errorData = await response.json()
        console.error("Error enviando horarios a Particle:", errorData)
        return
      }
      const data = await response.json()
      console.log("Horarios enviados correctamente a Particle:", data)
    } catch (error) {
      console.error("Error al enviar datos a Particle:", error)
    }
  }

  const handleDeleteSchedule = async (id: string) => {
    const scheduleToDelete = scheduleList.find((item) => item.id === id)
    if (scheduleToDelete) {
      for (const notificationId of scheduleToDelete.notificationIds) {
        await Notifications.cancelScheduledNotificationAsync(notificationId)
      }
    }
    const updatedSchedules = scheduleList.filter((item) => item.id !== id)
    setScheduleList(updatedSchedules)
    const firebaseSchedules = updatedSchedules.reduce((acc: { [key: string]: any }, schedule) => {
      acc[schedule.id] = {
        on: schedule.on,
        off: schedule.off,
        expiresAt: schedule.expiresAt,
        notificationIds: schedule.notificationIds,
      }
      return acc
    }, {})
    await saveSchedulesToSubdeviceAndParticle(firebaseSchedules)
    Alert.alert("Eliminado", "Programación eliminada con éxito.")
  }

  return (
    <View style={styles.container}>
      <Navbar title={`Programar ${deviceName || ""}`} onSettingsPress={handleSettingsPress} />

      <SettingsModal isVisible={modalVisible} onClose={() => setModalVisible(false)} />

      <View style={styles.content}>
        <Text style={styles.subtitle}>
          Programar Horario para {deviceName} (Pin: {pin})
        </Text>

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

        <TouchableOpacity style={styles.saveButton} onPress={handleSaveSchedule}>
          <Text style={styles.saveButtonText}>Guardar Programación</Text>
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
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#333",
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 10,
    marginBottom: 5,
    color: "#444",
  },
  timeInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  timeInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 5,
    width: 60,
    textAlign: "center",
    backgroundColor: "#fff",
  },
  separator: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  saveButton: {
    backgroundColor: "#007BFF",
    paddingVertical: 12,
    paddingHorizontal: 15,
    marginVertical: 20,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  scheduleItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    backgroundColor: "#fff",
    borderRadius: 8,
    marginVertical: 5,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 2,
  },
  scheduleText: {
    fontSize: 16,
    color: "#333",
  },
  deleteText: {
    color: "red",
    fontSize: 14,
    fontWeight: "500",
  },
})

export default Programar

