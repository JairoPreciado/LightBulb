import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import Settings from './settings'; // Asegúrate de importar tu componente Settings
import { auth, db } from '../../firebaseConfiguration';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

const HomeScreen = () => {
  const router = useRouter();
  // Estado para almacenar la API key y expiración de un dispositivo (el primero válido que se encuentre)
  const [storedApiKey, setStoredApiKey] = useState('');
  const [storedExpiresAt, setStoredExpiresAt] = useState<number | string | null>(null);
  // Estado para almacenar la clave del dispositivo (la key del objeto dentro de Devices)
  const [deviceKey, setDeviceKey] = useState("");

  useEffect(() => {
    const intervalId = setInterval(async () => {
      const userId = auth.currentUser?.uid;
      if (!userId) return;
  
      try {
        const userDocRef = doc(db, 'BD', userId);
        const userDocSnap = await getDoc(userDocRef);
  
        if (userDocSnap.exists()) {
          const data = userDocSnap.data();
          const devicesData = data.Devices || {};
          let validApiKey = "";
          let validExpiresAt: number | string | null = null;
          let validDeviceKey = "";
  
          // Iterar sobre cada dispositivo guardado en Devices
          Object.entries(devicesData).forEach(([key, device]: [string, any]) => {
            if (device && device.apikey && device.apikey.trim() !== "") {
              // Tomamos el primer dispositivo con API key no vacía
              if (!validApiKey) {
                validApiKey = device.apikey;
                validExpiresAt = device.expiresAt;
                validDeviceKey = key;
              }
            }
          });
  
          setStoredApiKey(validApiKey);
          setStoredExpiresAt(validExpiresAt);
          setDeviceKey(validDeviceKey);
  
          // Si la API key tiene fecha de expiración (número) y ya pasó, se actualiza para eliminarla
          if (typeof validExpiresAt === "number" && Date.now() > validExpiresAt) {
            await updateDoc(userDocRef, { [`Devices.${validDeviceKey}.apikey`]: "" });
            setStoredApiKey("");
            setStoredExpiresAt(null);
            Alert.alert('Aviso', 'Tu API Key ha expirado y ha sido eliminada.');
          }
        }
      } catch (error) {
        console.error('Error verificando la expiración de la API Key:', error);
      }
    }, 10000); // Se verifica cada 5 segundos
  
    return () => clearInterval(intervalId);
  }, []);
  
  return (
    <View style={styles.container}>
      {/* Componente Settings en la esquina superior derecha */}
      <View style={styles.settingsContainer}>
        <Settings />
      </View>

      {/* Texto de bienvenida */}
      <Text style={styles.text}>Bienvenido a Lightbulb</Text>
      <Text style={styles.subText}>
        Gestiona toda la información de la app y configura tus dispositivos.
      </Text>

      {/* Tarjetas informativas */}
      <View style={styles.infoContainer}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📡 Dispositivos</Text>
          <Text style={styles.cardText}>
            Gestiona y controla los dispositivos vinculados a tu cuenta.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>🛠️ Controladores</Text>
          <Text style={styles.cardText}>
            Crea y configura nuevos dispositivos para personalizar tu experiencia.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>📖 Guía de usuario</Text>
          <Text style={styles.cardText}>
            Aprende cómo usar todas las funciones de la aplicación fácilmente.
          </Text>
        </View>
      </View>

      {/* Contenedor para los botones en horizontal */}
      <View style={styles.buttonRow}>
        <TouchableOpacity 
          style={[styles.primaryButton, !storedApiKey && styles.primaryDisabledButton]} 
          disabled={!storedApiKey}
          onPress={() => router.push('./devices/listDevices')}
        >
          <Text style={styles.primaryButtonText}>Dispositivos</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.primaryButton} 
          onPress={() => router.push('./guideUser')}
        >
          <Text style={styles.primaryButtonText}>Guía</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.primaryButton} 
          onPress={() => router.push('./controllers/addControllers')}
        >
          <Text style={styles.primaryButtonText}>Controladores</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: '5%',
    justifyContent: 'center',
    backgroundColor:'#f0f0f0'
  },
  settingsContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  text: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  subText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
  },
  infoContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 30,
  },
  card: {
    width: '90%',
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  cardText: {
    fontSize: 14,
    color: '#555',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    position: 'absolute',
    bottom: '5%',
    left: 0,
    right: 0,
    paddingHorizontal: '5%',
  },
  primaryButton: {
    backgroundColor: '#007BFF',
    borderRadius: 5,
    paddingVertical: '3%',
    paddingHorizontal: '6%',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: '2%',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  primaryDisabledButton: {
    backgroundColor: '#d3d3d3',
  },
});

export default HomeScreen;
