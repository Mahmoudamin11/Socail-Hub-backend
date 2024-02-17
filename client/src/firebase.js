import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCFNLf3d5kqNbh2OYEm7t0zCIKQh5fTe44",
  authDomain: "chattube2.firebaseapp.com",
  projectId: "chattube2",
  storageBucket: "chattube2.appspot.com",
  messagingSenderId: "735683423082",
  appId: "1:735683423082:web:aeb06202b6dcfbe9141313",
  measurementId: "G-FBWEW18JF7"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();

export default app;
