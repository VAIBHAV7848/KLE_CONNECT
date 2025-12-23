import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAMMzRab6OCXICjmAlnN-maJXRGEEgWdaE",
    authDomain: "kle-connect.firebaseapp.com",
    projectId: "kle-connect",
    storageBucket: "kle-connect.firebasestorage.app",
    messagingSenderId: "939070940474",
    appId: "1:939070940474:web:5a0b7a45c7fe345fbddc03",
    measurementId: "G-9T43NDMQVS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const analytics = getAnalytics(app);
