import React, { useState, useEffect } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, Modal, Alert} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { auth, db } from "../../../firebaseConfiguration";
import { doc, getDoc, updateDoc, deleteField } from "firebase/firestore";
import Settings from "../settings";

const MAX_SUBDEVICES = 10;
const VALID_PINS = ["D0", "D1", "D2", "D3", "D4", "D5", "D6", "D7"];

const ListSubDevices: React.FC = () => {
  const { deviceKey } = useLocalSearchParams<{ deviceKey: string }>();

  const [subdevices, setSubdevices] = useState<any[]>([]);
  const [selectedSubdevice, setSelectedSubdevice] = useState<any>(null);
  const [activeOption, setActiveOption] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [updatedName, setUpdatedName] = useState("");
  const [newSubName, setNewSubName] = useState("");
  const [newSubPin, setNewSubPin] = useState("");
  const router = useRouter();

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
      await updateDoc(docRef, {
        [`Devices.${deviceKey}.subdevices.${newSubPin}`]: {
          name: newSubName,
          pin: newSubPin,
          state: false,
        },
      });
      setSubdevices((prev) => [...prev, { name: newSubName, pin: newSubPin }]);
      setNewSubName("");
      setNewSubPin("");
      Alert.alert("Éxito", "Subdispositivo creado correctamente.");
    } catch (error) {
      console.error("Error al agregar subdispositivo:", error);
      Alert.alert("Error", "No se pudo agregar el subdispositivo.");
    }
  };

  // Funciones de actualización
  const updateSubdeviceName = async () => {
    if (!selectedSubdevice) return;
    const userId = auth.currentUser?.uid;
    if (!userId) {
      Alert.alert("Error", "Usuario no autenticado.");
      return;
    }
    try {
      const docRef = doc(db, "BD", userId);
      const newName =
        updatedName.trim() === "" ? selectedSubdevice.name : updatedName;
      await updateDoc(docRef, {
        [`Devices.${deviceKey}.subdevices.${selectedSubdevice.pin}.name`]:
          newName,
      });
      setSubdevices((prev) =>
        prev.map((sd) =>
          sd.pin === selectedSubdevice.pin ? { ...sd, name: newName } : sd
        )
      );
      setModalVisible(false);
      setActiveOption("");
      Alert.alert(
        "Éxito",
        "Nombre del subdispositivo actualizado correctamente."
      );
    } catch (error) {
      console.error("Error al actualizar el nombre del subdispositivo:", error);
      Alert.alert(
        "Error",
        "No se pudo actualizar el nombre del subdispositivo."
      );
    }
  };

  // Funcion de eliminación
  const deleteSubdevice = async () => {
    if (!selectedSubdevice) return;
    const userId = auth.currentUser?.uid;
    if (!userId) {
      Alert.alert("Error", "Usuario no autenticado.");
      return;
    }
    Alert.alert(
      "Confirmación",
      "¿Estás seguro de que deseas eliminar este subdispositivo?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              const docRef = doc(db, "BD", userId);
              await updateDoc(docRef, {
                [`Devices.${deviceKey}.subdevices.${selectedSubdevice.pin}`]:
                  deleteField(),
              });
              setSubdevices((prev) =>
                prev.filter((sd) => sd.pin !== selectedSubdevice.pin)
              );
              setModalVisible(false);
              setActiveOption("");
              Alert.alert("Éxito", "Subdispositivo eliminado correctamente.");
            } catch (error) {
              console.error("Error al eliminar el subdispositivo:", error);
              Alert.alert("Error", "No se pudo eliminar el subdispositivo.");
            }
          },
        },
      ]
    );
  };

  // Restaurar el modal a su estado inicial
  const handleModalClose = () => {
    setModalVisible(false);
    setActiveOption("");
  };

  // Renderizar el contenido del modal
  const renderModalContent = () => {
    switch (activeOption) {
      case "updateName":
        return (
          <View style={styles.modalContent}>
            <Text style={styles.modalLabel}>Editar Nombre</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Nombre actual"
              value={selectedSubdevice ? selectedSubdevice.name : ""}
              editable={false}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Nuevo nombre (opcional)"
              value={updatedName}
              onChangeText={setUpdatedName}
            />
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={updateSubdeviceName}
            >
              <Text style={styles.secondaryButtonText}>Actualizar nombre</Text>
            </TouchableOpacity>
          </View>
        );
      case "delete":
        return (
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.secondaryButton2}
              onPress={deleteSubdevice}
            >
              <Text style={styles.secondaryButtonText}>
                Borrar Subdispositivo
              </Text>
            </TouchableOpacity>
          </View>
        );
      default:
        return (
          <View style={styles.modalOptionsContainer}>
            <TouchableOpacity
              style={styles.modalOptionButton}
              onPress={() => setActiveOption("updateName")}
            >
              <Text style={styles.modalOptionText}>Actualizar Nombre</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalOptionButton}
              onPress={() => setActiveOption("delete")}
            >
              <Text style={[styles.modalOptionText, { color: "red" }]}>
                Eliminar Subdispositivo
              </Text>
            </TouchableOpacity>
          </View>
        );
    }
  };

  // Renderizar la lista de subdispositivos
  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.deviceItem}>
      <TouchableOpacity
        style={styles.optionsButton}
        onPress={() => {
          setSelectedSubdevice(item);
          setModalVisible(true);
        }}
      >
        <Text style={styles.optionsButtonText}>≡</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.deviceButton}
        onPress={() => {
          router.push({
            pathname: "./devices",
            params: {
              subName: item.name,
              pin: item.pin,
              deviceKey: deviceKey,
            },
          });
        }}
      >
        <Text style={styles.deviceText}>
          {item.name} (Pin: {item.pin})
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Salto de linea improvisado xd*/}
            <View style={{height: '5%'}} />
      <Text style={styles.title}>Subdispositivos</Text>

      {/* Formulario para agregar subdispositivos (agregado) */}
      <View style={styles.formContainer}>
        {/* Agregar un campo para ingresar el nombre del subdispositivo */}
        <TextInput
          style={styles.input}
          placeholder="Nombre del subdispositivo"
          value={newSubName}
          onChangeText={setNewSubName}
          maxLength={20}
        />

        {/* Agregar un campo para ingresar el pin del subdispositivo*/}
        <TextInput
          style={styles.input}
          placeholder="Pin (D0, D1, D2, D3, D4, D5, D6, D7)"
          value={newSubPin}
          onChangeText={setNewSubPin}
          maxLength={2}
        />
        <TouchableOpacity style={styles.addButton} onPress={addSubdevice}>
          <Text style={styles.addButtonText}>Crear Subdispositivo</Text>
        </TouchableOpacity>
      </View>
      
      {/* Renderizar la lista de subdispositivos*/}
      <FlatList
        data={subdevices}
        keyExtractor={(item) => item.pin}
        renderItem={renderItem}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            No hay subdispositivos creados aún.
          </Text>
        }
      />

      {/*Modal para gestionar subdispositivos*/}
      <Modal
        visible={modalVisible}
        animationType="fade"
        transparent
        onRequestClose={handleModalClose}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Gestión del Subdispositivo</Text>
            {renderModalContent()}
            <TouchableOpacity
              style={styles.modalOptionButtonClose}
              onPress={handleModalClose}
            >
              <Text style={styles.modalOptionText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={styles.settingsContainer}>
        <Settings />
      </View>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>←</Text>
      </TouchableOpacity>
    </View>
  );
};

export default ListSubDevices;

// Estilos
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  // Estilos para el formulario de creación (agregados)
  formContainer: {
    marginBottom: 20,
    backgroundColor: "#e6e6e6",
    borderRadius: 10,
    padding: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  addButton: {
    backgroundColor: "#007BFF",
    borderRadius: 5,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  // Estilos para los items de la lista
  deviceItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    backgroundColor: "#e6e6e6",
    borderRadius: 5,
    marginVertical: 8,
  },
  optionsButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ccc",
    borderRadius: 20,
    marginRight: 10,
  },
  optionsButtonText: {
    fontSize: 20,
    color: "#333",
  },
  deviceButton: {
    flex: 1,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  deviceText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  emptyText: {
    textAlign: "center",
    fontSize: 16,
    color: "#888",
    marginTop: 20,
  },
  // Estilos para el modal
  modalBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "100%",
    paddingVertical: 10,
    alignItems: "center",
  },
  modalContainer: {
    width: "80%",
    backgroundColor: "#FFE5B4",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
  },
  modalLabel: {
    alignSelf: "flex-start",
    fontSize: 16,
    marginTop: 10,
  },
  modalInput: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    marginVertical: 5,
    backgroundColor: "#f5f5f5",
  },
  modalOptionsContainer: {
    width: "100%",
    marginVertical: 10,
    alignItems: "center",
  },
  modalOptionButton: {
    width: "100%",
    padding: 15,
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
    marginVertical: 5,
    alignItems: "center",
  },
  modalOptionButtonClose: {
    width: "100%",
    padding: 15,
    backgroundColor: "#cccccc",
    borderRadius: 10,
    marginVertical: 5,
    alignItems: "center",
  },
  modalOptionText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  secondaryButton: {
    backgroundColor: "#007BFF",
    width: "100%",
    height: 35,
    marginBottom: 10,
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  secondaryButton2: {
    backgroundColor: "red",
    width: "100%",
    height: 35,
    marginBottom: 10,
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
  },
  settingsContainer: {
    position: "absolute",
    top: 10,
    right: 10,
  },
  backButton: {
    position: "absolute",
    bottom: 20,
    left: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "#ddd",
    borderRadius: 5,
  },
  backButtonText: {
    fontSize: 18,
    color: "#333",
  },
});
