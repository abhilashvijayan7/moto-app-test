// src/hooks/usePushNotifications.js
import { useEffect } from "react";
import { requestForToken, onMessageListener } from "../firebase";

function usePushNotifications() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/firebase-messaging-sw.js")
        .then((registration) => {
          console.log("Service Worker registered:", registration);

          requestForToken().then((token) => {
            if (token) {
              // Send token to backend
              fetch("http://localhost:4000/save-token", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token }),
              });
            }
          });

          // Listen for foreground messages
          onMessageListener()
            .then((payload) => {
              console.log("Message received in foreground:", payload);
              alert(
                `🔔 ${payload.notification.title}\n${payload.notification.body}`
              );
            })
            .catch((err) => console.log("Message listener error:", err));
        });
    }
  }, []);
}

export default usePushNotifications;
