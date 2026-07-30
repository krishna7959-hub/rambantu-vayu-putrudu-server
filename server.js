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
  include_subscription_ids: [
  "cd8c2b86-10a7-481a-9edd-87dff4c1273d",
  "6bc2b743-de26-4cb3-9c86-577a36ffe333"
],
  target_channel: "push",
  url: req.body.url
};
console.log("Notification Object:", notification);
    const response = await client.createNotification(notification);

console.log("Status:", response.statusCode);
console.log("Body:", response.body);

res.json(response.body);

  } catch (err) {
  console.error("OneSignal Error:", err);
  res.status(500).json(err);
}
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});