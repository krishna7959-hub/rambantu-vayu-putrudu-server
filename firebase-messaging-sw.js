importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyDExlU66IL0hE1H-DDkmok_IpkBm-haTqg",
  authDomain: "rambantu-vayu-putrudu.firebaseapp.com",
  projectId: "rambantu-vayu-putrudu",
  storageBucket: "rambantu-vayu-putrudu.firebasestorage.app",
  messagingSenderId: "285095305794",
  appId: "1:285095305794:web:dddf323e583c21ced303db"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  self.registration.showNotification(payload.notification.title, {
    body: payload.notification.body,
    icon: "/icon-192.png"
  });
});