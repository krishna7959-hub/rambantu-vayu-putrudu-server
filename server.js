const express = require("express");
const cors = require("cors");

const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { getAuth } = require("firebase-admin/auth");

const app = express();

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

initializeApp({
  credential: cert(serviceAccount)
});

async function requireAdmin(req, res, next) {
  try {
    const header = req.get("authorization") || "";

    if (!header.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    const idToken = header.slice(7).trim();

    if (!idToken || idToken.length > 10000) {
      return res.status(401).json({ success: false, message: "Invalid authentication token" });
    }

    const decoded = await getAuth().verifyIdToken(idToken);

    const adminUIDs = [
      "dGNNq3QH2QfP5fe9P5lct5gHw073",
      "Y0q7rzVUL2Xdanjpce1QqxsLf5k2"
    ];

    if (!adminUIDs.includes(decoded.uid)) {
      return res.status(403).json({ success: false, message: "Admin access required" });
    }

    req.adminUid = decoded.uid;
    return next();

  } catch (error) {
    console.error("Admin authentication failed");
    return res.status(401).json({ success: false, message: "Invalid authentication token" });
  }
}

const sendAttempts = new Map();

function rateLimitSend(ip) {
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxAttempts = 10;

  const entry = sendAttempts.get(ip) || { start: now, count: 0 };

  if (now - entry.start >= windowMs) {
    entry.start = now;
    entry.count = 0;
  }

  entry.count += 1;
  sendAttempts.set(ip, entry);

  return entry.count <= maxAttempts;
}

app.use(cors({ origin: ["https://rambantu-vayu-putrudu.web.app", "https://rambantu-vayu-putrudu.firebaseapp.com"], methods: ["GET", "POST"], allowedHeaders: ["Content-Type", "Authorization"] }));
app.use(express.json({ limit: "20kb" }));

/* =========================================
   ONESIGNAL
========================================= */

app.post("/send", requireAdmin, async (req, res) => {
  if (!rateLimitSend(req.ip)) {
    return res.status(429).json({
      success: false,
      message: "Too many notification requests"
    });
  }


  const title = typeof req.body?.title === "string" ? req.body.title.trim() : "";
  const message = typeof req.body?.message === "string" ? req.body.message.trim() : "";
  const url = typeof req.body?.url === "string" ? req.body.url.trim() : "";

  if (!title || title.length > 200 || !message || message.length > 500) {
    return res.status(400).json({
      success: false,
      message: "Invalid notification content"
    });
  }

  const allowedUrl =
    url === "https://rambantu-vayu-putrudu.web.app" ||
    url === "https://rambantu-vayu-putrudu.web.app/";

  if (!allowedUrl) {
    return res.status(400).json({
      success: false,
      message: "Invalid notification URL"
    });
  }

  try {

    const response = await fetch(
      "https://api.onesignal.com/notifications",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "Authorization": `Key ${process.env.ONESIGNAL_API_KEY}`
        },

        body: JSON.stringify({
          app_id: "ca312fa3-511f-4b36-ab0e-8d774ab70cfc",
          target_channel: "push",
          included_segments: ["Active Subscriptions"],

          headings: {
            en: title
          },

          contents: {
            en: message
          },

          url: url
        })
      }
    );

    const data = await response.json();

    console.log("OneSignal HTTP Status:", response.status);
    console.log("OneSignal Response:", data);

    if (!response.ok || !data.id) {
      return res.status(502).json({
        success: false,
        message: "OneSignal did not create notification",
        details: data
      });
    }

    res.json({
      success: true,
      id: data.id
    });

  } catch (err) {

    console.error("OneSignal Error:", err);

    res.status(500).json({
      success: false,
      message: "Notification send failed"
    });

  }

});

/* =========================================
   DYNAMIC SITEMAP
========================================= */

app.get("/sitemap.xml", async (req, res) => {

  try {

    const projectId = "rambantu-vayu-putrudu";

    const apiKey =
      process.env.FIREBASE_API_KEY;

    const firestoreURL =
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/news?key=${apiKey}`;

    console.log("Creating dynamic sitemap...");

    const response = await fetch(firestoreURL);

    if (!response.ok) {

      throw new Error(
        `Firestore request failed: ${response.status}`
      );

    }

    const data = await response.json();

    const documents = data.documents || [];

    const siteURL =
      "https://rambantu-vayu-putrudu.web.app";

    let urls = "";

    /* Homepage */

    urls += `
    <url>
      <loc>${siteURL}/</loc>
      <changefreq>daily</changefreq>
      <priority>1.0</priority>
    </url>`;

    /* News Articles */

    documents.forEach((doc) => {

      const documentName = doc.name || "";

      const newsId =
        documentName.split("/").pop();

      if (!newsId) return;

      let lastmod = "";

      if (
        doc.fields &&
        doc.fields.createdAt &&
        doc.fields.createdAt.timestampValue
      ) {

        lastmod =
          doc.fields.createdAt.timestampValue
            .split("T")[0];

      }

      urls += `
      <url>

        <loc>${siteURL}/news.html?id=${encodeURIComponent(newsId)}</loc>

        ${
          lastmod
            ? `<lastmod>${lastmod}</lastmod>`
            : ""
        }

        <changefreq>weekly</changefreq>

        <priority>0.8</priority>

      </url>`;

    });

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>

<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">

${urls}

</urlset>`;

    res.set("Content-Type", "application/xml");

    res.send(sitemap);

    console.log(
      `Sitemap created successfully. News count: ${documents.length}`
    );

  } catch (error) {

    console.error("Sitemap Error:", error);

    res.status(500).send(
      "Sitemap generation failed"
    );

  }

});


/* =========================================
   ROBOTS.TXT
========================================= */

app.get("/robots.txt", (req, res) => {

  res.type("text/plain");

  res.send(
`User-agent: *
Allow: /

Sitemap: https://rambantu-vayu-putrudu-server.onrender.com/sitemap.xml`
  );

});


/* =========================================
   NEWS VIEWS
========================================= */

const viewAttempts = new Map();

function rateLimitView(ip) {
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxAttempts = 30;

  const entry = viewAttempts.get(ip) || { start: now, count: 0 };

  if (now - entry.start >= windowMs) {
    entry.start = now;
    entry.count = 0;
  }

  entry.count += 1;
  viewAttempts.set(ip, entry);

  return entry.count <= maxAttempts;
}

app.post("/view", async (req, res) => {

  if (!rateLimitView(req.ip)) {
    return res.status(429).json({
      success: false,
      message: "Too many view requests"
    });
  }

  try {

    const newsId = req.body.newsId;

    if (!newsId || typeof newsId !== "string" || newsId.length > 200 || newsId.includes("/") || newsId.includes("\\")) {
      return res.status(400).json({
        success: false,
        message: "Invalid newsId"
      });
    }

    const newsRef = getFirestore()
      .collection("news")
      .doc(newsId);

    const newsSnap = await newsRef.get();

    if (!newsSnap.exists) {
      return res.status(404).json({
        success: false,
        message: "News not found"
      });
    }

    await newsRef.update({
      views: FieldValue.increment(1)
    });

    res.json({
      success: true
    });

  } catch (error) {

    console.error("View Counter Error:", error);

    res.status(500).json({
      success: false,
      message: "View count update failed"
    });

  }

});

/* =========================================
   SERVER
========================================= */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {

  console.log(
    `Server running on port ${PORT}`
  );

});