import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; // <-- Add this

const firebaseConfig = {
  apiKey: "AIzaSyAfZ9uqDokgHkquGRMz-q7886gsPnYjM9M",
  authDomain: "novapath2-27234.firebaseapp.com",
  projectId: "novapath2-27234",
  storageBucket: "novapath2-27234.firebasestorage.app",
  messagingSenderId: "610188911834",
  appId: "1:610188911834:web:d6a2818e45371fd2cab1e3",
  measurementId: "G-965Q18KL8K"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app); // <-- Add this
