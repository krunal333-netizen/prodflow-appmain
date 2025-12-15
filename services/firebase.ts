import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase Configuration for ProdFlow
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCFrPSYnFn1T5zgsuIB_4TxMB59D3-0qMg",
  authDomain: "prodflow-731b1.firebaseapp.com",
  projectId: "prodflow-731b1",
  storageBucket: "prodflow-731b1.firebasestorage.app",
  messagingSenderId: "874150900796",
  appId: "1:874150900796:web:98fdc6227455bcbc87ff39",
  measurementId: "G-2J0T0KM5YE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export auth and database services
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;