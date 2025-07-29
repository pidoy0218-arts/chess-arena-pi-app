// logic-login.js

document.addEventListener("DOMContentLoaded", async () => {
  if (!window.Pi) {
    alert("Pi Network SDK not available. Please open in Pi Browser.");
    return;
  }

  const loginButton = document.getElementById("loginButton");
  if (!loginButton) return;

  loginButton.addEventListener("click", async () => {
    try {
      const scopes = ['username', 'payments'];
      const authResult = await window.Pi.authenticate(scopes);

      localStorage.setItem("pi_user", JSON.stringify(authResult.user));
      alert("Welcome " + authResult.user.username);
      window.location.href = "board.html"; // next screen
    } catch (error) {
      console.error("Authentication failed:", error);
      alert("Login failed. Try again.");
    }
  });
});
