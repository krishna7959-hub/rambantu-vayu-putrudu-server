const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

const express = require("express");
const cors = require("cors");

// ------------------------------------
// Firebase Admin
// ------------------------------------

initializeApp({
  credential: cert(
    JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  )
});

const db = getFirestore();

// ------------------------------------
// Express
// ------------------------------------

const app = express();

app.use(cors());
app.use(express.json());

// ------------------------------------
// Health Check
// ------------------------------------

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Rambantu Vayu Putrudu Notification Server is running."
  });
});

// ------------------------------------
// Send Push Notification
// ------------------------------------

app.post("/send", async (req, res) => {

  try {

    console.log("=================================");
    console.log("Notification Request Received");
    console.log("=================================");

    console.log("Request Body:", req.body);

    const title = String(req.body.title || "").trim();
    const message = String(req.body.message || "").trim();
    const url = String(
      req.body.url || "https://rambantu-vayu-putrudu.web.app"
    ).trim();

    if (!title || !message) {

      return res.status(400).json({
        success: false,
        message: "Title and message are required."
      });

    }

    // --------------------------------
    // Get OneSignal Subscription IDs
    // --------------------------------

    const snapshot = await db
      .collection("subscriptions")
      .get();

    const subscriptionIds = [];

    snapshot.forEach((doc) => {

      const data = doc.data();

      // Preferred field:
      // subscriptionId
      //
      // Fallback:
      // document ID

      const subscriptionId =
        data.subscriptionId || doc.id;

      if (subscriptionId) {
        subscriptionIds.push(subscriptionId);
      }

    });

    console.log(
      "OneSignal Subscription IDs:",
      subscriptionIds
    );

    // --------------------------------
    // No Subscribers
    // --------------------------------

    if (subscriptionIds.length === 0) {

      return res.json({
        success: false,
        message: "No OneSignal subscriptions found.",
        count: 0
      });

    }

    // --------------------------------
    // OneSignal API
    // --------------------------------

    const response = await fetch(
      "https://api.onesignal.com/notifications?c=push",
      {
        method: "POST",

        headers: {
          "Authorization":
            `Key ${process.env.ONESIGNAL_API_KEY}`,

          "Content-Type":
            "application/json"
        },

        body: JSON.stringify({

          app_id:
            process.env.ONESIGNAL_APP_ID,

          include_subscription_ids:
            subscriptionIds,

          headings: {
            en: title
          },

          contents: {
            en: message
          },

          target_channel:
            "push",

          url: url

        })
      }
    );

    // --------------------------------
    // OneSignal Response
    // --------------------------------

    const data = await response.json();

    console.log(
      "OneSignal HTTP Status:",
      response.status
    );

    console.log(
      "OneSignal Response:",
      data
    );

    // --------------------------------
    // API Error
    // --------------------------------

    if (!response.ok) {

      return res.status(response.status).json({

        success: false,

        message:
          "OneSignal API returned an error.",

        onesignal: data

      });

    }

    // --------------------------------
    // Success
    // --------------------------------

    return res.json({

      success: true,

      message:
        "Notification sent successfully.",

      subscriptionCount:
        subscriptionIds.length,

      onesignal:
        data

    });

  } catch (error) {

    console.error(
      "Notification Server Error:",
      error
    );

    return res.status(500).json({

      success: false,

      error:
        error.message

    });

  }

});

// ------------------------------------
// Start Server
// ------------------------------------

const PORT =
  process.env.PORT || 3000;

app.listen(PORT, () => {

  console.log(
    `Server running on port ${PORT}`
  );

});