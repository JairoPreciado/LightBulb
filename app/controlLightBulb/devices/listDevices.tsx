import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, FlatList, Alert, TextInput, TouchableOpacity, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { doc, updateDoc, getDoc, deleteField } from 'firebase/firestore';
import { auth, db } from '../../../firebaseConfiguration'; // Ajusta según tu configuración
import Settings from '../settings'; // Asegúrate de importar tu componente Settings
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const MAX_DEVICES = 8;
const VALID_PINS = ['D0', 'D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7']; // Lista de pines válidos

const ListDevices: React.FC = () => {
  const [devices, setDevices] = useState<{ name: string; pin: string }[]>([]);
  const [newDeviceName, setNewDeviceName] = useState('');
  const [newDevicePin, setNewDevicePin] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<{ name: string; pin: string } | null>(null);
  const [updatedName, setUpdatedName] = useState('');
  const [flashModalVisible, setFlashModalVisible] = useState(false);
  const router = useRouter();

  // Cargar dispositivos desde Firestore al montar la vista
  useEffect(() => {
    const loadDevices = async () => {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        Alert.alert('Error', 'Usuario no autenticado.');
        return;
      }
      try {
        const userDocRef = doc(db, 'BD', userId);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const data = userDoc.data();
          const devicesMap = data.devices || {};
          const loadedDevices = Object.entries(devicesMap).map(([pin, device]: any) => ({
            name: device.name,
            pin: pin,
          }));
          setDevices(loadedDevices);
        } else {
          Alert.alert('Error', 'No se encontró información del usuario.');
        }
      } catch (error) {
        console.error('Error al cargar dispositivos:', error);
        Alert.alert('Error', 'No se pudieron cargar los dispositivos.');
      }
    };
    loadDevices();
  }, []);

  // Verificar si se ha completado el flasheo (almacenado localmente y en Firestore)
  useEffect(() => {
    const checkFlashStatus = async () => {
      const userId = auth.currentUser?.uid;
      if (!userId) return;
      const flashKey = `flashCompleted_${userId}`;
      const localFlag = await AsyncStorage.getItem(flashKey);

      const userDocRef = doc(db, 'BD', userId);
      const userDocSnap = await getDoc(userDocRef);
      let firestoreFlag = false;
      if (userDocSnap.exists()) {
        const data = userDocSnap.data();
        firestoreFlag = data.flashCompleted || false;
      }

      // Si ninguno indica que ya se ha flasheado, mostramos el modal
      if (!localFlag && !firestoreFlag) {
        setFlashModalVisible(true);
      } else {
        setFlashModalVisible(false);
      }
    };
    checkFlashStatus();
  }, []);

  // Función para flashear el Photon mediante una petición al servidor
  const flashPhoton = async () => {
    try {
      // 1. Obtener deviceID y accessToken desde Firestore
      const userId = auth.currentUser?.uid;
      if (!userId) {
        Alert.alert("Error", "Usuario no autenticado.");
        return;
      }
      const userDocRef = doc(db, 'BD', userId);
      const userDocSnap = await getDoc(userDocRef);
      if (!userDocSnap.exists()) {
        Alert.alert("Error", "No se encontró información del usuario.");
        return;
      }
      const data = userDocSnap.data();
      const deviceID = data.photonId; // ID del Photon almacenado en BD
      const accessToken = data.apiKey; // API Key almacenada en BD
      if (!deviceID || !accessToken) {
        Alert.alert("Error", "No se encontró el deviceID o el accessToken.");
        return;
      }

      // 2. Realizar una petición POST al endpoint de tu servidor para flashear el firmware
      const endpoint = "https://server-lightbulb-five.vercel.app/api/flash"; // Ajusta esta URL a la de tu despliegue
      const response = await axios.post(endpoint, {
        deviceID,
        accessToken
      }, {
        headers: { "Content-Type": "application/json" }
      });

      Alert.alert("Éxito", "Firmware flasheado correctamente.");
      console.log("Respuesta del servidor:", response.data);
      await updateDoc(userDocRef, { flashCompleted: true });  
      await AsyncStorage.setItem(`flashCompleted_${userId}`, 'true');
      setFlashModalVisible(false);
    } catch (error: any) {
      console.error("Error al flashear el Photon:", error.response ? error.response.data : error.message);
      Alert.alert("Error", "Error al flashear el Photon.");
    }
  };

  // Función para agregar un nuevo dispositivo (se guarda en Firestore y localmente)
  const addDevice = async () => {
    if (devices.length >= MAX_DEVICES) {
      Alert.alert('Límite alcanzado', 'Solo puedes agregar un máximo de 8 dispositivos.');
      return;
    }
    if (!newDeviceName || !newDevicePin) {
      Alert.alert('Error', 'Por favor ingresa un nombre y selecciona un pin.');
      return;
    }
    if (!VALID_PINS.includes(newDevicePin)) {
      Alert.alert('Error', 'Pin no válido. Solo puedes usar D0, D1, D2, D3, D4, D5, D6, D7.');
      return;
    }
    if (devices.some((device) => device.pin === newDevicePin)) {
      Alert.alert('Error', 'El pin ya está asignado a otro dispositivo.');
      return;
    }
    const userId = auth.currentUser?.uid;
    if (!userId) {
      Alert.alert('Error', 'Usuario no autenticado.');
      return;
    }
    try {
      const userDocRef = doc(db, 'BD', userId);
      await updateDoc(userDocRef, {
        [`devices.${newDevicePin}`]: {
          name: newDeviceName,
          pin: newDevicePin,
          state: false, // Estado inicial apagado
        },
      });
      setDevices((prevDevices) => [...prevDevices, { name: newDeviceName, pin: newDevicePin }]);
      setNewDeviceName('');
      setNewDevicePin('');
      Alert.alert('Éxito', 'Dispositivo creado correctamente.');
    } catch (error) {
      console.error('Error al agregar dispositivo:', error);
      Alert.alert('Error', 'No se pudo agregar el dispositivo.');
    }
  };

  // Función para mostrar el modal de ajustes de dispositivo
  const openSettingsModal = (device: { name: string; pin: string }) => {
    setSelectedDevice(device);
    setUpdatedName(device.name);
    setModalVisible(true);
  };

  // Función para borrar un dispositivo
  const deleteDevice = async () => {
    if (!selectedDevice) return;
    const userId = auth.currentUser?.uid;
    if (!userId) {
      Alert.alert('Error', 'Usuario no autenticado.');
      return;
    }
    try {
      const userDocRef = doc(db, 'BD', userId);
      await updateDoc(userDocRef, {
        [`devices.${selectedDevice.pin}`]: deleteField(),
      });
      setDevices((prevDevices) =>
        prevDevices.filter((device) => device.pin !== selectedDevice.pin)
      );
      setModalVisible(false);
      Alert.alert('Éxito', 'Dispositivo eliminado correctamente.');
    } catch (error) {
      console.error('Error al eliminar el dispositivo:', error);
      Alert.alert('Error', 'No se pudo eliminar el dispositivo.');
    }
  };

  // Función para modificar el nombre del dispositivo
  const updateDeviceName = async () => {
    if (!selectedDevice) return;
    const userId = auth.currentUser?.uid;
    if (!userId) {
      Alert.alert('Error', 'Usuario no autenticado.');
      return;
    }
    try {
      const userDocRef = doc(db, 'BD', userId);
      await updateDoc(userDocRef, {
        [`devices.${selectedDevice.pin}.name`]: updatedName,
      });
      setDevices((prevDevices) =>
        prevDevices.map((device) =>
          device.pin === selectedDevice.pin ? { ...device, name: updatedName } : device
        )
      );
      setModalVisible(false);
      Alert.alert('Éxito', 'Nombre del dispositivo actualizado correctamente.');
    } catch (error) {
      console.error('Error al actualizar el nombre del dispositivo:', error);
      Alert.alert('Error', 'No se pudo actualizar el nombre del dispositivo.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Lista de Dispositivos</Text>

      {/* Modal de flasheo que aparece solo una vez */}
      <Modal
        visible={flashModalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => {}}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Flashear Photon</Text>
            <Text style={styles.modalText}>
              Para continuar, es necesario flashear el firmware del dispositivo Photon.
            </Text>
            <Button title="Flashear ahora" onPress={flashPhoton} />
          </View>
        </View>
      </Modal>

      {/* Formulario para agregar dispositivo */}
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Nombre del dispositivo"
          value={newDeviceName}
          maxLength={30}
          onChangeText={setNewDeviceName}
        />
        <TextInput
          style={styles.input}
          placeholder="Pin (D0, D1, D2, D3, D4, D5, D6, D7)"
          maxLength={2}
          value={newDevicePin}
          onChangeText={setNewDevicePin}
        />
        <TouchableOpacity style={styles.secondaryButton} onPress={addDevice}>
          <Text style={styles.secondaryButtonText}>Crear dispositivo</Text>
        </TouchableOpacity>
      </View>

      {/* Lista de dispositivos */}
      <FlatList
        data={devices}
        keyExtractor={(item, index) => `${item.pin}-${index}`}
        renderItem={({ item }) => (
          <View style={styles.deviceItem}>
            <TouchableOpacity
              style={styles.deviceButton}
              onPress={() => router.push(`./devices?name=${item.name}&pin=${item.pin}`)}
            >
              <Text style={styles.deviceText}>
                {item.name} (Pin: {item.pin})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingsButton} onPress={() => openSettingsModal(item)}>
              <Text style={styles.settingsButtonText}>⋮</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No hay dispositivos creados aún.</Text>
        }
      />

      {/* Modal de ajustes del dispositivo */}
      <Modal
        visible={modalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Ajustes del Dispositivo</Text>
            <TextInput
              style={styles.input}
              placeholder="Nuevo nombre del dispositivo"
              onChangeText={setUpdatedName}
              maxLength={16}
            />
            <View style={styles.modalButtonsContainer}>
              <View style={styles.modalButton}>
                <Button title="Actualizar Nombre" onPress={updateDeviceName} />
              </View>
              <View style={styles.modalButton}>
                <Button title="Eliminar Dispositivo" color="red" onPress={deleteDevice} />
              </View>
              <Button title="Cerrar" onPress={() => setModalVisible(false)} />
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.settingsContainer}>
        <Settings />
      </View>
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
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    marginTop: 30,
    textAlign: 'center',
  },
  form: {
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  deviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    marginVertical: 5,
    backgroundColor: '#e6e6e6',
    borderRadius: 5,
  },
  deviceButton: {
    width: 250,
    justifyContent: 'center',
    alignItems: 'flex-start',
    backgroundColor: '#e6e6e6',
    paddingVertical: 10,
    borderRadius: 5,
  },
  deviceText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  settingsButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e6e6e6',
    borderRadius: 2,
  },
  settingsButtonText: {
    fontSize: 18,
    color: '#333',
  },
  settingsContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  modalText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButtonsContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
    marginTop: 20,
  },
  modalButton: {
    width: '60%',
    marginBottom: 20,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#888',
    marginTop: 20,
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
  secondaryButton: {
    backgroundColor: '#007BFF',
    borderRadius: 5,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 10,
  },
  secondaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    width: '40%',
    textAlign: 'center',
    borderRadius: 5,
  },
});

export default ListDevices;
