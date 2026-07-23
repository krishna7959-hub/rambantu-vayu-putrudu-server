import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";
import { getMessaging } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging.js";
import { getToken } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging.js";
const firebaseConfig = {
  apiKey: "AIzaSyDExlU66IL0hE1H-DDkmok_IpkBm-haTqg",
  authDomain: "rambantu-vayu-putrudu.firebaseapp.com",
  projectId: "rambantu-vayu-putrudu",
  storageBucket: "rambantu-vayu-putrudu.firebasestorage.app",
  messagingSenderId: "285095305794",
  appId: "1:285095305794:web:dddf323e583c21ced303db"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const storage = getStorage(app);
export const messaging = getMessaging(app);
export { getToken };