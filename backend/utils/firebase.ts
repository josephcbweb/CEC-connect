
import * as admin from 'firebase-admin';
import path from 'path';

let isInitialized = false;

export const initializeFirebase = () => {
  if (isInitialized) return;

  try {
    // You must place your serviceAccountKey.json in the backend root or config folder
    // Alternatively, use connection string or environment variables
    const serviceAccountPath = path.join(__dirname, '../../serviceAccountKey.json');
    
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
         const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
         admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
          });
          isInitialized = true;
          console.log("Firebase Admin initialized with env variable");
    } else {
        // Check if file exists to avoid crash
        // For development, you can mock or skip if file missing
        try {
             const serviceAccount = require(serviceAccountPath);
             admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
              });
              isInitialized = true;
               console.log("Firebase Admin initialized with serviceAccountKey.json");
        } catch (e) {
            console.warn("Firebase serviceAccountKey.json not found. Push notifications will not work.");
        }
    }
  } catch (error) {
    console.error("Firebase initialization failed:", error);
  }
};

export const getMessaging = () => {
    if (!isInitialized) initializeFirebase();
    if (!isInitialized) return null; // Or throw error
    return admin.messaging();
};
