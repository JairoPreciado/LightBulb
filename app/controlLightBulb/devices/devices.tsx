import React, { useState, useEffect } from 'react';
import { View, Text, Alert, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import NetInfo from '@react-native-community/netinfo';
import axios from 'axios';
import { auth, db } from '../../../firebaseConfiguration';
import { doc, getDoc } from 'firebase/firestore';
import Settings from '../settings';

const Device: React.FC = () => {
  const router = useRouter();
  // Recibimos: 
  // - deviceKey: el distinct name del dispositivo completo (clave en Devices)
  // - subName: el nombre del subdispositivo (opcional para mostrar)
  // - pin: el pin que identifica al subdispositivo (p.ej., "D7")
  const { deviceKey, subName, pin } = useLocalSearchParams<{ deviceKey: string; subName: string; pin: string }>();
console.log(deviceKey, subName, pin);
  const [isConnected, setIsConnected] = useState(true);
  const [isDeviceOn, setIsDeviceOn] = useState(false);
  const [photonId, setPhotonId] = useState('');
  const [particleAccessToken, setParticleAccessToken] = useState('');

  // Validar que se reciban los parámetros necesarios
  useEffect(() => {
    if (!deviceKey || !pin) {
      Alert.alert('Error', 'Faltan parámetros del dispositivo.');
      router.back();
    }
  }, [deviceKey, pin, router]);
  
  // Obtener datos del dispositivo (photonId y apiKey) usando deviceKey
  useEffect(() => {
    const fetchDeviceData = async () => {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        Alert.alert('Error', 'Usuario no autenticado.');
        return;
      }
      try {
        const docRef = doc(db, 'BD', userId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          const deviceData = data.Devices?.[deviceKey];
          if (!deviceData) {
            Alert.alert('Error', `No se encontró el dispositivo con deviceKey: ${deviceKey}`);
            router.back();
            return;
          }
          console.log('Datos del dispositivo:', deviceData);
          setPhotonId(deviceData.photonId);
          setParticleAccessToken(deviceData.apikey);
          console.log(deviceData.photonId, deviceData.apikey);
        } else {
          Alert.alert('Error', 'No se encontró información del usuario en la BD.');
        }
      } catch (error) {
        console.error('Error al obtener los datos del dispositivo:', error);
        Alert.alert('Error', 'Hubo un problema al cargar los datos del dispositivo.');
      }
    };
  
    fetchDeviceData();
  }, [deviceKey, router]);
  

  // Consultar el estado del dispositivo cada 5 segundos usando el pin
  useEffect(() => {
    const interval = setInterval(() => {
      if (isConnected && photonId && particleAccessToken) {
        consultarEstadoDispositivo();
      }
    }, 3500);
    return () => clearInterval(interval);
  }, [isConnected, photonId, particleAccessToken]);

  const consultarEstadoDispositivo = async () => {
    if (!photonId || !particleAccessToken) return;
    try {
      const response = await axios.get(
        `https://api.particle.io/v1/devices/${photonId}/estado${pin}`,
        {
          headers: { 'Authorization': `Bearer ${particleAccessToken}` },
        }
      );
      setIsDeviceOn(response.data.result);
    } catch (error) {
      console.error(`Error al consultar el estado del dispositivo ${pin}:`, error);
    }
  };

  const toggleDevice = async () => {
    if (!isConnected) {
      Alert.alert('Sin conexión', 'No puedes controlar el dispositivo sin conexión a Internet.');
      return;
    }
    const command = isDeviceOn ? 'off' : 'on';
    try {
      const response = await axios.post(
        `https://api.particle.io/v1/devices/${photonId}/cambiarEstado${pin}`,
        `arg=${command}`,
        {
          headers: {
            'Authorization': `Bearer ${particleAccessToken}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );
      if (response.data.return_value === 1) {
        setIsDeviceOn(!isDeviceOn);
        Alert.alert('Éxito', `Dispositivo ${isDeviceOn ? 'apagado' : 'encendido'} correctamente`);
      } else {
        Alert.alert('Error', 'No se pudo cambiar el estado del dispositivo.');
      }
    } catch (error) {
      Alert.alert('Error', `Hubo un problema al comunicarse con el dispositivo ${pin}.`);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.settingsContainer}>
        <Settings />
      </View>

      {isConnected ? (
        <>
          <Text style={styles.title}>
            Control de {subName}
          </Text>
          <Text style={styles.statusText}>
            Estado pin {pin}: {isDeviceOn ? 'Encendido' : 'Apagado'}
          </Text>
          <TouchableOpacity
            style={[styles.button, isDeviceOn ? styles.buttonOff : styles.buttonOn]}
            onPress={toggleDevice}
          >
            <Text style={styles.buttonText}>{isDeviceOn ? 'Apagar' : 'Encender'}</Text>
          </TouchableOpacity>
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() =>
                router.push({
                  pathname: './program2',
                  params: {
                    deviceName: subName || deviceKey,
                    pin: pin,
                    deviceKey: deviceKey,
                  },
                })
              }
            >
              <Text style={styles.secondaryButtonText}>Programar</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <Text style={styles.offlineText}>Sin conexión a Internet</Text>
      )}

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>←</Text>
      </TouchableOpacity>
    </View>
  );
};

export default Device;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F5F5F5',
  },
  settingsContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  statusText: {
    fontSize: 18,
    marginBottom: 20,
    color: '#333',
  },
  offlineText: {
    fontSize: 18,
    color: 'red',
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    width: '80%',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#007BFF',
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginHorizontal: 5,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
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
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  buttonOn: {
    backgroundColor: 'green',
  },
  buttonOff: {
    backgroundColor: 'red',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
