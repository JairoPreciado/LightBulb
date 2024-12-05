import React, { useState } from 'react';
import { View, Text, TextInput, Alert, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseConfiguration';

const RecoveryPassword = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isEmailValid, setIsEmailValid] = useState(false);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);

  // Expresión regular para validar correos electrónicos
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  // Validar correo electrónico
  const validateEmail = (email: string) => {
    setIsEmailValid(emailRegex.test(email));
  };

  // Función para verificar si el correo existe en Firebase
  const checkEmailExists = async (email: string): Promise<boolean> => {
    try {
      const usersRef = collection(db, 'BD'); // Cambia 'BD' por tu colección
      const q = query(usersRef, where('email', '==', email));
      const querySnapshot = await getDocs(q);

      return !querySnapshot.empty; // Devuelve true si el correo existe
    } catch (error) {
      console.error('Error verificando el correo:', error);
      Alert.alert('Error', 'Hubo un problema verificando el correo. Intenta nuevamente.');
      return false;
    }
  };

  // Función para enviar el correo de recuperación
  const handleSendPasswordReset = async () => {
    setIsButtonDisabled(true); // Deshabilitar el botón mientras se verifica el correo

    try {
      const emailExists = await checkEmailExists(email); // Validar si el correo existe
      if (!emailExists) {
        Alert.alert('Error', 'El correo ingresado no está registrado.');
        setIsButtonDisabled(false);
        return;
      }

      const auth = getAuth(); // Instancia de Firebase Auth

      // Enviar correo de recuperación de contraseña
      await sendPasswordResetEmail(auth, email);
      Alert.alert(
        'Éxito',
        'Correo de recuperación enviado. Revisa tu bandeja de entrada.'
      );
    } catch (error) {
      console.error('Error al enviar el correo de recuperación:', error);
      Alert.alert(
        'Error',
        'No se pudo enviar el correo. Intenta nuevamente.'
      );
    }

    // Reactivar el botón después de 10 segundos
    setTimeout(() => setIsButtonDisabled(false), 10000);
  };

  return (
    <View style={styles.container}>
      {/* Título */}
      <Text style={styles.title}>Recuperación de Contraseña</Text>

      {/* Input de correo */}
      <TextInput
        style={styles.input}
        placeholder="Correo Electrónico"
        keyboardType="email-address"
        value={email}
        onChangeText={(text) => {
          setEmail(text);
          validateEmail(text);
        }}
        maxLength={50}
      />
      {email && !isEmailValid && <Text style={styles.errorText}>El correo no es válido.</Text>}

      {/* Botón de enviar correo */}
      <TouchableOpacity
        style={[
          styles.secondaryButton,
          (isButtonDisabled || !isEmailValid) && styles.disabledButton,
        ]}
        onPress={handleSendPasswordReset}
        disabled={isButtonDisabled || !isEmailValid}
      >
        <Text style={styles.secondaryButtonText}>
          {isButtonDisabled ? 'Espera 10s...' : 'Enviar Contraseña por Correo'}
        </Text>
      </TouchableOpacity>

      {/* Botón de regreso */}
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
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
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
  errorText: {
    color: 'red',
    fontSize: 12,
    marginBottom: 10,
  },
  secondaryButton: {
    backgroundColor: '#007BFF',
    width: '100%',
    height: 45,
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
  disabledButton: {
    backgroundColor: '#d3d3d3',
  },
});

export default RecoveryPassword;
