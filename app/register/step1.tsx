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
import { useRouter } from "expo-router"
import { collection, query, where, getDocs } from "firebase/firestore" // Firebase Firestore
import { db } from "../../firebaseConfiguration" // Ajusta la ruta según tu estructura
import { Mail, ArrowLeft, ArrowRight, CheckCircle } from "lucide-react-native"

const RegisterStep1 = () => {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [inputCode, setInputCode] = useState("")
  const [codeSent, setCodeSent] = useState(false)
  const [verificationCode, setVerificationCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Expresión regular mejorada para validar correos electrónicos
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

  // Dominios comunes válidos (puedes agregar más si lo deseas)
  const validDomains = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "ucol.mx"]

  // Verifica si el dominio del correo es válido
  const isDomainValid = (email: string) => {
    if (!email.includes("@")) return false
    const domain = email.split("@")[1]
    return validDomains.includes(domain)
  }

  // Verifica si el correo tiene un formato y dominio válidos
  const isEmailValid = email ? emailRegex.test(email) && isDomainValid(email) : false

  // Función para verificar si el correo ya está registrado
  const checkEmailExists = async (email: string) => {
    try {
      const usersRef = collection(db, "BD") // Colección donde guardas usuarios
      const q = query(usersRef, where("email", "==", email))
      const querySnapshot = await getDocs(q)

      return !querySnapshot.empty // Devuelve true si el correo ya existe
    } catch (error) {
      console.error("Error verificando el correo:", error)
      Alert.alert("Error", "Ocurrió un problema verificando el correo.")
      return false
    }
  }

  // Función para enviar el correo
  const sendVerificationEmail = async (email: string, code: string) => {
    try {
      const response = await fetch("https://server-lightbulb-five.vercel.app/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, code }),
      })

      if (response.ok) {
        Alert.alert("Éxito", "Código de verificación enviado. Revisa tu bandeja de entrada.")
      } else {
        const errorResponse = await response.text()
        console.error("Error en la respuesta:", errorResponse)
        throw new Error("Error al enviar el correo")
      }
    } catch (error) {
      console.error("Error al enviar el correo:", error)
      Alert.alert("Error", "No se pudo enviar el correo. Intenta nuevamente.")
    }
  }

  // Manejar envío del código
  const handleSendCode = async () => {
    setIsLoading(true)
    try {
      const emailExists = await checkEmailExists(email)
      if (emailExists) {
        Alert.alert("Error", "Este correo ya está asociado a una cuenta. Usa otro correo.")
        setIsLoading(false)
        return
      }

      const generatedCode = Math.floor(100000 + Math.random() * 900000).toString() // Código de 6 dígitos
      setVerificationCode(generatedCode)
      setCodeSent(true)

      await sendVerificationEmail(email, generatedCode) // Enviar el correo
    } catch (error) {
      console.error("Error al enviar el código:", error)
      Alert.alert("Error", "No se pudo enviar el código. Intenta nuevamente.")
    }
    setIsLoading(false)
  }

  // Verificar el código ingresado
  const handleVerifyCode = () => {
    if (inputCode === verificationCode) {
      Alert.alert("Éxito", "Correo verificado!")
      router.push({
        pathname: "./step2",
        params: { email }, // Pasa directamente los parámetros
      })
    } else {
      Alert.alert("Error", "El código ingresado es incorrecto.")
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <StatusBar barStyle="dark-content" />
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.container}>
            {/* Titulo */}
            <Text style={styles.title}>Registro: Paso 1</Text>
            <Text style={styles.subtitle}>Verifica tu correo electrónico</Text>

            {/* Input de Correo electronico */}
            <View style={styles.inputContainer}>
              <Mail size={20} color="#64748b" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Correo Electrónico"
                placeholderTextColor="#64748b"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                maxLength={50}
                autoCapitalize="none"
              />
            </View>
            {email && !isEmailValid && <Text style={styles.errorText}>El correo no es válido.</Text>}

            {/* Botón de enviar codigo al correo */}
            <TouchableOpacity
              style={[styles.primaryButton, !isEmailValid && styles.primaryDisabledButton]}
              onPress={handleSendCode}
              disabled={!isEmailValid || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Text style={styles.primaryButtonText}>Enviar Código</Text>
                  <ArrowRight size={20} color="#FFFFFF" />
                </>
              )}
            </TouchableOpacity>

            {/* Separador */}
            {codeSent && (
              <View style={styles.separator}>
                <View style={styles.separatorLine} />
                <Text style={styles.separatorText}>Código Enviado</Text>
                <View style={styles.separatorLine} />
              </View>
            )}

            {/* Input de Codigo de verificacion */}
            {codeSent && (
              <>
                <View style={[styles.inputContainer, !codeSent && styles.disabledInput]}>
                  <CheckCircle size={20} color="#64748b" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Código de Verificación"
                    placeholderTextColor="#64748b"
                    keyboardType="numeric"
                    value={inputCode}
                    onChangeText={setInputCode}
                    editable={codeSent}
                    maxLength={6}
                  />
                </View>

                {/* Botón de verificar el correo */}
                <TouchableOpacity
                  style={[styles.primaryButton, (!codeSent || !inputCode) && styles.primaryDisabledButton]}
                  onPress={handleVerifyCode}
                  disabled={!codeSent || !inputCode}
                >
                  <Text style={styles.primaryButtonText}>Verificar Código</Text>
                  <ArrowRight size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </>
            )}

            {/* Botón de regresar */}
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
  disabledInput: {
    opacity: 0.5,
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
    marginBottom: responsiveSize(3),
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
  separator: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    marginVertical: responsiveSize(3),
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#e2e8f0",
  },
  separatorText: {
    color: "#64748b",
    paddingHorizontal: 10,
    fontSize: normalizeFont(14),
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: responsiveSize(5),
    padding: responsiveSize(2),
  },
  backButtonText: {
    color: "#007BFF",
    fontSize: normalizeFont(16),
    marginLeft: 8,
  },
})

export default RegisterStep1

