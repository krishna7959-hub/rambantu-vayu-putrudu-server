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
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const publishBtn = document.getElementById("publish");
const newsList = document.getElementById("newsList");
let editMode = false;
let editId = "";
publishBtn.addEventListener("click", async () => {

  const title = document.getElementById("title").value.trim();
  const details = document.getElementById("details").value.trim();
  const imageFile = document.getElementById("image").files[0];
  
  if (!title || !details || !imageFile) {
    alert("అన్ని వివరాలు నమోదు చేయండి.");
    return;
  }
  
  try {
    
    // Cloudinary Upload
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
    console.log(upload.status);
console.log(upload);
    const uploadData = await upload.json();
    console.log(uploadData);
    const imageURL = uploadData.secure_url;
    
    // Firestore Save
    if (editMode) {
  
  await updateDoc(doc(db, "news", editId), {
    title,
    details,
    image: imageURL
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
  
  alert("వార్త విజయవంతంగా Publish అయింది!");
  
}
    console.log("Firestore Save Success");
    await loadNews();
alert("వార్త విజయవంతంగా Publish అయింది!");
  
    document.getElementById("title").value = "";
    document.getElementById("details").value = "";
    document.getElementById("image").value = "";
    
  } catch (err) {
    console.log(err);
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
  
  snapshot.forEach((doc) => {
    
    const news = doc.data();
    
    newsList.innerHTML += `
  <div class="card">
  <img src="${news.image}" class="news-image">
  <h3>${news.title}</h3>
  <p>${news.details.substring(0,100)}...</p>
<button onclick="editNews('${doc.id}')">
  ✏️ Edit
</button>
  <button onclick="deleteNews('${doc.id}')">
    🗑️ Delete
  </button>
</div>
    `;
    
  });
  
}

loadNews();
window.deleteNews = async function(id) {
  
  if (!confirm("ఈ వార్తను Delete చేయాలా?")) {
    return;
  }
  
  await deleteDoc(doc(db, "news", id));
  
  alert("వార్త Delete అయింది.");
  
  loadNews();
  
}; // ← ఇక్కడ సెమీకోలన్‌తో ముగించు

window.editNews = async function(id) {
  
  const docRef = doc(db, "news", id);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    
    const news = docSnap.data();
    
    document.getElementById("title").value = news.title;
    document.getElementById("details").value = news.details;
    
    alert("వార్త Edit చేయడానికి సిద్ధంగా ఉంది.");
  }
  
};editMode = true;
editId = id;
publishBtn.innerText = "Update News";