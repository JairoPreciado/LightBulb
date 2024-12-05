import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import axios from 'axios';
import { useRouter, useLocalSearchParams } from 'expo-router';

const Consumo = () => {
  const [voltaje, setVoltaje] = useState(0); // Voltaje medido
  const [potencia, setPotencia] = useState(0); // Potencia medida
  const [corriente, setCorriente] = useState(0); // Corriente medida
  const [tiempoEncendido, setTiempoEncendido] = useState(0); // Tiempo encendido acumulado
  const [costoAcumulado, setCostoAcumulado] = useState(0); // Costo acumulado estimado
  const [chartData, setChartData] = useState<number[]>([]); // Datos para las gráficas
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const PHOTON_DEVICE_ID = 'TU_PHOTON_DEVICE_ID';
  const PARTICLE_ACCESS_TOKEN = 'TU_PARTICLE_ACCESS_TOKEN';

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Solicitar datos del Photon
        const voltajeResponse = await axios.get(
          `https://api.particle.io/v1/devices/${PHOTON_DEVICE_ID}/voltaje?access_token=${PARTICLE_ACCESS_TOKEN}`
        );
        const potenciaResponse = await axios.get(
          `https://api.particle.io/v1/devices/${PHOTON_DEVICE_ID}/potencia?access_token=${PARTICLE_ACCESS_TOKEN}`
        );
        const corrienteResponse = await axios.get(
          `https://api.particle.io/v1/devices/${PHOTON_DEVICE_ID}/corriente?access_token=${PARTICLE_ACCESS_TOKEN}`
        );

        // Asignar valores a las variables
        setVoltaje(voltajeResponse.data.result);
        setPotencia(potenciaResponse.data.result);
        setCorriente(corrienteResponse.data.result);

        // Calcular tiempo encendido y costo acumulado (ejemplo básico)
        const horasEncendido = 5; // Este dato puedes calcularlo o recibirlo
        const costoPorKWh = 0.20; // Costo por kWh en tu moneda
        setTiempoEncendido(horasEncendido);
        setCostoAcumulado((potenciaResponse.data.result / 1000) * horasEncendido * costoPorKWh);

        // Simulación de datos para las gráficas
        const fetchedChartData = [20, 45, 28, 80]; // Puedes reemplazar con datos reales
        setChartData(fetchedChartData);
      } catch (error) {
        console.error('Error al cargar los datos:', error);
        Alert.alert('Error', 'Hubo un problema al cargar los datos del sensor.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007BFF" />
        <Text style={styles.loadingText}>Cargando datos...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Consumo</Text>

      {/* Información general */}
      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>Voltaje: {voltaje}V</Text>
        <Text style={styles.infoText}>Potencia: {potencia}W</Text>
        <Text style={styles.infoText}>Corriente: {corriente}A</Text>
        <Text style={styles.infoText}>Tiempo encendido: {tiempoEncendido} horas</Text>
        <Text style={styles.infoText}>Costo acumulado: ${costoAcumulado.toFixed(2)}</Text>
      </View>

      {/* Gráfico semanal */}
      <Text style={styles.subtitle}>Historial de Consumo (Semanal)</Text>
      <BarChart
        data={{
          labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'], // 4 semanas
          datasets: [
            {
              data: chartData, // Datos dinámicos
            },
          ],
        }}
        width={Dimensions.get('window').width - 40} // Ancho del gráfico
        height={220} // Altura del gráfico
        yAxisLabel="kWh " // Etiqueta del eje Y
        yAxisSuffix="" // Sufijo vacío para eje Y
        chartConfig={{
          backgroundColor: '#1cc910',
          backgroundGradientFrom: '#eff3ff',
          backgroundGradientTo: '#efefef',
          decimalPlaces: 2,
          color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          style: {
            borderRadius: 16,
          },
        }}
        style={{
          marginVertical: 10,
          borderRadius: 16,
        }}
      />

      {/* Gráfico mensual */}
      <Text style={styles.subtitle}>Historial de Consumo (Mensual)</Text>
      <BarChart
        data={{
          labels: ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4'], // Etiquetas para 4 semanas
          datasets: [
            {
              data: chartData.map((value) => value * 1.2), // Datos simulados
            },
          ],
        }}
        width={Dimensions.get('window').width - 40}
        height={220}
        yAxisLabel="$ "
        yAxisSuffix=" MXN"
        chartConfig={{
          backgroundColor: '#1c91cc',
          backgroundGradientFrom: '#eff3ff',
          backgroundGradientTo: '#efefef',
          decimalPlaces: 2,
          color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          style: {
            borderRadius: 16,
          },
        }}
        style={{
          marginVertical: 10,
          borderRadius: 16,
        }}
      />
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>←</Text>
      </TouchableOpacity>
    </ScrollView>
    
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  infoContainer: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    elevation: 3,
  },
  infoText: {
    fontSize: 16,
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
  },
  backButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#ddd',
    borderRadius: 5,
  },
  backButtonText: {
    fontSize: 18,
    color: '#333',
  },
});

export default Consumo;
