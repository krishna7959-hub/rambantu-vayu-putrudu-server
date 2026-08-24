import { db } from "./firebase.js";

import {
  collection,
  getDocs,
  query,
  orderBy,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


let allNews = [];


// =========================================
// Load News
// =========================================

async function loadNews() {

  try {

    const q = query(
      collection(db, "news"),
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(q);

    console.log(
      "Documents Count:",
      snapshot.size
    );

    allNews = [];

    snapshot.forEach((newsDoc) => {

      allNews.push({
        id: newsDoc.id,
        ...newsDoc.data()
      });

    });

    loadFeaturedNews();

    displayNews(allNews);

    loadBreakingNews();

  } catch (err) {

    console.error(
      "News Load Error:",
      err
    );

    const container =
      document.getElementById(
        "newsContainer"
      );

    if (container) {

      container.innerHTML =
        "<h3>వార్తలు లోడ్ కాలేదు</h3>";

    }

  }

}


// =========================================
// Share News
// =========================================

window.shareNews =
  function (event, id, title) {

    // Prevent opening news page
    if (event) {
      event.stopPropagation();
    }

    const url =
      window.location.origin +
      "/news.html?id=" +
      encodeURIComponent(id);

    const text =
      title || "Rambantu Vayu Putrudu News";


    // -----------------------------------------
    // WhatsApp
    // -----------------------------------------

    const whatsapp =
      "https://wa.me/?text=" +
      encodeURIComponent(
        text + "\n\n" + url
      );


    // -----------------------------------------
    // Facebook
    // -----------------------------------------

    const facebook =
      "https://www.facebook.com/sharer/sharer.php?u=" +
      encodeURIComponent(url);


    // -----------------------------------------
    // X
    // -----------------------------------------

    const x =
      "https://twitter.com/intent/tweet?text=" +
      encodeURIComponent(text) +
      "&url=" +
      encodeURIComponent(url);


    // -----------------------------------------
    // Telegram
    // -----------------------------------------

    const telegram =
      "https://t.me/share/url?url=" +
      encodeURIComponent(url) +
      "&text=" +
      encodeURIComponent(text);


    // -----------------------------------------
    // Open Share Window
    // -----------------------------------------

    const shareWindow =
      window.open(
        "",
        "shareWindow",
        "width=420,height=500"
      );


    if (!shareWindow) {

      alert(
        "Popup blocked. Please allow popups for this website."
      );

      return;

    }


    shareWindow.document.write(`

      <!DOCTYPE html>

      <html>

      <head>

        <meta charset="UTF-8">

        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0"
        >

        <title>Share News</title>

        <style>

          body {

            font-family:
              Arial,
              sans-serif;

            text-align:
              center;

            padding:
              30px;

            background:
              #f5f5f5;

          }


          h2 {

            margin-bottom:
              25px;

          }


          .share-btn {

            display:
              block;

            width:
              90%;

            max-width:
              320px;

            margin:
              12px auto;

            padding:
              14px;

            border:
              none;

            border-radius:
              8px;

            font-size:
              17px;

            font-weight:
              bold;

            text-decoration:
              none;

            cursor:
              pointer;

          }


          .whatsapp {

            background:
              #25D366;

            color:
              white;

          }


          .facebook {

            background:
              #1877F2;

            color:
              white;

          }


          .x {

            background:
              #000000;

            color:
              white;

          }


          .telegram {

            background:
              #229ED9;

            color:
              white;

          }


          .copy {

            background:
              #555;

            color:
              white;

          }

        </style>

      </head>


      <body>

        <h2>📤 Share News</h2>


        <a
          class="share-btn whatsapp"
          href="${whatsapp}"
          target="_blank"
        >
          🟢 Share on WhatsApp
        </a>


        <a
          class="share-btn facebook"
          href="${facebook}"
          target="_blank"
        >
          🔵 Share on Facebook
        </a>


        <a
          class="share-btn x"
          href="${x}"
          target="_blank"
        >
          ⚫ Share on X
        </a>


        <a
          class="share-btn telegram"
          href="${telegram}"
          target="_blank"
        >
          🔷 Share on Telegram
        </a>


        <button
          class="share-btn copy"
          onclick="copyLink()"
        >
          🔗 Copy Link
        </button>


        <script>

          function copyLink() {

            navigator.clipboard.writeText(
              ${JSON.stringify(url)}
            );

            alert(
              "News link copied!"
            );

          }

        <\/script>


      </body>

      </html>

    `);

    shareWindow.document.close();

  };


// =========================================
// Featured News
// =========================================

function loadFeaturedNews() {

  const featured =
    document.getElementById(
      "featuredNews"
    );

  if (!featured) {
    return;
  }

  if (allNews.length === 0) {

    featured.innerHTML = "";

    return;

  }

  const news =
    allNews[0];


  featured.innerHTML = `

    <div
      class="news-card"
      onclick="location.href='news.html?id=${news.id}'"
    >

      <img
        src="${news.image || ""}"
        alt=""
      >

      <div class="news-content">

        <h3>
          ${news.title || ""}
        </h3>

        <p>
          ${(news.details || "").substring(0, 150)}...
        </p>


        <button
          class="share-news-btn"
          onclick="shareNews(event, '${news.id}', ${JSON.stringify(news.title || "")})"
        >
          📤 Share
        </button>

      </div>

    </div>

  `;

}


// =========================================
// Display News
// =========================================

function displayNews(newsList) {

  const container =
    document.getElementById("newsContainer");

  if (!container) {
    return;
  }

  let html = "";

  newsList.forEach((news) => {

    html += `

      <div
        class="news-card"
        onclick="location.href='news.html?id=${news.id}'"
      >

        <img
          src="${news.image || ""}"
          alt=""
        >

        <div class="news-content">

          <span class="category-badge">
            ${news.category || "News"}
          </span>

          <h3>
            ${news.title || ""}
          </h3>

          <p>
            ${(news.details || "").substring(0, 120)}...
          </p>

          <button
            class="share-btn"
            onclick="event.stopPropagation(); shareNews('${news.id}')"
          >
            📤 Share
          </button>

        </div>

      </div>

    `;

  });

  container.innerHTML = html;

}


// =========================================
// Share News
// =========================================

window.shareNews = async function(newsId) {

  const news =
    allNews.find(
      item => item.id === newsId
    );

  if (!news) {
    return;
  }

  const shareUrl =
    window.location.origin +
    "/news.html?id=" +
    newsId;

  const shareData = {

    title:
      news.title ||
      "Rambantu Vayu Putrudu",

    text:
      (news.title || "") +
      "\n\nRambantu Vayu Putrudu",

    url:
      shareUrl

  };


  if (
    navigator.share &&
    navigator.canShare &&
    navigator.canShare(shareData)
  ) {

    try {

      await navigator.share(
        shareData
      );

    } catch (error) {

      console.log(
        "Share cancelled:",
        error
      );

    }

    return;
  }


  // WhatsApp fallback

  const whatsappUrl =
    "https://wa.me/?text=" +
    encodeURIComponent(
      (news.title || "") +
      "\n\n" +
      shareUrl
    );

  window.open(
    whatsappUrl,
    "_blank"
  );

};

// =========================================
// Breaking News
// =========================================

async function loadBreakingNews() {

  const breakingElement =
    document.getElementById(
      "breakingText"
    );

  if (!breakingElement) {
    return;
  }


  try {

    const breakingDoc =
      await getDoc(
        doc(
          db,
          "settings",
          "breaking"
        )
      );


    if (
      breakingDoc.exists()
    ) {

      const data =
        breakingDoc.data();


      if (
        data.text &&
        data.text.trim() !== ""
      ) {

        breakingElement.innerHTML =
          "🚨 " + data.text;

        return;

      }

    }

  } catch (error) {

    console.error(
      "Breaking News Error:",
      error
    );

  }


  // =======================================
  // If no Breaking News,
  // show Latest News
  // =======================================

  const breaking =
    allNews
      .slice(0, 10)
      .map(
        (news) =>
          "🔴 " + news.title
      )
      .join(
        " &nbsp;&nbsp;&nbsp;&nbsp; "
      );


  breakingElement.innerHTML =
    breaking;

}


// =========================================
// Category Filter
// =========================================

window.filterNews =
  function (category) {

    if (category === "All") {

      displayNews(
        allNews
      );

      return;

    }


    const filtered =
      allNews.filter(
        (news) =>
          (news.category || "")
            .toLowerCase() ===
          category.toLowerCase()
      );


    displayNews(
      filtered
    );

  };


// =========================================
// Search News
// =========================================

window.searchNews =
  function () {

    const input =
      document.getElementById(
        "searchInput"
      );

    if (!input) {
      return;
    }


    const keyword =
      input.value
        .toLowerCase()
        .trim();


    const filtered =
      allNews.filter(
        (news) =>

          (news.title || "")
            .toLowerCase()
            .includes(keyword)

          ||

          (news.details || "")
            .toLowerCase()
            .includes(keyword)
      );


    displayNews(
      filtered
    );

  };


// =========================================
// Back To Top
// =========================================

const topBtn =
  document.getElementById(
    "topBtn"
  );


window.onscroll =
  function () {

    if (!topBtn) {
      return;
    }


    if (
      document.body.scrollTop > 300 ||
      document.documentElement.scrollTop > 300
    ) {

      topBtn.style.display =
        "block";

    } else {

      topBtn.style.display =
        "none";

    }

  };


window.topFunction =
  function () {

    window.scrollTo({

      top: 0,

      behavior: "smooth"

    });

  };


// =========================================
// Start
// =========================================

loadNews();