"use client"

import { useState } from "react"
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  StatusBar,
  ActivityIndicator,
} from "react-native"
import Checkbox from "expo-checkbox"
import { useRouter, useLocalSearchParams } from "expo-router"
import { createUserWithEmailAndPassword } from "firebase/auth"
import { setDoc, doc } from "firebase/firestore"
import { auth, db } from "../../firebaseConfiguration" // Ajusta la ruta según tu estructura
import { User, Lock, ArrowLeft, CheckCircle } from "lucide-react-native"

const RegisterStep2 = () => {
  const router = useRouter()
  const params = useLocalSearchParams()
  const email = Array.isArray(params.email) ? params.email[0] : params.email // Asegúrate de que sea una cadena
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [name, setName] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Verifica que la contraseña sea valida
  const isPasswordValid = password.length >= 8 && password.length <= 16
  // Verifica que la contraseña sea valida y se confirme como tal
  const isConfirmPasswordValid = confirmPassword === password && password.length > 0
  // Verifica que el nombre sea valido
  const isNameValid = name.trim().length > 0 // El nombre no puede estar vacío
  // Verifica que el formulario tenga la informacion necesaria
  const isFormValid = isPasswordValid && isConfirmPasswordValid && isNameValid

  // Funcion para ingresar datos de la cuenta a la BD
  const handleCreateAccount = async () => {
    setIsLoading(true)
    try {
      if (!email || typeof email !== "string") {
        throw new Error("Correo inválido")
      }

      if (!isConfirmPasswordValid) {
        Alert.alert("Error", "Las contraseñas no coinciden.")
        setIsLoading(false)
        return
      }

      // Crea la cuenta del usuario
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // Guarda los datos en Firestore
      await setDoc(doc(db, "BD", user.uid), {
        email,
        name,
      })

      Alert.alert("Éxito", "Cuenta creada exitosamente.")
      router.push("/loginn/login")
    } catch (error) {
      console.error("Error creando la cuenta:", error)
      Alert.alert("Error", "No se pudo crear la cuenta. Inténtalo de nuevo.")
    }
    setIsLoading(false)
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <StatusBar barStyle="dark-content" />
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.container}>
            {/* Titulo de la vista */}
            <Text style={styles.title}>Registro: Paso 2</Text>
            <Text style={styles.subtitle}>Completa tu información personal</Text>

            {/* Email verificado */}
            <View style={styles.verifiedEmailContainer}>
              <CheckCircle size={20} color="#10B981" style={styles.verifiedIcon} />
              <Text style={styles.verifiedEmailText}>{email}</Text>
            </View>

            {/* Input de Nombre */}
            <View style={styles.inputContainer}>
              <User size={20} color="#64748b" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Nombre"
                placeholderTextColor="#64748b"
                value={name}
                onChangeText={setName}
                maxLength={16}
              />
            </View>
            {!isNameValid && name.length > 0 && <Text style={styles.errorText}>El nombre no puede estar vacío.</Text>}

            {/* Input de Contraseña */}
            <View style={styles.inputContainer}>
              <Lock size={20} color="#64748b" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Contraseña"
                placeholderTextColor="#64748b"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                maxLength={16}
                autoCapitalize="none"
              />
            </View>
            {!isPasswordValid && password.length > 0 && (
              <Text style={styles.errorText}>La contraseña debe tener entre 8 y 16 caracteres.</Text>
            )}

            {/* Input de Confirmar Contraseña */}
            <View style={styles.inputContainer}>
              <Lock size={20} color="#64748b" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Confirmar Contraseña"
                placeholderTextColor="#64748b"
                secureTextEntry={!showPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                maxLength={16}
                autoCapitalize="none"
              />
            </View>
            {!isConfirmPasswordValid && confirmPassword.length > 0 && (
              <Text style={styles.errorText}>Las contraseñas no coinciden.</Text>
            )}

            {/* Checkbox de mostrar u ocultar contraseña */}
            <View style={styles.checkboxContainer}>
              <Checkbox
                value={showPassword}
                onValueChange={setShowPassword}
                color={showPassword ? "#007BFF" : undefined}
                style={styles.checkbox}
              />
              <Text style={styles.checkboxLabel}>Mostrar Contraseña</Text>
            </View>

            {/* Botón Crear Cuenta */}
            <TouchableOpacity
              style={[styles.primaryButton, !isFormValid && styles.primaryDisabledButton]}
              onPress={handleCreateAccount}
              disabled={!isFormValid || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.primaryButtonText}>Crear Cuenta</Text>
              )}
            </TouchableOpacity>

            {/* Botón de regresar */}
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <ArrowLeft size={20} color="#007BFF" />
              <Text style={styles.backButtonText}>Volver al paso anterior</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
    </KeyboardAvoidingView>
  )
}

//responsive design -----------------------------------------------------------------------------------------

const { width, height } = Dimensions.get("window")
const scale = Math.min(width, height) / 375 // Base scale on a 375pt width (iPhone standard)
// Función para hacer responsive los tamaños de texto basado en el ancho de la pantalla
const normalizeFont = (size: number) => {
  return Math.round(size * scale)
}
// Función para hacer responsive los espaciados basados en el porcentaje del ancho de pantalla
const responsiveSize = (percentage: number) => {
  return width * (percentage / 100)
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: responsiveSize(5),
    paddingVertical: responsiveSize(10),
  },
  title: {
    fontSize: normalizeFont(28),
    fontWeight: "bold",
    marginBottom: responsiveSize(1),
    textAlign: "center",
    color: "#0f172a",
  },
  subtitle: {
    fontSize: normalizeFont(16),
    marginBottom: responsiveSize(4),
    textAlign: "center",
    color: "#64748b",
  },
  verifiedEmailContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    borderRadius: 12,
    padding: responsiveSize(3),
    marginBottom: responsiveSize(4),
    width: "100%",
  },
  verifiedIcon: {
    marginRight: 10,
  },
  verifiedEmailText: {
    color: "#10B981",
    fontSize: normalizeFont(14),
    fontWeight: "500",
  },
  inputContainer: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: responsiveSize(3),
    marginBottom: responsiveSize(3),
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: responsiveSize(3),
    fontSize: normalizeFont(16),
    color: "#0f172a",
  },
  errorText: {
    color: "#ef4444",
    fontSize: normalizeFont(12),
    marginBottom: responsiveSize(2),
    width: "100%",
    paddingHorizontal: responsiveSize(1),
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: responsiveSize(5),
    width: "100%",
  },
  checkbox: {
    marginRight: 10,
    borderRadius: 4,
  },
  checkboxLabel: {
    fontSize: normalizeFont(14),
    color: "#64748b",
  },
  primaryButton: {
    width: "100%",
    height: Math.max(50, responsiveSize(12)),
    backgroundColor: "#007BFF",
    borderRadius: 12,
    marginBottom: responsiveSize(3),
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#007BFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: normalizeFont(16),
    fontWeight: "bold",
  },
  primaryDisabledButton: {
    backgroundColor: "rgba(0, 123, 255, 0.5)",
    shadowOpacity: 0,
    elevation: 0,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: responsiveSize(2),
  },
  backButtonText: {
    color: "#007BFF",
    fontSize: normalizeFont(16),
    marginLeft: 8,
  },
})

export default RegisterStep2

