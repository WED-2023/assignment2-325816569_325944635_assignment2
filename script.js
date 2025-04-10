// Initial user database
let users = [
    { username: "p", password: "testuser", firstName: "Player", lastName: "One", email: "p@example.com", dob: "2000-01-01" }
  ];
  
  // Show only the specified screen
  function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
  
    // Special handling for about modal
    if (screenId === 'aboutScreen') {
      openModal();
    }
  }
  
  // Register user
  function registerUser(event) {
    event.preventDefault();
  
    const username = document.getElementById('regUsername').value.trim();
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regConfirmPassword').value;
    const firstName = document.getElementById('regFirstName').value.trim();
    const lastName = document.getElementById('regLastName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const dob = document.getElementById('regDOB').value;
  
    const errors = [];
  
    if (!username || !password || !confirmPassword || !firstName || !lastName || !email || !dob) {
      errors.push("All fields are required.");
    }
  
    if (password !== confirmPassword) {
      errors.push("Passwords do not match.");
    }
  
    if (password.length < 8 || !/\d/.test(password) || !/[A-Za-z]/.test(password)) {
      errors.push("Password must be at least 8 characters and include letters and numbers.");
    }
  
    if (/\d/.test(firstName) || /\d/.test(lastName)) {
      errors.push("First and last name cannot contain numbers.");
    }
  
    if (!/\S+@\S+\.\S+/.test(email)) {
      errors.push("Invalid email address.");
    }
  
    if (users.find(u => u.username === username)) {
      errors.push("Username already exists.");
    }
  
    if (errors.length > 0) {
      alert(errors.join("\n"));
      return;
    }
  
    users.push({ username, password, firstName, lastName, email, dob });
    alert("Registration successful! You can now log in.");
    showScreen('loginScreen');
  }
  
  // Login user
  function loginUser(event) {
    event.preventDefault();
  
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
  
    const user = users.find(u => u.username === username && u.password === password);
  
    if (user) {
      alert(`Welcome, ${user.firstName || username}!`);
      showScreen('gameScreen');
    } else {
      alert("Invalid username or password.");
    }
  }
  
  // Logout
  function logout() {
    showScreen('welcomeScreen');
  }
  
  // Modal functionality
  const modal = document.getElementById("aboutModal");
  
  function openModal() {
    modal.style.display = "block";
  }
  
  function closeModal() {
    modal.style.display = "none";
  }
  
  window.onclick = function(event) {
    if (event.target === modal) {
      closeModal();
    }
  };
  
  window.onkeydown = function(event) {
    if (event.key === "Escape") {
      closeModal();
    }
  };
  
  // Set default view
  document.addEventListener("DOMContentLoaded", () => {
    showScreen("welcomeScreen");
  
    // Hook up form actions
    document.getElementById("registerForm")?.addEventListener("submit", registerUser);
    document.getElementById("loginForm")?.addEventListener("submit", loginUser);
  });
  
  // Register user
function registerUser(event) {
    event.preventDefault();
  
    const username = document.getElementById('regUsername').value.trim();
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regConfirmPassword').value;
    const firstName = document.getElementById('regFirstName').value.trim();
    const lastName = document.getElementById('regLastName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const dob = document.getElementById('regDOB').value;
  
    const errors = [];
  
    if (!username || !password || !confirmPassword || !firstName || !lastName || !email || !dob) {
      errors.push("All fields are required.");
    }
  
    if (password !== confirmPassword) {
      errors.push("Passwords do not match.");
    }
  
    if (password.length < 8 || !/\d/.test(password) || !/[A-Za-z]/.test(password)) {
      errors.push("Password must be at least 8 characters and include letters and numbers.");
    }
  
    if (!/^[a-zA-Z]/.test(firstName) || !/^[a-zA-Z]/.test(lastName)) {
      errors.push("First and last name must contains only letters.");
    }
  
    if (!/\S+@\S+\.\S+/.test(email)) {
      errors.push("Invalid email address.");
    }
  
    if (users.find(u => u.username === username)) {
      errors.push("Username already exists.");
    }
  
    if (errors.length > 0) {
      alert(errors.join("\n"));
      return;
    }
  
    users.push({ username, password, firstName, lastName, email, dob });
    alert("Registration successful! You can now log in.");
    showScreen('loginScreen');
  }
  
  // Set default view
document.addEventListener("DOMContentLoaded", () => {
    showScreen("welcomeScreen");
  
    // Hook up form actions
    document.getElementById("registerForm")?.addEventListener("submit", registerUser);
});
  


////////////////////////////////////// GAME LOGIC //////////////////////////////////////

// Spaceship //
let playerSpaceship = {
    x: 0, // Player's spaceship position on X-axis
    y: window.innerHeight - 100, // Position at the bottom of the screen
    speed: 5, // Movement speed
};
function moveSpaceShip(e) {
    if(e.key === "ArrowLeft" && playerSpaceship.x > 0) {
        playerSpaceship.x -= playerSpaceship.speed;
    }
    if(e.key === "ArrowRight" && playerSpaceship.x < window.innerWidth - 50) {
        playerSpaceship.x += playerSpaceship.speed;
    }
    if(e.key === "ArrowUp" && playerSpaceship.y > 0 && playerSpaceship.y < window.innerHeight*0.4) {
        playerSpaceship.y -= playerSpaceship.speed;
    }
    if(e.key === "ArrowDown" && playerSpaceship.y < window.innerHeight - 50) {
        playerSpaceship.y += playerSpaceship.speed;
    }
    drawSpaceship();
}
function drawSpaceship() {
    const spaceship = document.getElementById("spaceship");
    spaceship.style.left = playerSpaceship.x + "px";
    spaceship.style.top = playerSpaceship.y + "px";
}

// Enemy Spaceships //
let enemySpaceships = []; // Array to hold enemy spaceships
function spawnEnemy() {
    const rows = 4; // Number of rows of enemy spaceships
    const cols = 5; // Number of columns of enemy spaceships
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            const enemy = {
                x: j * 100 + 50, // Adjusted for spacing
                y: i * 100 + 50, // Adjusted for spacing
                direction: 1, // 1 for right, -1 for left
            };
            enemySpaceships[i].push(enemy);
        }
    }
}
function moveEnemy() {
    enemySpaceships.forEach(row => {
        row.forEach(enemy => {
            enemy.x += enemy.direction * 2; // Move enemy spaceships
            if (enemy.x > window.innerWidth - 50 || enemy.x < 0) {
                enemy.direction *= -1; // Change direction on hitting the wall
            }
            drawEnenmy(enemy); // Draw enemy spaceship
        });
    });
  }

function drawEnemy(enemy) {
    const enemyElement = document.getElementById(`enemySpaceships-${enemy.x}-${enemy.y}`);
    if (enemyElement) {
        enemyElement.style.left = enemy.x + "px";
        enemyElement.style.top = enemy.y + "px";
    }
}

// Shooting //


// Scoreboard //
