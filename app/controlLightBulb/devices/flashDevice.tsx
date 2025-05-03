import { useLocalSearchParams } from "expo-router"
import { useState } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
} from "react-native"
import Navbar from "../../components/navbar"
import BottomNavbar from "../../components/bottom-navbar"
import SettingsModal from "../settings-modal"

export default function FlashDevice() {
  const { id, name, type, key, apikey } = useLocalSearchParams()
  const [code, setCode] = useState("")
  const [settingsModalVisible, setSettingsModalVisible] = useState(false)

  const handleLoadDefaultCode = () => {
    const defaultCode = `// Parpadeo en D7 cada 5 segundos void setup() {  pinMode(D7, OUTPUT); } void loop() {  digitalWrite(D7, HIGH);  delay(5000);  digitalWrite(D7, LOW);  delay(5000);}`;
    setCode(defaultCode);
  };
  
  const handleFlash = async () => {
    try {
      const response = await fetch("https://serverparticlecontrol.onrender.com/api/flashFromCode", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sourceCode: code,
          deviceID: id,
          accessToken: apikey,
        }),
      });
  
      const result = await response.json();
  
      if (!response.ok) {
        console.error("Error del servidor:", result.error);
        alert("Error al flashear: " + result.error);
        return;
      }
  
      alert("Código flasheado correctamente ✅");
      console.log("Respuesta:", result);
    } catch (error) {
      console.error("Error en la petición:", error);
      alert("Error al intentar flashear el dispositivo.");
    }
  };
  

  const handleSettingsPress = () => {
    setSettingsModalVisible(true)
  }

  return (
    <View style={styles.container}>
      {/* Navbar superior */}
      <Navbar title="Flasheo de dispositivo" onSettingsPress={handleSettingsPress} />

      {/* Modal de configuración */}
      <SettingsModal
        isVisible={settingsModalVisible}
        onClose={() => setSettingsModalVisible(false)}
      />

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.label}>Nombre: {name}</Text>
        <Text style={styles.label}>ID: {id}</Text>
        <Text style={styles.label}>Tipo: {type}</Text>
        <Text style={styles.label}>Access Token: {String(apikey)}</Text>
 {/* <--- ESTA LÍNEA NUEVA */}

        <Text style={styles.subheading}>Código a flashear</Text>
        <TextInput
          style={styles.editor}
          multiline
          textAlignVertical="top"
          placeholder="Escribe aquí tu código..."
          value={code}
          onChangeText={setCode}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.button} onPress={handleLoadDefaultCode}>
            <Text style={styles.buttonText}>Código por defecto</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.flashButton]} onPress={handleFlash}>
            <Text style={styles.buttonText}>Flashear</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Navbar inferior */}
      <BottomNavbar storedApiKey={apikey as string} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    padding: 20,
    flexGrow: 1,
  },
  label: {
    fontSize: 16,
    color: "#444",
    marginBottom: 2,
  },
  subheading: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 20,
    marginBottom: 8,
  },
  editor: {
    height: 250,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontFamily: "monospace",
    fontSize: 14,
    backgroundColor: "#f8f8f8",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  button: {
    flex: 1,
    backgroundColor: "#007BFF",
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  flashButton: {
    backgroundColor: "#28a745",
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "600",
  },
})
