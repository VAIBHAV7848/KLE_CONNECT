import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
    apiKey: "AIzaSyCSb-xCE5OIUm9RLkM1dizD_dz0BBu3OYA",
    authDomain: "vaibhav-7848.firebaseapp.com",
    databaseURL: "https://vaibhav-7848-default-rtdb.firebaseio.com",
    projectId: "vaibhav-7848",
    storageBucket: "vaibhav-7848.firebasestorage.app",
    messagingSenderId: "530530585982",
    appId: "1:530530585982:web:ea239c817a050e2dd2b72f",
    measurementId: "G-4B0ZFN99V5"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const analytics = getAnalytics(app);
