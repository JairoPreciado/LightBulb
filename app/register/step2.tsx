import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, TouchableOpacity, Dimensions, Platform} from 'react-native';
import Checkbox from 'expo-checkbox';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { setDoc, doc } from 'firebase/firestore';
import { auth, db } from '../../firebaseConfiguration'; // Ajusta la ruta según tu estructura

const RegisterStep2 = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const email = Array.isArray(params.email) ? params.email[0] : params.email; // Asegúrate de que sea una cadena
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Verifica que la contraseña sea valida
  const isPasswordValid = password.length >= 8 && password.length <= 16;
  // Verifica que la contraseña sea valida y se confirme como tal
  const isConfirmPasswordValid = confirmPassword === password && password.length > 0;
  // Verifica que el nombre sea valido
  const isNameValid = name.trim().length > 0; // El nombre no puede estar vacío
  // Verifica que el formulario tenga la informacion necesaria
  const isFormValid = isPasswordValid && isConfirmPasswordValid && isNameValid;

  // Funcion para ingresar datos de la cuenta a la BD
  const handleCreateAccount = async () => {
    try {
      if (!email || typeof email !== 'string') {
        throw new Error('Correo inválido');
      }

      if (!isConfirmPasswordValid) {
        Alert.alert('Error', 'Las contraseñas no coinciden.');
        return;
      }

      // Crea la cuenta del usuario
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Guarda los datos en Firestore
      await setDoc(doc(db, 'BD', user.uid), {
        email,
        name,
      });

      Alert.alert('Éxito', 'Cuenta creada exitosamente.');
      router.push('/loginn/login');
    } catch (error) {
      console.error('Error creando la cuenta:', error);
      Alert.alert('Error', 'No se pudo crear la cuenta. Inténtalo de nuevo.');
    }
  };

  return (
    <View style={styles.container}>
      
      {/* Titulo de la vista */}
      <Text style={styles.title}>Crear Cuenta</Text>

      {/* Input de Nombre */}
      <TextInput style={styles.input} placeholder="Nombre" value={name} onChangeText={setName} maxLength={16}/>
      {!isNameValid && name.length > 0 && (<Text style={styles.errorText}>El nombre no puede estar vacío.</Text>)}

      {/* Input de Contraseña */}
      <TextInput style={styles.input} placeholder="Contraseña" secureTextEntry={!showPassword} value={password} onChangeText={setPassword} maxLength={16}/>
      {!isPasswordValid && password.length > 0 && (<Text style={styles.errorText}>La contraseña debe tener entre 8 y 16 caracteres.</Text>)}

      {/* Input de Confirmar Contraseña */}
      <TextInput style={styles.input} placeholder="Confirmar Contraseña" secureTextEntry={!showPassword} value={confirmPassword} onChangeText={setConfirmPassword} maxLength={16}/>
      {!isConfirmPasswordValid && confirmPassword.length > 0 && (<Text style={styles.errorText}>Las contraseñas no coinciden.</Text>)}

      {/* Checkbox de mostrar u ocultar contraseña */}
      <View style={styles.checkboxContainer}>
        <Checkbox value={showPassword} onValueChange={setShowPassword} color={showPassword ? 'blue' : undefined}/>
        <Text style={styles.checkboxLabel}>Mostrar Contraseña</Text>
      </View>

      {/* Botón Crear Cuenta */}      
      <TouchableOpacity style={[styles.primaryButton,!isFormValid && styles.primaryDisabledButton,]} onPress={handleCreateAccount} disabled={!isFormValid} >
        <Text style={styles.primaryButtonText}>Crear Cuenta</Text>
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
  errorText: {
    color: 'red',
    fontSize: normalizeFont(12),
    marginBottom: responsiveSize(2.5),
    width: '100%',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: responsiveSize(5),
    width: '100%',
    flexWrap: 'wrap', // Para evitar desbordamiento en pantallas pequeñas
  },
  checkboxLabel: {
    marginLeft: 8,
    fontSize: normalizeFont(14),
    flex: 1, // Para que se ajuste al espacio disponible
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
    fontSize: normalizeFont(18),
    color: '#333',
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
  landscapeCheckboxContainer: {
    width: '48%', // Cuando está en landscape, los checkboxes pueden ocupar la mitad del ancho
    marginRight: '2%',
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


export default RegisterStep2;
