import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBCXOcnsvYLJKUqbwQZhZF9YEFFGhPC_Z0",
  authDomain: "finvault-project.firebaseapp.com",
  projectId: "finvault-project",
  storageBucket: "finvault-project.firebasestorage.app",
  messagingSenderId: "849754303509",
  appId: "1:849754303509:web:bcae73d470647fcba2321c",
  measurementId: "G-5V66S1810N"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
