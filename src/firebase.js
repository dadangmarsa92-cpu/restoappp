import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Konfigurasi Firebase dari user
const firebaseConfig = {
  apiKey: "AIzaSyBoFZ0_bRFkEp4bU7GXQEigCgZz0ndwjkw",
  authDomain: "restaurant-2c89c.firebaseapp.com",
  projectId: "restaurant-2c89c",
  storageBucket: "restaurant-2c89c.firebasestorage.app",
  messagingSenderId: "625222405133",
  appId: "1:625222405133:web:05124b467c400a4fb95944"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

export default app;
