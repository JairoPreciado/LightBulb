import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Button,
  StyleSheet,
  FlatList,
  Alert,
  TextInput,
  TouchableOpacity,
  Modal,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { doc, updateDoc, getDoc, deleteField } from "firebase/firestore";
import { auth, db } from "../../../firebaseConfiguration";
import Settings from "../settings";

const MAX_SUBDEVICES = 8;
const VALID_PINS = ["D0", "D1", "D2", "D3", "D4", "D5", "D6", "D7"];

const ListSubDevices: React.FC = () => {
  const [subdevices, setSubdevices] = useState<{ name: string; pin: string }[]>(
    []
  );
  const [newSubName, setNewSubName] = useState("");
  const [newSubPin, setNewSubPin] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedSubdevice, setSelectedSubdevice] = useState<{
    name: string;
    pin: string;
  } | null>(null);
  const [updatedName, setUpdatedName] = useState("");
  const router = useRouter();

  // Obtenemos la clave del dispositivo desde la query: ?deviceKey=...
  const { deviceKey } = useLocalSearchParams<{ deviceKey: string }>();

  // Cargar subdispositivos del dispositivo seleccionado
  useEffect(() => {
    const loadSubdevices = async () => {
      if (!deviceKey) {
        Alert.alert("Error", "No se especificó el dispositivo.");
        return;
      }
      const userId = auth.currentUser?.uid;
      if (!userId) {
        Alert.alert("Error", "Usuario no autenticado.");
        return;
      }
      try {
        const userDocRef = doc(db, "BD", userId);
        const snap = await getDoc(userDocRef);
        if (snap.exists()) {
          const data = snap.data();
          // Leer subdispositivos de Devices.[deviceKey].subdevices
          const subObj = data.Devices?.[deviceKey]?.subdevices || {};
          const loaded = Object.entries(subObj).map(
            ([pin, sub]: [string, any]) => ({
              name: sub.name,
              pin,
            })
          );
          setSubdevices(loaded);
        } else {
          Alert.alert("Error", "No se encontró información del usuario.");
        }
      } catch (error) {
        console.error("Error al cargar subdispositivos:", error);
        Alert.alert("Error", "No se pudieron cargar los subdispositivos.");
      }
    };
    loadSubdevices();
  }, [deviceKey]);

  // Agregar un nuevo subdispositivo
  const addSubdevice = async () => {
    if (!deviceKey) {
      Alert.alert("Error", "No se especificó el dispositivo.");
      return;
    }
    if (subdevices.length >= MAX_SUBDEVICES) {
      Alert.alert(
        "Límite alcanzado",
        `Solo puedes agregar un máximo de ${MAX_SUBDEVICES} subdispositivos.`
      );
      return;
    }
    if (!newSubName || !newSubPin) {
      Alert.alert("Error", "Por favor ingresa un nombre y un pin.");
      return;
    }
    if (!VALID_PINS.includes(newSubPin)) {
      Alert.alert("Error", "Pin no válido (D0, D1, D2, D3, D4, D5, D6, D7).");
      return;
    }
    if (subdevices.some((s) => s.pin === newSubPin)) {
      Alert.alert("Error", "El pin ya está asignado a otro subdispositivo.");
      return;
    }
    const userId = auth.currentUser?.uid;
    if (!userId) {
      Alert.alert("Error", "Usuario no autenticado.");
      return;
    }
    try {
      const docRef = doc(db, "BD", userId);
      // Guardar en: Devices[deviceKey].subdevices[newSubPin]
      await updateDoc(docRef, {
        [`Devices.${deviceKey}.subdevices.${newSubPin}`]: {
          name: newSubName,
          pin: newSubPin,
          state: false,
        },
      });
      // Actualizar estado local
      setSubdevices((prev) => [...prev, { name: newSubName, pin: newSubPin }]);
      setNewSubName("");
      setNewSubPin("");
      Alert.alert("Éxito", "Subdispositivo creado correctamente.");
    } catch (error) {
      console.error("Error al agregar subdispositivo:", error);
      Alert.alert("Error", "No se pudo agregar el subdispositivo.");
    }
  };

  // Abrir modal para editar/eliminar un subdispositivo
  const openSettingsModal = (subdevice: { name: string; pin: string }) => {
    setSelectedSubdevice(subdevice);
    setUpdatedName(subdevice.name);
    setModalVisible(true);
  };

  // Eliminar un subdispositivo
  const deleteSubdevice = async () => {
    if (!selectedSubdevice || !deviceKey) return;
    const userId = auth.currentUser?.uid;
    if (!userId) {
      Alert.alert("Error", "Usuario no autenticado.");
      return;
    }
    try {
      const docRef = doc(db, "BD", userId);
      await updateDoc(docRef, {
        [`Devices.${deviceKey}.subdevices.${selectedSubdevice.pin}`]:
          deleteField(),
      });
      // Actualizar estado local
      setSubdevices((prev) =>
        prev.filter((s) => s.pin !== selectedSubdevice.pin)
      );
      setModalVisible(false);
      Alert.alert("Éxito", "Subdispositivo eliminado correctamente.");
    } catch (error) {
      console.error("Error al eliminar el subdispositivo:", error);
      Alert.alert("Error", "No se pudo eliminar el subdispositivo.");
    }
  };

  // Actualizar nombre del subdispositivo
  const updateSubdeviceName = async () => {
    if (!selectedSubdevice || !deviceKey) return;
    const userId = auth.currentUser?.uid;
    if (!userId) {
      Alert.alert("Error", "Usuario no autenticado.");
      return;
    }
    try {
      const docRef = doc(db, "BD", userId);
      await updateDoc(docRef, {
        [`Devices.${deviceKey}.subdevices.${selectedSubdevice.pin}.name`]:
          updatedName,
      });
      setSubdevices((prev) =>
        prev.map((s) =>
          s.pin === selectedSubdevice.pin ? { ...s, name: updatedName } : s
        )
      );
      setModalVisible(false);
      Alert.alert(
        "Éxito",
        "Nombre del subdispositivo actualizado correctamente."
      );
    } catch (error) {
      console.error("Error al actualizar el subdispositivo:", error);
      Alert.alert("Error", "No se pudo actualizar el subdispositivo.");
    }
  };

  const renderSubdeviceItem = ({ item }: { item: any }) => (
    <View style={styles.subdeviceItem}>
      <TouchableOpacity
        style={styles.subdeviceButton}
        onPress={() =>
          router.push(
            `./devices?name=${encodeURIComponent(
              item.name
            )}&pin=${encodeURIComponent(item.pin)}`
          )
        }
      >
        <Text style={styles.subdeviceText}>
          {item.name} (Pin: {item.pin})
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.settingsButton}
        onPress={() => openSettingsModal(item)}
      >
        <Text style={styles.settingsButtonText}>⋮</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Subdispositivos del Dispositivo</Text>

      {/* Formulario para agregar subdispositivo */}
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Nombre del subdispositivo"
          value={newSubName}
          onChangeText={setNewSubName}
          maxLength={20}
        />
        <TextInput
          style={styles.input}
          placeholder="Pin (D0, D1, D2, D3, D4, D5, D6, D7)"
          value={newSubPin}
          onChangeText={setNewSubPin}
          maxLength={2}
        />
        <TouchableOpacity style={styles.secondaryButton} onPress={addSubdevice}>
          <Text style={styles.secondaryButtonText}>Crear Subdispositivo</Text>
        </TouchableOpacity>
      </View>

      {/* Lista de subdispositivos */}
      <FlatList
        data={subdevices}
        keyExtractor={(item, index) => `${item.pin}-${index}`}
        renderItem={renderSubdeviceItem}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            No hay subdispositivos creados aún.
          </Text>
        }
      />

      {/* Modal para ajustes del subdispositivo */}
      <Modal
        visible={modalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Ajustes del Subdispositivo</Text>
            <Text style={styles.modalText}>Pin: {selectedSubdevice?.pin}</Text>
            <TextInput
              style={styles.input}
              placeholder="Nuevo nombre del subdispositivo"
              value={updatedName}
              onChangeText={setUpdatedName}
              maxLength={20}
            />
            <View style={styles.modalButtonsContainer}>
              <View style={styles.modalButton}>
                <Button
                  title="Actualizar Nombre"
                  onPress={updateSubdeviceName}
                />
              </View>
              <View style={styles.modalButton}>
                <Button
                  title="Eliminar Subdispositivo"
                  color="red"
                  onPress={deleteSubdevice}
                />
              </View>
              <Button title="Cerrar" onPress={() => setModalVisible(false)} />
            </View>
          </View>
        </View>
      </Modal>

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>←</Text>
      </TouchableOpacity>
      <View style={styles.settingsContainer}>
        <Settings />
      </View>
    </View>
  );
};

export default ListSubDevices;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f5f5f5" },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  form: { marginBottom: 20 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  secondaryButton: {
    backgroundColor: "#007BFF",
    borderRadius: 5,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: "center",
    marginBottom: 10,
  },
  secondaryButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  emptyText: {
    textAlign: "center",
    fontSize: 16,
    color: "#888",
    marginTop: 20,
  },
  subdeviceItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
    marginVertical: 5,
    backgroundColor: "#e6e6e6",
    borderRadius: 5,
  },
  subdeviceButton: {
    flex: 1,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  subdeviceText: { fontSize: 16, fontWeight: "bold", color: "#333" },
  settingsButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#e6e6e6",
    borderRadius: 2,
  },
  settingsButtonText: { fontSize: 18, color: "#333" },
  modalBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContainer: {
    width: "80%",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
  },
  modalTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 20 },
  modalText: { fontSize: 16, textAlign: "center", marginBottom: 20 },
  modalButtonsContainer: {
    flexDirection: "column",
    alignItems: "center",
    width: "100%",
    marginTop: 20,
  },
  modalButton: { width: "60%", marginBottom: 20 },
  backButton: {
    position: "absolute",
    bottom: 20,
    left: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "#ddd",
    borderRadius: 5,
  },
  backButtonText: { fontSize: 18, color: "#333" },
  settingsContainer: { position: "absolute", top: 10, right: 10 },
});
