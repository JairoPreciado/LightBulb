
# **Lightbulb: Proyecto IoT**

Lightbulb es un proyecto IoT diseñado para controlar un foco inteligente mediante un dispositivo Particle Photon y una aplicación móvil creada con **React Native** utilizando **Expo**. Este proyecto combina software, hardware y conectividad a Internet para ofrecer una experiencia eficiente de domótica.

---

## **Características principales**
- **Control remoto del foco:**
  - Encendido y apagado del foco desde cualquier lugar con conexión a Internet.
  - Sincronización en tiempo real del estado del dispositivo.
- **Programación horaria:**
  - Configuración de horarios automáticos para encendido y apagado.
- **Notificaciones:**
  - Alertas a través de mensajes, correos electrónicos o notificaciones locales.
- **Estadísticas de consumo energético:**
  - Consulta de historial detallado del consumo eléctrico.
- **Gestión de usuarios:**
  - Sistema de registro e inicio de sesión con cuentas únicas.
  - Cada usuario gestiona únicamente sus dispositivos registrados.
- **Interfaz intuitiva:**
  - Aplicación desarrollada con **React Native Expo**, compatible con dispositivos Android e iOS.

---

## **Requisitos para ejecutar el proyecto**

### **Software necesario**
1. **Node.js** (Recomendado: LTS).
2. **Expo CLI** (Instalar globalmente con el siguiente comando):
   ```bash
   npm install -g expo-cli
   ```
3. Aplicación móvil **Expo Go** instalada en tu dispositivo:
   - [Descargar para Android](https://play.google.com/store/apps/details?id=host.exp.exponent)
   - [Descargar para iOS](https://apps.apple.com/app/expo-go/id982107779)

### **Hardware necesario**
1. Dispositivo **Particle Photon** configurado y conectado a Internet.
2. Módulo relé para controlar el foco.

---

## **Instrucciones para clonar y ejecutar el proyecto**

1. **Clona este repositorio en tu máquina local:**
   ```bash
   git clone https://github.com/JairoPreciado/LightBulb.git
   cd LightBulb
   ```

2. **Instala las dependencias del proyecto:**
   ```bash
   npm install
   ```

3. **Inicia la aplicación:**
   ```bash
   npx expo start
   ```

4. **Ejecuta la app en tu dispositivo móvil:**
   - Escanea el código QR generado en tu terminal usando la app **Expo Go**.
   - También puedes usar un emulador de Android/iOS configurado en tu computadora.

---

## **Configuración adicional**

### **Configuración del hardware**
1. Conecta el **Particle Photon** a un módulo relé y asegúrate de que esté configurado en la nube de Particle.
2. Modifica los parámetros del dispositivo en el código de la app para sincronizar correctamente con tu Photon.

### **Variables de entorno**
- Crea un archivo `.env` (si es necesario) para almacenar claves de API, tokens o configuraciones específicas.

---

## **Documentación adicional**
Consulta los siguientes recursos para mayor información sobre las tecnologías utilizadas:

- [Documentación de Particle](https://docs.particle.io/)
- [Guía oficial de Expo](https://docs.expo.dev/)

---

## **Contribuciones**
Las contribuciones son bienvenidas. Si deseas contribuir, por favor abre un _issue_ o envía un _pull request_.
