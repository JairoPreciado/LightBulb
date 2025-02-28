import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import Settings from './settings'; // Asegúrate de importar tu componente Settings
import { auth, db } from '../../firebaseConfiguration';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

const HomeScreen = () => {
  const router = useRouter();
  const [storedApiKey, setStoredApiKey] = useState('');
  const [storedExpiresAt, setStoredExpiresAt] = useState('');

  useEffect(() => {
    const intervalId = setInterval(async () => {
      const userId = auth.currentUser?.uid;
      if (!userId) return;
  
      try {
        const userDocRef = doc(db, 'BD', userId);
        const userDocSnap = await getDoc(userDocRef);
  
        if (userDocSnap.exists()) {
          const data = userDocSnap.data();
          const expiresAt = data.expiresAt;
          const currentApiKey = data.apiKey || '';
          setStoredApiKey(currentApiKey);
          setStoredExpiresAt(expiresAt || null);
          // Si existe una fecha de expiración y ya pasó, se elimina la apiKey
          if (expiresAt && Date.now() > expiresAt) {
            await updateDoc(userDocRef, { apiKey: '' });
            setStoredApiKey('');
            setStoredExpiresAt('');
            Alert.alert('Aviso', 'Tu API Key ha expirado y ha sido eliminada.');
          }
        }
      } catch (error) {
        console.error('Error verificando la expiración de la API Key:', error);
      }
    }, 10000); // Se verifica cada 10 segundos
  
    return () => clearInterval(intervalId);
  }, []);
  
  return (
    <View style={styles.container}>
      {/* Componente Settings en la esquina superior derecha */}
      <View style={styles.settingsContainer}>
        <Settings />
      </View>
  
      {/* Contenido principal de la pantalla */}
      <Text style={styles.text}>Bienvenido a Home</Text>
  
      {/* Contenedor para los botones en horizontal */}
      <View style={styles.buttonRow}>
        <TouchableOpacity 
          style={[styles.secondaryButton, !storedApiKey && styles.disabledButton]} 
          disabled={!storedApiKey}
          onPress={() => router.push('./devices/listDevices')}
        >
          <Text style={styles.secondaryButtonText}>Dispositivos</Text>
        </TouchableOpacity>
  
        <TouchableOpacity 
          style={styles.secondaryButton} 
          onPress={() => router.push('./guideUser')}
        >
          <Text style={styles.secondaryButtonText}>Guía</Text>
        </TouchableOpacity>
  
        <TouchableOpacity 
          style={styles.secondaryButton} 
          onPress={() => router.push('./credentials')}
        >
          <Text style={styles.secondaryButtonText}>Credenciales</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
  
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  settingsContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  text: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 350,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 400,
  },
  secondaryButton: {
    backgroundColor: '#007BFF',
    borderRadius: 5,
    paddingVertical: 10,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  secondaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#d3d3d3',
  },
});
  
export default HomeScreen;
