import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyBAhpWdYeNsbdGn1NFe7nCSxSWoKjZ0SqQ',
  authDomain: 'analog-ace-458917-c7.firebaseapp.com',
  projectId: 'analog-ace-458917-c7',
  storageBucket: 'analog-ace-458917-c7.firebasestorage.app',
  messagingSenderId: '1081535716140',
  appId: '1:1081535716140:web:d7aa27dce89b5edf55aa89',
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const db = getFirestore(app);

export { auth, googleProvider, db }; 