import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBqcYFcjsxbNDBr-mceMWyAOna0ntv06Ho",
  authDomain: "notes-4all.firebaseapp.com",
  databaseURL: "https://notes-4all-default-rtdb.asia-southeast1.firebasedatabase.app/",
  projectId: "notes-4all",
  storageBucket: "notes-4all.firebasestorage.app",
  messagingSenderId: "115724020239",
  appId: "1:115724020239:web:dd2b571eb4812eb752517a",
  measurementId: "G-PYCCRR8XLR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

// Initialize Services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const rtdb = getDatabase(app, firebaseConfig.databaseURL);
export const storage = getStorage(app);

export { analytics };
export default app;
