import { db } from "./firebase.js";
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
const publishBtn = document.getElementById("publish");
const newsList = document.getElementById("newsList");
const breakingNews = document.getElementById("breakingNews");
const saveBreaking = document.getElementById("saveBreaking");
saveBreaking.addEventListener("click", async () => {

  const text = breakingNews.value.trim();

  if (!text) {
    alert("Breaking News నమోదు చేయండి.");
    return;
  }

  try {

    await setDoc(doc(db, "settings", "breaking"), {
      text: text
    });

    alert("Breaking News Save అయింది.");

    breakingNews.value = "";

  } catch (err) {

    console.error(err);
    alert("Save కాలేదు.");

  }

});
let editMode = false;
let editId = "";

publishBtn.addEventListener("click", async () => {
console.log("Publish button clicked");

  const title = document.getElementById("title").value.trim();
  const details = document.getElementById("details").value.trim();
  const imageFile = document.getElementById("image").files[0];

  if (!title || !details || (!imageFile && !editMode)) {
    alert("అన్ని వివరాలు నమోదు చేయండి.");
    return;
  }

  try {

    let imageURL = "";

    if (imageFile) {

      const formData = new FormData();
      formData.append("file", imageFile);
      formData.append("upload_preset", "News_upload");

      const upload = await fetch(
        "https://api.cloudinary.com/v1_1/zzofbzm1/image/upload",
        {
          method: "POST",
          body: formData
        }
      );

      const uploadData = await upload.json();
      imageURL = uploadData.secure_url;
    }

    if (editMode) {

      const docSnap = await getDoc(doc(db, "news", editId));
      const oldData = docSnap.data();

      await updateDoc(doc(db, "news", editId), {
        title,
        details,
        image: imageURL || oldData.image
      });

      alert("వార్త Update అయింది.");

      editMode = false;
      editId = "";
      publishBtn.innerText = "Publish";

    } else {

      await addDoc(collection(db, "news"), {
        title,
        details,
        image: imageURL,
        createdAt: new Date()
      });
console.log("News saved to Firestore");

console.log("Sending notification...");

const response = await fetch("https://rambantu-vayu-putrudu-server.onrender.com/send", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    title: title,
    message: details.substring(0, 100),
    url: "https://rambantu-vayu-putrudu.web.app"
  })
});

console.log(await response.text());

alert("వార్త విజయవంతంగా Publish అయింది!");
    }

    document.getElementById("title").value = "";
    document.getElementById("details").value = "";
    document.getElementById("image").value = "";

    await loadNews();

  } catch (err) {
    console.error(err);
    alert("Publish కాలేదు.");
  }

});

async function loadNews() {

  newsList.innerHTML = "";

  const q = query(
    collection(db, "news"),
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(q);

  snapshot.forEach((newsDoc) => {

    const news = newsDoc.data();

    newsList.innerHTML += `
      <div class="card">
        <img src="${news.image}" class="news-image">
        <h3>${news.title}</h3>
        <p>${news.details.substring(0,100)}...</p>

        <button onclick="editNews('${newsDoc.id}')">
          ✏️ Edit
        </button>

        <button onclick="deleteNews('${newsDoc.id}')">
          🗑️ Delete
        </button>

      </div>
    `;

  });

}

loadNews();

window.deleteNews = async function(id) {

  if (!confirm("ఈ వార్తను Delete చేయాలా?")) return;

  await deleteDoc(doc(db, "news", id));

  alert("వార్త Delete అయింది.");

  loadNews();

};

window.editNews = async function(id) {

  const docRef = doc(db, "news", id);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) return;

  const news = docSnap.data();

  document.getElementById("title").value = news.title;
  document.getElementById("details").value = news.details;

  editMode = true;
  editId = id;

  publishBtn.innerText = "Update News";

  alert("వార్త Edit చేయడానికి సిద్ధంగా ఉంది.");

};