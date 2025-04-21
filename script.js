// Initial user database
let users = [
  { username: "p", password: "testuser", firstName: "Player", lastName: "One", email: "p@example.com", dob: "2000-01-01" }
];

let currentPlayer = null; // Track the currently logged-in player
let playerScores = {}; // Store scores for each player

// Show only the specified screen
function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));
  document.getElementById(screenId).classList.add('active');

  // Handle Home button visibility
  const hideHomeOnScreens = ['configScreen', 'gameScreen'];
  if (hideHomeOnScreens.includes(screenId)) {
    document.getElementById("homeBtn").classList.add("hidden");
  }else {
    document.getElementById("homeBtn").classList.remove("hidden");
  }
  if (screenId === 'welcomeScreen') {
    document.getElementById("logoutBtn").classList.add("hidden");
  }
   // New Game button only visible on gameScreen
   const newGameBtn = document.getElementById("newGameBtn");
   if (screenId === 'gameScreen') {
     newGameBtn.classList.remove("hidden");
   } else {
     newGameBtn.classList.add("hidden");
   }
 
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
  document.getElementById('registerForm').reset(); 
  showScreen('loginScreen');
}

// Login user
function loginUser(event) {
  event.preventDefault();

  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value;

  const user = users.find(u => u.username === username && u.password === password);

  if (user) {
    // Initialize scoring history for the player on every login
    currentPlayer = username;
    playerScores[currentPlayer] = []; // Reset the player's score history

    document.getElementById("loginForm").reset();
    document.getElementById("logoutBtn").classList.remove("hidden");
    showScreen('configScreen');
  } else {
    alert("Invalid username or password.");
  }
}

// Logout
function logout() {
  document.getElementById("logoutBtn").classList.add("hidden");
  showScreen('welcomeScreen');
  resetParams(); // Reset game parameters
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Clear current player and their scores
  currentPlayer = null;
  playerScores = {}; // Reset all player scores
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


// Game State
let gameRunning = false;
let score = 0;
let lives = 3;
let badSpaceshipSpeed = 1;
let accelerationCount = 0;
let lastShootTime = 0;
let lastLevelUpTime = 0; // Track the time for level-up
let gameTime = window.gameConfig ? window.gameConfig.gameTime * 60 : 120; // Default to 2 minutes if not set
let timerId; // Variable to store the timer interval ID


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

// Enemy Images
const enemyImages = [
  'assets/enemyRow1.jpeg', // Row 0
  'assets/enemyRow2.png',  // Row 1
  'assets/enemyRow3.png',  // Row 2
  'assets/enemyRow4.jpeg'  // Row 3
];

// Preload enemy images
const enemyImageObjects = enemyImages.map(src => {
  const img = new Image();
  img.src = src;
  return img;
});

// Enemies
const enemies = [];
const enemyRows = 4;
const enemyCols = 5;
const enemyWidth = 40;
const enemyHeight = 40;
let enemySpeed = 1;
let enemyDirection = 1;
let badBullet = null;

// Bullets
const bullets = [];
const bulletSpeed = 7;
const bulletWidth = 5;
const bulletHeight = 15;

// Initialize Game
function initGame() {
  resetParams(); // Reset game parameters
  resetPlayer();
  createEnemies();
  gameRunning = true;
  lastLevelUpTime = Date.now();  // Set the initial time for level-up
  gameTime = window.gameConfig ? window.gameConfig.gameTime * 60 : 120; // Reset game time
  updateScore();
  updateLives();
  document.getElementById('gameOver').style.display = 'none';
  gameLoop();
  startTimer();
}
function resetParams() {
  enemySpeed = 1;
  bullets.length = 0;
  score = 0;
  lives = 3;
  accelerationCount = 0;
  lastLevelUpTime = 0;
  gameRunning = false;
  badBullet = null;
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
        alive: true,
        image: enemyImageObjects[r]
      });
    }
  }
}
function startTimer() {
  const timerElement = document.getElementById('timer');

  // Clear any existing timer interval
  if (timerId) {
    clearInterval(timerId);
  }

  timerId = setInterval(() => {
    gameTime--;

    // Update the timer display
    const minutes = Math.floor(gameTime / 60).toString().padStart(2, '0');
    const seconds = (gameTime % 60).toString().padStart(2, '0');
    timerElement.textContent = `${minutes}:${seconds}`;

    // Change timer color to red during the last 30 seconds
    if (gameTime <= 30) {
      timerElement.style.color = 'red';
    } else {
      timerElement.style.color = ''; // Reset to default color
    }

    if (gameTime <= 0) {
      clearInterval(timerId);
      gameOver();
    }
  }, 1000); // Update every second
}

// Update the game loop to use a variable for tracking the animation frame
let gameLoopId; // Variable to store the animation frame ID

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

  // Store the animation frame ID
  gameLoopId = requestAnimationFrame(gameLoop);
}

// Update Game State
function update() {
  handlePlayerMovement();
  moveEnemies();
  moveBullets();
  checkCollisions();
  moveBadBullet();
  checkBadBulletCollision(); 
  maybeShootFromEnemy();  
}

// Render Game
function render() {
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw player
  ctx.drawImage(player.image, player.x, player.y, player.width, player.height);

  // Draw enemies
  enemies.forEach(enemy => {
    if (enemy.alive) {
      ctx.drawImage(enemy.image, enemy.x, enemy.y, enemy.width, enemy.height);
    }
  });

  // Draw bullets
  ctx.fillStyle = 'yellow';
  bullets.forEach(bullet => {
    ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
  });

  // Draw bad spaceship bullet
  if (badBullet) {
    ctx.fillStyle = 'red';
    ctx.fillRect(badBullet.x, badBullet.y, badBullet.width, badBullet.height);
  }
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

function maybeShootFromEnemy() {
  if (badBullet) {
    const traveled = badBullet.y - badBullet.startY;
    if (traveled < canvas.height * 0.75) {
      return; // Wait until bullet travels 3/4 of screen
    }
  }

  const shooters = enemies.filter(e => e.alive);
  if (shooters.length === 0) return;

  const shooter = shooters[Math.floor(Math.random() * shooters.length)];

  badBullet = {
    x: shooter.x + shooter.width / 2 - 2.5,
    y: shooter.y + shooter.height +5,
    width: 5,
    height: 15,
    speed: 2,
    startY: shooter.y + shooter.height
  };
}

function checkBadBulletCollision() {
  if (!badBullet) return;

  if (checkCollision(badBullet, player)) {
    lives--;
    updateLives();
    resetPlayer();
    badBullet = null;

    if (lives <= 0) {
      gameOver();
    }
  }
}

function moveBadBullet() {
  if (!badBullet) return;

  badBullet.y += badBullet.speed;

  // Check if the bullet goes off screen
  if (badBullet.y > canvas.height) {
    badBullet = null;
    return;
  }

  // Ensure the bullet does not disappear when colliding with other enemies
  for (let i = 0; i < enemies.length; i++) {
    const enemy = enemies[i];
    if (enemy.alive && checkCollision(badBullet, enemy)) {
      // Skip removing the bullet if it collides with an enemy
      return;
    }
  }

  // Check if the bullet hits the player
  if (checkCollision(badBullet, player)) {
    lives--;
    updateLives();
    resetPlayer();
    badBullet = null;

    if (lives <= 0) {
      gameOver();
    }
  }
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
    enemySpeed += 0.15;
  }
}

// Game Events
function gameOver() {
  gameRunning = false;

  // Save the current score to the player's history
  if (currentPlayer) {
    playerScores[currentPlayer].push(score);
    playerScores[currentPlayer].sort((a, b) => b - a); // Sort scores in descending order
    if (playerScores[currentPlayer].length > 5) {
      playerScores[currentPlayer] = playerScores[currentPlayer].slice(0, 5); // Keep only top 5 scores
    }
  }

  let message = '';
  if (gameTime <= 0) {
    if (score > 100) {
      message = 'You can do better!' + score;
    } else {
      message = 'Winner!';
    }
  } else if (lives <= 0) {
    message = 'You Lost!';
  } else {
    if (enemies.every(enemy => !enemy.alive)) {
      message = 'Champion!';
    }
  }

  // Display high score table
  displayHighScoreTable();

  document.getElementById('gameOverMessage').textContent = message;
  document.getElementById('finalScore').textContent = score;
  document.getElementById('gameOver').style.display = 'block';
}

function displayHighScoreTable() {
  const highScoreTable = document.getElementById('highScoreTable');
  highScoreTable.innerHTML = ''; // Clear previous table

  if (currentPlayer && playerScores[currentPlayer]) {
    const scores = playerScores[currentPlayer];
    highScoreTable.innerHTML = `
      <h3>High Scores for ${currentPlayer}</h3>
      <table class="score-table">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Score</th>
          </tr>
        </thead>
        <tbody>
          ${scores.map((s, index) => `
            <tr>
              <td>${index + 1}</td>
              <td>${s}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }
}

function resetGame() {
  // Stop any ongoing game loop
  gameRunning = false;

  // Reset game parameters
  resetParams();

  // Cancel any ongoing animation frame
  cancelAnimationFrame(gameLoopId);

  // Clear the timer interval
  if (timerId) {
    clearInterval(timerId);
  }

  // Hide the game over screen
  document.getElementById('gameOver').style.display = 'none';

  // Reinitialize the game
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
