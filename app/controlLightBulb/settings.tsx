import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, Modal, TouchableOpacity,ScrollView,} from 'react-native';
import Checkbox from 'expo-checkbox';
import { useRouter } from 'expo-router';
import { auth, db } from '../../firebaseConfiguration';
import { updatePassword, deleteUser, reauthenticateWithCredential, EmailAuthProvider,} from 'firebase/auth';
import { doc, deleteDoc } from 'firebase/firestore';

const ManageAccount = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [activeOption, setActiveOption] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const router = useRouter();

  // Verifica que la contraseña sea valida
  const isPasswordValid = newPassword.length >= 8 && newPassword.length <= 16; 

  // Funcion para modificar la contraseña(actualizar contraseña)
  const handleUpdatePassword = async () => {
    try {
      const user = auth.currentUser;
    if (!user || !user.email) {
      Alert.alert('Error', 'No se pudo obtener el correo del usuario.');
      return;
    }
        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(user, credential);
        await updatePassword(user, newPassword);

        setCurrentPassword('');
        setNewPassword('');
        Alert.alert('Éxito', 'Contraseña actualizada correctamente.');
    } catch (error) {
      console.error('Error al actualizar la contraseña:', error);
      Alert.alert('Error', 'La contraseña actual no es correcta.');
    }
  };

  // Funcion para eliminar la cuenta
  const handleDeleteAccount = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        await deleteDoc(doc(db, 'BD', user.uid));
        await deleteUser(user);
        Alert.alert('Éxito', 'Cuenta eliminada correctamente.');
        router.replace('/loginn/login');
      }
    } catch (error) {
      console.error('Error al eliminar la cuenta:', error);
      Alert.alert('Error', 'No se pudo eliminar la cuenta.');
    }
  };

  // Funcion para cerrar sesion
  const handleLogout = () => {
    auth.signOut();
    Alert.alert('Cierre de Sesión', 'Sesión cerrada correctamente.');
    router.replace('/loginn/login');
  };

  // Renderizado del modal de settings
  const renderModalContent = () => {
    switch (activeOption) {
      case 'password':
        return (
          <View style={styles.modalContent}>

            {/* Titulo de la vista de cambiar contraseña */}
            <Text style={styles.subtitle}>Cambiar Contraseña</Text>

            {/* Input para meter la contraseña actual */}
            <TextInput style={styles.input} placeholder="Contraseña Actual" value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry={!showPasswords} maxLength={16}/>
            
            {/* Input para meter la contraseña nueva */}
            <TextInput style={styles.input} placeholder="Nueva Contraseña" value={newPassword} onChangeText={setNewPassword} secureTextEntry={!showPasswords} maxLength={16}/>
            {!isPasswordValid && newPassword.length > 0 && (<Text style={styles.errorText}>La nueva contraseña debe tener entre 8 y 16 caracteres.</Text>)}
            
            {/* Checkbox para ocultar o mostrar la contraseña */}
            <View style={styles.checkboxContainer}>
              <Checkbox value={showPasswords} onValueChange={setShowPasswords} color={showPasswords ? 'blue' : undefined}/>
              <Text style={styles.checkboxLabel}>Mostrar Contraseñas</Text>
            </View>

            {/* Boton para actualizar contraseña */}
            <TouchableOpacity style={[styles.secondaryButton,!isPasswordValid && styles.disabledButton]} onPress={handleUpdatePassword} disabled={!isPasswordValid || !currentPassword}>
              <Text style={styles.secondaryButtonText}>Actualizar contraseña</Text>
            </TouchableOpacity>
            

          </View>
        );
      case 'delete':
        return (
          <View style={styles.modalContent}>
            
            {/* Titulo de la vista de eliminar del modal */}
            <Text style={[styles.subtitle, { color: 'red' }]}>Eliminar Cuenta</Text>

            {/* Botón de eliminar cuenta */}
            <TouchableOpacity style={styles.secondaryButton2} onPress={() => Alert.alert('Confirmar','¿Estás seguro de que deseas eliminar tu cuenta?',[
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Eliminar', style: 'destructive', onPress: handleDeleteAccount },
                  ]
                )
              }>
              <Text style={styles.secondaryButtonText}>Eliminar cuenta</Text>
            </TouchableOpacity>
          </View>
        );
      case 'logout':
        return (
          <View style={styles.modalContent}>

            {/* Botón de cerrar sesion */}
            <TouchableOpacity style={styles.secondaryButton} onPress={handleLogout}>
              <Text style={styles.secondaryButtonText}>Cerrar sesión</Text>
            </TouchableOpacity>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>

      {/* Botón de ajustes */}
      <TouchableOpacity style={styles.settingsButton} onPress={() => setModalVisible(true)}>
        <Text style={styles.settingsButtonText}>⚙️</Text>
      </TouchableOpacity>

      {/* Vista de todo el modal */}
      <Modal visible={modalVisible} animationType="fade" transparent onRequestClose={() => setModalVisible(false)}>
        
        {/* Containner de todo el modal */}
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>

            {/* Titulo de la vista */}
            <Text style={styles.modalTitle}>Gestión de Cuenta</Text>
            <ScrollView contentContainerStyle={styles.modalOptions}>

              {/* Botón de cambio de email 
              <TouchableOpacity style={styles.optionButton} onPress={() => setActiveOption('email')}>
                <Text style={styles.optionText}>Cambiar Correo</Text>
              </TouchableOpacity>*/}

              {/* Botón de cambio de password */}
              <TouchableOpacity style={styles.optionButton} onPress={() => setActiveOption('password')}>
                <Text style={styles.optionText}>Cambiar Contraseña</Text>
              </TouchableOpacity>

              {/* Botón de eliminar la cuenta */}
              <TouchableOpacity style={styles.optionButton} onPress={() => setActiveOption('delete')}>
                <Text style={[styles.optionText, { color: 'red' }]}>Eliminar Cuenta</Text>
              </TouchableOpacity>

              {/* Botón de cerrar sesion */}
              <TouchableOpacity style={styles.optionButton} onPress={() => setActiveOption('logout')}>
                <Text style={styles.optionText}>Cerrar Sesión</Text>
              </TouchableOpacity>

            </ScrollView>

            {/* Contenido de todo el modal */}
            {renderModalContent()}

            {/* Botón de cerrar/ocultar el modal */}
            <TouchableOpacity style={styles.secondaryButton3} onPress={() => setModalVisible(false)}>
              <Text style={styles.secondaryButtonText}>Cerrar</Text>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  settingsButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#ddd',
    borderRadius: 20,
    padding: 10,
  },
  settingsButtonText: {
    fontSize: 18,
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: '80%',
    backgroundColor: '#FFE5B4',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalOptions: {
    alignItems: 'center',
    marginBottom: 20,
  },
  optionButton: {
    width: '100%',
    padding: 15,
    marginVertical: 5,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    alignItems: 'center',
  },
  optionText: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalContent: {
    marginVertical: 20,
    width: '100%',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
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
    marginBottom: 10,
  },
  checkboxLabel: {
    marginLeft: 10,
    fontSize: 14,
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginBottom: 10,
  },
  secondaryButton: {
    backgroundColor: '#007BFF',
    width:'100%',
    height:35,
    marginBottom: 10,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButton2: {
    backgroundColor: 'red',
    width:'100%',
    height:35,
    marginBottom: 10,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButton3: {
    backgroundColor: 'brown',
    width:'50%',
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

export default ManageAccount;
