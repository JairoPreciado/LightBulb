"use client"

import { View, Text, TouchableOpacity, StyleSheet, Dimensions, ActivityIndicator, Modal, Alert } from "react-native"
import { useRouter, usePathname } from "expo-router"
import { Smartphone, BookOpen, Sliders, Home, Lock, Plus } from "lucide-react-native"
import { useState } from "react"
import { auth, db } from "../../firebaseConfiguration"
import { doc, getDoc } from "firebase/firestore"

interface BottomNavbarProps {
  storedApiKey?: string
}

const BottomNavbar = ({ storedApiKey }: BottomNavbarProps) => {
  const router = useRouter()
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(false)
  const [showDeviceModal, setShowDeviceModal] = useState(false)
  const [hasDevices, setHasDevices] = useState(false)

  const isActive = (path: string) => {
    return pathname.includes(path)
  }

  // Verificar si hay dispositivos Photon conectados
  const checkDevices = async () => {
    setIsLoading(true)
    try {
      const userId = auth.currentUser?.uid
      if (!userId) {
        setHasDevices(false)
        setIsLoading(false)
        return
      }

      const userDocRef = doc(db, "BD", userId)
      const userDocSnap = await getDoc(userDocRef)

      if (userDocSnap.exists()) {
        const data = userDocSnap.data()
        const devicesData = data.Devices || {}
        const hasAnyDevice = Object.keys(devicesData).length > 0

        setHasDevices(hasAnyDevice)

        if (hasAnyDevice) {
          router.push("/controlLightBulb/devices/listDevices")
        } else {
          setShowDeviceModal(true)
        }
      } else {
        setHasDevices(false)
        setShowDeviceModal(true)
      }
    } catch (error) {
      console.error("Error al verificar dispositivos:", error)
      Alert.alert("Error", "No se pudieron verificar los dispositivos.")
      setHasDevices(false)
    } finally {
      setIsLoading(false)
    }
  }

  // Definir las rutas con sus respectivos paths completos
  const navigateToHome = () => router.push("/controlLightBulb/home")
  const navigateToDevices = () => {
    if (pathname.includes("/devices")) return
    checkDevices()
  }
  const navigateToGuide = () => router.push("/controlLightBulb/guideUser")
  const navigateToControllers = () => router.push("/controlLightBulb/controllers/addControllers")

  return (
    <>
      <View style={styles.container}>
        <View style={styles.navItems}>
          <TouchableOpacity
            style={[styles.navItem, isActive("/home") && styles.activeNavItem]}
            onPress={navigateToHome}
          >
            <Home color={isActive("/home") ? "#007BFF" : "#666"} size={24} />
            <Text style={[styles.navText, isActive("/home") && styles.activeText]}>Inicio</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navItem, isActive("/devices") && styles.activeNavItem]}
            onPress={navigateToDevices}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#007BFF" />
            ) : (
              <Smartphone color={isActive("/devices") ? "#007BFF" : "#666"} size={24} />
            )}
            <Text style={[styles.navText, isActive("/devices") && styles.activeText]}>Dispositivos</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navItem, isActive("/guideUser") && styles.activeNavItem]}
            onPress={navigateToGuide}
          >
            <BookOpen color={isActive("/guideUser") ? "#007BFF" : "#666"} size={24} />
            <Text style={[styles.navText, isActive("/guideUser") && styles.activeText]}>Guía</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navItem, isActive("/controllers") && styles.activeNavItem]}
            onPress={navigateToControllers}
          >
            <Sliders color={isActive("/controllers") ? "#007BFF" : "#666"} size={24} />
            <Text style={[styles.navText, isActive("/controllers") && styles.activeText]}>Controladores</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Modal para cuando no hay dispositivos */}
      <Modal
        visible={showDeviceModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDeviceModal(false)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Lock size={50} color="#FF9500" style={styles.modalIcon} />
            <Text style={styles.modalTitle}>No hay dispositivos</Text>
            <Text style={styles.modalText}>
              No se encontraron dispositivos Photon conectados. Agrega un nuevo dispositivo para continuar.
            </Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setShowDeviceModal(false)
                router.push("/controlLightBulb/controllers/addControllers")
              }}
            >
              <Plus size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.modalButtonText}>Agregar nuevo dispositivo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalCloseButton} onPress={() => setShowDeviceModal(false)}>
              <Text style={styles.modalCloseButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    paddingVertical: 10,
  },
  navItems: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  navItem: {
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
    width: Dimensions.get("window").width / 4 - 15,
  },
  activeNavItem: {
    backgroundColor: "#f0f9ff",
    borderRadius: 8,
  },
  navText: {
    fontSize: 12,
    marginTop: 4,
    color: "#666",
    textAlign: "center",
  },
  activeText: {
    color: "#007BFF",
    fontWeight: "600",
  },
  disabledNavItem: {
    opacity: 0.7,
  },
  disabledText: {
    color: "#999",
  },
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "80%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalIcon: {
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  modalText: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
    color: "#666",
  },
  modalButton: {
    flexDirection: "row",
    backgroundColor: "#FF9500",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    marginBottom: 10,
  },
  modalButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  modalCloseButton: {
    paddingVertical: 10,
  },
  modalCloseButtonText: {
    color: "#666",
    fontSize: 14,
  },
})

export default BottomNavbar

