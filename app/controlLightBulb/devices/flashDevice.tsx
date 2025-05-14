import { useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import Navbar from "../../components/navbar";
import BottomNavbar from "../../components/bottom-navbar";
import SettingsModal from "../settings-modal";
import * as FileSystem from "expo-file-system";

type Params = {
  id?: string;
  name?: string;
  type?: string;
  platformId?: string;
  userToken?: string; // device-specific token passed from listDevices
};

export default function FlashDevice() {
  const params = useLocalSearchParams<Params>();
  // Parámetros recibidos desde listDevices.tsx
  const id = params.id ?? "";
  const name = params.name ?? "Desconocido";
  const type = params.type ?? "Desconocido";
  const platformId = params.platformId ?? "6";
  const userToken = params.userToken ?? "";

  const [code, setCode] = useState<string>("");
  const [status, setStatus] = useState<"idle" | "working">("idle");
  const [binaryUrl, setBinaryUrl] = useState<string>("");
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);

  // map friendly type → numeric platformId
  const platformMap: Record<string, number> = {
    Photon: 6,
    "Photon 2": 32,
    Electron: 10,
    Argon: 12,
    Boron: 13,
  };
  const pid = Number(platformId) || platformMap[type] || 6;

  const handleLoadDefaultCode = () => {
    setCode(
`#include "Particle.h"
#include "ArduinoJson.h"

// Configuración de pines
const int pinRelevadorD0 = D0;
const int pinRelevadorD1 = D1;
const int pinRelevadorD2 = D2;
const int pinRelevadorD3 = D3;
const int pinRelevadorD4 = D4;
const int pinRelevadorD5 = D5;
const int pinRelevadorD6 = D6;
const int pinRelevadorD7 = D7;

// Variables de estado
bool estadoD0 = false;
bool estadoD1 = false;
bool estadoD2 = false;
bool estadoD3 = false;
bool estadoD4 = false;
bool estadoD5 = false;
bool estadoD6 = false;
bool estadoD7 = false;

// Horarios dinámicos
StaticJsonDocument<4048> horarios;

// Declaración de funciones
void procesarHorarios();
void verificarHorario(int currentHour, int currentMinute, const char* onTime, const char* offTime, bool &estado, int pin);
int actualizarHorarios(String command);
int cambiarEstadoD0(String command);
int cambiarEstadoD1(String command);
int cambiarEstadoD2(String command);
int cambiarEstadoD3(String command);
int cambiarEstadoD4(String command);
int cambiarEstadoD5(String command);
int cambiarEstadoD6(String command);
int cambiarEstadoD7(String command);
int obtenerPin(const char* deviceKey);
bool* obtenerEstado(const char* deviceKey);
int convertirMinutos(const char* time);
int cambiarEstado(String command, int pin, bool &estado);
void setup() {
    Time.zone(-6);

    // Configuración de pines
    pinMode(pinRelevadorD0, OUTPUT);
    pinMode(pinRelevadorD1, OUTPUT);
    pinMode(pinRelevadorD2, OUTPUT);
    pinMode(pinRelevadorD3, OUTPUT);
    pinMode(pinRelevadorD4, OUTPUT);
    pinMode(pinRelevadorD5, OUTPUT);
    pinMode(pinRelevadorD6, OUTPUT);
    pinMode(pinRelevadorD7, OUTPUT);

    digitalWrite(pinRelevadorD0, HIGH);
    digitalWrite(pinRelevadorD1, HIGH);
    digitalWrite(pinRelevadorD2, HIGH);
    digitalWrite(pinRelevadorD3, HIGH);
    digitalWrite(pinRelevadorD4, HIGH);
    digitalWrite(pinRelevadorD5, HIGH);
    digitalWrite(pinRelevadorD6, HIGH);
    digitalWrite(pinRelevadorD7, HIGH);

    Serial.begin(9600);
    while (!Serial) {}

    Serial.println("Iniciando...");

    // Registrar funciones de nube
    Particle.function("actualizarHorarios", actualizarHorarios);
    Particle.function("cambiarEstadoD0", cambiarEstadoD0);
    Particle.function("cambiarEstadoD1", cambiarEstadoD1);
    Particle.function("cambiarEstadoD2", cambiarEstadoD2);
    Particle.function("cambiarEstadoD3", cambiarEstadoD3);
    Particle.function("cambiarEstadoD4", cambiarEstadoD4);
    Particle.function("cambiarEstadoD5", cambiarEstadoD5);
    Particle.function("cambiarEstadoD6", cambiarEstadoD6);
    Particle.function("cambiarEstadoD7", cambiarEstadoD7);

    Particle.variable("estadoD0", estadoD0);
    Particle.variable("estadoD1", estadoD1);
    Particle.variable("estadoD2", estadoD2);
    Particle.variable("estadoD3", estadoD3);
    Particle.variable("estadoD4", estadoD4);
    Particle.variable("estadoD5", estadoD5);
    Particle.variable("estadoD6", estadoD6);
    Particle.variable("estadoD7", estadoD7);

    Serial.println("Inicialización completa.");
}

void loop() {
    static unsigned long lastCheck = 0;
    const unsigned long interval = 10000; // Cada 10 segundos

    if (millis() - lastCheck >= interval) {
        lastCheck = millis();
        procesarHorarios();
    }
}

// Procesar horarios y aplicar cambios
void procesarHorarios() {
    int currentHour = Time.hour();
    int currentMinute = Time.minute();
    Serial.println("Procesando horarios...");

    for (JsonPair device : horarios.as<JsonObject>()) {
        JsonObject deviceData = device.value().as<JsonObject>();
        JsonObject deviceHorarios = deviceData["horarios"].as<JsonObject>();

        for (JsonPair horario : deviceHorarios) {
            const char* onTime = horario.value()["on"] | "";
            const char* offTime = horario.value()["off"] | "";

            int pin = obtenerPin(device.key().c_str());
            bool* estado = obtenerEstado(device.key().c_str());

            if (pin != -1 && estado != nullptr) {
                verificarHorario(currentHour, currentMinute, onTime, offTime, *estado, pin);
            }
        }
    }
    Serial.println("Horarios procesados correctamente.");
}

int obtenerPin(const char* deviceKey) {
    if (strcmp(deviceKey, "D0") == 0) return pinRelevadorD0;
    if (strcmp(deviceKey, "D1") == 0) return pinRelevadorD1;
    if (strcmp(deviceKey, "D2") == 0) return pinRelevadorD2;
    if (strcmp(deviceKey, "D3") == 0) return pinRelevadorD3;
    if (strcmp(deviceKey, "D4") == 0) return pinRelevadorD4;
    if (strcmp(deviceKey, "D5") == 0) return pinRelevadorD5;
    if (strcmp(deviceKey, "D6") == 0) return pinRelevadorD6;
    if (strcmp(deviceKey, "D7") == 0) return pinRelevadorD7;
    return -1;
}

bool* obtenerEstado(const char* deviceKey) {
    if (strcmp(deviceKey, "D0") == 0) return &estadoD0;
    if (strcmp(deviceKey, "D1") == 0) return &estadoD1;
    if (strcmp(deviceKey, "D2") == 0) return &estadoD2;
    if (strcmp(deviceKey, "D3") == 0) return &estadoD3;
    if (strcmp(deviceKey, "D4") == 0) return &estadoD4;
    if (strcmp(deviceKey, "D5") == 0) return &estadoD5;
    if (strcmp(deviceKey, "D6") == 0) return &estadoD6;
    if (strcmp(deviceKey, "D7") == 0) return &estadoD7;
    return nullptr;
}

void verificarHorario(int currentHour, int currentMinute, const char* onTime, const char* offTime, bool &estado, int pin) {
    if (strlen(onTime) < 5 || strlen(offTime) < 5) {
        Serial.println("Error: Formato de hora inválido.");
        return;
    }

    int onMinutes = convertirMinutos(onTime);
    int offMinutes = convertirMinutos(offTime);
    int currentMinutes = currentHour * 60 + currentMinute;

    bool encender = false;
    bool apagar = false;

    if (onMinutes <= offMinutes) {
        encender = (currentMinutes >= onMinutes && currentMinutes < offMinutes);
        apagar = (currentMinutes >= offMinutes);
    } else {
        encender = (currentMinutes >= onMinutes || currentMinutes < offMinutes);
        apagar = (currentMinutes >= offMinutes && currentMinutes < onMinutes);
    }

    if (encender && !estado) {
        estado = true;
        digitalWrite(pin, LOW); // Encender
        Serial.print("Encendiendo pin: ");
        Serial.println(pin);
    } else if (apagar && estado) {
        estado = false;
        digitalWrite(pin, HIGH); // Apagar
        Serial.print("Apagando pin: ");
        Serial.println(pin);
    }
}

int convertirMinutos(const char* time) {
    int hour = String(time).substring(0, 2).toInt();
    int minute = String(time).substring(3, 5).toInt();
    return hour * 60 + minute;
}

int actualizarHorarios(String command) {
    DeserializationError error = deserializeJson(horarios, command.c_str());

    if (error) {
        Serial.print("Error al actualizar horarios: ");
        Serial.println(error.c_str());
        return -1;
    }

    Serial.println("Horarios actualizados:");
    serializeJsonPretty(horarios, Serial);
    return 1;
}


// Cambiar estado manualmente
int cambiarEstadoD0(String command) { return cambiarEstado(command, pinRelevadorD0, estadoD0); }
int cambiarEstadoD1(String command) { return cambiarEstado(command, pinRelevadorD1, estadoD1); }
int cambiarEstadoD2(String command) { return cambiarEstado(command, pinRelevadorD2, estadoD2); }
int cambiarEstadoD3(String command) { return cambiarEstado(command, pinRelevadorD3, estadoD3); }
int cambiarEstadoD4(String command) { return cambiarEstado(command, pinRelevadorD4, estadoD4); }
int cambiarEstadoD5(String command) { return cambiarEstado(command, pinRelevadorD5, estadoD5); }
int cambiarEstadoD6(String command) { return cambiarEstado(command, pinRelevadorD6, estadoD6); }
int cambiarEstadoD7(String command) { return cambiarEstado(command, pinRelevadorD7, estadoD7); }

int cambiarEstado(String command, int pin, bool &estado) {
    if (command == "on") {
        estado = true;
        digitalWrite(pin, LOW);
    } else if (command == "off") {
        estado = false;
        digitalWrite(pin, HIGH);
    } else {
        return -1;
    }
    return 1;
}
`
    );
    setBinaryUrl("");
  };

  const handleCompile = async () => {
    if (!code.trim()) {
      return Alert.alert("Error", "Escribe el código antes de compilar.");
    }
    setStatus("working");
    try {
      const resp = await fetch(
        "https://server-particle-control.vercel.app/api/flash",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            deviceID: id,
            userToken,   // OAuth token con firmware:create
            sourceCode: code,
            platformId: pid,
          }),
        }
      );
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Error desconocido");

      // Guardar binary_url para que aparezca el input
      setBinaryUrl(data.binary_url);
      Alert.alert(
        "Compilación exitosa",
        `Binary_URL: ${data.binary_url}`
      );
    } catch (err: any) {
      console.error(err);
      Alert.alert("Error", err.message);
    } finally {
      setStatus("idle");
    }
  };

  const handleRemoteFlash = async () => {
    if (!binaryUrl) return;
    setStatus("working");
    let fileUri = "";
    try {
      // 1) Descargar el binario al almacenamiento local
      const downloadUrl = `https://api.particle.io${binaryUrl}?access_token=${userToken}`;
      fileUri = FileSystem.documentDirectory + 'firmware.bin';
      await FileSystem.downloadAsync(downloadUrl, fileUri);

      // 2) Preparar FormData con el archivo descargado
      const form = new FormData();
      form.append('file', {
        uri: fileUri,
        name: 'firmware.bin',
        type: 'application/octet-stream',
      } as any);

      // 3) Enviar OTA al dispositivo (PUT multipart/form-data)
      const resp = await fetch(
        `https://api.particle.io/v1/devices/${id}?access_token=${userToken}`,
        {
          method: 'PUT',
          body: form,
        }
      );
      const result = await resp.json();
      if (!resp.ok) throw new Error(result.error || 'Error al flashear');

      Alert.alert('Flash iniciado', 'El dispositivo está recibiendo el binario.');
    } catch (err: any) {
      console.error(err);
      Alert.alert('Error', err.message || 'Error al flashear');
    } finally {
      setStatus('idle');
      // 4) Borrar archivo local para liberar espacio
      if (fileUri) {
        try {
          await FileSystem.deleteAsync(fileUri, { idempotent: true });
        } catch (e) {
          console.warn('No se pudo borrar el archivo:', fileUri, e);
        }
      }
    }
  };

  if (!id || !userToken) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Cargando datos del dispositivo…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Navbar
        title="Flasheo de dispositivo"
        onSettingsPress={() => setSettingsModalVisible(true)}
      />
      <SettingsModal
        isVisible={settingsModalVisible}
        onClose={() => setSettingsModalVisible(false)}
      />
      <ScrollView contentContainerStyle={styles.content}>
        {/* Mostrar parámetros recibidos */}
        <Text style={styles.label}>Dispositivo: {name}</Text>
        <Text style={styles.label}>ID: {id}</Text>
        <Text style={styles.label}>Tipo: {type}</Text>
        <Text style={styles.label}>Platform ID: {pid}</Text>
        <Text style={styles.label}>User Token: {userToken}</Text>

        <Text style={styles.subheading}>Código a compilar</Text>
        <TextInput
          style={styles.editor}
          multiline
          placeholder="Escribe tu código…"
          value={code}
          onChangeText={setCode}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.secondary]}
            onPress={handleLoadDefaultCode}
            disabled={status !== "idle"}
          >
            <Text style={styles.buttonText}>Default</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.primary]}
            onPress={handleCompile}
            disabled={status !== "idle"}
          >
            {status === "idle" ? (
              <Text style={styles.buttonText}>Compilar</Text>
            ) : (
              <ActivityIndicator color="#fff" />
            )}
          </TouchableOpacity>
        </View>

        {/* Input disabled para binary_url y botón de flasheo remoto */}
        {binaryUrl ? (
          <View style={styles.buttonCol}>
            <TextInput
              style={[styles.editor, styles.urlInput]}
              value={binaryUrl}
              editable={false}
              selectTextOnFocus
            />
            <TouchableOpacity
              style={[styles.button, styles.primary]}
              onPress={handleRemoteFlash}
              disabled={status !== "idle"}
            >
              <Text style={styles.buttonText}>Flashear</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </ScrollView>
      <BottomNavbar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  content: { padding: 20, flexGrow: 1 },
  label: { fontSize: 16, color: "#444", marginBottom: 4 },
  subheading: { fontSize: 18, fontWeight: "600", marginTop: 20, marginBottom: 8 },
  editor: { height: 200, borderWidth: 1, borderColor: "#ccc", borderRadius: 6, padding: 10, backgroundColor: "#fafafa", fontFamily: "monospace" },
  buttonRow: { flexDirection: "row", marginTop: 16 },
  buttonCol: { flexDirection: "column", marginTop: 32 },
  button: { flex: 1, padding: 12, borderRadius: 6, alignItems: "center" },
  primary: { backgroundColor: "#28a745"},
  secondary: { backgroundColor: "#888", marginRight: 8},
  urlInput: { flex: 3, height: 40, backgroundColor: "#eee", padding: 8, fontSize: 12, marginBottom: 8 },
  buttonText: { color: "#fff", fontWeight: "600" },
});
