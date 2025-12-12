import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyDbmroJMKue8LPZxJi2fTqRrWiOEyipp7E",
  authDomain: "talwit-5ac9b.firebaseapp.com",
  projectId: "talwit-5ac9b",
  storageBucket: "talwit-5ac9b.firebasestorage.app",
  messagingSenderId: "329578663510",
  appId: "1:329578663510:web:32a27cd8522ceab3f6b5f7"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firebase Authentication and get a reference to the service
// Firebase Auth automatically persists authentication state in localStorage by default
// This means users will stay logged in across browser sessions until they explicitly log out
export const auth = getAuth(app)

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app)

export default app

