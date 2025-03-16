"use client"

import { useState } from "react"
import { View, Text, TextInput, Alert, TouchableOpacity, StyleSheet, ScrollView } from "react-native"
import { auth, db } from "../../../firebaseConfiguration"
import { doc, setDoc } from "firebase/firestore"
import { useRouter } from "expo-router"
import Checkbox from "expo-checkbox"
import { Key, Database } from "lucide-react-native"
import Navbar from "../../components/navbar"
import BottomNavbar from "../../components/bottom-navbar"
import SettingsModal from "../settings-modal"

const AddDevice = () => {
  const router = useRouter()
  const [photonId, setPhotonId] = useState("")
  const [distinctName, setDistinctName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [apiKey, setApiKey] = useState("")
  const [isGeneratingKey, setIsGeneratingKey] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)

  // Validaciones
  const isPhotonIdValid = photonId.length === 24 && /^[0-9A-F]+$/.test(photonId)
  const isEmailValid = email.includes("@")
  const isPasswordValid = password.length > 0
  const isDistinctNameValid = distinctName.trim().length > 0

  const handleSettingsPress = () => {
    setModalVisible(true)
  }

  // Generar clave de acceso sin expiración (se usará Never por defecto)
  const handleGenerateApiKey = async () => {
    if (!isEmailValid || !isPasswordValid) {
      Alert.alert("Error", "Por favor ingresa un correo y contraseña válidos.")
      return
    }

    setIsGeneratingKey(true)
    try {
      const requestBody = `username=${encodeURIComponent(email)}&password=${encodeURIComponent(
        password,
      )}&grant_type=password&client_id=particle&client_secret=particle`

      const response = await fetch("https://api.particle.io/oauth/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: requestBody,
      })

      const data = await response.json()

      if (response.ok) {
        setApiKey(data.access_token)
        Alert.alert("Éxito", "Clave generada correctamente.")
      } else {
        Alert.alert("Error", `No se pudo generar la clave: ${data.error_description}`)
      }
    } catch (error) {
      Alert.alert("Error", "Ocurrió un error al generar la clave.")
    } finally {
      setIsGeneratingKey(false)
    }
  }

  // Guardar en la base de datos (incluyendo la expiración)
  const handleSaveToDatabase = async () => {
    if (!isPhotonIdValid) {
      Alert.alert("Error", "El ID del Photon debe tener 24 caracteres hexadecimales.")
      return
    }

    if (!isDistinctNameValid) {
      Alert.alert("Error", "Por favor ingresa un nombre distintivo para el dispositivo.")
      return
    }

    if (!apiKey) {
      Alert.alert("Error", "Por favor genera una clave API primero.")
      return
    }

    try {
      const userId = auth.currentUser?.uid
      if (!userId) {
        Alert.alert("Error", "Usuario no autenticado.")
        return
      }

      // Estructura para el dispositivo
      const deviceData = {
        photonId: photonId,
        apikey: apiKey,
        name: distinctName,
        expiresAt: "Never", // Por defecto, sin expiración
        subdevices: {}, // Aquí puedes inicializar los subdispositivos, si los hay
      }

      await setDoc(doc(db, "BD", userId), { Devices: { [distinctName]: deviceData } }, { merge: true })

      Alert.alert("Éxito", "Dispositivo guardado correctamente.", [
        {
          text: "OK",
          onPress: () => {
            setPhotonId("")
            setApiKey("")
            setDistinctName("")
            setEmail("")
            setPassword("")
            router.push("../devices/listDevices")
          },
        },
      ])
    } catch (error: any) {
      if (error.code === "permission-denied") {
        Alert.alert("Error", "No tienes permisos para escribir en la base de datos.")
      } else {
        Alert.alert("Error", "No se pudieron guardar los datos.")
      }
    }
  }

  return (
    <View style={styles.container}>
      <Navbar title="Agregar Dispositivo" onSettingsPress={handleSettingsPress} />

      <SettingsModal isVisible={modalVisible} onClose={() => setModalVisible(false)} />

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Información del Dispositivo</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>ID del Photon</Text>
            <TextInput
              style={[styles.input, !isPhotonIdValid && photonId.length > 0 && styles.inputError]}
              placeholder="Ingresa el ID de 24 caracteres"
              value={photonId}
              onChangeText={(text) => setPhotonId(text.toUpperCase())}
              autoCapitalize="characters"
              maxLength={24}
            />
            {!isPhotonIdValid && photonId.length > 0 && (
              <Text style={styles.errorText}>El ID debe tener 24 caracteres hexadecimales (0-9, A-F).</Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nombre del Dispositivo</Text>
            <TextInput
              style={styles.input}
              placeholder="Nombre distintivo del dispositivo"
              value={distinctName}
              onChangeText={setDistinctName}
              maxLength={15}
            />
          </View>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Credenciales de Particle</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Correo Electrónico</Text>
            <TextInput
              style={[styles.input, !isEmailValid && email.length > 0 && styles.inputError]}
              placeholder="Correo asociado a Particle"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {!isEmailValid && email.length > 0 && (
              <Text style={styles.errorText}>Por favor, ingresa un correo válido.</Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Contraseña</Text>
            <TextInput
              style={styles.input}
              placeholder="Contraseña de Particle"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />

            <View style={styles.checkboxContainer}>
              <Checkbox
                value={showPassword}
                onValueChange={setShowPassword}
                color={showPassword ? "#007BFF" : undefined}
              />
              <Text style={styles.checkboxLabel}>Mostrar Contraseña</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.actionButton,
              (!isEmailValid || !isPasswordValid || isGeneratingKey) && styles.disabledButton,
            ]}
            onPress={handleGenerateApiKey}
            disabled={!isEmailValid || !isPasswordValid || isGeneratingKey}
          >
            <Key size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.actionButtonText}>{isGeneratingKey ? "Generando..." : "Generar Clave API"}</Text>
          </TouchableOpacity>
        </View>

        {apiKey && (
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Clave API Generada</Text>
            <TextInput style={[styles.input, styles.apiKeyInput]} value={apiKey} editable={false} multiline />

            <TouchableOpacity
              style={[styles.saveButton, (!isPhotonIdValid || !isDistinctNameValid) && styles.disabledButton]}
              onPress={handleSaveToDatabase}
              disabled={!isPhotonIdValid || !isDistinctNameValid}
            >
              <Database size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.actionButtonText}>Guardar en Base de Datos</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Barra de navegación inferior */}
      <BottomNavbar />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  formSection: {
    backgroundColor: "#ffffff",
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#333",
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
    color: "#555",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#fff",
    fontSize: 15,
  },
  inputError: {
    borderColor: "#F44336",
  },
  errorText: {
    color: "#F44336",
    fontSize: 12,
    marginTop: 4,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  checkboxLabel: {
    marginLeft: 8,
    fontSize: 14,
    color: "#555",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#007BFF",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  apiKeyInput: {
    backgroundColor: "#f9f9f9",
    marginBottom: 16,
    minHeight: 80,
    textAlignVertical: "top",
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4CAF50",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  disabledButton: {
    backgroundColor: "#cccccc",
  },
})

export default AddDevice

