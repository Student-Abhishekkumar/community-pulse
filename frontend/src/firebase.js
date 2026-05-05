import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Your web app's Firebase configuration
// Replace these with your actual config from Firebase console
const firebaseConfig = {
  apiKey: "AIzaSyBKlkDiUjS6xhmk8xGEYNV7YvAKKqA1T6w",
  authDomain: "community-pulse-f05e9.firebaseapp.com",
  projectId: "community-pulse-f05e9",
  storageBucket: "community-pulse-f05e9.firebasestorage.app",
  messagingSenderId: "900658400176",
  appId: "1:900658400176:web:e86e81fd6384448b75e475",
//   measurementId: "G-GT178RQLQN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export auth instance
export const auth = getAuth(app);