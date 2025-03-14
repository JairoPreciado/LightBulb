"use client"

import { useState } from "react"
import { View, Text, TextInput, StyleSheet, Alert, Modal, TouchableOpacity, Dimensions } from "react-native"
import Checkbox from "expo-checkbox"
import { useRouter } from "expo-router"
import { auth, db } from "../../firebaseConfiguration"
import { updatePassword, deleteUser, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth"
import { doc, deleteDoc } from "firebase/firestore"
import { X, Key, UserX, LogOut } from "lucide-react-native"

interface SettingsModalProps {
  isVisible: boolean
  onClose: () => void
}

const SettingsModal = ({ isVisible, onClose }: SettingsModalProps) => {
  const [activeOption, setActiveOption] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [showPasswords, setShowPasswords] = useState(false)
  const router = useRouter()

  // Verifica que la contraseña sea valida
  const isPasswordValid = newPassword.length >= 8 && newPassword.length <= 16

  // Funcion para modificar la contraseña(actualizar contraseña)
  const handleUpdatePassword = async () => {
    try {
      const user = auth.currentUser
      if (!user || !user.email) {
        Alert.alert("Error", "No se pudo obtener el correo del usuario.")
        return
      }
      const credential = EmailAuthProvider.credential(user.email, currentPassword)
      await reauthenticateWithCredential(user, credential)
      await updatePassword(user, newPassword)

      setCurrentPassword("")
      setNewPassword("")
      Alert.alert("Éxito", "Contraseña actualizada correctamente.")
    } catch (error) {
      console.error("Error al actualizar la contraseña:", error)
      Alert.alert("Error", "La contraseña actual no es correcta.")
    }
  }

  // Funcion para eliminar la cuenta
  const handleDeleteAccount = async () => {
    try {
      const user = auth.currentUser
      if (user) {
        await deleteDoc(doc(db, "BD", user.uid))
        await deleteUser(user)
        Alert.alert("Éxito", "Cuenta eliminada correctamente.")
        router.replace("/loginn/login")
      }
    } catch (error) {
      console.error("Error al eliminar la cuenta:", error)
      Alert.alert("Error", "No se pudo eliminar la cuenta.")
    }
  }

  // Funcion para cerrar sesion
  const handleLogout = () => {
    auth.signOut()
    Alert.alert("Cierre de Sesión", "Sesión cerrada correctamente.")
    router.replace("/loginn/login")
  }

  // Función para cerrar el modal y reiniciar todos los estados
  const closeAndResetModal = () => {
    if (typeof onClose === "function") {
      onClose()
    }
    setActiveOption("")
    setCurrentPassword("")
    setNewPassword("")
    setShowPasswords(false)
  }

  // Renderizado del modal de settings
  const renderModalContent = () => {
    switch (activeOption) {
      case "password":
        return (
          <View style={styles.modalContent}>
            <Text style={styles.modalSubtitle}>Cambiar Contraseña</Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Contraseña Actual"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry={!showPasswords}
              maxLength={16}
            />

            <TextInput
              style={styles.modalInput}
              placeholder="Nueva Contraseña"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry={!showPasswords}
              maxLength={16}
            />
            {!isPasswordValid && newPassword.length > 0 && (
              <Text style={styles.modalErrorText}>La nueva contraseña debe tener entre 8 y 16 caracteres.</Text>
            )}

            <View style={styles.modalCheckboxContainer}>
              <Checkbox
                value={showPasswords}
                onValueChange={setShowPasswords}
                color={showPasswords ? "#007BFF" : undefined}
              />
              <Text style={styles.modalCheckboxLabel}>Mostrar Contraseñas</Text>
            </View>

            <TouchableOpacity
              style={[styles.modalButtonPassword, !isPasswordValid && styles.disabledButton]}
              onPress={handleUpdatePassword}
              disabled={!isPasswordValid || !currentPassword}
            >
              <Text style={styles.modalButtonText}>Actualizar contraseña</Text>
            </TouchableOpacity>
          </View>
        )
      case "delete":
        return (
          <View style={styles.modalContent}>
            <Text style={[styles.modalSubtitle, { color: "red" }]}>Eliminar Cuenta</Text>

            <TouchableOpacity
              style={styles.modalButtonDanger}
              onPress={() =>
                Alert.alert("Confirmar", "¿Estás seguro de que deseas eliminar tu cuenta?", [
                  { text: "Cancelar", style: "cancel" },
                  { text: "Eliminar", style: "destructive", onPress: handleDeleteAccount },
                ])
              }
            >
              <Text style={styles.modalButtonText}>Eliminar cuenta</Text>
            </TouchableOpacity>
          </View>
        )
      case "logout":
        return (
          <View style={styles.modalContent}>
            <Text style={[styles.modalSubtitle, { color: "orange" }]}>Cerrar sesión</Text>
            <TouchableOpacity style={styles.modalButtonLogout} onPress={handleLogout}>
              <Text style={styles.modalButtonText}>Cerrar sesión</Text>
            </TouchableOpacity>
          </View>
        )
      default:
        return (
          <View style={styles.modalOptionsContainer}>
            <TouchableOpacity style={styles.modalOptionButton} onPress={() => setActiveOption("password")}>
              <Key size={20} color="#333" style={styles.optionIcon} />
              <Text style={styles.modalOptionText}>Cambiar Contraseña</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalOptionButton} onPress={() => setActiveOption("delete")}>
              <UserX size={20} color="red" style={styles.optionIcon} />
              <Text style={[styles.modalOptionText, { color: "red" }]}>Eliminar Cuenta</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalOptionButton} onPress={() => setActiveOption("logout")}>
              <LogOut size={20} color="#FF8C00" style={styles.optionIcon} />
              <Text style={[styles.modalOptionText, { color: "#FF8C00" }]}>Cerrar Sesión</Text>
            </TouchableOpacity>
          </View>
        )
    }
  }

  return (
    <Modal visible={isVisible} animationType="fade" transparent onRequestClose={closeAndResetModal}>
      <View style={styles.modalBackground}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Gestión de Cuenta</Text>
            <TouchableOpacity onPress={closeAndResetModal} style={styles.closeButton}>
              <X size={20} color="#333" />
            </TouchableOpacity>
          </View>

          {renderModalContent()}

          {activeOption !== "" && (
            <TouchableOpacity style={styles.backOptionButton} onPress={() => setActiveOption("")}>
              <Text style={styles.backOptionText}>Volver</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  )
}

const { width, height } = Dimensions.get("window")
// Calculate responsive size based on screen width
const responsiveSize = (size: number) => {
  return (width / 375) * size // 375 is used as base width (iPhone X)
}
// Calculate responsive height based on screen height
const responsiveHeight = (size: number) => {
  return (height / 812) * size // 812 is used as base height (iPhone X)
}

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContainer: {
    width: "85%",
    backgroundColor: "#FFFFFF",
    borderRadius: responsiveSize(12),
    padding: responsiveSize(20),
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: responsiveSize(10),
    elevation: 5,
    maxHeight: height * 0.8,
  },
  modalHeader: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: responsiveSize(15),
  },
  modalTitle: {
    fontSize: responsiveSize(20),
    fontWeight: "bold",
    color: "#333",
  },
  closeButton: {
    padding: 5,
  },
  modalOptionsContainer: {
    width: "100%",
    marginVertical: responsiveSize(10),
  },
  modalOptionButton: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    padding: responsiveSize(15),
    marginVertical: responsiveSize(5),
    backgroundColor: "#f5f5f5",
    borderRadius: responsiveSize(8),
  },
  optionIcon: {
    marginRight: 12,
  },
  modalOptionText: {
    fontSize: responsiveSize(16),
    fontWeight: "600",
  },
  modalContent: {
    marginVertical: responsiveSize(10),
    width: "100%",
  },
  modalSubtitle: {
    fontSize: responsiveSize(18),
    fontWeight: "bold",
    marginBottom: responsiveSize(15),
    color: "#333",
  },
  modalInput: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: responsiveSize(8),
    padding: responsiveSize(12),
    marginBottom: responsiveSize(10),
    backgroundColor: "#f9f9f9",
  },
  modalCheckboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: responsiveSize(15),
  },
  modalCheckboxLabel: {
    marginLeft: responsiveSize(10),
    fontSize: responsiveSize(14),
    color: "#555",
  },
  modalErrorText: {
    color: "red",
    fontSize: responsiveSize(12),
    marginBottom: responsiveSize(10),
  },
  modalButtonPassword: {
    backgroundColor: "#007BFF",
    width: "100%",
    height: responsiveHeight(45),
    marginBottom: responsiveSize(10),
    borderRadius: responsiveSize(8),
    justifyContent: "center",
    alignItems: "center",
  },
  modalButtonDanger: {
    backgroundColor: "red",
    width: "100%",
    height: responsiveHeight(45),
    marginBottom: responsiveSize(10),
    borderRadius: responsiveSize(8),
    justifyContent: "center",
    alignItems: "center",
  },
  modalButtonLogout: {
    backgroundColor: "#FF8C00",
    width: "100%",
    height: responsiveHeight(45),
    marginBottom: responsiveSize(10),
    borderRadius: responsiveSize(8),
    justifyContent: "center",
    alignItems: "center",
  },
  modalButtonText: {
    color: "#fff",
    fontSize: responsiveSize(16),
    fontWeight: "bold",
  },
  disabledButton: {
    backgroundColor: "#d3d3d3",
  },
  backOptionButton: {
    width: "100%",
    padding: responsiveSize(12),
    backgroundColor: "#f0f0f0",
    borderRadius: responsiveSize(8),
    alignItems: "center",
    marginTop: responsiveSize(5),
  },
  backOptionText: {
    fontSize: responsiveSize(14),
    color: "#555",
    fontWeight: "500",
  },
})

export default SettingsModal

