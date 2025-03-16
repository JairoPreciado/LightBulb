"use client"

import { useEffect, useState } from "react"
import { View, Text, StyleSheet, Alert, ScrollView } from "react-native"
import { useRouter } from "expo-router"
import { auth, db } from "../../firebaseConfiguration"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import Navbar from "../components/navbar"
import BottomNavbar from "../components/bottom-navbar"
import SettingsModal from "./settings-modal"

const HomeScreen = () => {
  const router = useRouter()
  const [storedApiKey, setStoredApiKey] = useState("")
  const [storedExpiresAt, setStoredExpiresAt] = useState<number | string | null>(null)
  const [deviceKey, setDeviceKey] = useState("")
  const [modalVisible, setModalVisible] = useState(false)

  useEffect(() => {
    const intervalId = setInterval(async () => {
      const userId = auth.currentUser?.uid
      if (!userId) return

      try {
        const userDocRef = doc(db, "BD", userId)
        const userDocSnap = await getDoc(userDocRef)

        if (userDocSnap.exists()) {
          const data = userDocSnap.data()
          const devicesData = data.Devices || {}
          let validApiKey = ""
          let validExpiresAt: number | string | null = null
          let validDeviceKey = ""

          // Iterar sobre cada dispositivo guardado en Devices
          Object.entries(devicesData).forEach(([key, device]: [string, any]) => {
            if (device && device.apikey && device.apikey.trim() !== "") {
              // Tomamos el primer dispositivo con API key no vacía
              if (!validApiKey) {
                validApiKey = device.apikey
                validExpiresAt = device.expiresAt
                validDeviceKey = key
              }
            }
          })

          setStoredApiKey(validApiKey)
          setStoredExpiresAt(validExpiresAt)
          setDeviceKey(validDeviceKey)

          // Si la API key tiene fecha de expiración (número) y ya pasó, se actualiza para eliminarla
          if (typeof validExpiresAt === "number" && Date.now() > validExpiresAt) {
            await updateDoc(userDocRef, { [`Devices.${validDeviceKey}.apikey`]: "" })
            setStoredApiKey("")
            setStoredExpiresAt(null)
            Alert.alert("Aviso", "Tu API Key ha expirado y ha sido eliminada.")
          }
        }
      } catch (error) {
        console.error("Error verificando la expiración de la API Key:", error)
      }
    }, 10000)

    return () => clearInterval(intervalId)
  }, [])

  const handleSettingsPress = () => {
    setModalVisible(true)
  }

  return (
    <View style={styles.container}>
      {/* Navbar en la parte superior */}
      <Navbar title="Lightbulb" showBackButton={false} onSettingsPress={handleSettingsPress} />

      {/* Settings Modal */}
      <SettingsModal isVisible={modalVisible} onClose={() => setModalVisible(false)} />

      <ScrollView style={styles.contentContainer}>
        {/* Texto de bienvenida */}
        <Text style={styles.text}>Bienvenido a Lightbulb</Text>
        <Text style={styles.subText}>Gestiona toda la información de la app y configura tus dispositivos.</Text>

        {/* Tarjetas informativas */}
        <View style={styles.infoContainer}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📡 Dispositivos</Text>
            <Text style={styles.cardText}>Gestiona y controla los dispositivos vinculados a tu cuenta.</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>🛠️ Controladores</Text>
            <Text style={styles.cardText}>Crea y configura nuevos dispositivos para personalizar tu experiencia.</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>📖 Guía de usuario</Text>
            <Text style={styles.cardText}>Aprende cómo usar todas las funciones de la aplicación fácilmente.</Text>
          </View>
        </View>
      </ScrollView>

      {/* Barra de navegación inferior */}
      <BottomNavbar storedApiKey={storedApiKey} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  contentContainer: {
    flex: 1,
    padding: 20,
  },
  text: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
    marginTop: 10,
  },
  subText: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
    color: "#666",
  },
  infoContainer: {
    width: "100%",
    alignItems: "center",
    marginBottom: 30,
  },
  card: {
    width: "100%",
    backgroundColor: "#ffffff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },
  cardText: {
    fontSize: 14,
    color: "#555",
  },
})

export default HomeScreen

