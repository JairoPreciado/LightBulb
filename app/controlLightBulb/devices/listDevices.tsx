import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, TextInput, Modal,} from 'react-native';
import Checkbox from 'expo-checkbox';
import { useRouter } from 'expo-router';
import { auth, db } from '../../../firebaseConfiguration';
import { doc, getDoc, updateDoc, deleteField } from 'firebase/firestore';
import axios from 'axios';
import Settings from '../settings';

const ListUserDevices: React.FC = () => {
  const [devices, setDevices] = useState<Array<{
    key: string;
    photonId: string;
    apikey: string;
    name: string;
    expiresAt: string;
    subdevices: any;
  }>>([]);
  // Dispositivos seleccionados para flasheo
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  // Estado para modal de gestión del dispositivo
  const [modalVisible, setModalVisible] = useState(false);
  // Estado para indicar qué opción se ha seleccionado en el modal ('', 'updateName', 'updateId', 'delete')
  const [activeOption, setActiveOption] = useState('');
  // Dispositivo seleccionado para gestionar
  const [selectedDevice, setSelectedDevice] = useState<any>(null);
  // Estados para los inputs de actualización
  const [updatedName, setUpdatedName] = useState('');
  const [updatedPhotonId, setUpdatedPhotonId] = useState('');
  const router = useRouter();

  useEffect(() => {
    const loadDevices = async () => {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        Alert.alert('Error', 'Usuario no autenticado.');
        return;
      }
      try {
        const userDocRef = doc(db, 'BD', userId);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const data = userDocSnap.data();
          const devicesObj = data.Devices || {};
          const devicesArray = Object.entries(devicesObj).map(([key, device]: [string, any]) => ({
            key,
            photonId: device.photonId,
            apikey: device.apikey,
            name: device.name,
            expiresAt: device.expiresAt,
            subdevices: device.subdevices,
          }));
          setDevices(devicesArray);
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

  // Alternar la selección para flasheo
  const toggleSelection = (deviceKey: string) => {
    setSelectedDevices(prev =>
      prev.includes(deviceKey)
        ? prev.filter(key => key !== deviceKey)
        : [...prev, deviceKey]
    );
  };

  // Función para flashear un dispositivo mediante petición al servidor
  const flashPhoton = async (device: { photonId: string; apikey: string; name: string }) => {
    try {
      if (!device.photonId || !device.apikey) {
        Alert.alert("Error", `El dispositivo ${device.name} no tiene deviceID o accessToken.`);
        return;
      }
      const endpoint = "https://server-lightbulb-five.vercel.app/api/flash";
      const response = await axios.post(endpoint, {
        deviceID: device.photonId,
        accessToken: device.apikey,
      }, {
        headers: { "Content-Type": "application/json" }
      });
      console.log(`Firmware flasheado para ${device.name}:`, response.data);
      Alert.alert("Éxito", `Firmware del dispositivo ${device.name} flasheado correctamente.`);
    } catch (error: any) {
      console.error(`Error al flashear ${device.name}:`, error.response ? error.response.data : error.message);
      Alert.alert("Error", `Error al flashear el dispositivo ${device.name}.`);
    }
  };

  // Flashear todos los dispositivos seleccionados
  const handleFlashDevices = async () => {
    if (selectedDevices.length === 0) {
      Alert.alert("Atención", "No se seleccionó ningún dispositivo para flashear.");
      return;
    }
    for (const key of selectedDevices) {
      const device = devices.find(d => d.key === key);
      if (device) {
        await flashPhoton(device);
      }
    }
    setSelectedDevices([]);
  };

  // Abrir modal de gestión para un dispositivo y resetear opción activa
  const openDeviceManagementModal = (device: any) => {
    setSelectedDevice(device);
    setUpdatedName(device.name);
    setUpdatedPhotonId(device.photonId);
    setActiveOption('');
    setModalVisible(true);
  };

  // Función para actualizar el nombre del dispositivo
  const updateDeviceName = async () => {
    if (!selectedDevice) return;
    const userId = auth.currentUser?.uid;
    if (!userId) {
      Alert.alert('Error', 'Usuario no autenticado.');
      return;
    }
    try {
      const docRef = doc(db, 'BD', userId);
      const newName = updatedName.trim() === '' ? selectedDevice.name : updatedName;
      await updateDoc(docRef, {
        [`Devices.${selectedDevice.key}.name`]: newName,
      });
      setDevices(prev =>
        prev.map(d =>
          d.key === selectedDevice.key ? { ...d, name: newName } : d
        )
      );
      setModalVisible(false);
      Alert.alert('Éxito', 'Nombre del dispositivo actualizado correctamente.');
    } catch (error) {
      console.error('Error al actualizar el nombre del dispositivo:', error);
      Alert.alert('Error', 'No se pudo actualizar el nombre del dispositivo.');
    }
  };

  // Función para actualizar el ID del dispositivo (photonId)
  const updateDeviceID = async () => {
    if (!selectedDevice) return;
    const userId = auth.currentUser?.uid;
    if (!userId) {
      Alert.alert('Error', 'Usuario no autenticado.');
      return;
    }
    // Validar que el nuevo ID tenga exactamente 24 caracteres hexadecimales
    const hexRegex = /^[0-9A-Fa-f]{24}$/;
    if (updatedPhotonId.trim() !== '' && !hexRegex.test(updatedPhotonId)) {
      Alert.alert('Error', 'El nuevo ID debe tener exactamente 24 caracteres hexadecimales.');
      return;
    }
    try {
      const docRef = doc(db, 'BD', userId);
      const newID = updatedPhotonId.trim() === '' ? selectedDevice.photonId : updatedPhotonId;
      await updateDoc(docRef, {
        [`Devices.${selectedDevice.key}.photonId`]: newID,
      });
      setDevices(prev =>
        prev.map(d =>
          d.key === selectedDevice.key ? { ...d, photonId: newID } : d
        )
      );
      setModalVisible(false);
      Alert.alert('Éxito', 'ID del dispositivo actualizado correctamente.');
    } catch (error) {
      console.error('Error al actualizar el ID del dispositivo:', error);
      Alert.alert('Error', 'No se pudo actualizar el ID del dispositivo.');
    }
  };

  // Función para eliminar el dispositivo con confirmación
  const deleteDevice = async () => {
    if (!selectedDevice) return;
    const userId = auth.currentUser?.uid;
    if (!userId) {
      Alert.alert('Error', 'Usuario no autenticado.');
      return;
    }
    Alert.alert(
      'Confirmación',
      '¿Estás seguro de que deseas eliminar este dispositivo?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: async () => {
            try {
              const docRef = doc(db, 'BD', userId);
              await updateDoc(docRef, {
                [`Devices.${selectedDevice.key}`]: deleteField(),
              });
              setDevices(prev => prev.filter(d => d.key !== selectedDevice.key));
              setModalVisible(false);
              Alert.alert('Éxito', 'Dispositivo eliminado correctamente.');
            } catch (error) {
              console.error('Error al eliminar el dispositivo:', error);
              Alert.alert('Error', 'No se pudo eliminar el dispositivo.');
            }
          }
        },
      ]
    );
  };

  // Renderizado del contenido del modal según la opción seleccionada
  const renderModalContent = () => {
    switch (activeOption) {
      case 'updateName':
        return (
          <View style={styles.modalContent}>
            <Text style={styles.modalLabel}>Editar Nombre</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Nombre actual"
              value={selectedDevice ? selectedDevice.name : ''}
              editable={false}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Nuevo nombre (opcional)"
              value={updatedName}
              onChangeText={setUpdatedName}
            />
            <TouchableOpacity style={styles.secondaryButton} onPress={updateDeviceName}>
              <Text style={styles.secondaryButtonText}>Actualizar nombre</Text>
            </TouchableOpacity>
          </View>
        );
      case 'updateId':
        return (
          <View style={styles.modalContent}>
            <Text style={styles.modalLabel}>Editar ID</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="ID actual"
              value={selectedDevice ? selectedDevice.photonId : ''}
              editable={false}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Nuevo ID (24 caracteres hexadecimales)"
              value={updatedPhotonId}
              onChangeText={setUpdatedPhotonId}
            />
            <TouchableOpacity style={styles.secondaryButton} onPress={updateDeviceID}>
              <Text style={styles.secondaryButtonText}>Actualizar ID</Text>
            </TouchableOpacity>
          </View>
        );
      case 'delete':
        return (
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.secondaryButton2} onPress={deleteDevice}>
              <Text style={styles.secondaryButtonText}>Borrar Dispositivo</Text>
            </TouchableOpacity>
          </View>
        );
      default:
        return (
          <View style={styles.modalOptionsContainer}>
            <TouchableOpacity style={styles.modalOptionButton} onPress={() => setActiveOption('updateName')}>
              <Text style={styles.modalOptionText}>Actualizar Nombre</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalOptionButton} onPress={() => setActiveOption('updateId')}>
              <Text style={styles.modalOptionText}>Actualizar ID</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalOptionButton} onPress={() => setActiveOption('delete')}>
              <Text style={[styles.modalOptionText, { color: 'red' }]}>Eliminar Dispositivo</Text>
            </TouchableOpacity>
          </View>
        );
    }
  };

  // Navegar a la pantalla de subdispositivos
  const handleSelectDevice = (deviceKey: string) => {
    router.push({
      pathname: './listSubDevices',
      params: { deviceKey },
    });
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.deviceItem}>
      {/* Botón de opciones a la izquierda */}
      <TouchableOpacity 
        style={styles.optionsButton}
        onPress={() => openDeviceManagementModal(item)}
      >
        <Text style={styles.optionsButtonText}>≡</Text>
      </TouchableOpacity>
      {/* Área principal: al presionar, navega a la pantalla de subdispositivos */}
      <TouchableOpacity
        style={styles.deviceButton}
        onPress={() => handleSelectDevice(item.key)}
      >
        <Text style={styles.deviceText}>{item.name}</Text>
        <Text style={styles.deviceSubText}>Photon ID: {item.photonId}</Text>
      </TouchableOpacity>
      {/* Checkbox a la derecha para selección para flasheo */}
      <Checkbox
        value={selectedDevices.includes(item.key)}
        onValueChange={() => toggleSelection(item.key)}
        style={styles.checkbox}
        color={selectedDevices.includes(item.key) ? '#007BFF' : undefined}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dispositivos Creados</Text>
      <FlatList
        data={devices}
        keyExtractor={(item) => item.key}
        renderItem={renderItem}
        ListEmptyComponent={<Text style={styles.emptyText}>No hay dispositivos creados aún.</Text>}
      />
      <TouchableOpacity style={styles.flashButton} onPress={handleFlashDevices}>
        <Text style={styles.flashButtonText}>Flashear dispositivos</Text>
      </TouchableOpacity>

      {/* Modal de gestión del dispositivo */}
      <Modal
        visible={modalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Gestión del Dispositivo</Text>
            {renderModalContent()}
            <TouchableOpacity style={styles.modalOptionButtonClose} onPress={() => setModalVisible(false)}>
              <Text style={styles.modalOptionText}>Cerrar</Text>
            </TouchableOpacity>
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

export default ListUserDevices;

const styles = StyleSheet.create({
  container: { 
    flex: 1, padding: 20, backgroundColor: '#f5f5f5' 
  },
  title: { 
    fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' 
  },
  deviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#e6e6e6',
    borderRadius: 5,
    marginVertical: 8,
  },
  optionsButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ccc',
    borderRadius: 20,
    marginRight: 10,
  },
  optionsButtonText: {
    fontSize: 20,
    color: '#333',
  },
  deviceButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  deviceText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  deviceSubText: {
    fontSize: 14,
    color: '#555',
  },
  checkbox: {
    marginLeft: 10,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#888',
    marginTop: 20,
  },
  flashButton: {
    padding: 15,
    backgroundColor: 'orange',
    borderRadius: 5,
    marginVertical: 75,
    alignItems: 'center',
  },
  flashButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  settingsContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
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
  // Estilos para el modal
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  }, 
  modalContent: {
    width: '100%',
    paddingVertical: 10,
    alignItems: 'center',
  },
  modalContainer: {
    width: '80%',
    backgroundColor: '#FFE5B4',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  modalLabel: {
    alignSelf: 'flex-start',
    fontSize: 16,
    marginTop: 10,
  },
  modalInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginVertical: 5,
    backgroundColor: '#f5f5f5',
  },
  modalSeparator: {
    height: 1,
    width: '100%',
    backgroundColor: '#ccc',
    marginVertical: 15,
  },
  modalOptionsContainer: {
    width: '100%',
    marginVertical: 10,
    alignItems: 'center',
  },
  modalOptionButton: {
    width: '100%',
    padding: 15,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    marginVertical: 5,
    alignItems: 'center',
  },
  modalOptionButtonClose: {
    width: '100%',
    padding: 15,
    backgroundColor: '#cccccc',
    borderRadius: 10,
    marginVertical: 5,
    alignItems: 'center',
  },
  modalOptionText: {
    fontSize: 16,
    fontWeight: 'bold',
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
  secondaryButton: {
    backgroundColor: '#007BFF',
    width:'100%',
    height:35,
    marginBottom: 10,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton2: {
    backgroundColor: 'red',
    width:'100%',
    height:35,
    marginBottom: 10,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  }
});
