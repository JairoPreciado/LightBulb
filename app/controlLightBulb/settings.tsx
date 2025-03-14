import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, Alert, Modal, TouchableOpacity} from "react-native";
import Checkbox from "expo-checkbox";
import { useRouter } from "expo-router";
import { auth, db } from "../../firebaseConfiguration";
import { updatePassword, deleteUser, reauthenticateWithCredential, EmailAuthProvider} from "firebase/auth";
import { doc, deleteDoc } from "firebase/firestore";

const ManageAccount = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [activeOption, setActiveOption] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const router = useRouter();

  // Verifica que la contraseña sea valida
  const isPasswordValid = newPassword.length >= 8 && newPassword.length <= 16;

  // Funcion para modificar la contraseña(actualizar contraseña)
  const handleUpdatePassword = async () => {
    try {
      const user = auth.currentUser;
      if (!user || !user.email) {
        Alert.alert("Error", "No se pudo obtener el correo del usuario.");
        return;
      }
      const credential = EmailAuthProvider.credential(
        user.email,
        currentPassword
      );
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);

      setCurrentPassword("");
      setNewPassword("");
      Alert.alert("Éxito", "Contraseña actualizada correctamente.");
    } catch (error) {
      console.error("Error al actualizar la contraseña:", error);
      Alert.alert("Error", "La contraseña actual no es correcta.");
    }
  };

  // Funcion para eliminar la cuenta
  const handleDeleteAccount = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        await deleteDoc(doc(db, "BD", user.uid));
        await deleteUser(user);
        Alert.alert("Éxito", "Cuenta eliminada correctamente.");
        router.replace("/loginn/login");
      }
    } catch (error) {
      console.error("Error al eliminar la cuenta:", error);
      Alert.alert("Error", "No se pudo eliminar la cuenta.");
    }
  };

  // Funcion para cerrar sesion
  const handleLogout = () => {
    auth.signOut();
    Alert.alert("Cierre de Sesión", "Sesión cerrada correctamente.");
    router.replace("/loginn/login");
  };

  // Función para cerrar el modal y reiniciar todos los estados
  const closeAndResetModal = () => {
    setModalVisible(false);
    setActiveOption("");
    setCurrentPassword("");
    setNewPassword("");
    setShowPasswords(false);
  };

  // Renderizado del modal de settings
  const renderModalContent = () => {
    switch (activeOption) {
      case "password":
        return (
          <View style={styles.modalContent}>

            {/* Titulo de la vista de cambiar contraseña */}
            <Text style={styles.modalSubtitle}>Cambiar Contraseña</Text>

            {/* Input para meter la contraseña actual */}
            <TextInput
              style={styles.modalInput}
              placeholder="Contraseña Actual"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry={!showPasswords}
              maxLength={16}
            />

            {/* Input para meter la contraseña nueva */}
            <TextInput
              style={styles.modalInput}
              placeholder="Nueva Contraseña"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry={!showPasswords}
              maxLength={16}
            />
            {!isPasswordValid && newPassword.length > 0 && (
              <Text style={styles.modalErrorText}>
                La nueva contraseña debe tener entre 8 y 16 caracteres.
              </Text>
            )}

            {/* Checkbox para ocultar o mostrar la contraseña */}
            <View style={styles.modalCheckboxContainer}>
              <Checkbox
                value={showPasswords}
                onValueChange={setShowPasswords}
                color={showPasswords ? "blue" : undefined}
              />
              <Text style={styles.modalCheckboxLabel}>Mostrar Contraseñas</Text>
            </View>

            {/* Boton para actualizar contraseña */}
            <TouchableOpacity
              style={[
                styles.modalButtonPassword,
                !isPasswordValid && styles.disabledButton,
              ]}
              onPress={handleUpdatePassword}
              disabled={!isPasswordValid || !currentPassword}
            >
              <Text style={styles.modalButtonText}>
                Actualizar contraseña
              </Text>
            </TouchableOpacity>
          </View>
        );
      case "delete":
        return (
          <View style={styles.modalContent}>
            {/* Titulo de la vista de eliminar del modal */}
            <Text style={[styles.modalSubtitle, { color: "red" }]}>
              Eliminar Cuenta
            </Text>

            {/* Botón de eliminar cuenta */}
            <TouchableOpacity
              style={styles.modalButtonDanger}
              onPress={() =>
                Alert.alert(
                  "Confirmar",
                  "¿Estás seguro de que deseas eliminar tu cuenta?",
                  [
                    { text: "Cancelar", style: "cancel" },
                    { text: "Eliminar", style: "destructive", onPress: handleDeleteAccount},
                  ]
                )
              }
            >
              <Text style={styles.modalButtonText}>Eliminar cuenta</Text>
            </TouchableOpacity>
          </View>
        );
      case "logout":
        return (
          <View style={styles.modalContent}>
            {/* Titulo de la vista de eliminar del modal */}
            <Text style={[styles.modalSubtitle, { color: "orange" }]}>
              Cerrar sesion
            </Text>
            {/* Botón de cerrar sesion */}
            <TouchableOpacity style={styles.modalButtonLogout} onPress={handleLogout}>
              <Text style={styles.modalButtonText}>Cerrar sesión</Text>
            </TouchableOpacity>
          </View>
        );
      default:
        return (
          <View style={styles.modalOptionsContainer}>

            {/* Botón de cambio de password */}
            <TouchableOpacity
              style={styles.modalOptionButton}
              onPress={() => setActiveOption("password")}
            >
              <Text style={styles.modalOptionText}>Cambiar Contraseña</Text>
            </TouchableOpacity>

            {/* Botón de eliminar la cuenta */}
            <TouchableOpacity
              style={styles.modalOptionButton}
              onPress={() => setActiveOption("delete")}
            >
              <Text style={[styles.modalOptionText, { color: "red" }]}>
                Eliminar Cuenta
              </Text>
            </TouchableOpacity>

            {/* Botón de cerrar sesion */}
            <TouchableOpacity
              style={styles.modalOptionButton}
              onPress={() => setActiveOption("logout")}
            >
              <Text style={styles.modalOptionText}>Cerrar Sesión</Text>
            </TouchableOpacity>
          </View>
        );
    }
  };

  return (
    <View style={styles.container}>

      {/* Botón de ajustes */}
      <TouchableOpacity
        style={styles.settingsButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.settingsButtonText}>⚙️</Text>
      </TouchableOpacity>

      {/* Vista de todo el modal */}
      <Modal
        visible={modalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        {/* Containner de todo el modal */}
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            {/* Titulo de la vista */}
            <Text style={styles.modalTitle}>Gestión de Cuenta</Text>

            {/* Contenido de todo el modal */}
            {renderModalContent()}

            {/* Botón de cerrar/ocultar el modal */}
            <TouchableOpacity
              style={styles.modalButtonClose}
              onPress={closeAndResetModal}
            >
              <Text style={styles.modalButtonText}>Cerrar</Text>
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
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "#ddd",
    borderRadius: 20,
    padding: 10,
  },
  settingsButtonText: {
    fontSize: 18,
  },

  modalBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContainer: {
    width: "80%",
    backgroundColor: "#FFE5B4",
    borderRadius: 10,
    padding: "10%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },

  modalOptionsContainer: {
    width: "100%",
    marginVertical: 10,
    alignItems: "center",
  },
  modalOptionButton: {
    width: "100%",
    padding: 15,
    marginVertical: 5,
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
    alignItems: "center",
  },
  modalOptionText: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  modalContent: {
    marginVertical: 20,
    width: "100%",
  },
  modalSubtitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: '10%',
  },
  modalInput: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  modalCheckboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  modalCheckboxLabel: {
    marginLeft: 10,
    fontSize: 14,
  },
  modalErrorText: {
    color: "red",
    fontSize: 12,
    marginBottom: 10,
  },


  modalButtonPassword: {
    backgroundColor: "#007BFF",
    width: "100%",
    height: '20%',
    marginBottom: '10%',
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
  },
  modalButtonDanger: {
    backgroundColor: "red",
    width: "100%",
    height: '30%',
    marginBottom: '40%',
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
  },
  modalButtonLogout: {
    backgroundColor: "orange",
    width: "100%",
    height: '30%',
    marginBottom: '40%',
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
  },
  modalButtonClose: {
    width: "100%",
    height: '14%',
    backgroundColor: "brown",
    borderRadius: 5,
    marginBottom: '3%',
    justifyContent: "center",
    alignItems: "center",
  },

  modalButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  disabledButton: {
    backgroundColor: "#d3d3d3", // Color gris cuando está deshabilitado
  },
});

export default ManageAccount;
