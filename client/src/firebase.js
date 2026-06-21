import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBTsJBxLJQ_Lb0QXL0RHbzC5A66wkeUKbs",
  authDomain: "goalign-20d21.firebaseapp.com",
  projectId: "goalign-20d21",
  storageBucket: "goalign-20d21.firebasestorage.app",
  messagingSenderId: "217203838497",
  appId: "1:217203838497:web:cb21615fd5ccecdadedd60",
  measurementId: "G-0K42NS5F9S"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
