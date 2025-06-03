// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/9.22.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.1/firebase-messaging-compat.js');

// Your Firebase config - get from Firebase Console (Project settings)
firebase.initializeApp({
 apiKey: "AIzaSyAJDYjp3tPVe0MOu4NjooDlLWvmGVT_TLc",
  authDomain: "pump-fbc53.firebaseapp.com",
  projectId: "pump-fbc53",
  storageBucket: "pump-fbc53.firebasestorage.app",
  messagingSenderId: "434950723615",
  appId: "1:434950723615:web:34c66960cece4cec83dd2a"
});

// Retrieve firebase messaging
const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
