// CREATED: Firebase configuration file
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDZimVtFByzOacmm-SWKexdsh0I3Yb6Sec",
  authDomain: "exactlywhatiwant-c5a37.firebaseapp.com",
  projectId: "exactlywhatiwant-c5a37",
  storageBucket: "exactlywhatiwant-c5a37.firebasestorage.app",
  messagingSenderId: "48043273955",
  appId: "1:48043273955:web:81013c9c3b0448ac905fd6",
  measurementId: "G-9FQ45XJWRX",
};

// Initialize Firebase
const app = !getApps().length
  ? initializeApp(firebaseConfig)
  : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
