import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, TouchableOpacity } from 'react-native';
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
      const response = await fetch('https://server-lightbulb.vercel.app/api/send-email', {
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
      <TouchableOpacity style={[styles.secondaryButton,!isEmailValid && styles.disabledButton,]} onPress={handleSendCode} disabled={!isEmailValid}>
        <Text style={styles.secondaryButtonText}>Enviar Codigo</Text>
      </TouchableOpacity>
      
      {/* Input de Codigo de verificacion */}
      <TextInput style={styles.input} placeholder="Código de Verificación" keyboardType="numeric" value={inputCode} onChangeText={setInputCode} editable={codeSent} maxLength={6}/>
      
      {/* Botón de verificar el correo */}
      <TouchableOpacity style={[styles.secondaryButton,!codeSent && styles.disabledButton,]} onPress={handleVerifyCode} disabled={!codeSent}>
        <Text style={styles.secondaryButtonText}>Verificar Codigo</Text>
      </TouchableOpacity>

      {/* Botón de regresar */}
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
    width:150,
    height:35,
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
        backgroundColor: '#d3d3d3', // Color gris cuando está deshabilitado
  }
});

export default RegisterStep1;
