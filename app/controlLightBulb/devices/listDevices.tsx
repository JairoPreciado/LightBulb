"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, Modal, TextInput } from "react-native"
import Checkbox from "expo-checkbox"
import { useRouter } from "expo-router"
import { auth, db } from "../../../firebaseConfiguration"
import { doc, getDoc, updateDoc, deleteField } from "firebase/firestore"
import { ChevronRight, Edit, Trash2, Zap } from "lucide-react-native"
import Navbar from "../../components/navbar"
import BottomNavbar from "../../components/bottom-navbar"
import SettingsModal from "../settings-modal"

const ListUserDevices: React.FC = () => {
  const [devices, setDevices] = useState<
    Array<{
      key: string
      photonId: string
      apikey: string
      name: string
      expiresAt: string
      subdevices: any
    }>
  >([])
  // Dispositivos seleccionados para flasheo
  const [selectedDevices, setSelectedDevices] = useState<string[]>([])
  // Estado para indicar qué opción se ha seleccionado en el modal ('', 'updateName', 'updateId', 'delete')
  const [activeOption, setActiveOption] = useState("")
  // Estado para modal de gestión del dispositivo
  const [modalVisible, setModalVisible] = useState(false)
  // Estado para modal de configuración
  const [settingsModalVisible, setSettingsModalVisible] = useState(false)
  // Dispositivo seleccionado para gestionar
  const [selectedDevice, setSelectedDevice] = useState<any>(null)
  // Estados para los inputs de actualización
  const [updatedName, setUpdatedName] = useState("")
  const [updatedPhotonId, setUpdatedPhotonId] = useState("")
  // Estado para almacenar los tipos de dispositivos
  const [deviceTypes, setDeviceTypes] = useState<{ [key: string]: string }>({})
  const router = useRouter()

  useEffect(() => {
    const loadDevices = async () => {
      const userId = auth.currentUser?.uid
      if (!userId) {
        Alert.alert("Error", "Usuario no autenticado.")
        return
      }
      try {
        const userDocRef = doc(db, "BD", userId)
        const userDocSnap = await getDoc(userDocRef)
        if (userDocSnap.exists()) {
          const data = userDocSnap.data()
          const devicesObj = data.Devices || {}
          const devicesArray = Object.entries(devicesObj).map(([key, device]: [string, any]) => ({
            key,
            photonId: device.photonId,
            apikey: device.apikey,
            name: device.name,
            expiresAt: device.expiresAt,
            subdevices: device.subdevices,
          }))
          setDevices(devicesArray)

          // Obtener el tipo de cada dispositivo
          const types: { [key: string]: string } = {}
          for (const device of devicesArray) {
            if (device.photonId && device.apikey) {
              const type = await fetchDeviceType(device.photonId, device.apikey)
              types[device.key] = type
            }
          }
          setDeviceTypes(types)
        } else {
          Alert.alert("Error", "No se encontró información del usuario.")
        }
      } catch (error) {
        console.error("Error al cargar dispositivos:", error)
        Alert.alert("Error", "No se pudieron cargar los dispositivos.")
      }
    }
    loadDevices()
  }, [])

  // Función para obtener el tipo de dispositivo desde la API de Particle
  const fetchDeviceType = async (photonId: string, apiKey: string) => {
    try {
      const response = await fetch(`https://api.particle.io/v1/devices/${photonId}`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        // El tipo de dispositivo está en data.product_id o data.platform_id
        // 6 = Photon, 10 = Electron, 12 = Argon, 13 = Boron, 26 = Photon 2
        let deviceType = "Desconocido"

        if (data.platform_id === 6) {
          deviceType = "Photon"
        } else if (data.platform_id === 26) {
          deviceType = "Photon 2"
        } else if (data.platform_id === 10) {
          deviceType = "Electron"
        } else if (data.platform_id === 12) {
          deviceType = "Argon"
        } else if (data.platform_id === 13) {
          deviceType = "Boron"
        }

        return deviceType
      }
      return "Desconocido"
    } catch (error) {
      console.error("Error al obtener tipo de dispositivo:", error)
      return "Desconocido"
    }
  }

  // Alternar la selección para flasheo
  const toggleSelection = (deviceKey: string) => {
    setSelectedDevices((prev) =>
      prev.includes(deviceKey) ? prev.filter((key) => key !== deviceKey) : [...prev, deviceKey],
    )
  }

  // Función para flashear un dispositivo mediante petición al servidor
  const flashPhoton = async (device: { photonId: string; apikey: string; name: string }) => {
    try {
      if (!device.photonId || !device.apikey) {
        Alert.alert("Error", `El dispositivo ${device.name} no tiene deviceID o accessToken.`)
        return
      }
      const endpoint = "https://server-lightbulb-five.vercel.app/api/flash"
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceID: device.photonId,
          accessToken: device.apikey,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error(`Error al flashear ${device.name}:`, errorData)
        Alert.alert("Error", `Error al flashear el dispositivo ${device.name}.`)
        return
      }

      const data = await response.json()
      console.log(`Firmware flasheado para ${device.name}:`, data)
      Alert.alert("Éxito", `Firmware del dispositivo ${device.name} flasheado correctamente.`)
    } catch (error: any) {
      console.error(`Error al flashear ${device.name}:`, error.response ? error.response.data : error.message)
      Alert.alert("Error", `Error al flashear el dispositivo ${device.name}.`)
    }
  }

  // Flashear todos los dispositivos seleccionados
  const handleFlashDevices = async () => {
    if (selectedDevices.length === 0) {
      Alert.alert("Atención", "No se seleccionó ningún dispositivo para flashear.")
      return
    }
    for (const key of selectedDevices) {
      const device = devices.find((d) => d.key === key)
      if (device) {
        await flashPhoton(device)
      }
    }
    setSelectedDevices([])
  }

  const handleSettingsPress = () => {
    setSettingsModalVisible(true)
  }

  // Abrir modal de gestión para un dispositivo y resetear opción activa
  const openDeviceManagementModal = (device: any) => {
    setSelectedDevice(device)
    setUpdatedName(device.name)
    setUpdatedPhotonId(device.photonId)
    setActiveOption("")
    setModalVisible(true)
  }

  // Función para actualizar el nombre del dispositivo
  const updateDeviceName = async () => {
    if (!selectedDevice) return
    const userId = auth.currentUser?.uid
    if (!userId) {
      Alert.alert("Error", "Usuario no autenticado.")
      return
    }
    try {
      const docRef = doc(db, "BD", userId)
      const newName = updatedName.trim() === "" ? selectedDevice.name : updatedName
      await updateDoc(docRef, {
        [`Devices.${selectedDevice.key}.name`]: newName,
      })
      setDevices((prev) => prev.map((d) => (d.key === selectedDevice.key ? { ...d, name: newName } : d)))
      setModalVisible(false)
      Alert.alert("Éxito", "Nombre del dispositivo actualizado correctamente.")
    } catch (error) {
      console.error("Error al actualizar el nombre del dispositivo:", error)
      Alert.alert("Error", "No se pudo actualizar el nombre del dispositivo.")
    }
  }

  // Función para actualizar el ID del dispositivo (photonId)
  const updateDeviceID = async () => {
    if (!selectedDevice) return
    const userId = auth.currentUser?.uid
    if (!userId) {
      Alert.alert("Error", "Usuario no autenticado.")
      return
    }
    // Validar que el nuevo ID tenga exactamente 24 caracteres hexadecimales
    const hexRegex = /^[0-9A-Fa-f]{24}$/
    if (updatedPhotonId.trim() !== "" && !hexRegex.test(updatedPhotonId)) {
      Alert.alert("Error", "El nuevo ID debe tener exactamente 24 caracteres hexadecimales.")
      return
    }
    try {
      const docRef = doc(db, "BD", userId)
      const newID = updatedPhotonId.trim() === "" ? selectedDevice.photonId : updatedPhotonId
      await updateDoc(docRef, {
        [`Devices.${selectedDevice.key}.photonId`]: newID,
      })
      setDevices((prev) => prev.map((d) => (d.key === selectedDevice.key ? { ...d, photonId: newID } : d)))
      setModalVisible(false)
      Alert.alert("Éxito", "ID del dispositivo actualizado correctamente.")
    } catch (error) {
      console.error("Error al actualizar el ID del dispositivo:", error)
      Alert.alert("Error", "No se pudo actualizar el ID del dispositivo.")
    }
  }

  // Función para eliminar el dispositivo con confirmación
  const deleteDevice = async () => {
    if (!selectedDevice) return
    const userId = auth.currentUser?.uid
    if (!userId) {
      Alert.alert("Error", "Usuario no autenticado.")
      return
    }
    Alert.alert("Confirmación", "¿Estás seguro de que deseas eliminar este dispositivo?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          try {
            const docRef = doc(db, "BD", userId)
            await updateDoc(docRef, {
              [`Devices.${selectedDevice.key}`]: deleteField(),
            })
            setDevices((prev) => prev.filter((d) => d.key !== selectedDevice.key))
            setModalVisible(false)
            Alert.alert("Éxito", "Dispositivo eliminado correctamente.")
          } catch (error) {
            console.error("Error al eliminar el dispositivo:", error)
            Alert.alert("Error", "No se pudo eliminar el dispositivo.")
          }
        },
      },
    ])
  }

  // Renderizado del contenido del modal según la opción seleccionada
  const renderModalContent = () => {
    switch (activeOption) {
      case "updateName":
        return (
          <View style={styles.modalContent}>
            <Text style={styles.modalLabel}>Editar Nombre</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Nombre actual"
              value={selectedDevice ? selectedDevice.name : ""}
              editable={false}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Nuevo nombre (opcional)"
              value={updatedName}
              onChangeText={setUpdatedName}
            />
            <TouchableOpacity style={styles.actionButton} onPress={updateDeviceName}>
              <Text style={styles.actionButtonText}>Actualizar nombre</Text>
            </TouchableOpacity>
          </View>
        )
      case "updateId":
        return (
          <View style={styles.modalContent}>
            <Text style={styles.modalLabel}>Editar ID</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="ID actual"
              value={selectedDevice ? selectedDevice.photonId : ""}
              editable={false}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Nuevo ID (24 caracteres hexadecimales)"
              value={updatedPhotonId}
              onChangeText={setUpdatedPhotonId}
            />
            <TouchableOpacity style={styles.actionButton} onPress={updateDeviceID}>
              <Text style={styles.actionButtonText}>Actualizar ID</Text>
            </TouchableOpacity>
          </View>
        )
      case "delete":
        return (
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.deleteButton} onPress={deleteDevice}>
              <Text style={styles.actionButtonText}>Borrar Dispositivo</Text>
            </TouchableOpacity>
          </View>
        )
      default:
        return (
          <View style={styles.modalOptionsContainer}>
            <TouchableOpacity style={styles.modalOptionButton} onPress={() => setActiveOption("updateName")}>
              <Edit size={20} color="#333" style={styles.optionIcon} />
              <Text style={styles.modalOptionText}>Actualizar Nombre</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalOptionButton} onPress={() => setActiveOption("updateId")}>
              <Edit size={20} color="#333" style={styles.optionIcon} />
              <Text style={styles.modalOptionText}>Actualizar ID</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalOptionButton} onPress={() => setActiveOption("delete")}>
              <Trash2 size={20} color="red" style={styles.optionIcon} />
              <Text style={[styles.modalOptionText, { color: "red" }]}>Eliminar Dispositivo</Text>
            </TouchableOpacity>
          </View>
        )
    }
  }

  // Navegar a la pantalla de subdispositivos
  const handleSelectDevice = (deviceKey: string) => {
    router.push({
      pathname: "./listSubDevices",
      params: { deviceKey },
    })
  }

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.deviceItem}>
      <TouchableOpacity style={styles.deviceButton} onPress={() => handleSelectDevice(item.key)}>
        <View style={styles.deviceInfo}>
          <Text style={styles.deviceName}>{item.name}</Text>
          <Text style={styles.deviceId}>ID: {item.photonId}</Text>
          <Text style={styles.deviceType}>Tipo: {deviceTypes[item.key] || "Cargando..."}</Text>
        </View>
        <ChevronRight color="#777" size={20} />
      </TouchableOpacity>

      <View style={styles.deviceActions}>
        <TouchableOpacity style={styles.optionsButton} onPress={() => openDeviceManagementModal(item)}>
          <Text style={styles.optionsButtonText}>⋮</Text>
        </TouchableOpacity>

        <Checkbox
          value={selectedDevices.includes(item.key)}
          onValueChange={() => toggleSelection(item.key)}
          style={styles.checkbox}
          color={selectedDevices.includes(item.key) ? "#007BFF" : undefined}
        />
      </View>
    </View>
  )

  return (
    <View style={styles.container}>
      <Navbar title="Dispositivos" onSettingsPress={handleSettingsPress} />

      <SettingsModal isVisible={settingsModalVisible} onClose={() => setSettingsModalVisible(false)} />

      <View style={styles.content}>
        <FlatList
          data={devices}
          keyExtractor={(item) => item.key}
          renderItem={renderItem}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No hay dispositivos creados aún.</Text>
              <TouchableOpacity style={styles.addDeviceButton} onPress={() => router.push("./addControllers")}>
                <Text style={styles.addDeviceButtonText}>Agregar Dispositivo</Text>
              </TouchableOpacity>
            </View>
          }
        />

        {devices.length > 0 && (
          <TouchableOpacity style={styles.flashButton} onPress={handleFlashDevices}>
            <Zap size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.flashButtonText}>Flashear dispositivos seleccionados</Text>
          </TouchableOpacity>
        )}

        {/* Modal de gestión del dispositivo */}
        <Modal visible={modalVisible} animationType="fade" transparent onRequestClose={() => setModalVisible(false)}>
          <View style={styles.modalBackground}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Gestión del Dispositivo</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
              {renderModalContent()}
            </View>
          </View>
        </Modal>
      </View>

      {/* Barra de navegación inferior */}
      <BottomNavbar storedApiKey={devices.length > 0 ? devices[0].apikey : ""} />
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
    padding: 16,
  },
  deviceItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  deviceButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  deviceId: {
    fontSize: 14,
    color: "#666",
  },
  deviceType: {
    fontSize: 14,
    color: "#888",
    marginTop: 2,
  },
  deviceActions: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 8,
  },
  optionsButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  optionsButtonText: {
    fontSize: 18,
    color: "#555",
    fontWeight: "bold",
  },
  checkbox: {
    marginLeft: 4,
    marginRight: 8,
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    textAlign: "center",
    fontSize: 16,
    color: "#888",
    marginBottom: 20,
  },
  addDeviceButton: {
    backgroundColor: "#007BFF",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  addDeviceButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  flashButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    backgroundColor: "#FF9500",
    borderRadius: 8,
    marginVertical: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  flashButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  modalBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContainer: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  closeButton: {
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 15,
    backgroundColor: "#f0f0f0",
  },
  closeButtonText: {
    fontSize: 16,
    color: "#555",
  },
  modalContent: {
    width: "100%",
    paddingVertical: 10,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
    color: "#333",
  },
  modalInput: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    backgroundColor: "#f9f9f9",
  },
  modalOptionsContainer: {
    width: "100%",
  },
  modalOptionButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    marginBottom: 8,
  },
  optionIcon: {
    marginRight: 12,
  },
  modalOptionText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  actionButton: {
    backgroundColor: "#007BFF",
    width: "100%",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  deleteButton: {
    backgroundColor: "red",
    width: "100%",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
})

export default ListUserDevices

