// Import Firebase SDKs (using CDN for static site without build step)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// User's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyARBjl5foDHy6oEMwFxl1VBwshR2TPZz84",
  authDomain: "mein-portfolio-e8ea2.firebaseapp.com",
  projectId: "mein-portfolio-e8ea2",
  storageBucket: "mein-portfolio-e8ea2.firebasestorage.app",
  messagingSenderId: "511646728761",
  appId: "1:511646728761:web:548cdcbe571047aaa743e8",
  measurementId: "G-NZSJKB24D8",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, analytics, auth, db };
