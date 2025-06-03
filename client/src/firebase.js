// src/firebase.js
import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyAJDYjp3tPVe0MOu4NjooDlLWvmGVT_TLc",
  authDomain: "pump-fbc53.firebaseapp.com",
  projectId: "pump-fbc53",
  storageBucket: "pump-fbc53.firebasestorage.app",
  messagingSenderId: "434950723615",
  appId: "1:434950723615:web:34c66960cece4cec83dd2a",
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

export const requestForToken = async () => {
  try {
    const currentToken = await getToken(messaging, {
      vapidKey:
        "BNo0oAqUSaRLnEC033L4aGS8Vd0-hISt8TJSq7iHvO2TkrE8JphT5NOvwG7guh83sS8d-yNK0vZot4cAZunwbp0",
    });
    if (currentToken) {
      console.log("FCM token:", currentToken);
      return currentToken;
    } else {
      console.log(
        "No registration token available. Request permission to generate one."
      );
      return null;
    }
  } catch (error) {
    console.error("An error occurred while retrieving token. ", error);
    return null;
  }
};

export const onMessageListener = () =>
  new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });
