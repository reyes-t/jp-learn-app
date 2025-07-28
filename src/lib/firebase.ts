
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';

const firebaseConfig = {
  "projectId": "japanese-learning-xapme",
  "appId": "1:30102578771:web:f413b34814d6b9a78fc8a6",
  "storageBucket": "japanese-learning-xapme.firebasestorage.app",
  "apiKey": "AIzaSyC4IPWCodM34cJ1THHQgVSebuKl31CuGVQ",
  "authDomain": "japanese-learning-xapme.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "30102578771"
};

// Initialize Firebase
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const auth: Auth = getAuth(app);

export { app, auth };
