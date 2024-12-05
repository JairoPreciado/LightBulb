import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, TouchableOpacity } from 'react-native';
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
      <TouchableOpacity style={[styles.secondaryButton,!isFormValid && styles.disabledButton,]} onPress={handleCreateAccount} disabled={!isFormValid} >
        <Text style={styles.secondaryButtonText}>Crear Cuenta</Text>
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
  errorText: {
    color: 'red',
    fontSize: 12,
    marginBottom: 10,
    textAlign: 'center',
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

export default RegisterStep2;
