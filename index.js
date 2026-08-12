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

      </div>

    </div>

  `;

}


// =========================================
// Display News
// =========================================

function displayNews(newsList) {

  const container =
    document.getElementById(
      "newsContainer"
    );


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

        </div>

      </div>

    `;

  });


  container.innerHTML = html;

}


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