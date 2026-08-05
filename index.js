import { db } from "./firebase.js";
import {
  collection,
  getDocs,
  query,
  orderBy,
  doc,
  getDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let allNews = [];

async function loadNews() {
  
  try {
    
    const q = query(
      collection(db, "news"),
      orderBy("createdAt", "desc")
    );
    
    const snapshot = await getDocs(q);

console.log("Documents Count:", snapshot.size);

snapshot.forEach((doc) => {
    console.log(doc.id, doc.data());
});
    
    allNews = [];
    
    snapshot.forEach(doc => {
      
      allNews.push({
        id: doc.id,
        ...doc.data()
      });
      
    });
    
    loadFeaturedNews();
    
    displayNews(allNews);
    
    loadBreakingNews();
    
  } catch (err) {
    
    alert(err.message);
console.log(err);
    
    document.getElementById("newsContainer").innerHTML =
      "<h3>వార్తలు లోడ్ కాలేదు</h3>";
    
  }
  
}

function loadFeaturedNews() {
  
  if (allNews.length === 0) return;
  
  const news = allNews[0];
  
  document.getElementById("featuredNews").innerHTML = `

<div class="news-card"
onclick="location.href='news.html?id=${news.id}'">

<img src="${news.image}" alt="">

<div class="news-content">

<h3>${news.title}</h3>

<p>${news.details.substring(0,150)}...</p>

</div>

</div>

`;
  
}

function displayNews(newsList) {

  let html = "";

  newsList.forEach(news => {

    html += `

<div class="news-card"
onclick="location.href='news.html?id=${news.id}'">

<img src="${news.image}" alt="">

<div class="news-content">

<span class="category-badge">
${news.category || "News"}
</span>

<h3>${news.title}</h3>

<p>${news.details.substring(0,120)}...</p>

</div>

</div>

`;
    
  });
  
  document.getElementById("newsContainer").innerHTML = html;
  
}
async function loadBreakingNews() {

  const breakingElement = document.getElementById("breakingText");

  if (!breakingElement) return;

  try {

    const snap = await getDoc(doc(db, "settings", "breaking"));
console.log("Firestore Data:", snap.data());
    if (snap.exists()) {

      const data = snap.data();

      if (data.text && data.text.trim() !== "") {
        breakingElement.innerHTML = "🚨 " + data.text;
        return;
      }

    }

  } catch (e) {
    console.log(e);
  }

  // Breaking News లేకపోతే మాత్రమే Latest News చూపించు
  const breaking = allNews
    .slice(0, 10)
    .map(n => "🔴 " + n.title)
    .join(" &nbsp;&nbsp;&nbsp;&nbsp; ");

  breakingElement.innerHTML = breaking;

}

window.filterNews = function(category) {
  
  if (category === "All") {
    
    displayNews(allNews);
    return;
    
  }
  
  const filtered = allNews.filter(news =>
    (news.category || "").toLowerCase() === category.toLowerCase()
  );
  
  displayNews(filtered);
  
}

window.searchNews = function() {
  
  const keyword = document
    .getElementById("searchInput")
    .value
    .toLowerCase();
  
  const filtered = allNews.filter(news =>
    
    (news.title || "").toLowerCase().includes(keyword) ||
    
    (news.details || "").toLowerCase().includes(keyword)
    
  );
  
  displayNews(filtered);
  
}

loadNews();
const topBtn = document.getElementById("topBtn");

window.onscroll = function() {
  if (
    document.body.scrollTop > 300 ||
    document.documentElement.scrollTop > 300
  ) {
    topBtn.style.display = "block";
  } else {
    topBtn.style.display = "none";
  }
};

window.topFunction = function() {
  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
};
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./service-worker.js")
      .then(() => console.log("Service Worker Registered"))
      .catch(err => console.log(err));
  });
}
async function requestNotificationPermission() {
  try {
    const permission = await Notification.requestPermission();

    if (permission === "granted") {
      console.log("Notification permission granted");
    } else {
      console.log("Notification permission denied");
    }
  } catch (error) {
    console.error(error);
  }
}

