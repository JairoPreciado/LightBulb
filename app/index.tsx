import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import NetInfo from '@react-native-community/netinfo';
import * as Notifications from 'expo-notifications'; // Importar notificaciones
import '../backgroundtask'; // Importa el archivo de tareas en segundo plano

const SplashScreen = () => {
  const router = useRouter();
  const [isConnected, setIsConnected] = useState<boolean | null>(null); // Estado para la conexión a Internet

  // Configuración inicial de notificaciones
  useEffect(() => {
    const setupNotifications = async () => {
      // Solicitar permisos de notificaciones
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permiso denegado',
          'No se podrán enviar notificaciones sin los permisos necesarios.'
        );
        return;
      }

      // Configuración de notificaciones
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: false,
          shouldSetBadge: false,
        }),
      });

      console.log('Notificaciones configuradas');
    };

    setupNotifications();
  }, []);

  useEffect(() => {
    // Detectar cambios en la conexión a Internet
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected);
      if (!state.isConnected) {
        Alert.alert(
          'Sin conexión',
          'Por favor, verifica tu conexión a Internet para continuar.'
        );
      }
    });

    return () => {
      unsubscribe(); // Limpia el listener de NetInfo
    };
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    if (isConnected) {
      // Navegar al login después de 3 segundos si hay conexión
      timer = setTimeout(() => {
        router.push('./loginn/login');
      }, 3000);
    }

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [isConnected, router]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bienvenido a Lightbulb</Text>
      {isConnected === false && (
        <Text style={styles.errorText}>
          Sin conexión a Internet. Conéctate para continuar.
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10,
  },
});

export default SplashScreen;
