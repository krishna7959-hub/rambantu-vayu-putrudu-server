const express = require("express");
const cors = require("cors");
const OneSignal = require("onesignal-node");

const app = express();

app.use(cors());
app.use(express.json());

/* =========================================
   ONESIGNAL
========================================= */

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

      included_segments: [
        "Subscribed Users"
      ],

      target_channel: "push",

      url: req.body.url
    };

    console.log("Notification Object:", notification);

    const response = await client.createNotification(notification);

    console.log("OneSignal Response:", response);

    res.json(response);

  } catch (err) {

    console.error("OneSignal Error:", err);

    res.status(500).json(err);

  }

});


/* =========================================
   DYNAMIC SITEMAP
========================================= */

app.get("/sitemap.xml", async (req, res) => {

  try {

    const projectId = "rambantu-vayu-putrudu";

    const apiKey =
      process.env.FIREBASE_API_KEY ||
      "AIzaSyDExlU66IL0hE1H-DDkmok_IpkBm-haTqg";

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
   SERVER
========================================= */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {

  console.log(
    `Server running on port ${PORT}`
  );

});