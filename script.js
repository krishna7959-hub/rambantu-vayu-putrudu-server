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


const newsSections =
  document.getElementById(
    "newsSections"
  );


const addSectionBtn =
  document.getElementById(
    "addSectionBtn"
  );


// =========================================
// EDIT MODE
// =========================================

let editMode =
  false;


let editId =
  "";


// =========================================
// NEWS SECTIONS
// =========================================

function addNewsSection(
  subheading = "",
  paragraph = ""
) {

  if (!newsSections) {

    return;

  }


  const section =
    document.createElement(
      "div"
    );


  section.className =
    "news-section";


  section.innerHTML = `

    <input
      type="text"
      class="subheading"
      placeholder="Subheading (Optional)"
      value="${escapeHTML(subheading)}"
    >

    <textarea
      class="paragraph"
      rows="5"
      placeholder="Paragraph"
    >${escapeHTML(paragraph)}</textarea>

    <button
      type="button"
      class="remove-section"
    >
      ❌ Remove Section
    </button>

  `;


  const removeBtn =
    section.querySelector(
      ".remove-section"
    );


  removeBtn.addEventListener(
    "click",
    () => {

      section.remove();

    }
  );


  newsSections.appendChild(
    section
  );

}


// =========================================
// GET NEWS SECTIONS
// =========================================

function getNewsSections() {

  if (!newsSections) {

    return [];

  }


  return Array.from(
    newsSections.querySelectorAll(
      ".news-section"
    )
  )
  .map(
    section => {

      const subheading =
        section
          .querySelector(
            ".subheading"
          )
          .value
          .trim();


      const paragraph =
        section
          .querySelector(
            ".paragraph"
          )
          .value
          .trim();


      return {

        subheading:
          subheading,

        paragraph:
          paragraph

      };

    }
  )
  .filter(
    section =>
      section.paragraph
  );

}


// =========================================
// SECTIONS TO DETAILS
// =========================================

function sectionsToDetails(
  sections
) {

  return sections
    .map(
      section => {

        const heading =
          section.subheading
            ? section.subheading + "\n"
            : "";


        return (
          heading +
          section.paragraph
        );

      }
    )
    .join(
      "\n\n"
    )
    .trim();

}


// =========================================
// CLEAR NEWS SECTIONS
// =========================================

function clearNewsSections() {

  if (!newsSections) {

    return;

  }


  newsSections.innerHTML =
    "";


  addNewsSection();

}


// =========================================
// LOAD SECTIONS INTO FORM
// =========================================

function loadSectionsIntoForm(
  sections
) {

  if (!newsSections) {

    return;

  }


  newsSections.innerHTML =
    "";


  if (
    !Array.isArray(sections) ||
    !sections.length
  ) {

    addNewsSection();

    return;

  }


  sections.forEach(
    section => {

      addNewsSection(

        section.subheading ||
        "",

        section.paragraph ||
        ""

      );

    }
  );

}


// =========================================
// ADD SECTION BUTTON
// =========================================

if (addSectionBtn) {

  addSectionBtn.addEventListener(
    "click",
    () => {

      addNewsSection();

    }
  );

}


// =========================================
// BREAKING NEWS
// =========================================

if (
  saveBreaking &&
  breakingNews
) {

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

            text:
              text

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

}


// =========================================
// PUBLISH NEWS
// =========================================

if (publishBtn) {

  publishBtn.addEventListener(
    "click",
    async () => {

      console.log(
        "Publish button clicked"
      );


      const title =
        document
          .getElementById(
            "title"
          )
          .value
          .trim();


      const sections =
        getNewsSections();


      const details =
        sectionsToDetails(
          sections
        );


      const category =
        document
          .getElementById(
            "category"
          )
          .value;


      const imageFile =
        document
          .getElementById(
            "image"
          )
          .files[0];


      // ===================================
      // VALIDATION
      // ===================================

      if (
        !title ||
        !details ||
        (
          !imageFile &&
          !editMode
        )
      ) {

        alert(
          "Title, Paragraph మరియు Image నమోదు చేయండి."
        );

        return;

      }


      try {

        let imageURL =
          "";


        // =================================
        // CLOUDINARY IMAGE UPLOAD
        // =================================

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


          if (
            !uploadData.secure_url
          ) {

            console.error(
              uploadData
            );


            throw new Error(
              "Image upload failed"
            );

          }


          imageURL =
            uploadData.secure_url;

        }


        // =================================
        // UPDATE EXISTING NEWS
        // =================================

        if (editMode) {

          const docRef =
            doc(
              db,
              "news",
              editId
            );


          const docSnap =
            await getDoc(
              docRef
            );


          if (
            !docSnap.exists()
          ) {

            alert(
              "వార్త కనిపించలేదు."
            );

            return;

          }


          const oldData =
            docSnap.data();


          await updateDoc(
            docRef,
            {

              title:
                title,

              details:
                details,

              sections:
                sections,

              category:
                category,

              image:
                imageURL ||
                oldData.image ||
                ""

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


        // =================================
        // CREATE NEW NEWS
        // =================================

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

              sections:
                sections,

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


          // ===============================
          // SEND NOTIFICATION
          // ===============================

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


        // =================================
        // CLEAR FORM
        // =================================

        document
          .getElementById(
            "title"
          )
          .value =
          "";


        document
          .getElementById(
            "category"
          )
          .value =
          "";


        document
          .getElementById(
            "image"
          )
          .value =
          "";


        clearNewsSections();


        await loadNews();

      }

      catch (err) {

        console.error(
          "Publish Error:",
          err
        );


        alert(
          "Publish కాలేదు."
        );

      }

    }
  );

}


// =========================================
// LOAD NEWS
// =========================================

async function loadNews() {

  if (!newsList) {

    return;

  }


  newsList.innerHTML =
    "";


  try {

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


    if (
      snapshot.empty
    ) {

      newsList.innerHTML = `

        <p>
          ఇంకా వార్తలు లేవు.
        </p>

      `;

      return;

    }


    snapshot.forEach(
      newsDoc => {

        const news =
          newsDoc.data();


        newsList.innerHTML += `

          <div class="card">

            <img
              src="${escapeHTML(
                news.image || ""
              )}"
              class="news-image"
            >

            <h3>
              ${escapeHTML(
                news.title || ""
              )}
            </h3>

            <p>
              ${escapeHTML(
                (
                  news.details ||
                  ""
                ).substring(
                  0,
                  100
                )
              )}${news.details ? "..." : ""}
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

  catch (error) {

    console.error(
      "Load News Error:",
      error
    );


    newsList.innerHTML = `

      <p>
        వార్తలు Load కాలేదు.
      </p>

    `;

  }

}


// =========================================
// DELETE NEWS
// =========================================

window.deleteNews =
  async function (
    id
  ) {

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
  async function (
    id
  ) {

    try {

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

        alert(
          "వార్త కనిపించలేదు."
        );

        return;

      }


      const news =
        docSnap.data();


      // ===================================
      // TITLE
      // ===================================

      document
        .getElementById(
          "title"
        )
        .value =
        news.title ||
        "";


      // ===================================
      // SECTIONS
      // ===================================

      if (
        Array.isArray(
          news.sections
        ) &&
        news.sections.length
      ) {

        loadSectionsIntoForm(
          news.sections
        );

      }

      else {

        // ================================
        // OLD NEWS COMPATIBILITY
        // ================================

        loadSectionsIntoForm(
          [
            {

              subheading:
                "",

              paragraph:
                news.details ||
                ""

            }
          ]
        );

      }


      // ===================================
      // CATEGORY
      // ===================================

      document
        .getElementById(
          "category"
        )
        .value =
        news.category ||
        "";


      // ===================================
      // EDIT MODE
      // ===================================

      editMode =
        true;


      editId =
        id;


      publishBtn.innerText =
        "Update News";


      window.scrollTo({

        top:
          0,

        behavior:
          "smooth"

      });


      alert(
        "వార్త Edit చేయడానికి సిద్ధంగా ఉంది."
      );

    }

    catch (error) {

      console.error(
        "Edit News Error:",
        error
      );


      alert(
        "వార్త Edit చేయలేకపోయాము."
      );

    }

  };


// =========================================
// LOAD COMMENTS FOR ADMIN
// =========================================

async function loadAdminComments() {

  if (
    !commentsAdminList
  ) {

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
      commentDoc => {

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
              onclick="deleteComment('${commentDoc.id}')"
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
    String(
      text
    );


  return div.innerHTML;

}


// =========================================
// START
// =========================================

// మొదట కనీసం ఒక section ఉండాలి

if (
  newsSections &&
  !newsSections.querySelector(
    ".news-section"
  )
) {

  addNewsSection();

}


loadNews();

loadAdminComments();