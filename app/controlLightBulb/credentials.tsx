import React, { useState } from 'react';
import { View, Text, TextInput, Alert, TouchableOpacity, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { auth, db } from '../../firebaseConfiguration';
import { doc, setDoc } from 'firebase/firestore';
import { useRouter } from 'expo-router';
import Checkbox from 'expo-checkbox';
import Settings from './settings'; // Asegúrate de importar tu componente Settings

const AddDevice = () => {
  const router = useRouter(); // Hook para la navegación
  const [photonId, setPhotonId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [expiresIn, setExpiresIn] = useState('15 minutes');
  const [isGeneratingKey, setIsGeneratingKey] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [expirationDate, setExpirationDate] = useState<number | null>(null);

  // Validaciones
  const isPhotonIdValid = photonId.length === 24 && /^[0-9]+$/.test(photonId);
  const isEmailValid = email.includes('@');
  const isPasswordValid = password.length > 0;

  // Mapear tiempo de expiración
  const mapExpiresIn = (value: string): number | null => {
    const expirationMap: Record<string, number> = {
      '15 minutes': 900,
      '1 hour': 3600,
      '8 hours': 28800,
      '1 day': 86400,
      '30 days': 2592000,
      '90 days': 7776000,
      'Never': 0,
    };

    return expirationMap[value] || null;
  };

  // Generar clave de acceso y calcular la expiración
  const handleGenerateApiKey = async () => {
    setIsGeneratingKey(true);
    try {
      const expiresValue = mapExpiresIn(expiresIn);

      if (expiresValue === null) {
        Alert.alert('Error', 'Tiempo de expiración no válido. Por favor selecciona un valor válido.');
        setIsGeneratingKey(false);
        return;
      }

      // Calcular la fecha de expiración en milisegundos (null si es "Never")
      const expirationTimestamp = expiresValue === 0 ? null : Date.now() + expiresValue * 1000;

      const requestBody = `username=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}&grant_type=password&client_id=particle&client_secret=particle&expires_in=${expiresValue}`;

      const response = await fetch('https://api.particle.io/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: requestBody,
      });

      const data = await response.json();

      if (response.ok) {
        setApiKey(data.access_token);
        setExpirationDate(expirationTimestamp);
        Alert.alert('Éxito', 'Clave generada correctamente.');
      } else {
        Alert.alert('Error', `No se pudo generar la clave: ${data.error_description}`);
      }
    } catch (error) {
      Alert.alert('Error', 'Ocurrió un error al generar la clave.');
    } finally {
      setIsGeneratingKey(false);
    }
  };

  // Guardar en la base de datos (incluyendo la expiración)
  const handleSaveToDatabase = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        Alert.alert('Error', 'Usuario no autenticado.');
        return;
      }

      await setDoc(
        doc(db, 'BD', userId),
        { photonId, apiKey, expiresAt: expirationDate },
        { merge: true }
      );

      Alert.alert('Éxito', 'Datos guardados correctamente.');
      setPhotonId('');
      setApiKey('');
    } catch (error: any) {
      if (error.code === 'permission-denied') {
        Alert.alert('Error', 'No tienes permisos para escribir en la base de datos.');
      } else {
        Alert.alert('Error', 'No se pudieron guardar los datos.');
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Agregar Nuevo Dispositivo</Text>

      {!isPhotonIdValid && photonId.length > 0 && (
        <Text style={styles.errorText}>El ID debe tener 24 caracteres numéricos.</Text>
      )}
      <TextInput
        style={[styles.input, styles.espacio]}
        placeholder="ID del Photon"
        value={photonId}
        onChangeText={setPhotonId}
        keyboardType="numeric"
        maxLength={24}
      />

      {!isEmailValid && email.length > 0 && (
        <Text style={styles.errorText}>Por favor, ingresa un correo válido.</Text>
      )}
      <TextInput
        style={styles.input}
        placeholder="Correo Asociado a Particle"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />

      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        value={password}
        onChangeText={setPassword}
        secureTextEntry={!showPassword}
      />

      {/* Checkbox para mostrar/ocultar contraseña */}
      <View style={[styles.checkboxContainer, styles.espacio]}>
        <Checkbox value={showPassword} onValueChange={setShowPassword} color={showPassword ? 'blue' : undefined} />
        <Text style={styles.checkboxLabel}>Mostrar Contraseña</Text>
      </View>

      <Picker selectedValue={expiresIn} onValueChange={(itemValue) => setExpiresIn(itemValue)} style={[styles.picker, styles.espacio]}>
        <Picker.Item label="15 minutes" value="15 minutes" />
        <Picker.Item label="1 hour" value="1 hour" />
        <Picker.Item label="8 hours" value="8 hours" />
        <Picker.Item label="1 day" value="1 day" />
        <Picker.Item label="30 days" value="30 days" />
        <Picker.Item label="90 days" value="90 days" />
        <Picker.Item label="Never" value="Never" />
      </Picker>

      <TouchableOpacity
        style={[styles.secondaryButton, (!isEmailValid || !isPasswordValid || isGeneratingKey) && styles.disabledButton]}
        onPress={handleGenerateApiKey}
        disabled={!isEmailValid || !isPasswordValid || isGeneratingKey}
      >
        <Text style={styles.secondaryButtonText}>{isGeneratingKey ? 'Generando...' : 'Generar Clave'}</Text>
      </TouchableOpacity>

      {apiKey && (
        <TextInput
          style={[styles.input, styles.readOnlyInput, styles.espacio]}
          value={apiKey}
          editable={false}
        />
      )}

      <TouchableOpacity
        style={[styles.secondaryButton, (!isPhotonIdValid || !apiKey) && styles.disabledButton]}
        onPress={handleSaveToDatabase}
        disabled={!isPhotonIdValid || !apiKey}
      >
        <Text style={styles.secondaryButtonText}>Guardar en Base de Datos</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>←</Text>
      </TouchableOpacity>

      <View style={styles.settingsContainer}>
        <Settings />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  settingsContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    marginTop: 100,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  espacio: {
    marginBottom: 40,
  },
  readOnlyInput: {
    backgroundColor: '#f0f0f0',
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginBottom: 10,
  },
  picker: {
    height: 50,
    marginBottom: 20,
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
  },
  disabledButton: {
    backgroundColor: '#d3d3d3',
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
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
  },
  checkboxLabel: {
    marginLeft: 8,
    fontSize: 14,
  },
});

export default AddDevice;
