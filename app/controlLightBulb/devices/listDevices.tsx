import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { auth, db } from '../../../firebaseConfiguration';
import { doc, getDoc } from 'firebase/firestore';

const ListUserDevices: React.FC = () => {
  const [devices, setDevices] = useState<Array<{
    key: string;
    photonId: string;
    apikey: string;
    name: string;
    expiresAt: string;
    subdevices: any;
  }>>([]);

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
          // Convertir el objeto en un arreglo; la clave (distinctName) se usa como "key"
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

  // Al pulsar un dispositivo, pasamos su clave (key) como parámetro a la segunda pantalla
  const handleSelectDevice = (deviceKey: string) => {
    // Podemos navegar usando params:
    router.push({
      pathname: './listSubDevices',
      params: { deviceKey },
    });
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.deviceItem}
      onPress={() => handleSelectDevice(item.key)}
    >
      <Text style={styles.deviceText}>{item.name}</Text>
      <Text style={styles.deviceSubText}>Photon ID: {item.photonId}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dispositivos Creados</Text>
      <FlatList
        data={devices}
        keyExtractor={(item) => item.key}
        renderItem={renderItem}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No hay dispositivos creados aún.</Text>
        }
      />
    </View>
  );
};

export default ListUserDevices;

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 20, 
    backgroundColor: '#f5f5f5' 
  },
  title: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    marginBottom: 20, 
    textAlign: 'center' 
  },
  deviceItem: {
    padding: 15,
    backgroundColor: '#e6e6e6',
    borderRadius: 5,
    marginVertical: 8,
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
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#888',
    marginTop: 20,
  },
});
