"use client"

import { useState } from "react"
import { View, Text, StyleSheet, ScrollView, Image } from "react-native"
import { useRouter } from "expo-router"
import Navbar from "../components/navbar"
import BottomNavbar from "../components/bottom-navbar"
import SettingsModal from "./settings-modal"

const UserGuide = () => {
  const router = useRouter()
  const [modalVisible, setModalVisible] = useState(false)

  const handleSettingsPress = () => {
    setModalVisible(true)
  }

  return (
    <View style={styles.container}>
      <Navbar title="Guía de Usuario" onSettingsPress={handleSettingsPress} />

      <SettingsModal isVisible={modalVisible} onClose={() => setModalVisible(false)} />

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.text}>
          Bienvenido a la guía de usuario de nuestra aplicación. Aquí encontrarás información sobre cómo navegar y
          utilizar las funcionalidades principales de la app. Sigue leyendo para descubrir cómo sacar el máximo
          provecho.
        </Text>

        <Text style={styles.subtitle}>1. Pantalla de Inicio</Text>
        <Text style={styles.text}>
          La pantalla principal de la aplicación te da acceso rápido a las principales funciones. Desde aquí puedes
          navegar a las secciones de Credenciales, Dispositivos, Guía de Usuario y Configuración mediante botones
          horizontales. También encontrarás un acceso rápido a configuraciones en la esquina superior derecha.
        </Text>
        <Image source={require("../../assets/images/home.jpeg")} style={styles.image} />

        <Text style={styles.subtitle}>2. Credenciales</Text>
        <Text style={styles.text}>
          En la sección de Credenciales puedes generar claves API y asociarlas con tus dispositivos Photon. Estas claves
          son necesarias para interactuar con el hardware de IoT conectado a la nube. Asegúrate de guardar las claves
          generadas en la base de datos para un acceso rápido.
        </Text>
        <Image source={require("../../assets/images/credenciales.jpeg")} style={styles.image} />

        <Text style={styles.subtitle}>3. Dispositivos</Text>
        <Text style={styles.text}>
          La sección de Dispositivos te muestra una lista de todos los dispositivos registrados en tu cuenta. Puedes ver
          detalles como el ID del Photon, la clave API asociada y el estado del dispositivo (en línea o desconectado).
          Esta sección es clave para gestionar y supervisar tu ecosistema IoT.
        </Text>
        <Image source={require("../../assets/images/lista.jpeg")} style={styles.image} />

        <Text style={styles.subtitle}>4. Gestión de Cuenta</Text>
        <Text style={styles.text}>
          La sección de Gestión de Cuenta te permite realizar cambios importantes en tu perfil. Puedes cambiar tu
          contraseña, eliminar tu cuenta o cerrar sesión de manera segura. Para acceder a esta sección, selecciona el
          ícono de engranaje en la pantalla principal y elige la opción "Gestión de Cuenta".
        </Text>
        <Image source={require("../../assets/images/gestion.jpeg")} style={styles.image} />

        <Text style={styles.subtitle}>5. Manipulación de Dispositivos</Text>
        <Text style={styles.text}>
          Cada dispositivo registrado cuenta con un apartado dedicado para su manipulación. Desde esta sección puedes
          realizar las siguientes acciones:
        </Text>
        <Text style={styles.text}>
          - **Crear horarios de encendido y apagado:** Configura horarios específicos en los que el dispositivo se
          encenderá y apagará automáticamente.
        </Text>
        <Text style={styles.text}>
          - **Visualizar consumo eléctrico:** Monitorea el consumo de energía del dispositivo en tiempo real. También
          puedes acceder a estadísticas históricas para entender mejor el uso energético de tu ecosistema IoT.
        </Text>
        <View style={styles.imageRow}>
          <Image source={require("../../assets/images/dispositivo.jpeg")} style={styles.imageRows} />
          <Image source={require("../../assets/images/horarios.jpeg")} style={styles.imageRows} />
          <Image source={require("../../assets/images/consumo.jpeg")} style={styles.imageRows} />
        </View>

        <Text style={styles.conclusion}>
          Esperamos que esta guía te ayude a entender y utilizar la aplicación de manera eficiente. Si tienes alguna
          duda, consulta nuestra sección de preguntas frecuentes o contacta al soporte técnico.
        </Text>
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
  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
    color: "#333",
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 10,
    color: "#444",
  },
  image: {
    width: "100%",
    height: 200,
    resizeMode: "contain",
    marginVertical: 15,
    borderRadius: 8,
  },
  imageRows: {
    width: 100,
    height: 200,
    resizeMode: "contain",
    marginHorizontal: 5,
  },
  imageRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 15,
  },
  conclusion: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
    marginTop: 20,
    fontWeight: "bold",
    color: "#333",
  },
})

export default UserGuide

