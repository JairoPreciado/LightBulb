"use client"

import { useState } from "react"
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  StatusBar,
} from "react-native"
import Checkbox from "expo-checkbox"
import { useRouter } from "expo-router"
import { signInWithEmailAndPassword } from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"
import { auth, db } from "../../firebaseConfiguration"
import { Lock, Mail, ArrowRight } from "lucide-react-native"

const LoginScreen = () => {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  // Validación de correo
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

  //dominios validos
  const validDomains = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "ucol.mx"]

  // Verifica si el dominio del correo es válido
  const isDomainValid = (email: string) => {
    if (!email.includes("@")) return false
    const domain = email.split("@")[1]
    return validDomains.includes(domain)
  }

  // Verifica si el correo tiene un formato y dominio válidos
  const isEmailValid = email ? emailRegex.test(email) && isDomainValid(email) : false
  // Verifica si la contraseña tiene la extension necesaria
  const isPasswordValid = password.length > 7
  // Verifica si el formulario tiene la informacion necesaria o completa
  const isFormValid = email && password && isEmailValid && isPasswordValid

  // Funcion para accionar la sesion
  const handleLogin = async () => {
    try {
      // Inicia sesión con Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // Obtiene el nombre del usuario desde Firestore
      const userDocRef = doc(db, "BD", user.uid)
      const userDoc = await getDoc(userDocRef)

      // Mensaje de bienvenida en consecuencia al nombre con el que se registro el usuario
      if (userDoc.exists()) {
        const userData = userDoc.data()
        const userName = userData?.name || "Usuario"

        Alert.alert("Éxito", `¡Bienvenido, ${userName}!`)
        router.push("../controlLightBulb/home") // Cambia a la vista principal después del inicio de sesión
      } else {
        Alert.alert("Error", "No se encontró información del usuario. Inténtalo nuevamente.")
      }
    } catch (error) {
      console.error("Error al iniciar sesión:", error)
      Alert.alert("Error", "Correo o contraseña incorrectos.")
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <StatusBar barStyle="dark-content" />
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.container}>
            {/* Logo o Icono */}
            <View style={styles.logoContainer}>
              <Lock size={40} color="#007BFF" style={styles.logoIcon} />
            </View>

            {/* Titulo de la vista */}
            <Text style={styles.title}>Control Particle</Text>
            <Text style={styles.subtitle}>Inicia sesión para continuar</Text>

            {/* Input para ingresar el correo */}
            <View style={styles.inputContainer}>
              <Mail size={20} color="#64748b" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Correo electrónico"
                placeholderTextColor="#64748b"
                value={email}
                onChangeText={setEmail}
                maxLength={50}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            {email && !isEmailValid && <Text style={styles.errorText}>El correo no es válido.</Text>}

            {/* Input para ingresar la contraseña */}
            <View style={styles.inputContainer}>
              <Lock size={20} color="#64748b" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Contraseña"
                placeholderTextColor="#64748b"
                secureTextEntry={!showPassword}
                value={password}
                maxLength={16}
                onChangeText={setPassword}
                autoCapitalize="none"
              />
            </View>

            {/* Checkbox para ver o ocultar la contraseña */}
            <View style={styles.checkboxContainer}>
              <Checkbox
                value={showPassword}
                onValueChange={setShowPassword}
                color={showPassword ? "#007BFF" : undefined}
                style={styles.checkbox}
              />
              <Text style={styles.checkboxLabel}>Mostrar Contraseña</Text>
            </View>

            {/* Botón para mandar las credenciales a verificar para iniciar sesion */}
            <TouchableOpacity
              style={[styles.primaryButton, !isFormValid && styles.primaryDisabledButton]}
              onPress={handleLogin}
              disabled={!isFormValid}
            >
              <Text style={styles.primaryButtonText}>Iniciar Sesión</Text>
              <ArrowRight size={20} color="#FFFFFF" />
            </TouchableOpacity>

            {/* Botón para recuperar contraseña */}
            <TouchableOpacity style={styles.recoveryButton} onPress={() => router.push("../recovery/recoveryPassword")}>
              <Text style={styles.recoveryText}>¿Olvidaste tu contraseña?</Text>
            </TouchableOpacity>

            {/* Separador */}
            <View style={styles.separator}>
              <View style={styles.separatorLine} />
              <Text style={styles.separatorText}>O</Text>
              <View style={styles.separatorLine} />
            </View>

            {/* Botón para crear una cuenta o registrar una */}
            <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push("/register/step1")}>
              <Text style={styles.secondaryButtonText}>Crear Cuenta Nueva</Text>
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
// aqui esta el coso para hacer lo demas responsive /// pendiente <-- revisa esta vaina que ta to wena
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
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(0, 123, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: responsiveSize(4),
  },
  logoIcon: {
    backgroundColor: "transparent",
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
    marginBottom: responsiveSize(4),
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
  recoveryButton: {
    marginBottom: responsiveSize(5),
  },
  recoveryText: {
    color: "#007BFF",
    fontSize: normalizeFont(14),
    textDecorationLine: "underline",
  },
  separator: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: responsiveSize(5),
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
  secondaryButton: {
    width: "100%",
    height: Math.max(50, responsiveSize(12)),
    borderWidth: 1,
    borderColor: "rgba(0, 123, 255, 0.5)",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 123, 255, 0.1)",
  },
  secondaryButtonText: {
    color: "#007BFF",
    fontSize: normalizeFont(16),
    fontWeight: "600",
  },
})

export default LoginScreen

