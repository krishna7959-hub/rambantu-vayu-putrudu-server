const admin = require("firebase-admin");
const { onRequest } = require("firebase-functions/https");

admin.initializeApp();

exports.sendNotification = onRequest(async (req, res) => {
  try {
    const { title, body, image } = req.body;

    const db = admin.firestore();

    const snapshot = await db.collection("fcmTokens").get();

    const tokens = [];

    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.token) {
        tokens.push(data.token);
      }
    });

    if (tokens.length === 0) {
      return res.status(200).send("No tokens found");
    }

    const message = {
      notification: {
        title: title,
        body: body
      },
      data: {
        image: image || ""
      },
      tokens: tokens
    };

    const response = await admin.messaging().sendEachForMulticast(message);

    return res.status(200).json(response);

  } catch (err) {
    console.error(err);
    return res.status(500).send(err.toString());
  }
});