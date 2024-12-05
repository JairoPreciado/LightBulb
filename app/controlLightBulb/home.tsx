import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Settings from './settings'; // Asegúrate de importar tu componente Settings

const HomeScreen = () => {
  const router = useRouter(); // Hook de navegación de expo-router

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
        <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push('./devices/listDevices')}>
          <Text style={styles.secondaryButtonText}>Dispositivos</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push('./guideUser')}>
          <Text style={styles.secondaryButtonText}>Guía</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push('./credentials')}>
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
    flexDirection: 'row', // Los botones estarán en una fila horizontal
    justifyContent: 'space-around', // Espaciado uniforme entre botones
    marginTop: 400,
  },
  secondaryButton: {
    backgroundColor: '#007BFF',
    borderRadius: 5,
    paddingVertical: 10,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5, // Espaciado entre botones
  },
  secondaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default HomeScreen;
