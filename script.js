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

// Login user
function loginUser(event) {
  event.preventDefault();

  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value;

  const user = users.find(u => u.username === username && u.password === password);

  if (user) {
    showScreen('configScreen');
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

function showModal(modalId) {
  document.getElementById(modalId).style.display = "block";
}

function closeModal() {
  document.querySelectorAll('.modal').forEach(modal => {
    modal.style.display = "none";
  });
}

window.onclick = function(event) {
  if (event.target.classList.contains('modal')) {
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

///////////////////////////////// Configuration //////////////////////////////////////////

// Populate letter keys A-Z + Space
window.addEventListener('DOMContentLoaded', () => {
  const shootKeySelect = document.getElementById('shootKey');
  for (let i = 65; i <= 90; i++) {
    const letter = String.fromCharCode(i);
    const option = document.createElement('option');
    option.value = letter;
    option.textContent = letter;
    shootKeySelect.appendChild(option);
  }
});

// Store config and start game
function startConfiguredGame() {
  const selectedKey = document.getElementById('shootKey').value;
  const gameTime = parseInt(document.getElementById('gameTime').value);
  const shipColor = document.getElementById('shipColor').value;

  if (gameTime < 2) {
    alert("Game time must be at least 2 minutes.");
    return;
  }

  // Save settings (can be global or localStorage)
  window.gameConfig = {
    shootKey: selectedKey,
    gameTime: gameTime,
    shipColor: shipColor
  };
  showScreen('gameScreen');
  initGame();
}

////////////////////////////////////// GAME LOGIC //////////////////////////////////////

// Game Canvas Setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  canvas.width = 800;
  canvas.height = 600;

  // Center player at the bottom after canvas is set
  player.x = Math.random() * (canvas.width * 0.4); // Random starting position within 40% of the bottom area
  player.y = canvas.height - player.height - 10;
}

// Game State
let gameRunning = false;
let score = 0;
let lives = 3;
let badSpaceshipSpeed = 1;
let badSpaceshipDirection = 1;  // 1 = right, -1 = left
let accelerationCount = 0;
let lastShootTime = 0;
let lastLevelUpTime = 0; // Track the time for level-up
let badSpaceshipCooldown = [];

// Player
const player = {
  x: canvas.width / 2 - 25,
  y: canvas.height - 60,
  width: 50,
  height: 50,
  speed: 5,
  color: '#1abc9c',
  image: new Image()
};

player.image.src = 'assets/spaceship.png';

// Enemies
const enemies = [];
const enemyRows = 4;
const enemyCols = 5;
const enemyWidth = 40;
const enemyHeight = 40;
let enemySpeed = 1;
let enemyDirection = 1;

// Bullets
const bullets = [];
const bulletSpeed = 7;
const bulletWidth = 5;
const bulletHeight = 15;

// Initialize Game
function initGame() {
  bullets.length = 0;  // Clear the bullets array
  resizeCanvas();
  createEnemies();
  gameRunning = true;
  score = 0;
  lives = 3;
  accelerationCount = 0;
  enemySpeed = 1;
  lastLevelUpTime = Date.now();  // Set the initial time for level-up
  updateScore();
  updateLives();
  document.getElementById('gameOver').style.display = 'none';
  gameLoop();
}

// Create Enemies
function createEnemies() {
  enemies.length = 0;
  for (let r = 0; r < enemyRows; r++) {
    for (let c = 0; c < enemyCols; c++) {
      enemies.push({
        x: c * 70 + 50,
        y: r * 60 + 50,
        width: enemyWidth,
        height: enemyHeight,
        row: r,
        col: c,
        alive: true
      });
    }
  }
}

// Game Loop
function gameLoop() {
  if (!gameRunning) return;

  update();
  render();
  // Check if it's time for level-up (every 5 seconds)
  let currentTime = Date.now();
  if (currentTime - lastLevelUpTime >= 5000) {  // 5 seconds
    levelUp();
    lastLevelUpTime = currentTime;  // Reset the last level-up time
  }
  requestAnimationFrame(gameLoop);
}

// Update Game State
function update() {
  handlePlayerMovement();
  moveEnemies();
  moveBullets();
  checkCollisions();
}

// Render Game
function render() {
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw player
  if (player.image.complete) {
    ctx.drawImage(player.image, player.x, player.y, player.width, player.height);
  } else {
    // Fallback rectangle if image not loaded
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);
  }

  // Draw enemies
  enemies.forEach(enemy => {
    if (enemy.alive) {
      ctx.fillStyle = ['red', 'orange', 'yellow', 'green'][enemy.row % 4];
      ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
    }
  });

  // Draw bullets
  ctx.fillStyle = 'yellow';
  bullets.forEach(bullet => {
    ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
  });
}

function moveEnemies() {
  let edgeReached = false;
  
  // Check if any enemy reached the edge
  enemies.forEach(enemy => {
    if (enemy.alive) {
      // If an enemy reaches the left or right edge, mark that
      if ((enemy.x + enemyDirection * enemySpeed < 0) || 
          (enemy.x + enemyWidth + enemyDirection * enemySpeed > canvas.width)) {
        edgeReached = true;
      }
    }
  });
  
  // Move enemies
  enemies.forEach(enemy => {
    if (enemy.alive) {
      enemy.x += enemyDirection * enemySpeed; // Move horizontally
    }
  });

  // If edge is reached, reverse direction but don't move down
  if (edgeReached) {
    enemyDirection *= -1;
  }

  // Check if all enemies are dead and end the game
  if (enemies.every(enemy => !enemy.alive)) {
    gameOver();
  }
}

// Player Movement
const keys = {};
window.addEventListener('keydown', e => {
  keys[e.key] = true;
});
window.addEventListener('keyup', e => {
  keys[e.key] = false;
});

function handlePlayerMovement() {
  if (keys['ArrowLeft'] && player.x > 0) {
    player.x -= player.speed;
  }
  if (keys['ArrowRight'] && player.x < canvas.width  - player.width) {
    player.x += player.speed;
  }
  if (keys['ArrowUp'] && player.y > canvas.height * 0.6) { // Restricting the player to 40% of the bottom canvas area
    player.y -= player.speed;
  }
  if (keys['ArrowDown'] && player.y < canvas.height - player.height) {
    player.y += player.speed;
  }
  if (keys[' '] || window.gameConfig && (keys[window.gameConfig.shootKey.toLowerCase()] || keys[window.gameConfig.shootKey.toUpperCase()])) { 
    shoot();
  }
}

// Shooting
function shoot() {
  // Limit shooting rate
  if (bullets.length > 0) return;

  bullets.push({
    x: player.x + player.width / 2 - bulletWidth / 2,
    y: player.y,
    width: bulletWidth,
    height: bulletHeight,
    speed: bulletSpeed
  });
}

function moveBullets() {
  for (let i = bullets.length - 1; i >= 0; i--) {
    bullets[i].y -= bullets[i].speed;

    // Remove bullets that go off screen
    if (bullets[i].y < 0 || bullets[i].y > canvas.height) {
      bullets.splice(i, 1);
    }
  }
}

// Collision Detection
function checkCollisions() {
  for (let i = bullets.length - 1; i >= 0; i--) {
    const bullet = bullets[i];

    for (let j = enemies.length - 1; j >= 0; j--) {
      const enemy = enemies[j];
      if (enemy.alive && checkCollision(bullet, enemy)) {
        enemy.alive = false;
        bullets.splice(i, 1); // remove bullet
        score += getScoreForRow(enemy.row);
        updateScore();
        break; // exit inner loop — this bullet is done
      }

    }
  }
}

function checkCollision(rect1, rect2) {
  return rect1.x < rect2.x + rect2.width &&
         rect1.x + rect1.width > rect2.x &&
         rect1.y < rect2.y + rect2.height &&
         rect1.y + rect1.height > rect2.y;
}

function getScoreForRow(row) {
  switch (row) {
    case 0: return 20;
    case 1: return 15;
    case 2: return 10;
    case 3: return 5;
  }
}

function levelUp() {
  if (accelerationCount < 4) {
    accelerationCount++;
    enemySpeed += 0.2;
  }
}

// Game Events
function gameOver() {
  gameRunning = false;
  document.getElementById('finalScore').textContent = score;
  document.getElementById('gameOver').style.display = 'block';
}

function resetGame() {
  document.getElementById('gameOver').style.display = 'none';
  initGame();
}

function resetPlayer() {
  player.x = Math.random() * (canvas.width * 0.4);
  player.y = canvas.height - player.height - 10;
}

// UI Updates
function updateScore() {
  document.getElementById('score').textContent = score;
}

function updateLives() {
  document.getElementById('lives').textContent = lives;
}
document.addEventListener('keydown', (e) => {
  // Stop page from scrolling when using game controls
  if (
    e.code === 'Space' ||
    e.code === 'ArrowUp' ||
    e.code === 'ArrowDown'
  ) {
    e.preventDefault();
  }
});
