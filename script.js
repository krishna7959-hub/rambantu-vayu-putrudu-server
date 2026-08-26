import {
  db
} from "./firebase.js";


import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  deleteDoc,
  doc,
  getDoc,
  updateDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// =========================================
// ELEMENTS
// =========================================

const publishBtn =
  document.getElementById(
    "publish"
  );


const newsList =
  document.getElementById(
    "newsList"
  );


const breakingNews =
  document.getElementById(
    "breakingNews"
  );


const saveBreaking =
  document.getElementById(
    "saveBreaking"
  );


const commentsAdminList =
  document.getElementById(
    "commentsAdminList"
  );


// =========================================
// BREAKING NEWS
// =========================================

saveBreaking.addEventListener(
  "click",
  async () => {

    const text =
      breakingNews.value.trim();


    if (!text) {

      alert(
        "Breaking News నమోదు చేయండి."
      );

      return;

    }


    try {

      await setDoc(
        doc(
          db,
          "settings",
          "breaking"
        ),
        {
          text: text
        }
      );


      alert(
        "Breaking News Save అయింది."
      );


      breakingNews.value =
        "";

    }

    catch (err) {

      console.error(
        err
      );


      alert(
        "Save కాలేదు."
      );

    }

  }
);


// =========================================
// EDIT MODE
// =========================================

let editMode =
  false;


let editId =
  "";


// =========================================
// PUBLISH NEWS
// =========================================

publishBtn.addEventListener(
  "click",
  async () => {

    console.log(
      "Publish button clicked"
    );


    const title =
      document
        .getElementById("title")
        .value
        .trim();


    const details =
      document
        .getElementById("details")
        .value
        .trim();


    const category =
      document
        .getElementById("category")
        .value;


    const imageFile =
      document
        .getElementById("image")
        .files[0];


    if (
      !title ||
      !details ||
      (!imageFile && !editMode)
    ) {

      alert(
        "అన్ని వివరాలు నమోదు చేయండి."
      );

      return;

    }


    try {

      let imageURL =
        "";


      // ===================================
      // CLOUDINARY IMAGE UPLOAD
      // ===================================

      if (imageFile) {

        const formData =
          new FormData();


        formData.append(
          "file",
          imageFile
        );


        formData.append(
          "upload_preset",
          "News_upload"
        );


        const upload =
          await fetch(
            "https://api.cloudinary.com/v1_1/zzofbzm1/image/upload",
            {
              method:
                "POST",

              body:
                formData
            }
          );


        const uploadData =
          await upload.json();


        imageURL =
          uploadData.secure_url;

      }


      // ===================================
      // UPDATE NEWS
      // ===================================

      if (editMode) {

        const docSnap =
          await getDoc(
            doc(
              db,
              "news",
              editId
            )
          );


        const oldData =
          docSnap.data();


        await updateDoc(
          doc(
            db,
            "news",
            editId
          ),
          {

            title:
              title,

            details:
              details,

            category:
              category,

            image:
              imageURL ||
              oldData.image

          }
        );


        alert(
          "వార్త Update అయింది."
        );


        editMode =
          false;


        editId =
          "";


        publishBtn.innerText =
          "Publish";

      }


      // ===================================
      // NEW NEWS
      // ===================================

      else {

        await addDoc(
          collection(
            db,
            "news"
          ),
          {

            title:
              title,

            details:
              details,

            category:
              category,

            image:
              imageURL,

            createdAt:
              new Date()

          }
        );


        console.log(
          "News saved to Firestore"
        );


        alert(
          "వార్త విజయవంతంగా Publish అయింది!"
        );


        // =================================
        // SEND NOTIFICATION
        // =================================

        fetch(
          "https://rambantu-vayu-putrudu-server.onrender.com/send",
          {

            method:
              "POST",

            headers:
              {
                "Content-Type":
                  "application/json"
              },

            body:
              JSON.stringify({

                title:
                  title,

                message:
                  details.substring(
                    0,
                    100
                  ),

                url:
                  "https://rambantu-vayu-putrudu.web.app"

              })

          }

        )

        .then(
          async response => {

            console.log(
              "Notification Status:",
              response.status
            );


            console.log(
              "Notification Response:",
              await response.text()
            );

          }
        )

        .catch(
          error => {

            console.error(
              "Notification Error:",
              error
            );

          }
        );

      }


      // ===================================
      // CLEAR FORM
      // ===================================

      document
        .getElementById("title")
        .value =
        "";


      document
        .getElementById("details")
        .value =
        "";


      document
        .getElementById("image")
        .value =
        "";


      await loadNews();

    }

    catch (err) {

      console.error(
        err
      );


      alert(
        "Publish కాలేదు."
      );

    }

  }
);


// =========================================
// LOAD NEWS
// =========================================

async function loadNews() {

  newsList.innerHTML =
    "";


  const q =
    query(
      collection(
        db,
        "news"
      ),
      orderBy(
        "createdAt",
        "desc"
      )
    );


  const snapshot =
    await getDocs(
      q
    );


  snapshot.forEach(
    (newsDoc) => {

      const news =
        newsDoc.data();


      newsList.innerHTML += `

        <div class="card">

          <img
            src="${news.image || ""}"
            class="news-image"
          >

          <h3>
            ${news.title || ""}
          </h3>

          <p>
            ${(news.details || "").substring(
              0,
              100
            )}...
          </p>


          <button
            onclick="editNews('${newsDoc.id}')"
          >

            ✏️ Edit

          </button>


          <button
            onclick="deleteNews('${newsDoc.id}')"
          >

            🗑️ Delete

          </button>

        </div>

      `;

    }
  );

}


// =========================================
// DELETE NEWS
// =========================================

window.deleteNews =
  async function (id) {

    if (
      !confirm(
        "ఈ వార్తను Delete చేయాలా?"
      )
    ) {

      return;

    }


    try {

      await deleteDoc(
        doc(
          db,
          "news",
          id
        )
      );


      alert(
        "వార్త Delete అయింది."
      );


      await loadNews();

    }

    catch (error) {

      console.error(
        "Delete News Error:",
        error
      );


      alert(
        "వార్త Delete కాలేదు."
      );

    }

  };


// =========================================
// EDIT NEWS
// =========================================

window.editNews =
  async function (id) {

    const docRef =
      doc(
        db,
        "news",
        id
      );


    const docSnap =
      await getDoc(
        docRef
      );


    if (
      !docSnap.exists()
    ) {

      return;

    }


    const news =
      docSnap.data();


    document
      .getElementById("title")
      .value =
      news.title || "";


    document
      .getElementById("details")
      .value =
      news.details || "";


    document
      .getElementById("category")
      .value =
      news.category || "";


    editMode =
      true;


    editId =
      id;


    publishBtn.innerText =
      "Update News";


    alert(
      "వార్త Edit చేయడానికి సిద్ధంగా ఉంది."
    );

  };


// =========================================
// LOAD COMMENTS FOR ADMIN
// =========================================

async function loadAdminComments() {

  if (!commentsAdminList) {

    return;

  }


  commentsAdminList.innerHTML =
    "<p>Loading Comments...</p>";


  try {

    const commentsQuery =
      query(
        collection(
          db,
          "comments"
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


    if (
      snapshot.empty
    ) {

      commentsAdminList.innerHTML = `

        <p>
          ఇంకా Comments లేవు.
        </p>

      `;

      return;

    }


    let html =
      "";


    snapshot.forEach(
      (commentDoc) => {

        const comment =
          commentDoc.data();


        let dateText =
          "";


        if (
          comment.createdAt &&
          comment.createdAt.toDate
        ) {

          dateText =
            comment.createdAt
              .toDate()
              .toLocaleString(
                "en-IN"
              );

        }


        html += `

          <div class="card">

            <h3>
              👤 ${
                escapeHTML(
                  comment.name ||
                  "User"
                )
              }
            </h3>


            <p>
              ${
                escapeHTML(
                  comment.text ||
                  ""
                )
              }
            </p>


            <small>
              ${escapeHTML(
                dateText
              )}
            </small>


            <br><br>


            <button
              onclick="
                deleteComment(
                  '${commentDoc.id}'
                )
              "
            >

              🗑️ Delete Comment

            </button>

          </div>

        `;

      }
    );


    commentsAdminList.innerHTML =
      html;

  }

  catch (error) {

    console.error(
      "Load Admin Comments Error:",
      error
    );


    commentsAdminList.innerHTML = `

      <p>
        Comments Load కాలేదు.
      </p>

    `;

  }

}


// =========================================
// DELETE COMMENT - ADMIN
// =========================================

window.deleteComment =
  async function (
    commentId
  ) {

    if (
      !confirm(
        "ఈ Commentను Delete చేయాలా?"
      )
    ) {

      return;

    }


    try {

      await deleteDoc(
        doc(
          db,
          "comments",
          commentId
        )
      );


      alert(
        "Comment Delete అయింది."
      );


      await loadAdminComments();

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
// SECURITY
// ESCAPE HTML
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
// START
// =========================================

loadNews();

loadAdminComments();