import {
  db,
  auth,
  googleProvider
} from "./firebase.js?v=20260831-2";

import {
  signInWithPopup,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  doc,
  getDoc,
  collection,
  getDocs,
  addDoc,
  query,
  where,
  serverTimestamp,
  updateDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// =========================================
// URL / NEWS ID
// =========================================

const params =
  new URLSearchParams(window.location.search);

const id = params.get("id");

const newsDetails =
  document.getElementById("newsDetails");


// =========================================
// REPLY STATE
// =========================================

let replyToId = null;


// =========================================
// GOOGLE LOGIN
// =========================================

window.loginWithGoogle = async function () {

  try {

    await signInWithPopup(
      auth,
      googleProvider
    );

  } catch (error) {

    console.error(
      "Google Login Error:",
      error
    );

    alert(
      "Google Login కాలేదు. మళ్ళీ ప్రయత్నించండి."
    );

  }

};


// =========================================
// COMMENT LOGIN UI
// =========================================

function updateCommentUI(user) {

  const loginBox =
    document.getElementById("loginBox");

  const commentForm =
    document.getElementById("commentForm");

  const loggedInUser =
    document.getElementById("loggedInUser");

  if (!loginBox || !commentForm) {
    return;
  }

  if (user) {

    loginBox.style.display = "none";

    commentForm.style.display = "block";

    if (loggedInUser) {

      loggedInUser.innerText =
        "👤 " +
        (
          user.displayName ||
          user.email ||
          "User"
        );

    }

  } else {

    loginBox.style.display = "block";

    commentForm.style.display = "none";

  }

}


// =========================================
// AUTH STATE
// =========================================

onAuthStateChanged(
  auth,
  function (user) {

    updateCommentUI(user);

    // Login అయిన తర్వాత comments మళ్ళీ render
    if (id) {
      loadComments(id);
    }

  }
);


// =========================================
// LOAD NEWS
// =========================================

async function loadNews() {
console.log("NEWS DEBUG: loadNews started");
console.log("NEWS DEBUG: News ID =", id);
  if (!id) {

    newsDetails.innerHTML =
      "<h2>News Not Found</h2>";

    return;

  }

  try {

    const docRef =
      doc(db, "news", id);

    const docSnap =
      await getDoc(docRef);

    if (!docSnap.exists()) {

      newsDetails.innerHTML =
        "<h2>News Not Found</h2>";

      return;

    }

    const news =
      docSnap.data();


    newsDetails.innerHTML = `

      <div class="card">

        <!-- NEWS IMAGE -->

        <div class="news-image-container">

          <img
            src="${escapeHTML(news.image || "")}"
            class="news-image"
          >

          <div class="news-watermark">
            Rambantu Vayu Putrudu
          </div>

        </div>


        <!-- NEWS TITLE -->

        <h1>
          ${escapeHTML(news.title || "")}
        </h1>


        <!-- NEWS DATE -->

        <p class="news-date">

          📅 ${
            news.createdAt &&
            news.createdAt.seconds
              ? new Date(
                  news.createdAt.seconds * 1000
                ).toLocaleString("en-IN")
              : ""
          }

        </p>

<!-- NEWS DETAILS -->

<div class="news-details">

  ${
    Array.isArray(news.sections) &&
    news.sections.length

      ? news.sections
          .map(section => `

            ${
              section.subheading
                ? `
                  <h3 class="news-subheading">
                    ${escapeHTML(
                      section.subheading
                    )}
                  </h3>
                `
                : ""
            }

            <p class="news-paragraph">
              ${escapeHTML(
                section.paragraph || ""
              )}
            </p>

          `)
          .join("")

      : `
          <p class="news-paragraph">
            ${escapeHTML(
              news.details || ""
            )}
          </p>
        `
  }

</div>

        <br>


        <!-- BACK -->

        <button onclick="history.back()">
          ⬅ Back
        </button>


        <br><br>


        <!-- SHARE -->

        <button
          class="share-btn"
          onclick="shareCurrentNews()">

          📤 Share News

        </button>


        <hr>


        <!-- COMMENTS -->

        <h2>
          💬 Comments
        </h2>


        <!-- LOGIN -->

        <div class="comment-box">

          <div id="loginBox">

            <button
              id="googleLoginBtn"
              onclick="loginWithGoogle()">

              🔵 Sign in with Google

            </button>

          </div>


          <!-- COMMENT FORM -->

          <div
            id="commentForm"
            style="display:none;"
          >

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


        <!-- COMMENTS LIST -->

        <div id="commentsList">

          <p>
            Loading comments...
          </p>

        </div>


        <hr>


        <!-- RELATED NEWS -->

        <h2>
          📰 Related News
        </h2>

        <div id="relatedNews"></div>

      </div>

    `;


    window.currentNews = news;


    updateCommentUI(
      auth.currentUser
    );


    await loadComments(id);

    await loadRelatedNews(id);

  }

  catch (error) {

    console.error(
      "Load News Error:",
      error
    );

    newsDetails.innerHTML =
      "<h2>News Load కాలేదు.</h2>";

  }

}


// =========================================
// SHARE CURRENT NEWS
// =========================================

window.shareCurrentNews =
  async function () {

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
              document.createElement("canvas");

            canvas.width =
              img.naturalWidth;

            canvas.height =
              img.naturalHeight;

            const ctx =
              canvas.getContext("2d");

            ctx.drawImage(
              img,
              0,
              0,
              canvas.width,
              canvas.height
            );


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
                      type:
                        "image/jpeg"
                    }
                  );


                if (
                  navigator.share &&
                  navigator.canShare &&
                  navigator.canShare({
                    files: [file]
                  })
                ) {

                  try {

                    await navigator.share({

                      title:
                        title,

                      text:
                        text,

                      files:
                        [file]

                    });

                    return;

                  } catch (error) {

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


    function fallbackShare() {

      if (navigator.share) {

        navigator.share({

          title:
            title,

          text:
            text,

          url:
            shareUrl

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
// POST COMMENT / REPLY
// =========================================

window.postComment =
  async function () {

    const textInput =
      document.getElementById(
        "commentText"
      );

    const button =
      document.getElementById(
        "postCommentBtn"
      );


    if (!textInput || !button) {
      return;
    }


    const user =
      auth.currentUser;


    if (!user) {

      alert(
        "ముందుగా Google Login చేయండి."
      );

      return;

    }


    const text =
      textInput.value.trim();


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

      button.disabled = true;

      button.innerText =
        replyToId
          ? "Replying..."
          : "Posting...";


      const name =
        user.displayName ||
        user.email ||
        "User";


      await addDoc(
        collection(db, "comments"),
        {

          newsId:
            id,

          userId:
            user.uid,

          name:
            name,

          email:
            user.email || "",

          text:
            text,

          parentId:
            replyToId || null,

          createdAt:
            serverTimestamp(),

          updatedAt:
            serverTimestamp()

        }
      );


      textInput.value = "";

      replyToId = null;


      alert(
        replyToId
          ? "Reply విజయవంతంగా Post అయింది."
          : "Comment విజయవంతంగా Post అయింది."
      );


      await loadComments(id);

    }

    catch (error) {

  console.error("COMMENT POST ERROR:", error);

  alert(
    "Comment Post కాలేదు.\n\n" +
    "Error Code: " +
    (error.code || "Unknown") +
    "\n\n" +
    "Error: " +
    (error.message || "Unknown error")
  );

}

    finally {

      button.disabled = false;

      button.innerText =
        "💬 Post Comment";

    }

  };


// =========================================
// REPLY TO COMMENT
// =========================================

window.replyToComment =
  function (commentId) {

    if (!auth.currentUser) {

      alert(
        "Reply చేయడానికి ముందుగా Google Login చేయండి."
      );

      return;

    }


    const replyBox =
      document.getElementById(
        "reply-" + commentId
      );


    if (!replyBox) {
      return;
    }


    // Close other reply boxes
    document
      .querySelectorAll(".reply-form")
      .forEach(
        function (box) {

          if (
            box.id !==
            "reply-" + commentId
          ) {

            box.style.display =
              "none";

          }

        }
      );


    if (
      replyBox.style.display ===
      "block"
    ) {

      replyBox.style.display =
        "none";

      return;

    }


    replyBox.style.display =
      "block";


    const textarea =
      replyBox.querySelector(
        "textarea"
      );


    if (textarea) {
      textarea.focus();
    }

  };


// =========================================
// POST REPLY
// =========================================

window.postReply =
  async function (parentId) {

    const textarea =
      document.getElementById(
        "replyText-" + parentId
      );

    const button =
      document.getElementById(
        "replyBtn-" + parentId
      );


    if (!textarea || !button) {
      return;
    }


    const user =
      auth.currentUser;


    if (!user) {

      alert(
        "ముందుగా Google Login చేయండి."
      );

      return;

    }


    const text =
      textarea.value.trim();


    if (!text) {

      alert(
        "Reply నమోదు చేయండి."
      );

      textarea.focus();

      return;

    }


    try {

      button.disabled = true;

      button.innerText =
        "Replying...";


      const name =
        user.displayName ||
        user.email ||
        "User";


      await addDoc(
        collection(db, "comments"),
        {

          newsId:
            id,

          userId:
            user.uid,

          name:
            name,

          email:
            user.email || "",

          text:
            text,

          parentId:
            parentId,

          createdAt:
            serverTimestamp(),

          updatedAt:
            serverTimestamp()

        }
      );


      textarea.value = "";

      document.getElementById(
        "reply-" + parentId
      ).style.display =
        "none";


      alert(
        "Reply విజయవంతంగా Post అయింది."
      );


      await loadComments(id);

    }

    catch (error) {

      console.error(
        "Reply Error:",
        error
      );

      alert(
        "Reply Post కాలేదు."
      );

    }

    finally {

      button.disabled = false;

      button.innerText =
        "↩️ Post Reply";

    }

  };


// =========================================
// EDIT COMMENT
// =========================================

window.editComment =
  async function (commentId) {

    const commentRef =
      doc(
        db,
        "comments",
        commentId
      );


    try {

      const snap =
        await getDoc(commentRef);


      if (!snap.exists()) {

        alert(
          "Comment కనుగొనబడలేదు."
        );

        return;

      }


      const comment =
        snap.data();


      if (
        !auth.currentUser ||
        comment.userId !==
          auth.currentUser.uid
      ) {

        alert(
          "ఈ Comment‌ను Edit చేసే అనుమతి మీకు లేదు."
        );

        return;

      }


      const newText =
        prompt(
          "మీ Comment మార్చండి:",
          comment.text || ""
        );


      if (
        newText === null
      ) {
        return;
      }


      const trimmedText =
        newText.trim();


      if (!trimmedText) {

        alert(
          "Comment ఖాళీగా ఉండకూడదు."
        );

        return;

      }


      if (
        trimmedText.length >
        500
      ) {

        alert(
          "Comment గరిష్టంగా 500 characters మాత్రమే."
        );

        return;

      }


      await updateDoc(
        commentRef,
        {

          text:
            trimmedText,

          updatedAt:
            serverTimestamp()

        }
      );


      alert(
        "Comment విజయవంతంగా Edit అయింది."
      );


      await loadComments(id);

    }

    catch (error) {

      console.error(
        "Edit Comment Error:",
        error
      );

      alert(
        "Comment Edit కాలేదు."
      );

    }

  };


// =========================================
// DELETE COMMENT
// =========================================

window.deleteComment =
  async function (commentId) {

    const commentRef =
      doc(
        db,
        "comments",
        commentId
      );


    try {

      const snap =
        await getDoc(commentRef);


      if (!snap.exists()) {

        alert(
          "Comment ఇప్పటికే Delete అయి ఉండవచ్చు."
        );

        return;

      }


      const comment =
        snap.data();


      if (
        !auth.currentUser ||
        comment.userId !==
          auth.currentUser.uid
      ) {

        alert(
          "ఈ Comment‌ను Delete చేసే అనుమతి మీకు లేదు."
        );

        return;

      }


      const confirmDelete =
        confirm(
          "ఈ Comment‌ను Delete చేయాలా?"
        );


      if (!confirmDelete) {
        return;
      }


      await deleteDoc(
        commentRef
      );


      alert(
        "Comment Delete అయింది."
      );


      await loadComments(id);

    }

    catch (error) {

      console.error(
        "Delete Comment Error:",
        error
      );

      alert(
        "Comment Delete కాలేదు."
      );

    }

  };


// =========================================
// LOAD COMMENTS
// =========================================

async function loadComments(newsId) {

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
        collection(db, "comments"),
        where(
          "newsId",
          "==",
          newsId
        )
      );


    const snapshot =
      await getDocs(
        commentsQuery
      );


    if (snapshot.empty) {

      commentsList.innerHTML = `

        <p class="no-comments">

          ఇంకా Comments లేవు.
          మొదటి Comment మీరే చేయండి. 🙂

        </p>

      `;

      return;

    }


    const comments = [];


    snapshot.forEach(
      function (commentDoc) {

        comments.push({

          id:
            commentDoc.id,

          ...commentDoc.data()

        });

      }
    );


    // =====================================
    // SORT
    // =====================================

    comments.sort(
      function (a, b) {

        const aTime =
          a.createdAt &&
          a.createdAt.toMillis
            ? a.createdAt.toMillis()
            : 0;


        const bTime =
          b.createdAt &&
          b.createdAt.toMillis
            ? b.createdAt.toMillis()
            : 0;


        return aTime - bTime;

      }
    );


    // =====================================
    // TOP COMMENTS
    // =====================================

    const topComments =
      comments.filter(
        function (comment) {

          return !comment.parentId;

        }
      );


    let html = "";


    topComments.forEach(
      function (comment) {

        html +=
          renderComment(
            comment,
            comments,
            false
          );

      }
    );


    if (!html) {

      html =
        "<p>Comments లేవు.</p>";

    }


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
// RENDER COMMENT
// =========================================

function renderComment(
  comment,
  allComments,
  isReply
) {

  const currentUser =
    auth.currentUser;


  const isOwner =
    currentUser &&
    comment.userId &&
    comment.userId ===
      currentUser.uid;


  let dateText = "";


  if (
    comment.createdAt &&
    comment.createdAt.toDate
  ) {

    dateText =
      comment.createdAt
        .toDate()
        .toLocaleString("en-IN");

  }


  let html = `

    <div
      class="comment-card ${
        isReply
          ? "comment-reply"
          : ""
      }"
    >

      <div class="comment-header">

        <strong>
          👤 ${
            escapeHTML(
              comment.name ||
              "User"
            )
          }
        </strong>


        <span class="comment-date">

          ${
            escapeHTML(
              dateText
            )
          }

        </span>

      </div>


      <p class="comment-text">

        ${
          escapeHTML(
            comment.text ||
            ""
          )
        }

      </p>


      <div class="comment-actions">

        <button
          onclick="
            replyToComment(
              '${comment.id}'
            )
          "
        >
          ↩️ Reply
        </button>

  `;


  // =====================================
  // OWNER BUTTONS
  // =====================================

  if (isOwner) {

    html += `

        <button
          onclick="
            editComment(
              '${comment.id}'
            )
          "
        >
          ✏️ Edit
        </button>


        <button
          onclick="
            deleteComment(
              '${comment.id}'
            )
        "
        >
          🗑️ Delete
        </button>

    `;

  }


  html += `

      </div>


      <!-- REPLY FORM -->

      <div
        id="reply-${comment.id}"
        class="reply-form"
        style="display:none;"
      >

        <textarea
          id="replyText-${comment.id}"
          rows="3"
          maxlength="500"
          placeholder="Write your reply..."
        ></textarea>


        <button
          id="replyBtn-${comment.id}"
          onclick="
            postReply(
              '${comment.id}'
            )
          "
        >
          ↩️ Post Reply
        </button>

      </div>

  `;


  // =====================================
  // CHILD REPLIES
  // =====================================

  const replies =
    allComments.filter(
      function (reply) {

        return (
          reply.parentId ===
          comment.id
        );

      }
    );


  if (replies.length > 0) {

    html += `

      <div class="replies">

    `;


    replies.forEach(
      function (reply) {

        html +=
          renderComment(
            reply,
            allComments,
            true
          );

      }
    );


    html += `

      </div>

    `;

  }


  html += `

    </div>

  `;


  return html;

}


// =========================================
// ESCAPE HTML
// =========================================

function escapeHTML(text) {

  const div =
    document.createElement("div");

  div.textContent =
    text == null
      ? ""
      : String(text);

  return div.innerHTML;

}


// =========================================
// RELATED NEWS
// =========================================

async function loadRelatedNews(
  currentId
) {

  const related =
    document.getElementById(
      "relatedNews"
    );


  if (!related) {
    return;
  }


  try {

    const snap =
      await getDocs(
        collection(db, "news")
      );


    let html = "";

    let count = 0;


    snap.forEach(
      function (newsDoc) {

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
                location.href=
                'news.html?id=${newsDoc.id}'
              "
            >

              <img
                src="${escapeHTML(n.image || "")}"
              >


              <div class="news-content">

                <h3>
                  ${
                    escapeHTML(
                      n.title || ""
                    )
                  }
                </h3>

              </div>

            </div>

          `;


          count++;

        }

      }
    );


    if (html) {

      related.innerHTML =
        html;

    }

    else {

      related.innerHTML =
        "<p>Related News లేవు.</p>";

    }

  }

  catch (error) {

    console.error(
      "Related News Error:",
      error
    );

    related.innerHTML =
      "<p>Related News Load కాలేదు.</p>";

  }

}


// =========================================
// START
// =========================================

window.addEventListener("DOMContentLoaded", () => {

  console.log("NEWS DEBUG: DOMContentLoaded");

  loadNews().catch(error => {

    console.error(
      "NEWS DEBUG: loadNews failed:",
      error
    );

    if (newsDetails) {

      newsDetails.innerHTML = `
        <h2>News Load కాలేదు.</h2>
        <p style="color:red;">
          ${escapeHTML(
            error.message || "Unknown Error"
          )}
        </p>
      `;

    }

  });

});