import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyAwpPZCv4vuwf2H2lnFn8iDGid7b-QBssA",
  authDomain: "gfhffgh-73edc.firebaseapp.com",
  projectId: "gfhffgh-73edc",
  storageBucket: "gfhffgh-73edc.firebasestorage.app",
  messagingSenderId: "1035295773132",
  appId: "1:1035295773132:web:70a36e3c6f33776d9a8d69",
  measurementId: "G-172TS0LTP1",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
