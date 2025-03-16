"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { View, Text, Alert, StyleSheet, TouchableOpacity } from "react-native"
import { useRouter, useLocalSearchParams } from "expo-router"
import axios from "axios"
import { auth, db } from "../../../firebaseConfiguration"
import { doc, getDoc } from "firebase/firestore"
import { Power, Clock } from "lucide-react-native"
import Navbar from "../../components/navbar"
import SettingsModal from "../settings-modal"

const Device: React.FC = () => {
  const router = useRouter()
  const { deviceKey, subName, pin } = useLocalSearchParams<{
    deviceKey: string
    subName: string
    pin: string
  }>()

  const [isConnected, setIsConnected] = useState(true)
  const [isDeviceOn, setIsDeviceOn] = useState(false)
  const [photonId, setPhotonId] = useState("")
  const [particleAccessToken, setParticleAccessToken] = useState("")
  const [modalVisible, setModalVisible] = useState(false)

  // Validar que se reciban los parámetros necesarios
  useEffect(() => {
    if (!deviceKey || !pin) {
      Alert.alert("Error", "Faltan parámetros del dispositivo.")
      router.back()
    }
  }, [deviceKey, pin, router])

  // Obtener datos del dispositivo (photonId y apiKey) usando deviceKey
  useEffect(() => {
    const fetchDeviceData = async () => {
      const userId = auth.currentUser?.uid
      if (!userId) {
        Alert.alert("Error", "Usuario no autenticado.")
        return
      }
      try {
        const docRef = doc(db, "BD", userId)
        const docSnap = await getDoc(docRef)
        if (docSnap.exists()) {
          const data = docSnap.data()
          const deviceData = data.Devices?.[deviceKey]
          if (!deviceData) {
            Alert.alert("Error", `No se encontró el dispositivo con deviceKey: ${deviceKey}`)
            router.back()
            return
          }
          console.log("Datos del dispositivo:", deviceData)
          setPhotonId(deviceData.photonId)
          setParticleAccessToken(deviceData.apikey)
          console.log(deviceData.photonId, deviceData.apikey)
        } else {
          Alert.alert("Error", "No se encontró información del usuario en la BD.")
        }
      } catch (error) {
        console.error("Error al obtener los datos del dispositivo:", error)
        Alert.alert("Error", "Hubo un problema al cargar los datos del dispositivo.")
      }
    }

    fetchDeviceData()
  }, [deviceKey, router])

  // Consultar el estado del dispositivo cada 5 segundos usando el pin
  useEffect(() => {
    const interval = setInterval(() => {
      if (isConnected && photonId && particleAccessToken) {
        consultarEstadoDispositivo()
      }
    }, 3500)
    return () => clearInterval(interval)
  }, [isConnected, photonId, particleAccessToken])

  const handleSettingsPress = () => {
    setModalVisible(true)
  }

  const consultarEstadoDispositivo = async () => {
    if (!photonId || !particleAccessToken) return
    try {
      const response = await axios.get(`https://api.particle.io/v1/devices/${photonId}/estado${pin}`, {
        headers: { Authorization: `Bearer ${particleAccessToken}` },
      })
      setIsDeviceOn(response.data.result)
    } catch (error) {
      console.error(`Error al consultar el estado del dispositivo ${pin}:`, error)
    }
  }

  const toggleDevice = async () => {
    if (!isConnected) {
      Alert.alert("Sin conexión", "No puedes controlar el dispositivo sin conexión a Internet.")
      return
    }
    const command = isDeviceOn ? "off" : "on"
    try {
      const response = await axios.post(
        `https://api.particle.io/v1/devices/${photonId}/cambiarEstado${pin}`,
        `arg=${command}`,
        {
          headers: {
            Authorization: `Bearer ${particleAccessToken}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
        },
      )
      if (response.data.return_value === 1) {
        setIsDeviceOn(!isDeviceOn)
        Alert.alert("Éxito", `Dispositivo ${isDeviceOn ? "apagado" : "encendido"} correctamente`)
      } else {
        Alert.alert("Error", "No se pudo cambiar el estado del dispositivo.")
      }
    } catch (error) {
      Alert.alert("Error", `Hubo un problema al comunicarse con el dispositivo ${pin}.`)
    }
  }

  return (
    <View style={styles.container}>
      <Navbar title={`Control de ${subName || "Dispositivo"}`} onSettingsPress={handleSettingsPress} />

      <SettingsModal isVisible={modalVisible} onClose={() => setModalVisible(false)} />

      <View style={styles.content}>
        {isConnected ? (
          <>
            <View style={styles.statusContainer}>
              <Text style={styles.statusLabel}>Estado del dispositivo:</Text>
              <View style={[styles.statusIndicator, isDeviceOn ? styles.statusOn : styles.statusOff]}>
                <Text style={styles.statusText}>{isDeviceOn ? "Encendido" : "Apagado"}</Text>
              </View>
              <Text style={styles.pinText}>Pin: {pin}</Text>
            </View>

            <TouchableOpacity
              style={[styles.powerButton, isDeviceOn ? styles.powerButtonOff : styles.powerButtonOn]}
              onPress={toggleDevice}
            >
              <Power size={24} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.powerButtonText}>{isDeviceOn ? "Apagar" : "Encender"}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.programButton}
              onPress={() =>
                router.push({
                  pathname: "./program",
                  params: {
                    deviceName: subName || deviceKey,
                    pin: pin,
                    deviceKey: deviceKey,
                  },
                })
              }
            >
              <Clock size={24} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.programButtonText}>Programar Horarios</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.offlineContainer}>
            <Text style={styles.offlineText}>Sin conexión a Internet</Text>
            <Text style={styles.offlineSubtext}>Verifica tu conexión e intenta nuevamente</Text>
          </View>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  content: {
    flex: 1,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  statusContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  statusLabel: {
    fontSize: 18,
    fontWeight: "500",
    color: "#333",
    marginBottom: 12,
  },
  statusIndicator: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginBottom: 8,
  },
  statusOn: {
    backgroundColor: "#4CAF50",
  },
  statusOff: {
    backgroundColor: "#F44336",
  },
  statusText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  pinText: {
    fontSize: 14,
    color: "#666",
    marginTop: 8,
  },
  powerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 10,
    marginBottom: 20,
    width: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  powerButtonOn: {
    backgroundColor: "#4CAF50",
  },
  powerButtonOff: {
    backgroundColor: "#F44336",
  },
  powerButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  programButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#007BFF",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 10,
    width: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  programButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  offlineContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  offlineText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#F44336",
    marginBottom: 10,
  },
  offlineSubtext: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
})

export default Device

