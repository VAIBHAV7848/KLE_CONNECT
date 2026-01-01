import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { getDatabase } from "firebase/database";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "<GOOGLE_KEY_HIDDEN>",
    authDomain: "kle-connect.firebaseapp.com",
    databaseURL: "https://kle-connect-default-rtdb.firebaseio.com",
    projectId: "kle-connect",
    storageBucket: "kle-connect.firebasestorage.app",
    messagingSenderId: "939070940474",
    appId: "1:939070940474:web:5a0b7a45c7fe345fbddc03",
    measurementId: "G-9T43NDMQVS"
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
