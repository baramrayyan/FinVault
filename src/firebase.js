import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// TODO: Replace this with your actual Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyCvTRSukFQet7oS6cG6C92orZXeL5deB2E",
  authDomain: "money-manager-a70e0.firebaseapp.com",
  projectId: "money-manager-a70e0",
  storageBucket: "money-manager-a70e0.firebasestorage.app",
  messagingSenderId: "86448673836",
  appId: "1:86448673836:web:9ba5c734a2d4b826282d89",
  measurementId: "G-LTXFDJ4BNG"
};


const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
