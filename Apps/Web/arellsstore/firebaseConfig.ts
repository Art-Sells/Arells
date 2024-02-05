// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAJvZ2YWE571iwiFNMorpEqN6moQCHLWMk",
  authDomain: "arells-users-and-store-brands.firebaseapp.com",
  projectId: "arells-users-and-store-brands",
  storageBucket: "arells-users-and-store-brands.appspot.com",
  messagingSenderId: "580320101190",
  appId: "1:580320101190:web:5ee2b47c4ec72033505b47",
  measurementId: "G-EZ40G40Y9N"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
