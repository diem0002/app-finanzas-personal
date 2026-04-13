import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDkyGnDJczlqUEvAhful8hOaYuXQaySCos",
  authDomain: "app-finanzas-diem.firebaseapp.com",
  projectId: "app-finanzas-diem",
  storageBucket: "app-finanzas-diem.firebasestorage.app",
  messagingSenderId: "245636628090",
  appId: "1:245636628090:web:d273548fc91273324145c3",
  measurementId: "G-C4MRF45TYS"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
