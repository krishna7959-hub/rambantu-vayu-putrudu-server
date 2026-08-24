import { db } from "./firebase.js";

import {
  doc,
  getDoc,
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


const params =
  new URLSearchParams(
    window.location.search
  );

const id =
  params.get("id");


const newsDetails =
  document.getElementById(
    "newsDetails"
  );


// =========================================
// Load News
// =========================================

async function loadNews() {

  if (!id) {

    newsDetails.innerHTML =
      "<h2>News Not Found</h2>";

    return;

  }


  const docRef =
    doc(
      db,
      "news",
      id
    );


  const docSnap =
    await getDoc(docRef);


  if (docSnap.exists()) {

    const news =
      docSnap.data();


    newsDetails.innerHTML = `

      <div class="card">

        <div class="news-image-container">

  <img
    src="${news.image || ""}"
    class="news-image"
  >

  <div class="news-watermark">
    Rambantu Vayu Putrudu
  </div>

</div>

        <h1>
          ${news.title || ""}
        </h1>


        <p class="news-date">

          📅 ${
            news.createdAt
              ? new Date(
                  news.createdAt.seconds * 1000
                ).toLocaleString("en-IN")
              : ""
          }

        </p>


        <p>
          ${news.details || ""}
        </p>


        <br>


        <button
          onclick="history.back()">

          ⬅ Back

        </button>


        <br><br>


        <button
          class="share-btn"
          onclick="shareCurrentNews()">

          📤 Share News

        </button>


        <hr>


        <h2>
          📰 Related News
        </h2>


        <div id="relatedNews"></div>

      </div>

    `;


    // Store current news globally
    window.currentNews = news;


    loadRelatedNews(id);

  }

  else {

    newsDetails.innerHTML =
      "<h2>News Not Found</h2>";

  }

}


// =========================================
// Share Current News
// =========================================

window.shareCurrentNews =
  async function() {

    if (!window.currentNews) {
      return;
    }


    const news =
      window.currentNews;


    const shareUrl =
      window.location.href;


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


    // =====================================
    // Native Mobile Share
    // =====================================

    if (
      navigator.share &&
      navigator.canShare &&
      navigator.canShare(shareData)
    ) {

      try {

        await navigator.share(
          shareData
        );

      }

      catch (error) {

        console.log(
          "Share cancelled:",
          error
        );

      }

      return;

    }


    // =====================================
    // Fallback WhatsApp
    // =====================================

    const whatsappUrl =
      "https://wa.me/?text=" +
      encodeURIComponent(
        news.title +
        "\n\n" +
        shareUrl
      );


    window.open(
      whatsappUrl,
      "_blank"
    );

  };


// =========================================
// Related News
// =========================================

async function loadRelatedNews(
  currentId
) {

  const snap =
    await getDocs(
      collection(
        db,
        "news"
      )
    );


  let html = "";

  let count = 0;


  snap.forEach(
    (newsDoc) => {

      if (
        newsDoc.id !== currentId &&
        count < 5
      ) {

        const n =
          newsDoc.data();


        html += `

          <div
            class="news-card"
            onclick="
              location.href='news.html?id=${newsDoc.id}'
            "
          >

            <img
              src="${n.image || ""}"
            >

            <div
              class="news-content"
            >

              <h3>
                ${n.title || ""}
              </h3>

            </div>

          </div>

        `;


        count++;

      }

    }
  );


  const related =
    document.getElementById(
      "relatedNews"
    );


  if (related) {

    related.innerHTML =
      html;

  }

}


// =========================================
// Start
// =========================================

loadNews();