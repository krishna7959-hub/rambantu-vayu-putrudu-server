import {
  db,
  auth,
  googleProvider
} from "./firebase.js";

import {
  signInWithPopup,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  addDoc,
  query,
  where,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
// =========================================
// Google Login
// =========================================

window.loginWithGoogle = async function () {

  try {

    await signInWithPopup(
      auth,
      googleProvider
    );

  }

  catch (error) {

    console.error(
      "Google Login Error:",
      error
    );

    alert(
      "Google Login కాలేదు. మళ్ళీ ప్రయత్నించండి."
    );

  }

};

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


        <!-- =================================
             COMMENTS
        ================================== -->

        <hr>


        <h2>
          💬 Comments
        </h2>


        <div class="comment-box">

  <div id="loginBox">

    <button
      id="googleLoginBtn"
      onclick="loginWithGoogle()">

      🔵 Sign in with Google

    </button>

  </div>


  <div id="commentForm" style="display:none;">

    <p id="loggedInUser"></p>

    <textarea
      id="commentText"
      placeholder="Write your comment..."
      rows="4"
      maxlength="500"
    ></textarea>

    <button
      id="postCommentBtn"
      onclick="postComment()">

      💬 Post Comment

    </button>

  </div>

</div>

        <div id="commentsList">

          <p>
            Loading comments...
          </p>

        </div>


        <!-- =================================
             RELATED NEWS
        ================================== -->

        <hr>


        <h2>
          📰 Related News
        </h2>


        <div id="relatedNews"></div>

      </div>

    `;


    // Store current news globally
    window.currentNews = news;


    // Load comments
    loadComments(id);


    // Load related news
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


  const news =
    window.currentNews;


  const shareUrl =
    window.location.href;


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

    const imageUrl =
      news.image;


    if (imageUrl) {

      const img =
        new Image();


      img.crossOrigin =
        "anonymous";


      img.src =
        imageUrl;


      img.onload =
        async function () {

          const canvas =
            document.createElement(
              "canvas"
            );


          canvas.width =
            img.naturalWidth;


          canvas.height =
            img.naturalHeight;


          const ctx =
            canvas.getContext(
              "2d"
            );


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
              Math.floor(
                canvas.width * 0.035
              )
            );


          ctx.font =
            "bold " +
            fontSize +
            "px Arial";


          const watermark =
            "Rambantu Vayu Putrudu";


          const textWidth =
            ctx.measureText(
              watermark
            ).width;


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

        };


      img.onerror =
        function () {

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
// POST COMMENT
// =========================================

window.postComment = async function () {

  const nameInput =
    document.getElementById(
      "commentName"
    );


  const textInput =
    document.getElementById(
      "commentText"
    );


  const button =
    document.getElementById(
      "postCommentBtn"
    );


  if (!nameInput || !textInput) {
    return;
  }


  const name =
    nameInput.value.trim();


  const text =
    textInput.value.trim();


  if (!name) {

    alert(
      "దయచేసి మీ పేరు నమోదు చేయండి."
    );

    nameInput.focus();

    return;

  }


  if (!text) {

    alert(
      "దయచేసి Comment నమోదు చేయండి."
    );

    textInput.focus();

    return;

  }


  if (!id) {

    alert(
      "News ID కనుగొనబడలేదు."
    );

    return;

  }


  try {

    button.disabled =
      true;


    button.innerText =
      "Posting...";


    await addDoc(
      collection(
        db,
        "comments"
      ),
      {

        newsId: id,

        name: name,

        text: text,

        createdAt:
          serverTimestamp()

      }
    );


    nameInput.value =
      "";


    textInput.value =
      "";


    alert(
      "Comment విజయవంతంగా Post అయింది."
    );


    await loadComments(id);


  }

  catch (error) {

    console.error(
      "Comment Error:",
      error
    );


    alert(
      "Comment Post కాలేదు. మళ్ళీ ప్రయత్నించండి."
    );

  }


  finally {

    button.disabled =
      false;


    button.innerText =
      "💬 Post Comment";

  }

};


// =========================================
// LOAD COMMENTS
// =========================================

async function loadComments(
  newsId
) {

  const commentsList =
    document.getElementById(
      "commentsList"
    );


  if (!commentsList) {
    return;
  }


  commentsList.innerHTML =
    "<p>Loading comments...</p>";


  try {

    const commentsQuery =
      query(
        collection(
          db,
          "comments"
        ),

        where(
          "newsId",
          "==",
          newsId
        ),

        orderBy(
          "createdAt",
          "desc"
        )
      );


    const snapshot =
      await getDocs(
        commentsQuery
      );


    if (snapshot.empty) {

      commentsList.innerHTML = `
        <p class="no-comments">
          ఇంకా Comments లేవు. మొదటి Comment మీరే చేయండి. 🙂
        </p>
      `;

      return;

    }


    let html = "";


    snapshot.forEach(
      (commentDoc) => {

        const comment =
          commentDoc.data();


        let dateText =
          "";


        if (comment.createdAt) {

          const date =
            comment.createdAt.toDate();


          dateText =
            date.toLocaleString(
              "en-IN"
            );

        }


        html += `

          <div class="comment-card">

            <div class="comment-header">

              <strong>
                👤 ${escapeHTML(
                  comment.name || "User"
                )}
              </strong>

              <span class="comment-date">
                ${dateText}
              </span>

            </div>


            <p class="comment-text">
              ${escapeHTML(
                comment.text || ""
              )}
            </p>

          </div>

        `;

      }
    );


    commentsList.innerHTML =
      html;

  }

  catch (error) {

    console.error(
      "Load Comments Error:",
      error
    );


    commentsList.innerHTML = `
      <p class="comments-error">
        Comments Load కాలేదు.
      </p>
    `;

  }

}


// =========================================
// SECURITY
// Escape User Comments
// =========================================

function escapeHTML(
  text
) {

  const div =
    document.createElement(
      "div"
    );


  div.textContent =
    text;


  return div.innerHTML;

}


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