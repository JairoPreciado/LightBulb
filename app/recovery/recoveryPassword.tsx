"use client"

import { useState } from "react"
import {
  View,
  Text,
  TextInput,
  Alert,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  StatusBar,
  ActivityIndicator,
} from "react-native"
import { useRouter } from "expo-router"
import { getAuth, sendPasswordResetEmail } from "firebase/auth"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "../../firebaseConfiguration"
import { Mail, ArrowLeft, Send } from "lucide-react-native"

const RecoveryPassword = () => {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [isButtonDisabled, setIsButtonDisabled] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Expresión regular para validar correos electrónicos
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

  // Dominios válidos (agregado de LoginScreen)
  const validDomains = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "ucol.mx"]

  // Verifica si el dominio del correo es válido (agregado de LoginScreen)
  const isDomainValid = (email: string) => {
    if (!email.includes("@")) return false
    const domain = email.split("@")[1]
    return validDomains.includes(domain)
  }

  // Verifica si el correo tiene un formato y dominio válidos (modificado)
  const isEmailValid = email ? emailRegex.test(email) && isDomainValid(email) : false

  // Función para verificar si el correo existe en Firebase
  const checkEmailExists = async (email: string): Promise<boolean> => {
    try {
      const usersRef = collection(db, "BD") // Cambia 'BD' por tu colección
      const q = query(usersRef, where("email", "==", email))
      const querySnapshot = await getDocs(q)

      return !querySnapshot.empty // Devuelve true si el correo existe
    } catch (error) {
      console.error("Error verificando el correo:", error)
      Alert.alert("Error", "Hubo un problema verificando el correo. Intenta nuevamente.")
      return false
    }
  }

  // Función para enviar el correo de recuperación
  const handleSendPasswordReset = async () => {
    setIsButtonDisabled(true) // Deshabilitar el botón mientras se verifica el correo
    setIsLoading(true)

    try {
      const emailExists = await checkEmailExists(email) // Validar si el correo existe
      if (!emailExists) {
        Alert.alert("Error", "El correo ingresado no está registrado.")
        setIsButtonDisabled(false)
        setIsLoading(false)
        return
      }

      const auth = getAuth() // Instancia de Firebase Auth

      // Enviar correo de recuperación de contraseña
      await sendPasswordResetEmail(auth, email)
      Alert.alert("Éxito", "Correo de recuperación enviado. Revisa tu bandeja de entrada.")
    } catch (error) {
      console.error("Error al enviar el correo de recuperación:", error)
      Alert.alert("Error", "No se pudo enviar el correo. Intenta nuevamente.")
    }

    setIsLoading(false)
    // Reactivar el botón después de 10 segundos
    setTimeout(() => setIsButtonDisabled(false), 10000)
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <StatusBar barStyle="dark-content" />
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.container}>
            {/* Título */}
            <Text style={styles.title}>Recuperación de Contraseña</Text>
            <Text style={styles.subtitle}>Ingresa tu correo electrónico para recibir instrucciones</Text>

            {/* Input de correo */}
            <View style={styles.inputContainer}>
              <Mail size={20} color="#64748b" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Correo Electrónico"
                placeholderTextColor="#64748b"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                maxLength={50}
                autoCapitalize="none"
              />
            </View>
            {email && !isEmailValid && <Text style={styles.errorText}>El correo no es válido.</Text>}

            {/* Botón de enviar correo */}
            <TouchableOpacity
              style={[styles.primaryButton, (!isEmailValid || isButtonDisabled) && styles.primaryDisabledButton]}
              onPress={handleSendPasswordReset}
              disabled={!isEmailValid || isButtonDisabled}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Text style={styles.primaryButtonText}>
                    {isButtonDisabled ? "Espera 10s..." : "Enviar Instrucciones"}
                  </Text>
                  <Send size={20} color="#FFFFFF" />
                </>
              )}
            </TouchableOpacity>

            {/* Botón de regreso */}
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <ArrowLeft size={20} color="#007BFF" />
              <Text style={styles.backButtonText}>Volver al inicio de sesión</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
    </KeyboardAvoidingView>
  )
}

//responsive design -----------------------------------------------------------------------------------------

const { width, height } = Dimensions.get("window")
const scale = Math.min(width, height) / 375
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
    marginBottom: responsiveSize(6),
    textAlign: "center",
    color: "#64748b",
    paddingHorizontal: responsiveSize(5),
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
  primaryButton: {
    width: "100%",
    height: Math.max(50, responsiveSize(12)),
    backgroundColor: "#007BFF",
    borderRadius: 12,
    marginBottom: responsiveSize(5),
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
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
    marginRight: 8,
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

export default RecoveryPassword

