import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { getDatabase } from "firebase/database";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "<GOOGLE_KEY_HIDDEN>",
    authDomain: "kleconnect-a7c43.firebaseapp.com",
    databaseURL: "https://kleconnect-a7c43-default-rtdb.firebaseio.com",
    projectId: "kleconnect-a7c43",
    storageBucket: "kleconnect-a7c43.firebasestorage.app",
    messagingSenderId: "1041101183552",
    appId: "1:1041101183552:web:3df179ecc56dbcb7199da5",
    measurementId: "G-P3D6K55CXK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Configure Google Provider with custom parameters
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
    prompt: 'select_account', // Forces account selection
    display: 'popup'
});

// Add scopes for better user info
googleProvider.addScope('profile');
googleProvider.addScope('email');

export const analytics = getAnalytics(app);
export const database = getDatabase(app);
