import {
  signInWithPopup,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  auth,
  googleProvider
} from "./firebase.js";


const loginBtn =
  document.getElementById("loginBtn");


// =========================================
// AUTHORIZED ADMIN UIDs
// =========================================

const ADMIN_UIDS = [
  "dGNNq3QH2QfP5fe9P5lct5gHw073",
  "Y0q7rzVUL2Xdanjpce1QqxsLf5k2"
];


// =========================================
// GOOGLE ADMIN LOGIN
// =========================================

loginBtn.addEventListener(
  "click",
  async () => {

    const msg =
      document.getElementById("msg");

    try {

      msg.innerText =
        "🔐 Google Login జరుగుతోంది...";


      const result =
        await signInWithPopup(
          auth,
          googleProvider
        );


      const user =
        result.user;


      // =================================
      // ADMIN UID CHECK
      // =================================

      if (
        !ADMIN_UIDS.includes(
          user.uid
        )
      ) {

        await signOut(auth);

        msg.innerText =
          "❌ ఈ Google accountకు Admin access లేదు.";

        return;

      }


      // =================================
      // ADMIN LOGIN SUCCESS
      // =================================

      window.location.href =
        "admin.html";

    }

    catch (error) {

      console.error(
        "Admin Login Error:",
        error
      );


      msg.innerText =
        "❌ Login కాలేదు. మళ్లీ ప్రయత్నించండి.";

    }

  }
);
