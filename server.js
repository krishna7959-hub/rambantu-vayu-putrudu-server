const admin = require("firebase-admin");

admin.initializeApp({
  credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
});

const db = admin.firestore();

const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.post("/send", async (req, res) => {
  try {
    console.log("Received:", req.body);

    // Firestore నుంచి అన్ని Subscription IDs తీసుకోండి
    const snapshot = await db.collection("subscriptions").get();

    const ids = [];
    snapshot.forEach((doc) => {
      ids.push(doc.id);
    });

    console.log("Subscription IDs:", ids);

    if (ids.length === 0) {
      return res.json({
        success: false,
        message: "No subscriptions found."
      });
    }

    const response = await fetch(
      "https://api.onesignal.com/notifications?c=push",
      {
        method: "POST",
        headers: {
          "Authorization": `Key ${process.env.ONESIGNAL_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          app_id: process.env.ONESIGNAL_APP_ID,
          include_subscription_ids: ids,
          headings: {
            en: req.body.title
          },
          contents: {
            en: req.body.message
          },
          target_channel: "push",
          url: req.body.url
        })
      }
    );

    const data = await response.json();

    console.log("OneSignal Response:", data);

    res.json(data);

  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err.message
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on", PORT);
});