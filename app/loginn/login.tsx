import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert,Dimensions, Platform  } from 'react-native';
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
      <Text style={styles.title}>Control Particle</Text>
      
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
      <TouchableOpacity style={[styles.primaryButton,!isFormValid && styles.primaryDisabledButton,]} onPress={handleLogin} disabled={!isFormValid}>
        <Text style={styles.primaryButtonText}>Iniciar</Text>
      </TouchableOpacity>

      {/* Botón para crear una cuenta o registrar una */}
      <TouchableOpacity onPress={() => router.push('/register/step1')}>
        <Text style={styles.link}>¿Aún no tienes cuenta? Regístrate</Text>
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
    marginBottom: responsiveSize(2),
    fontSize: normalizeFont(14),
  },
  errorText: {
    color: 'red',
    fontSize: normalizeFont(12),
    marginBottom: responsiveSize(2),
    width: '100%',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: responsiveSize(4),
    width: '100%',
    flexWrap: 'wrap', // Para que los elementos se ajusten en pantallas pequeñas
  },
  checkboxLabel: {
    marginLeft: 8,
    fontSize: normalizeFont(14),
    flex: 1, // Para que ocupe el espacio disponible
  },
  link: {
    color: 'blue',
    marginTop: responsiveSize(2),
    textDecorationLine: 'underline',
    fontSize: normalizeFont(14),
  },
  recovery: {
    alignSelf: 'flex-end',
    marginTop: responsiveSize(1),
    fontSize: normalizeFont(14),
  },
  primaryButton: {
    width: '100%',
    height: Math.max(40, responsiveSize(10)), // Altura mínima de 40
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
    flexDirection: 'row', // Cambia la dirección en modo landscape
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  }
});

export default LoginScreen;
