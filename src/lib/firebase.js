import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBKFfEogMnOeuYBSU617mDJpGCffjWN37Q",
  authDomain: "blog-fc769.firebaseapp.com",
  projectId: "blog-fc769",
  storageBucket: "blog-fc769.firebasestorage.app",
  messagingSenderId: "462530324855",
  appId: "1:462530324855:web:1663ab7004c8dd8b41d972",
  measurementId: "G-Z11DPDKCS2",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
