"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, Alert, Modal, Image } from "react-native"
import { useRouter, useLocalSearchParams } from "expo-router"
import { auth, db } from "../../../firebaseConfiguration"
import { doc, getDoc, updateDoc, deleteField } from "firebase/firestore"
import { ChevronDown, Power, Clock, Edit, Trash2 } from "lucide-react-native"
import Navbar from "../../components/navbar"
import SettingsModal from "../settings-modal"
import RNPickerSelect from "react-native-picker-select"

const VALID_PINS = ["D0", "D1", "D2", "D3", "D4", "D5", "D6", "D7"]
const MAX_SUBDEVICES = 10

const ListSubDevices: React.FC = () => {
  const { deviceKey } = useLocalSearchParams<{ deviceKey: string }>()
  const [subdevices, setSubdevices] = useState<any[]>([])
  const [selectedSubdevice, setSelectedSubdevice] = useState<any>(null)
  const [modalVisible, setModalVisible] = useState(false)
  const [activeOption, setActiveOption] = useState("")
  const [updatedName, setUpdatedName] = useState("")
  const [settingsModalVisible, setSettingsModalVisible] = useState(false)
  const [showPinSelector, setShowPinSelector] = useState(false)
  const [newSubName, setNewSubName] = useState("")
  const [selectedPin, setSelectedPin] = useState("")
  const [deviceStates, setDeviceStates] = useState<{ [key: string]: boolean }>({})
  const [deviceInfo, setDeviceInfo] = useState<{
    name: string
    photonId: string
    type: string
  } | null>(null)
  const router = useRouter()

  // Obtener los pines disponibles
  const getAvailablePins = () => {
    const usedPins = subdevices.map((s) => s.pin)
    return VALID_PINS.filter((pin) => !usedPins.includes(pin))
  }

  // Función para obtener la ruta de la imagen según el tipo de dispositivo
  const getDeviceImageSource = (deviceType: string) => {
    switch (deviceType) {
      case "Photon":
        return require("../../../assets/images/device_type/photon0.png")
      case "Photon 2":
        return require("../../../assets/images/device_type/photon2.png")
      case "Electron":
        return require("../../../assets/images/device_type/electron.png")
      case "Argon":
        return require("../../../assets/images/device_type/argon.png")
      case "Boron":
        return require("../../../assets/images/device_type/boron.png")
      default:
        return require("../../../assets/images/device_type/photon0.png") // Imagen por defecto
    }
  }

  // Cargar información del dispositivo y subdispositivos
  useEffect(() => {
    const loadDeviceInfo = async () => {
      if (!deviceKey) {
        Alert.alert("Error", "No se especificó el dispositivo.")
        return
      }
      const userId = auth.currentUser?.uid
      if (!userId) {
        Alert.alert("Error", "Usuario no autenticado.")
        return
      }
      try {
        const userDocRef = doc(db, "BD", userId)
        const snap = await getDoc(userDocRef)
        if (snap.exists()) {
          const data = snap.data()
          const deviceData = data.Devices?.[deviceKey]

          if (deviceData) {
            // Determinar el tipo de dispositivo basado en el platform_id
            let deviceType = "Photon" // Valor por defecto

            // Si tienes acceso a la API de Particle, podrías obtener el tipo real
            if (deviceData.photonId && deviceData.apikey) {
              try {
                const response = await fetch(`https://api.particle.io/v1/devices/${deviceData.photonId}`, {
                  headers: { Authorization: `Bearer ${deviceData.apikey}` },
                })

                if (response.ok) {
                  const deviceInfo = await response.json()
                  if (deviceInfo.platform_id === 6) {
                    deviceType = "Photon"
                  } else if (deviceInfo.platform_id === 32 || deviceInfo.platform_id === 26) {
                    deviceType = "Photon 2"
                  } else if (deviceInfo.platform_id === 10) {
                    deviceType = "Electron"
                  } else if (deviceInfo.platform_id === 12) {
                    deviceType = "Argon"
                  } else if (deviceInfo.platform_id === 13) {
                    deviceType = "Boron"
                  }
                }
              } catch (error) {
                console.error("Error al obtener información del dispositivo:", error)
              }
            }

            setDeviceInfo({
              name: deviceData.name || "Dispositivo",
              photonId: deviceData.photonId || "",
              type: deviceType,
            })
          }

          // Cargar subdispositivos
          const subObj = data.Devices?.[deviceKey]?.subdevices || {}
          const loaded = Object.entries(subObj).map(([pin, sub]: [string, any]) => ({
            name: sub.name,
            pin,
            state: sub.state || false,
          }))
          setSubdevices(loaded)

          // Inicializar estados
          const states: { [key: string]: boolean } = {}
          loaded.forEach((device) => {
            states[device.pin] = device.state
          })
          setDeviceStates(states)
        }
      } catch (error) {
        console.error("Error al cargar información del dispositivo:", error)
        Alert.alert("Error", "No se pudo cargar la información del dispositivo.")
      }
    }

    loadDeviceInfo()
  }, [deviceKey])

  // Consultar el estado de los dispositivos periódicamente
  useEffect(() => {
    if (!deviceKey) return

    const fetchDeviceStates = async () => {
      try {
        const userId = auth.currentUser?.uid
        if (!userId) return

        const userDocRef = doc(db, "BD", userId)
        const userSnap = await getDoc(userDocRef)
        if (!userSnap.exists()) return

        const data = userSnap.data()
        const deviceData = data.Devices?.[deviceKey]
        const photonId = deviceData?.photonId
        const apiKey = deviceData?.apikey

        if (!photonId || !apiKey) return

        // Consultar el estado de cada subdispositivo
        for (const subdevice of subdevices) {
          try {
            const response = await fetch(`https://api.particle.io/v1/devices/${photonId}/estado${subdevice.pin}`, {
              headers: { Authorization: `Bearer ${apiKey}` },
            })

            if (response.ok) {
              const data = await response.json()
              setDeviceStates((prev) => ({
                ...prev,
                [subdevice.pin]: data.result,
              }))
            }
          } catch (error) {
            console.error(`Error al consultar el estado del dispositivo ${subdevice.pin}:`, error)
          }
        }
      } catch (error) {
        console.error("Error al consultar estados:", error)
      }
    }

    // Consultar estados inicialmente
    fetchDeviceStates()

    // Configurar intervalo para consultar estados
    const interval = setInterval(fetchDeviceStates, 5000)

    return () => clearInterval(interval)
  }, [deviceKey, subdevices])

  const handleSettingsPress = () => {
    setSettingsModalVisible(true)
  }

  // Función para alternar el estado de un dispositivo
  const toggleDevice = async (pin: string) => {
    try {
      const userId = auth.currentUser?.uid
      if (!userId) return

      // Obtener el photonId y apikey del dispositivo
      const userDocRef = doc(db, "BD", userId)
      const userSnap = await getDoc(userDocRef)
      if (!userSnap.exists()) return

      const data = userSnap.data()
      const deviceData = data.Devices?.[deviceKey]
      const photonId = deviceData?.photonId
      const apiKey = deviceData?.apikey

      if (!photonId || !apiKey) {
        Alert.alert("Error", "No se encontró información del dispositivo.")
        return
      }

      const newState = !deviceStates[pin]
      const command = newState ? "on" : "off"

      // Comunicarse con la API de Particle
      const response = await fetch(`https://api.particle.io/v1/devices/${photonId}/cambiarEstado${pin}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `arg=${command}`,
      })

      const responseData = await response.json()

      if (response.ok && responseData.return_value === 1) {
        // Actualizar el estado en Firestore
        await updateDoc(userDocRef, {
          [`Devices.${deviceKey}.subdevices.${pin}.state`]: newState,
        })

        // Actualizar el estado local
        setDeviceStates((prev) => ({
          ...prev,
          [pin]: newState,
        }))

        Alert.alert("Éxito", `Dispositivo ${newState ? "encendido" : "apagado"} correctamente`)
      } else {
        Alert.alert("Error", "No se pudo cambiar el estado del dispositivo.")
      }
    } catch (error) {
      console.error("Error al cambiar el estado:", error)
      Alert.alert("Error", "No se pudo cambiar el estado del dispositivo.")
    }
  }

  // Agregar un nuevo subdispositivo
  const addSubdevice = async () => {
    if (!deviceKey) {
      Alert.alert("Error", "No se especificó el dispositivo.")
      return
    }
    if (subdevices.length >= MAX_SUBDEVICES) {
      Alert.alert("Límite alcanzado", `Solo puedes agregar un máximo de ${MAX_SUBDEVICES} subdispositivos.`)
      return
    }
    if (!newSubName || !selectedPin) {
      Alert.alert("Error", "Por favor ingresa un nombre y selecciona un pin.")
      return
    }

    const userId = auth.currentUser?.uid
    if (!userId) {
      Alert.alert("Error", "Usuario no autenticado.")
      return
    }
    try {
      const docRef = doc(db, "BD", userId)
      await updateDoc(docRef, {
        [`Devices.${deviceKey}.subdevices.${selectedPin}`]: {
          name: newSubName,
          pin: selectedPin,
          state: false,
        },
      })
      setSubdevices((prev) => [...prev, { name: newSubName, pin: selectedPin, state: false }])
      setDeviceStates((prev) => ({
        ...prev,
        [selectedPin]: false,
      }))
      setNewSubName("")
      setSelectedPin("")
      Alert.alert("Éxito", "Subdispositivo creado correctamente.")
    } catch (error) {
      console.error("Error al agregar subdispositivo:", error)
      Alert.alert("Error", "No se pudo agregar el subdispositivo.")
    }
  }

  // Añadir la función para actualizar el nombre del subdispositivo
  const updateSubdeviceName = async () => {
    if (!selectedSubdevice) return
    const userId = auth.currentUser?.uid
    if (!userId) {
      Alert.alert("Error", "Usuario no autenticado.")
      return
    }
    try {
      const docRef = doc(db, "BD", userId)
      const newName = updatedName.trim() === "" ? selectedSubdevice.name : updatedName
      await updateDoc(docRef, {
        [`Devices.${deviceKey}.subdevices.${selectedSubdevice.pin}.name`]: newName,
      })
      setSubdevices((prev) => prev.map((sd) => (sd.pin === selectedSubdevice.pin ? { ...sd, name: newName } : sd)))
      setModalVisible(false)
      setActiveOption("")
      Alert.alert("Éxito", "Nombre del subdispositivo actualizado correctamente.")
    } catch (error) {
      console.error("Error al actualizar el nombre del subdispositivo:", error)
      Alert.alert("Error", "No se pudo actualizar el nombre del subdispositivo.")
    }
  }

  // Añadir la función para eliminar el subdispositivo
  const deleteSubdevice = async () => {
    if (!selectedSubdevice) return
    const userId = auth.currentUser?.uid
    if (!userId) {
      Alert.alert("Error", "Usuario no autenticado.")
      return
    }
    Alert.alert("Confirmación", "¿Estás seguro de que deseas eliminar este subdispositivo?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          try {
            const docRef = doc(db, "BD", userId)
            await updateDoc(docRef, {
              [`Devices.${deviceKey}.subdevices.${selectedSubdevice.pin}`]: deleteField(),
            })
            setSubdevices((prev) => prev.filter((sd) => sd.pin !== selectedSubdevice.pin))
            setModalVisible(false)
            setActiveOption("")
            Alert.alert("Éxito", "Subdispositivo eliminado correctamente.")
          } catch (error) {
            console.error("Error al eliminar el subdispositivo:", error)
            Alert.alert("Error", "No se pudo eliminar el subdispositivo.")
          }
        },
      },
    ])
  }

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.deviceItem}>
      <TouchableOpacity
        style={styles.deviceButton}
        onPress={() =>
          router.push({
            pathname: "./devices",
            params: {
              subName: item.name,
              pin: item.pin,
              deviceKey: deviceKey,
            },
          })
        }
      >
        <View style={styles.deviceInfo}>
          <Text style={styles.deviceName}>{item.name}</Text>
          <Text style={styles.devicePin}>Pin: {item.pin}</Text>
        </View>
      </TouchableOpacity>

      <View style={styles.deviceActions}>
        <TouchableOpacity
          style={[styles.actionButton, deviceStates[item.pin] ? styles.powerButtonOn : styles.powerButtonOff]}
          onPress={() => toggleDevice(item.pin)}
        >
          <Power size={20} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.programButton]}
          onPress={() =>
            router.push({
              pathname: "./program",
              params: {
                deviceName: item.name,
                pin: item.pin,
                deviceKey: deviceKey,
              },
            })
          }
        >
          <Clock size={20} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => {
            setSelectedSubdevice(item)
            setUpdatedName("")
            setModalVisible(true)
          }}
        >
          <Edit size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  )

  return (
    <View style={styles.container}>
      <Navbar title="Subdispositivos" onSettingsPress={handleSettingsPress} />

      <SettingsModal isVisible={settingsModalVisible} onClose={() => setSettingsModalVisible(false)} />

      <View style={styles.content}>
        {/* Información del dispositivo principal */}
        {deviceInfo && (
          <View style={styles.deviceInfoContainer}>
            <Text style={styles.deviceInfoName}>{deviceInfo.name}</Text>
            <Image source={getDeviceImageSource(deviceInfo.type)} style={styles.deviceImage} resizeMode="contain" />
            <View style={styles.deviceInfoText}>
              <Text style={styles.deviceInfoId}>ID: {deviceInfo.photonId}</Text>
              <Text style={styles.deviceInfoType}>Tipo: {deviceInfo.type}</Text>
            </View>
          </View>
        )}

        {/* Formulario para agregar subdispositivos */}
        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>Agregar nuevo subdispositivo</Text>

          <TextInput
            style={styles.input}
            placeholder="Nombre del subdispositivo"
            value={newSubName}
            onChangeText={setNewSubName}
            maxLength={20}
          />

          <View style={styles.selectContainer}>
            <RNPickerSelect
              onValueChange={(value) => setSelectedPin(value)}
              items={getAvailablePins().map(pin => ({ label: pin, value: pin }))}
              placeholder={{ label: 'Seleccionar Pin', value: null }}
              value={selectedPin}
              style={pickerSelectStyles}
              useNativeAndroidPickerStyle={false}
              Icon={() => (
                <ChevronDown
                  color="#777"
                  size={20}
                  style={{
                    position: 'absolute',
                    right: 15,
                    top: '40%',
                    transform: [{ translateY: 5 }],
                  }}
                />
              )}
            />

          </View>

          <TouchableOpacity
            style={[styles.addButton, (!newSubName || !selectedPin) && styles.disabledButton]}
            onPress={addSubdevice}
            disabled={!newSubName || !selectedPin}
          >
            <Text style={styles.addButtonText}>Crear Subdispositivo</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={subdevices}
          keyExtractor={(item) => item.pin}
          renderItem={renderItem}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No hay subdispositivos creados aún.</Text>
            </View>
          }
        />
      </View>

      {/* Modal para gestionar subdispositivos */}
      <Modal visible={modalVisible} animationType="fade" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Gestión del Subdispositivo</Text>
              <TouchableOpacity
                onPress={() => {
                  setActiveOption(""); // Reinicia la opción activa
                  setModalVisible(false);
                }}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>

            </View>

            {activeOption === "updateName" ? (
              <View style={styles.modalContent}>
                <Text style={styles.modalLabel}>Editar Nombre</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Nombre actual"
                  value={selectedSubdevice ? selectedSubdevice.name : ""}
                  editable={false}
                />
                <TextInput
                  style={styles.modalInput}
                  placeholder="Nuevo nombre (opcional)"
                  value={updatedName}
                  onChangeText={setUpdatedName}
                />
                <TouchableOpacity style={styles.updateButton} onPress={updateSubdeviceName}>
                  <Text style={styles.updateButtonText}>Actualizar nombre</Text>
                </TouchableOpacity>

              </View>
            ) : activeOption === "delete" ? (
              <View style={styles.modalContent}>
                <TouchableOpacity style={styles.deleteButton} onPress={deleteSubdevice}>
                  <Text style={styles.actionButtonText}>Borrar Subdispositivo</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.modalOptionsContainer}>
                <TouchableOpacity style={styles.modalOptionButton} onPress={() => setActiveOption("updateName")}>
                  <Edit size={20} color="#333" style={styles.optionIcon} />
                  <Text style={styles.modalOptionText}>Actualizar Nombre</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalOptionButton} onPress={() => setActiveOption("delete")}>
                  <Trash2 size={20} color="red" style={styles.optionIcon} />
                  <Text style={[styles.modalOptionText, { color: "red" }]}>Eliminar Subdispositivo</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  )
}

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 15,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    color: '#333',
    paddingRight: 30,
    backgroundColor: '#fff',
  },
  inputAndroid: {
    fontSize: 15,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    color: '#333',
    paddingRight: 30,
    backgroundColor: '#fff',
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  deviceInfoContainer: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  deviceImage: {
    width: 210,
    height: 90,
    marginVertical: 0,
  },
  deviceInfoText: {
    width: "100%",
    alignItems: "center",
  },
  deviceInfoName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
    textAlign: "center",
  },
  deviceInfoId: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  deviceInfoType: {
    fontSize: 14,
    color: "#888",
  },
  formContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    backgroundColor: "#fff",
    fontSize: 15,
  },
  selectContainer: {
    position: "relative",
    marginBottom: 12,
    zIndex: 1,
  },
  pickerInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#fff",
    fontSize: 15,
    color: "#333",
  },
  pickerPlaceholder: {
    color: "#999",
    fontSize: 15,
  },
  addButton: {
    backgroundColor: "#007BFF",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  addButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  disabledButton: {
    backgroundColor: "#cccccc",
  },
  deviceItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#ffffff",
    borderRadius: 10,
    padding: 16,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  deviceInfo: {
    flex: 1,
    padding: 16,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  devicePin: {
    fontSize: 14,
    color: "#666",
  },
  deviceActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
    marginLeft: 8,
  },
  powerButtonOn: {
    backgroundColor: "#4CAF50",
  },
  powerButtonOff: {
    backgroundColor: "#F44336",
  },
  programButton: {
    backgroundColor: "#007BFF",
  },
  emptyContainer: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    textAlign: "center",
    fontSize: 16,
    color: "#888",
  },
  editButton: {
    backgroundColor: "#FF9800",
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
  actionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  updateButton: {
    backgroundColor: "#007BFF",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 20,
    alignItems: "center",
  },
  updateButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  deleteButton: {
    backgroundColor: "red",
    width: "100%",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  deviceButton: {
    flex: 1,
    padding: 16,
  },
})

export default ListSubDevices

