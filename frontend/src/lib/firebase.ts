import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDE9ETux6q8h_uRR7n5VJ0_OLKe1hM4Vc0",
  authDomain: "dtaxrail-d838e.firebaseapp.com",
  projectId: "dtaxrail-d838e",
  storageBucket: "dtaxrail-d838e.firebasestorage.app",
  messagingSenderId: "621708089115",
  appId: "1:621708089115:web:87dc78765830a6ba09e5be",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

export default app;