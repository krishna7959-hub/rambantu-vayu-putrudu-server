const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.post("/send", async (req, res) => {
  try {
    console.log("Received:", req.body);

    const response = await fetch("https://api.onesignal.com/notifications?c=push", {
      method: "POST",
      headers: {
        "Authorization": `Key ${process.env.ONESIGNAL_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
  app_id: process.env.ONESIGNAL_APP_ID,

  include_subscription_ids: [
    "1017fe4d-bc3d-479b-94c3-cdad394d5b00"
  ],

  headings: {
    en: req.body.title
  },
  contents: {
    en: req.body.message
  },
  target_channel: "push",
  url: req.body.url
})
});

const data = await response.json();

    console.log("OneSignal Response:", data);

    res.json(data);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on", PORT);
});