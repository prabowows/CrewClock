// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  "projectId": "studio-1410642569-45f02",
  "appId": "1:29217588201:web:b5d92a04055537ac07c178",
  "apiKey": "AIzaSyAmRJmvQtWL0eWKvIKq-BD3EsSUuwDzOJ4",
  "authDomain": "studio-1410642569-45f02.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "29217588201",
  "storageBucket": "studio-1410642569-45f02.appspot.com"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
