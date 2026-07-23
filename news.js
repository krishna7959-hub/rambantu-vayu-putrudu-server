import { db } from "./firebase.js";
import {
  doc,
  getDoc,
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const params = new URLSearchParams(window.location.search);
const id = params.get("id");

const newsDetails = document.getElementById("newsDetails");

async function loadNews() {
  const docRef = doc(db, "news", id);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    const news = docSnap.data();
    
    newsDetails.innerHTML = `
      <div class="card">
        <img src="${news.image}" class="news-image">
    <h1>${news.title}</h1>

<p class="news-date">
📅 ${
  news.createdAt
    ? new Date(news.createdAt.seconds * 1000).toLocaleString("en-IN")
    : ""
}
</p>

<p>${news.details}</p>
        <br>
        <button onclick="history.back()">⬅ Back</button>
        
        <br><br>

<a href="https://wa.me/?text=${encodeURIComponent(news.title + "\n\n" + window.location.href)}"
   target="_blank">

<button class="share-btn">
🟢 Share on WhatsApp
</button>

</a>
<hr>
<h2>📰 Related News</h2>
<div id="relatedNews"></div>
      </div>
    `;
  loadRelatedNews(id);
  } else {
    newsDetails.innerHTML = "<h2>News Not Found</h2>";
  }
}
async function loadRelatedNews(currentId) {
  
  const snap = await getDocs(collection(db, "news"));
  
  let html = "";
  
  snap.forEach(doc => {
    
    if (doc.id !== currentId && html.split("news-card").length <= 5) {
      
      const n = doc.data();
      
      html += `
      <div class="news-card"
      onclick="location.href='news.html?id=${doc.id}'">

      <img src="${n.image}">

      <div class="news-content">
      <h3>${n.title}</h3>
      </div>

      </div>
      `;
      
    }
    
  });
  
  document.getElementById("relatedNews").innerHTML = html;
  
}
loadNews();