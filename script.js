import {
  db,
  auth
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
// NEWS DRAFT AUTO-SAVE
// =========================================

const NEWS_DRAFT_KEY = "rvp_news_editor_draft_v1";

let draftSaveTimer = null;

function saveNewsDraft() {

  if (editMode) {
    return;
  }

  const titleInput =
    document.getElementById("title");

  const categoryInput =
    document.getElementById("category");

  const authorNameInput =
    document.getElementById("authorName");

  if (
    !titleInput ||
    !categoryInput ||
    !authorNameInput ||
    !newsSections
  ) {
    return;
  }

  const draft = {
    title: titleInput.value,
    sections: getNewsSections(),
    category: categoryInput.value,
    authorName: authorNameInput.value.trim(),
    savedAt: new Date().toISOString()
  };

  try {

    localStorage.setItem(
      NEWS_DRAFT_KEY,
      JSON.stringify(draft)
    );

  } catch (error) {

    console.error(
      "Draft Save Error:",
      error
    );

  }

}

function scheduleNewsDraftSave() {

  clearTimeout(
    draftSaveTimer
  );

  draftSaveTimer =
    setTimeout(
      saveNewsDraft,
      500
    );

}

function restoreNewsDraft() {

  if (editMode) {
    return;
  }

  try {

    const saved =
      localStorage.getItem(
        NEWS_DRAFT_KEY
      );

    if (!saved) {
      return;
    }

    const draft =
      JSON.parse(saved);

    if (
      !draft ||
      typeof draft !== "object"
    ) {
      return;
    }

    const titleInput =
      document.getElementById("title");

    const categoryInput =
      document.getElementById("category");

    const authorNameInput =
      document.getElementById("authorName");

    if (
      !titleInput ||
      !categoryInput ||
      !authorNameInput ||
      !newsSections
    ) {
      return;
    }

    const hasDraftContent =
      draft.title ||
      draft.category ||
      draft.authorName ||
      (
        Array.isArray(
          draft.sections
        ) &&
        draft.sections.some(
          section =>
            section.subheading ||
            section.paragraph
        )
      );

    if (!hasDraftContent) {
      return;
    }

    const restore =
      confirm(
        "📝 మీరు పూర్తి చేయని News Draft ఉంది.\n\n" +
        "దాన్ని Restore చేయాలా?"
      );

    if (!restore) {

      localStorage.removeItem(
        NEWS_DRAFT_KEY
      );

      return;

    }

    titleInput.value =
      draft.title || "";

    categoryInput.value =
      draft.category || "";

    authorNameInput.value =
      draft.authorName || "";

    loadSectionsIntoForm(
      Array.isArray(
        draft.sections
      )
        ? draft.sections
        : []
    );

    console.log(
      "News draft restored"
    );

  } catch (error) {

    console.error(
      "Draft Restore Error:",
      error
    );

  }

}

function clearNewsDraft() {

  clearTimeout(
    draftSaveTimer
  );

  try {

    localStorage.removeItem(
      NEWS_DRAFT_KEY
    );

    console.log(
      "News draft cleared"
    );

  } catch (error) {

    console.error(
      "Draft Clear Error:",
      error
    );

  }

}

const titleInputForDraft =
  document.getElementById("title");

const categoryInputForDraft =
  document.getElementById("category");

const authorNameInputForDraft =
  document.getElementById("authorName");

if (titleInputForDraft) {

  titleInputForDraft.addEventListener(
    "input",
    scheduleNewsDraftSave
  );

}

if (categoryInputForDraft) {

  categoryInputForDraft.addEventListener(
    "change",
    scheduleNewsDraftSave
  );

}

if (authorNameInputForDraft) {

  authorNameInputForDraft.addEventListener(
    "input",
    scheduleNewsDraftSave
  );

}

if (newsSections) {

  newsSections.addEventListener(
    "input",
    scheduleNewsDraftSave
  );

  newsSections.addEventListener(
    "change",
    scheduleNewsDraftSave
  );

  const draftObserver =
    new MutationObserver(
      () => {
        scheduleNewsDraftSave();
      }
    );

  draftObserver.observe(
    newsSections,
    {
      childList: true,
      subtree: true
    }
  );

}

window.addEventListener(
  "DOMContentLoaded",
  () => {

    setTimeout(
      restoreNewsDraft,
      100
    );

  }
);

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
// PASTE NEWS
// =========================================

const pasteNewsBtn =
  document.getElementById(
    "pasteNewsBtn"
  );


function parsePastedNews(text) {

  const cleanText =
    text
      .replace(/\r/g, "")
      .trim();


  const titleMatch =
    cleanText.match(
      /(?:^|\n)TITLE\s*:\s*([\s\S]*?)(?=\n\s*SUBHEADING\s*:|\n\s*PARAGRAPH\s*:|$)/i
    );


  const title =
    titleMatch
      ? titleMatch[1].trim()
      : "";


  const sectionPattern =
    /SUBHEADING\s*:\s*([\s\S]*?)\n\s*PARAGRAPH\s*:\s*([\s\S]*?)(?=\n\s*SUBHEADING\s*:|$)/gi;


  const sections = [];


  let match;


  while (
    (match = sectionPattern.exec(cleanText)) !== null
  ) {

    const subheading =
      match[1].trim();


    const paragraph =
      match[2].trim();


    if (paragraph) {

      sections.push({
        subheading,
        paragraph
      });

    }

  }


  return {
    title,
    sections
  };

}


if (pasteNewsBtn) {

  pasteNewsBtn.addEventListener(
    "click",
    async () => {

      try {

        const text =
          await navigator.clipboard.readText();


        if (!text.trim()) {

          alert(
            "Clipboardలో News text లేదు. ముందుగా Newsని Copy చేయండి."
          );

          return;

        }


        const parsed =
          parsePastedNews(text);


        if (
          !parsed.title ||
          !parsed.sections.length
        ) {

          alert(
            "News format గుర్తించలేకపోయాను. TITLE, SUBHEADING, PARAGRAPH formatలో Copy చేయండి."
          );

          return;

        }


        document
          .getElementById("title")
          .value = parsed.title;


        newsSections.innerHTML = "";


        parsed.sections.forEach(
          section => {

            addNewsSection(
              section.subheading,
              section.paragraph
            );

          }
        );


        alert(
          "📋 News మొత్తం Formలో సెట్ అయింది."
        );

      }

      catch (error) {

        console.error(
          "Paste News Error:",
          error
        );


        alert(
          "Clipboard చదవలేకపోయాను. Browser permission ఇవ్వండి."
        );

      }

    }
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
// IMAGE OPTIMIZATION — BROWSER-SIDE WEBP
// =========================================

function formatFileSize(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) return "";
  return bytes >= 1024 * 1024
    ? (bytes / (1024 * 1024)).toFixed(2) + " MB"
    : (bytes / 1024).toFixed(1) + " KB";
}

async function convertImageToWebP(file) {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

  if (!allowedTypes.includes(file.type)) {
    throw new Error("JPG, PNG లేదా WebP ఫోటో మాత్రమే ఎంచుకోండి.");
  }

  if (typeof createImageBitmap !== "function") {
    throw new Error("ఈ బ్రౌజర్‌లో ఆటోమేటిక్ ఫోటో మార్పిడి అందుబాటులో లేదు. Chrome తాజా వెర్షన్ ఉపయోగించండి.");
  }

  let bitmap;

  try {
    bitmap = await createImageBitmap(file);

    const maxDimension = 1200;
    const scale = Math.min(
      1,
      maxDimension / Math.max(bitmap.width, bitmap.height)
    );

    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("ఫోటోను ప్రాసెస్ చేయలేకపోయాము.");
    }

    context.drawImage(bitmap, 0, 0, width, height);

    const webpBlob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        blob => blob ? resolve(blob) : reject(new Error("WebP conversion విఫలమైంది.")),
        "image/webp",
        0.82
      );
    });

    if (webpBlob.type !== "image/webp") {
      throw new Error("మీ బ్రౌజర్ WebP ఫార్మాట్‌ను సృష్టించలేకపోయింది.");
    }

    const baseName = file.name.replace(/\.[^.]+$/, "") || "rvp-news-image";
    const webpFile = new File(
      [webpBlob],
      baseName + ".webp",
      { type: "image/webp", lastModified: Date.now() }
    );

    return {
      file: webpFile,
      originalSize: file.size,
      width,
      height
    };
  } finally {
    if (bitmap) bitmap.close();
  }
}

function setImageOptimizationStatus(message, isError = false) {
  const status = document.getElementById("imageOptimizationStatus");
  if (!status) return;

  status.textContent = message;
  status.style.color = isError ? "#b00020" : "#237a3b";
}


// =========================================
// INSTANT WEBP CONVERSION ON FILE SELECTION
// =========================================

let imageConversionPromise = null;
let imageConversionSourceFile = null;

const imageInputForWebP = document.getElementById("image");

if (imageInputForWebP) {
  imageInputForWebP.addEventListener("change", () => {
    const selectedFile = imageInputForWebP.files?.[0] || null;

    imageConversionSourceFile = selectedFile;
    imageConversionPromise = null;

    if (!selectedFile) {
      setImageOptimizationStatus(
        "📷 JPG / PNG / WebP ఫోటోలు ఆటోమేటిక్‌గా WebPగా మార్చబడతాయి (గరిష్ఠం 1200px)."
      );
      return;
    }

    setImageOptimizationStatus("⏳ ఫోటోను WebPగా మారుస్తున్నాం...");

    imageConversionPromise = convertImageToWebP(selectedFile)
      .then(optimized => {
        if (imageConversionSourceFile !== selectedFile) return null;

        setImageOptimizationStatus(
          `✅ WebP సిద్ధం: ${formatFileSize(optimized.originalSize)} → ${formatFileSize(optimized.file.size)} (${optimized.width} × ${optimized.height}px)`
        );

        return optimized.file;
      })
      .catch(error => {
        if (imageConversionSourceFile === selectedFile) {
          console.error("WebP conversion failed:", error);
          setImageOptimizationStatus(
            `❌ WebP Conversion విఫలమైంది: ${error.message}`,
            true
          );
        }
        return null;
      });
  });
}


// =========================================
// PUBLISH NEWS
// =========================================

let isPublishing = false;

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


      const authorName =
        document
          .getElementById("authorName")
          .value
          .trim();

      const visibility =
        document.getElementById("newsVisibility")?.value === "private"
          ? "private"
          : "public";


      const imageFile =
        document
          .getElementById(
            "image"
          )
          .files[0];

      const imageConversionForPublish =
        imageConversionSourceFile === imageFile
          ? imageConversionPromise
          : null;


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

      // Prevent duplicate Publish / Update requests.
      if (isPublishing) {
        console.warn("Publish already in progress. Duplicate click ignored.");
        return;
      }

      isPublishing = true;
      publishBtn.disabled = true;
      publishBtn.innerText = editMode
        ? "⏳ Updating..."
        : "⏳ Publishing...";

      try {

        let imageURL =
          "";


        // =================================
        // IMAGEKIT IMAGE UPLOAD
        // Obtain short-lived upload credentials from the protected server.

        if (imageFile) {
          const user = auth.currentUser;

          if (!user) {
            throw new Error("Admin authentication required");
          }

          const idToken = await user.getIdToken();

          const authResponse = await fetch(
            "https://rambantu-vayu-putrudu-server.onrender.com/imagekit-auth",
            {
              method: "GET",
              headers: {
                "Authorization": `Bearer ${idToken}`
              }
            }
          );

          const authData = await authResponse.json();

          if (
            !authResponse.ok ||
            !authData.token ||
            !authData.signature ||
            !authData.expire ||
            !authData.publicKey
          ) {
            console.error("ImageKit authentication failed:", authResponse.status);
            throw new Error("Image upload authorization failed");
          }

          let uploadFile;

          if (imageConversionForPublish) {
            uploadFile = await imageConversionForPublish;
          } else {
            setImageOptimizationStatus("⏳ ఫోటోను WebPగా మారుస్తున్నాం...");
            const optimized = await convertImageToWebP(imageFile);
            uploadFile = optimized.file;

            setImageOptimizationStatus(
              `✅ WebP సిద్ధం: ${formatFileSize(optimized.originalSize)} → ${formatFileSize(uploadFile.size)} (${optimized.width} × ${optimized.height}px)`
            );
          }

          if (!uploadFile) {
            throw new Error("WebP Conversion విఫలమైంది. దయచేసి ఫోటోను మళ్లీ ఎంచుకోండి.");
          }

          const formData = new FormData();
          formData.append("file", uploadFile);
          formData.append("fileName", uploadFile.name);
          formData.append("publicKey", authData.publicKey);
          formData.append("token", authData.token);
          formData.append("signature", authData.signature);
          formData.append("expire", String(authData.expire));

          const upload = await fetch(
            "https://upload.imagekit.io/api/v1/files/upload",
            {
              method: "POST",
              body: formData
            }
          );

          const uploadData = await upload.json();

          if (!upload.ok || !uploadData.url) {
            console.error("ImageKit upload failed:", upload.status);
            throw new Error("Image upload failed");
          }

          imageURL = uploadData.url;
          setImageOptimizationStatus("✅ WebP ఫోటో ImageKitలో అప్‌లోడ్ అయింది.");
        }


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

              authorName:
                authorName,

              visibility:
                visibility,

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

              authorName:
                authorName,

              visibility:
                visibility,

              image:
                imageURL,

              createdAt:
                new Date()

            }
          );


          console.log(
            "News saved to Firestore"
          );


          // ===============================
          // SEND NOTIFICATION
          // ===============================

          if (visibility === "public") {
            try {
              const user = auth.currentUser;

              if (!user) {
                throw new Error("Admin authentication required");
              }

              const idToken = await user.getIdToken(true);

              const response = await fetch(
                "https://rambantu-vayu-putrudu-server.onrender.com/send",
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${idToken}`
                  },
                  body: JSON.stringify({
                    title: title,
                    message: details.substring(0, 100),
                    url: "https://rambantu-vayu-putrudu.web.app"
                  })
                }
              );

              const result = await response.json();

              console.log("Notification Status:", response.status);
              console.log("Notification Response:", result);

              if (!response.ok || result.success !== true) {
                throw new Error(result.message || "Notification failed");
              }

              alert("వార్త Publish అయింది. Notification విజయవంతంగా పంపబడింది.");

            } catch (error) {
              console.error("Notification Error:", error);
              alert("వార్త Publish అయింది. కానీ Notification పంపడంలో సమస్య వచ్చింది.");
            }

          } else {
            alert("Private వార్త విజయవంతంగా సేవ్ అయింది. Notification పంపలేదు.");
          }

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
          .getElementById("authorName")
          .value = "";

        document.getElementById("newsVisibility").value = "public";

        document
          .getElementById(
            "image"
          )
          .value =
          "";

        imageConversionSourceFile = null;
        imageConversionPromise = null;

        setImageOptimizationStatus(
          "📷 JPG / PNG / WebP ఫోటోలు ఆటోమేటిక్‌గా WebPగా మార్చబడతాయి (గరిష్ఠం 1200px)."
        );

        clearNewsSections();


        clearNewsDraft();


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
      finally {
        isPublishing = false;
        publishBtn.disabled = false;
        publishBtn.innerText = editMode
          ? "Update News"
          : "Publish";
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


    let totalViews = 0;
    const analyticsNews = [];

    snapshot.forEach((newsDoc) => {
      const newsData = newsDoc.data();
      const views = Number(newsData.views || 0);
      totalViews += views;

      analyticsNews.push({
        id: newsDoc.id,
        title: newsData.title || "",
        views
      });
    });

    const dashboardNewsCount =
      document.getElementById("dashboardNewsCount");

    const dashboardViewsCount =
      document.getElementById("dashboardViewsCount");

    if (dashboardNewsCount) {
      dashboardNewsCount.textContent = snapshot.size;
    }

    if (dashboardViewsCount) {
      dashboardViewsCount.textContent = totalViews.toLocaleString();
    }

    const mostViewedNews =
      document.getElementById("mostViewedNews");

    if (mostViewedNews) {
      const topNews = [...analyticsNews]
        .sort((a, b) => b.views - a.views)
        .slice(0, 10);

      if (topNews.length === 0) {
        mostViewedNews.innerHTML =
          "<p>ఇంకా Analytics data లేదు.</p>";
      } else {
        mostViewedNews.innerHTML = topNews
          .map((news, index) => {
            const rank =
              index === 0 ? "🥇" :
              index === 1 ? "🥈" :
              index === 2 ? "🥉" :
              `${index + 1}.`;

            return `
              <div class="analytics-item">
                <div class="analytics-rank">${rank}</div>
                <div class="analytics-title">
                  ${escapeHTML(news.title)}
                </div>
                <div class="analytics-views">
                  👁️ ${news.views.toLocaleString()}
                </div>
              </div>
            `;
          })
          .join("");
      }
    }

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

            <p>
              👁️ Views: ${news.views || 0}
            </p>

            <p>
              స్థితి: ${
                news.visibility === "private"
                  ? "🔒 Private"
                  : "🌐 Public"
              }
            </p>

            <button
              onclick="toggleNewsVisibility('${newsDoc.id}', '${news.visibility === "private" ? "private" : "public"}')"
            >
              ${news.visibility === "private" ? "🌐 Make Public" : "🔒 Make Private"}
            </button>

            <button
              onclick="editNews('${newsDoc.id}')"
            >
              ✏️ Edit
            </button>

            <!-- private-news-view-button -->
            <button
              onclick="window.open('news.html?id=${encodeURIComponent(newsDoc.id)}', '_blank')"
            >
              👁️ View News
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
// TOGGLE NEWS VISIBILITY
// =========================================

window.toggleNewsVisibility =
  async function (id, currentVisibility) {

    const nextVisibility =
      currentVisibility === "private"
        ? "public"
        : "private";

    const confirmMessage =
      nextVisibility === "private"
        ? "ఈ వార్తను Private చేయాలా?"
        : "ఈ వార్తను Public చేయాలా?";

    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      await updateDoc(
        doc(db, "news", id),
        {
          visibility: nextVisibility
        }
      );

      alert(
        nextVisibility === "private"
          ? "వార్త Private అయింది."
          : "వార్త Public అయింది."
      );

      await loadNews();

    } catch (error) {
      console.error("Toggle Visibility Error:", error);
      alert("Visibility మార్చలేకపోయాము.");
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


      document
        .getElementById("authorName")
        .value =
        news.authorName ||
        "";

      document.getElementById("newsVisibility").value =
        news.visibility === "private" ? "private" : "public";


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


    const dashboardCommentsCount =
      document.getElementById("dashboardCommentsCount");

    if (dashboardCommentsCount) {
      dashboardCommentsCount.textContent = snapshot.size;
    }

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
