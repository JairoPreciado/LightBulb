"use client"

import { useState } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native"
import { useRouter } from "expo-router"
import Navbar from "../components/navbar"
import BottomNavbar from "../components/bottom-navbar"
import SettingsModal from "./settings-modal"
import ImageModal from "../components/imageModal"
import guideImages from "../utils/guideImages"

const GuideUser = () => {
  const router = useRouter()
  const [settingsVisible, setSettingsVisible] = useState(false)
  const [imageModalVisible, setImageModalVisible] = useState(false)
  const [activeImages, setActiveImages] = useState<any[]>([])
  const [activeIndex, setActiveIndex] = useState(0)

  const handleSettingsPress = () => {
    setSettingsVisible(true)
  }

  const openImageModal = (topicKey: string) => {
    const images = guideImages[topicKey]
    if (images) {
      const imageArray = Array.isArray(images) ? images : [images]
      setActiveImages(imageArray)
      setActiveIndex(0)
      setImageModalVisible(true)
    }
  }

  const closeImageModal = () => {
    setImageModalVisible(false)
    setActiveImages([])
    setActiveIndex(0)
  }

  const showNextImage = () => {
    setActiveIndex((prev) => (prev + 1) % activeImages.length)
  }

  const showPrevImage = () => {
    setActiveIndex((prev) => (prev - 1 + activeImages.length) % activeImages.length)
  }

  return (
    <View style={styles.container}>
      <Navbar title="Guía de Usuario" onSettingsPress={handleSettingsPress} />
      <SettingsModal isVisible={settingsVisible} onClose={() => setSettingsVisible(false)} />

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.text}>
          Bienvenido a la guía de usuario de Control Particle, tu herramienta integral para la gestión de dispositivos IoT con tecnología Photon.
          Aquí encontrarás una explicación general de las funciones más importantes de la app.
        </Text>

        {/* Tópico 1 */}
        <View style={styles.topicContainer}>
          <Text style={styles.subtitle}>1. Pantalla de Inicio</Text>
          <Text style={styles.text}>Es la pantalla principal de la aplicación, donde se muestra un resumen básico antes de navegar a otras secciones.</Text>
          <TouchableOpacity onPress={() => openImageModal("inicio")} style={styles.imageButton}>
            <Text style={styles.imageButtonText}>Ver imagen(es)</Text>
          </TouchableOpacity>
        </View>


        {/* Tópico 2 */}
        <View style={styles.topicContainer}>
          <Text style={styles.subtitle}>2. Credenciales</Text>
          <Text style={styles.text}>Aquí puedes crear credenciales de acceso. Al generar una, se registra automáticamente el dispositivo en tu cuenta.</Text>
          <TouchableOpacity onPress={() => openImageModal("credenciales")} style={styles.imageButton}>
            <Text style={styles.imageButtonText}>Ver imagen(es)</Text>
          </TouchableOpacity>
        </View>

        {/* Tópico 3 */}
        <View style={styles.topicContainer}>
          <Text style={styles.subtitle}>3. Lista de Dispositivos</Text>
          <Text style={styles.text}>Muestra los dispositivos registrados. Desde aquí puedes eliminar alguno o editar su información como el nombre o ID.</Text>
          <TouchableOpacity onPress={() => openImageModal("listaDeDispositivos")} style={styles.imageButton}>
            <Text style={styles.imageButtonText}>Ver imagen(es)</Text>
          </TouchableOpacity>
        </View>

        {/* Tópico 4 */}
        <View style={styles.topicContainer}>
          <Text style={styles.subtitle}>4. Información del Dispositivo</Text>
          <Text style={styles.text}>Consulta de nombre, ID y estado del dispositivo seleccionado.</Text>
          <TouchableOpacity onPress={() => openImageModal("dispositivoSeleccionado")} style={styles.imageButton}>
            <Text style={styles.imageButtonText}>Ver imagen(es)</Text>
          </TouchableOpacity>
        </View>
        
        {/* Tópico 5 */}
        <View style={styles.topicContainer}>
          <Text style={styles.subtitle}>5. Control de Dispositivo</Text>
          <Text style={styles.text}>Interacción directa con dispositivos: encender, apagar y visualizar su estado.</Text>
          <TouchableOpacity onPress={() => openImageModal("dispositivoControlar")} style={styles.imageButton}>
            <Text style={styles.imageButtonText}>Ver imagen(es)</Text>
          </TouchableOpacity>
        </View>

        {/* Tópico 6 */}
        <View style={styles.topicContainer}>
          <Text style={styles.subtitle}>6. Flasheo de Dispositivo</Text>
          <Text style={styles.text}>Permite ingresar código y compilarlo directamente en los servidores de Particle. Después, con el endpoint de la compilación, puedes enviar una petición para flashear el dispositivo y actualizar su firmware.</Text>
          <TouchableOpacity onPress={() => openImageModal("flasheoDeDispositivo")} style={styles.imageButton}>
            <Text style={styles.imageButtonText}>Ver imagen(es)</Text>
          </TouchableOpacity>
        </View>

        {/* Tópico 7 */}
        <View style={styles.topicContainer}>
          <Text style={styles.subtitle}>7. Programar Horario</Text>
          <Text style={styles.text}>Configura horarios automáticos para encender o apagar tus dispositivos IoT según tus necesidades.</Text>
          <TouchableOpacity onPress={() => openImageModal("dispositivoProgramarHorario")} style={styles.imageButton}>
            <Text style={styles.imageButtonText}>Ver imagen(es)</Text>
          </TouchableOpacity>
        </View>

        {/* Tópico 8 */}
        <View style={styles.topicContainer}>
          <Text style={styles.subtitle}>8. Notificaciones</Text>
          <Text style={styles.text}>Información sobre alertas importantes y recordatorios.</Text>
          <TouchableOpacity onPress={() => openImageModal("notificaciones")} style={styles.imageButton}>
            <Text style={styles.imageButtonText}>Ver imagen(es)</Text>
          </TouchableOpacity>
        </View>

        {/* Tópico 9 */}
        <View style={styles.topicContainer}>
          <Text style={styles.subtitle}>9. Gestión de Cuenta</Text>
          <Text style={styles.text}>Permite cambiar la contraseña de tu cuenta, cerrar sesión o eliminarla permanentemente.</Text>
          <TouchableOpacity onPress={() => openImageModal("gestionDeCuenta")} style={styles.imageButton}>
            <Text style={styles.imageButtonText}>Ver imagen(es)</Text>
          </TouchableOpacity>
        </View>
        
        {/* Tópico 10 */}
        <View style={styles.topicContainer}>
          <Text style={styles.subtitle}>10. Soporte Técnico</Text>
          <Text style={styles.text}>
            Para asistencia personalizada, puedes contactarnos directamente a los correos: {"\n"}
            <Text style={{fontWeight: "bold"}}>jpreciado24@ucol.mx</Text> o <Text style={{fontWeight: "bold"}}>mrdonjuan@ucol.mx</Text>. {"\n"}
            Estamos aquí para ayudarte con cualquier duda o inconveniente que tengas.
          </Text>
        </View>

        <Text style={styles.conclusion}>
          Esta guía se actualiza constantemente para ofrecerte la mejor experiencia. ¡Gracias por confiar en Control Particle!
        </Text>

      </ScrollView>

      <ImageModal visible={imageModalVisible} onClose={closeImageModal} source={activeImages[activeIndex]}>
        {activeImages.length > 1 && (
          <>
            <TouchableOpacity onPress={showPrevImage} style={styles.navButtonLeft}>
              <Text style={styles.navButtonText}>‹</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={showNextImage} style={styles.navButtonRight}>
              <Text style={styles.navButtonText}>›</Text>
            </TouchableOpacity>
          </>
        )}
      </ImageModal>

      <BottomNavbar />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#f5f5f5" 
  },
  scrollContainer: { 
    padding: 20, 
    paddingBottom: 40 
  },
  subtitle: { 
    fontSize: 18, 
    fontWeight: "bold", 
    marginTop: 20, 
    marginBottom: 10, 
    color: "#333" 
  },
  text: { 
    fontSize: 16, 
    lineHeight: 24, 
    marginBottom: 10, 
    color: "#444", 
    textAlign: "justify" 
  }, 
  imageButton: {
    alignSelf: "center",         // centra el botón horizontalmente
    backgroundColor: "#007bff",
    paddingHorizontal: 20,       // más espacio horizontal
    paddingVertical: 10,         // más espacio vertical
    borderRadius: 8,
    marginVertical: 8,
    alignItems: "center",        // centra el texto horizontalmente dentro del botón
    justifyContent: "center",    // centra el texto verticalmente dentro del botón
    minWidth: 140,               // ancho mínimo para mejor proporción
  },
  imageButtonText: { 
    color: "#fff", 
    fontWeight: "bold",
  },
  conclusion: { 
    fontSize: 16, 
    lineHeight: 24, 
    textAlign: "center", 
    marginTop: 20, 
    fontWeight: "bold", 
    color: "#333" 
  },
  navButtonLeft: {
    position: "absolute",
    left: 10,
    top: "50%",
    padding: 10,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 20,
  },
  navButtonRight: {
    position: "absolute",
    right: 10,
    top: "50%",
    padding: 10,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 20,
  },
  navButtonText: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "bold",
  },
  topicContainer: {
  backgroundColor: "#BBDEFB",
  borderRadius: 12,
  padding: 15,
  marginVertical: 10,
  // Sombra para iOS
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  // Elevación para Android
  elevation: 3,
},

})

export default GuideUser
