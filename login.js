const loginBtn = document.getElementById("loginBtn");

loginBtn.addEventListener("click", () => {
  
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  const msg = document.getElementById("msg");
  
  if (username === "admin" && password === "12345") {
    
    localStorage.setItem("adminLogin", "true");
    
    window.location.href = "admin.html";
    
  } else {
    
    msg.innerText = "❌ Username లేదా Password తప్పు.";
    
  }
  
});