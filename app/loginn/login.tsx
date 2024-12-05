import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import Checkbox from 'expo-checkbox';
import { useRouter } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../firebaseConfiguration';

const LoginScreen = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Validación de correo
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  //dominios validos
  const validDomains = [
    'gmail.com',
    'yahoo.com',
    'hotmail.com',
    'outlook.com',
    'ucol.mx',
  ];

  // Verifica si el dominio del correo es válido
  const isDomainValid = (email: string) => {
    const domain = email.split('@')[1];
    return validDomains.includes(domain);
  };

  // Verifica si el correo tiene un formato y dominio válidos
  const isEmailValid = emailRegex.test(email) && isDomainValid(email);
  // Verifica si la contraseña tiene la extension necesaria
  const isPasswordValid = password.length > 7;
  // Verifica si el formulario tiene la informacion necesaria o completa
  const isFormValid = email && password && isEmailValid && isPasswordValid;

  // Funcion para accionar la sesion
  const handleLogin = async () => {
    try {
      // Inicia sesión con Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Obtiene el nombre del usuario desde Firestore
      const userDocRef = doc(db, 'BD', user.uid);
      const userDoc = await getDoc(userDocRef);

      // Mensaje de bienvenida en consecuencia al nombre con el que se registro el usuario
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const userName = userData?.name || 'Usuario';

        Alert.alert('Éxito', `¡Bienvenido, ${userName}!`);
        router.push('../controlLightBulb/home'); // Cambia a la vista principal después del inicio de sesión
      } else {
        Alert.alert('Error', 'No se encontró información del usuario. Inténtalo nuevamente.');
      }
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      Alert.alert('Error', 'Correo o contraseña incorrectos.');
    }
  };

  return (
    <View style={styles.container}>

      {/* Titulo de la vista */}
      <Text style={styles.title}>Lightbulb</Text>
      
      {/* Input para ingresar el correo */}
      <TextInput style={styles.input} placeholder="Correo" value={email} onChangeText={setEmail} maxLength={50} keyboardType="email-address"/>
      {email && !isEmailValid && <Text style={styles.errorText}>El correo no es válido.</Text>}
      
      {/* Input para ingresar la contraseña */}
      <TextInput style={styles.input} placeholder="Contraseña" secureTextEntry={!showPassword} value={password} maxLength={16} onChangeText={setPassword}/>
      
      {/* Checkbox para ver o ocultar la contraseña */}
      <View style={styles.checkboxContainer}>
        <Checkbox value={showPassword} onValueChange={setShowPassword} color={showPassword ? 'blue' : undefined}/>
        <Text style={styles.checkboxLabel}>Mostrar Contraseña</Text>

        {/* Botón para crear una cuenta o registrar una */}
        <TouchableOpacity style={styles.recovery} onPress={() => router.push('../recovery/recoveryPassword')}>
          <Text style={styles.link}>¿Olvidaste tu contraseña? Recuperala</Text>
        </TouchableOpacity>
      </View>

      {/* Botón para mandar las credenciales a verificar para iniciar sesion */}
      <TouchableOpacity style={[styles.secondaryButton,!isFormValid && styles.disabledButton,]} onPress={handleLogin} disabled={!isFormValid}>
        <Text style={styles.secondaryButtonText}>Iniciar</Text>
      </TouchableOpacity>

      {/* Botón para crear una cuenta o registrar una */}
      <TouchableOpacity onPress={() => router.push('/register/step1')}>
        <Text style={styles.link}>¿Aún no tienes cuenta? Regístrate</Text>
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
  errorText: {
    color: 'red',
    fontSize: 12,
    marginBottom: 10,
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
  link: {
    color: 'blue',
    marginTop: 10,
    textDecorationLine: 'underline',
  },
  secondaryButton: {
    backgroundColor: '#007BFF',
    paddingVertical: 10,
    paddingHorizontal: 160,
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
  disabledButton: {
    backgroundColor: '#d3d3d3', // Color gris cuando está deshabilitado
  },
  recovery: {
    marginLeft: 'auto',
    marginTop: -10,
  }
});

export default LoginScreen;
