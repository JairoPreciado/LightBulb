import React, { useState } from 'react';
import { View, Text, TextInput, Alert, TouchableOpacity, StyleSheet, Dimensions, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseConfiguration';

const RecoveryPassword = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);

  // Expresión regular para validar correos electrónicos
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  // Dominios válidos (agregado de LoginScreen)
  const validDomains = [
    'gmail.com',
    'yahoo.com',
    'hotmail.com',
    'outlook.com',
    'ucol.mx',
  ];

  // Verifica si el dominio del correo es válido (agregado de LoginScreen)
  const isDomainValid = (email: string) => {
    if (!email.includes('@')) return false;
    const domain = email.split('@')[1];
    return validDomains.includes(domain);
  };

  // Verifica si el correo tiene un formato y dominio válidos (modificado)
  const isEmailValid = email ? emailRegex.test(email) && isDomainValid(email) : false;

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
        onChangeText={setEmail}
        maxLength={50}
      />
      {email && emailRegex.test(email) && !isDomainValid(email) && (
        <Text style={styles.errorText}>
          El correo no es válido.
        </Text>
      )}

      {/* Botón de enviar correo */}
      <TouchableOpacity
        style={[
          styles.primaryButton,
          (!isEmailValid || isButtonDisabled) && styles.primaryDisabledButton,
        ]}
        onPress={handleSendPasswordReset}
        disabled={!isEmailValid || isButtonDisabled}
      >
        <Text style={styles.primaryButtonText}>
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

//responsive design -----------------------------------------------------------------------------------------

const { width, height } = Dimensions.get('window');
const scale = Math.min(width, height) / 375; 
// Función para hacer responsive los tamaños de texto basado en el ancho de la pantalla
const normalizeFont = (size:any) => {
  return Math.round(size * scale);
};
// Función para hacer responsive los espaciados basados en el porcentaje del ancho de pantalla
const responsiveSize = (percentage:any) => {
  return width * (percentage / 100);
};
// Función para determinar un tamaño seguro para elementos posicionados cerca de los bordes
const getSafeBottomMargin = () => {
  // En iOS con notch, añade más espacio para evitar colisiones con el área de gestos
  return Platform.OS === 'ios' && height > 800 ? 34 : 20;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: responsiveSize(5),
    paddingVertical: responsiveSize(3),
    backgroundColor: '#f0f0f0',
  },
  title: {
    fontSize: normalizeFont(24),
    fontWeight: 'bold',
    marginBottom: responsiveSize(5),
    textAlign: 'center',
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: responsiveSize(2.5),
    marginBottom: responsiveSize(2.5),
    fontSize: normalizeFont(14),
  },
  backButton: {
    position: 'absolute',
    bottom: getSafeBottomMargin(),
    left: responsiveSize(5),
    paddingHorizontal: responsiveSize(2.5),
    paddingVertical: responsiveSize(1.25),
    backgroundColor: '#ddd',
    borderRadius: 5,
    zIndex: 10,
  },
  backButtonText: {
    fontSize: normalizeFont(16),
    color: '#333',
  },
  errorText: {
    color: 'red',
    fontSize: normalizeFont(12),
    marginBottom: responsiveSize(3),
    width: '100%',
  },
  primaryButton: {
    width: '100%',
    height: Math.max(40, responsiveSize(10)), // Altura mínima de 40px
    backgroundColor: '#007BFF',
    borderRadius: 5,
    marginBottom: responsiveSize(3),
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: normalizeFont(16),
    fontWeight: 'bold',
  },
  primaryDisabledButton: {
    backgroundColor: '#d3d3d3',
  },
  // Estilos adicionales para diferentes tamaños de pantallas
  tabletContainer: {
    paddingHorizontal: responsiveSize(10), // Más padding en tablets
  },
  landscapeContainer: {
    paddingHorizontal: responsiveSize(15), // Más padding en modo horizontal
  },
  landscapeBackButton: {
    bottom: getSafeBottomMargin(),
    left: responsiveSize(5),
  },
  tabletBackButton: {
    paddingHorizontal: responsiveSize(3),
    paddingVertical: responsiveSize(1.5),
  }
});

export default RecoveryPassword;