// Importa Firebase y los servicios que necesitas
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Configuración de tu proyecto en Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDhT4o_tWW9S8B3XV44PQYFqvTdqaYV7Dk",
  authDomain: "lightbulb-5fcc3.firebaseapp.com",
  projectId: "lightbulb-5fcc3",
  storageBucket: "lightbulb-5fcc3.firebasestorage.app",
  messagingSenderId: "199233467868",
  appId: "1:199233467868:android:ceb64f8964e0a9c6114b19",
};

// Inicializa Firebase con la configuración
const app = initializeApp(firebaseConfig);

// Exporta los servicios que vas a usar
const auth = getAuth(app); // Para autenticación
const db = getFirestore(app); // Para la base de datos Firestore

export { auth, db };
