import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { collection, query, where, getDocs } from 'firebase/firestore'; // Firebase Firestore
import { db } from '../../firebaseConfiguration'; // Ajusta la ruta según tu estructura

const RegisterStep1 = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');

  // Expresión regular mejorada para validar correos electrónicos
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  // Dominios comunes válidos (puedes agregar más si lo deseas)
  const validDomains = [
    'gmail.com',
    'yahoo.com',
    'hotmail.com',
    'outlook.com',
    'ucol.mx',
  ];

  // Verifica si el dominio del correo es válido
  const isDomainValid = (email:string) => {
    const domain = email.split('@')[1];
    return validDomains.includes(domain);
  };

  // Verifica si el correo tiene un formato y dominio válidos
  const isEmailValid = emailRegex.test(email) && isDomainValid(email);

  // Función para verificar si el correo ya está registrado
  const checkEmailExists = async (email:string) => {
    try {
      const usersRef = collection(db, 'BD'); // Colección donde guardas usuarios
      const q = query(usersRef, where('email', '==', email));
      const querySnapshot = await getDocs(q);

      return !querySnapshot.empty; // Devuelve true si el correo ya existe
    } catch (error) {
      console.error('Error verificando el correo:', error);
      Alert.alert('Error', 'Ocurrió un problema verificando el correo.');
      return false;
    }
  };

  // Función para enviar el correo
  const sendVerificationEmail = async (email:string, code:string) => {
    try {
      const response = await fetch('https://server-lightbulb-five.vercel.app/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, code }),
      });

      if (response.ok) {
        Alert.alert('Éxito', 'Código de verificación enviado. Revisa tu bandeja de entrada.');
      } else {
        const errorResponse = await response.text();
        console.error('Error en la respuesta:', errorResponse);
        throw new Error('Error al enviar el correo');
      }
    } catch (error) {
      console.error('Error al enviar el correo:', error);
      Alert.alert('Error', 'No se pudo enviar el correo. Intenta nuevamente.');
    }
  };

  // Manejar envío del código
  const handleSendCode = async () => {
    try {
      const emailExists = await checkEmailExists(email);
      if (emailExists) {
        Alert.alert('Error', 'Este correo ya está asociado a una cuenta. Usa otro correo.');
        return;
      }

      const generatedCode = Math.floor(100000 + Math.random() * 900000).toString(); // Código de 6 dígitos
      setVerificationCode(generatedCode);
      setCodeSent(true);

      await sendVerificationEmail(email, generatedCode); // Enviar el correo
    } catch (error) {
      console.error('Error al enviar el código:', error);
      Alert.alert('Error', 'No se pudo enviar el código. Intenta nuevamente.');
    }
  };

  // Verificar el código ingresado
  const handleVerifyCode = () => {
    if (inputCode === verificationCode) {
      Alert.alert('Éxito', 'Correo verificado!');
      router.push({
        pathname: './step2',
        params: { email }, // Pasa directamente los parámetros
      });
    } else {
      Alert.alert('Error', 'El código ingresado es incorrecto.');
    }
  };

  return (
    <View style={styles.container}>
      
      {/* Titulo */}
      <Text style={styles.title}>Registro: Paso 1</Text>

      {/* Input de Correo electronico */}
      <TextInput style={styles.input} placeholder="Correo Electrónico" value={email} onChangeText={setEmail} keyboardType="email-address" maxLength={50}/>
      {email && !isEmailValid && <Text style={styles.errorText}>El correo no es válido.</Text>}
      
      {/* Botón de enviar codigo al correo */}
      <TouchableOpacity style={[styles.primaryButton,!isEmailValid && styles.primaryDisabledButton,]} onPress={handleSendCode} disabled={!isEmailValid}>
        <Text style={styles.primaryButtonText}>Enviar Codigo</Text>
      </TouchableOpacity>

      {/* Salto de linea improvisado xd*/}
      <View style={{height: '2%'}} />
      
      {/* Input de Codigo de verificacion */}
      <TextInput style={styles.input} placeholder="Código de Verificación" keyboardType="numeric" value={inputCode} onChangeText={setInputCode} editable={codeSent} maxLength={6}/>
      
      {/* Botón de verificar el correo */}
      <TouchableOpacity style={[styles.primaryButton,!codeSent && styles.primaryDisabledButton,]} onPress={handleVerifyCode} disabled={!codeSent}>
        <Text style={styles.primaryButtonText}>Verificar Codigo</Text>
      </TouchableOpacity>

      {/* Botón de regresar */}
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>←</Text>
      </TouchableOpacity>

    </View>
  );
};

//responsive design -----------------------------------------------------------------------------------------

const { width, height } = Dimensions.get('window');
const scale = Math.min(width, height) / 375; // Base scale on a 375pt width (iPhone standard)
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


export default RegisterStep1;
