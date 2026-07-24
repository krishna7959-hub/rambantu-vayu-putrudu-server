const express = require("express");
const cors = require("cors");
const OneSignal = require("onesignal-node");

const app = express();

app.use(cors());
app.use(express.json());

const client = new OneSignal.Client(
  "ca312fa3-511f-4b36-ab0e-8d774ab70cfc",
  process.env.ONESIGNAL_API_KEY
);
app.post("/send", async (req, res) => {
console.log("Received /send request");
console.log(req.body);
  try {
    const notification = {
      contents: {
        en: req.body.message
      },
      headings: {
        en: req.body.title
      },
      included_segments: ["Subscribed Users"],
      url: req.body.url
    };

    const response = await client.createNotification(notification);
console.log("OneSignal Response:", response);
    res.json(response);

  } catch (err) {
  console.error("OneSignal Error:", err);
  res.status(500).json(err);
}
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});