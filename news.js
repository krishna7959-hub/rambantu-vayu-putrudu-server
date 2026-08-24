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

window.shareCurrentNews = async function () {

  if (!window.currentNews) {
    return;
  }

  const news = window.currentNews;

  const shareUrl = window.location.href;

  const title =
    news.title ||
    "Rambantu Vayu Putrudu";

  const text =
    title +
    "\n\nRambantu Vayu Putrudu\n" +
    shareUrl;


  // =====================================
  // Create Share Image
  // =====================================

  try {

    const imageUrl = news.image;

    if (imageUrl) {

      const img = new Image();

      img.crossOrigin = "anonymous";

      img.src = imageUrl;

      img.onload = async function () {

        const canvas =
          document.createElement("canvas");

        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;

        const ctx =
          canvas.getContext("2d");

        ctx.drawImage(
          img,
          0,
          0,
          canvas.width,
          canvas.height
        );


        // =================================
        // Rambantu Vayu Putrudu Watermark
        // =================================

        const fontSize =
          Math.max(
            24,
            Math.floor(canvas.width * 0.035)
          );

        ctx.font =
          "bold " +
          fontSize +
          "px Arial";

        const padding = 20;

        const watermark =
          "Rambantu Vayu Putrudu";

        const textWidth =
          ctx.measureText(watermark).width;


        ctx.fillStyle =
          "rgba(0,0,0,0.65)";

        ctx.fillRect(
          20,
          canvas.height -
            fontSize -
            35,
          textWidth + 30,
          fontSize + 20
        );


        ctx.fillStyle =
          "#ffffff";

        ctx.fillText(
          watermark,
          35,
          canvas.height - 25
        );


        // =================================
        // Convert Image
        // =================================

        canvas.toBlob(
          async function (blob) {

            if (!blob) {
              fallbackShare();
              return;
            }


            const file =
              new File(
                [blob],
                "rambantu-vayu-putrudu-news.jpg",
                {
                  type: "image/jpeg"
                }
              );


            // =============================
            // Mobile Share
            // =============================

            if (
              navigator.share &&
              navigator.canShare &&
              navigator.canShare({
                files: [file]
              })
            ) {

              try {

                await navigator.share({

                  title: title,

                  text: text,

                  files: [file]

                });

                return;

              }

              catch (error) {

                console.log(
                  "Share cancelled:",
                  error
                );

              }

            }


            fallbackShare();

          },
          "image/jpeg",
          0.92
        );

        return;

      };


      img.onerror = function () {

        fallbackShare();

      };

      return;

    }

  }

  catch (error) {

    console.log(
      "Image share error:",
      error
    );

  }


  fallbackShare();


  // =====================================
  // Fallback Share
  // =====================================

  function fallbackShare() {

    if (navigator.share) {

      navigator.share({

        title: title,

        text: text,

        url: shareUrl

      });

      return;

    }


    const whatsappUrl =
      "https://wa.me/?text=" +
      encodeURIComponent(text);

    window.open(
      whatsappUrl,
      "_blank"
    );

  }

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