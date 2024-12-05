import React, { useState, useEffect } from 'react';
import { View, Text, Alert, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import NetInfo from '@react-native-community/netinfo';
import axios from 'axios';
import { auth, db } from '../../../firebaseConfiguration'; // Ajusta según tu configuración de Firebase
import { doc, getDoc } from 'firebase/firestore';
import Settings from '../settings'; // Asegúrate de importar tu componente Settings

const Device: React.FC = () => {
  const router = useRouter();
  const { name, pin } = useLocalSearchParams<{ name: string; pin: string }>(); // Recibe parámetros desde la ruta

  const [isConnected, setIsConnected] = useState(true);
  const [isDeviceOn, setIsDeviceOn] = useState(false);
  const [photonId, setPhotonId] = useState('');
  const [particleAccessToken, setParticleAccessToken] = useState('');

  // Validar que los parámetros existan
  useEffect(() => {
    if (!name || !pin) {
      Alert.alert('Error', 'No se recibieron los datos del dispositivo.');
      router.back(); // Regresar si los parámetros no existen
    }
  }, [name, pin]);

  // Obtener datos del Photon desde la base de datos al cargar la pantalla
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
          setPhotonId(data.photonId); // Asignar photonId desde la base de datos
          setParticleAccessToken(data.apiKey); // Asignar apiKey desde la base de datos
        } else {
          Alert.alert('Error', 'No se encontró el dispositivo en la base de datos.');
        }
      } catch (error) {
        console.error('Error al obtener los datos del dispositivo:', error);
        Alert.alert('Error', 'Hubo un problema al cargar los datos del dispositivo.');
      }
    };

    fetchDeviceData();

    // Escuchar cambios de conexión
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected ?? false);
      if (!state.isConnected) {
        Alert.alert('Sin conexión', 'No puedes usar la app sin conexión a Internet.');
      }
    });

    return () => unsubscribe(); // Limpiar la suscripción al desmontar
  }, []);

  // Verificar el estado del dispositivo cada 5 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      if (isConnected && photonId && particleAccessToken) {
        consultarEstadoDispositivo();
      }
    }, 5000);

    return () => clearInterval(interval); // Limpiar el intervalo al desmontar
  }, [isConnected, photonId, particleAccessToken]);

  const consultarEstadoDispositivo = async () => {
    if (!photonId || !particleAccessToken) return;

    try {
      const response = await axios.get(`https://api.particle.io/v1/devices/${photonId}/estado${pin}`, {
        headers: {
          'Authorization': `Bearer ${particleAccessToken}`,
        },
      });
      setIsDeviceOn(response.data.result); // Asume que `estado{pin}` devuelve `true` o `false`
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
          <Text style={styles.title}>Control de {name}</Text>
          <Text style={styles.statusText}>
            Estado del {name}: {isDeviceOn ? 'Encendido' : 'Apagado'}
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
              onPress={() => router.push(`./program?deviceName=${name}&pin=${pin}`)}
            >
              <Text style={styles.secondaryButtonText}>Programar</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push('./consume2')}>
              <Text style={styles.secondaryButtonText}>Ver Consumo</Text>
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

export default Device;
