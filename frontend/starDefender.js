const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 600;
const loginButton = { x: canvas.width / 2 - 75, y: 340, width: 150, height: 40 };
const createAccountButton = { x: canvas.width / 2 - 75, y: 400, width: 150, height: 40 };
const userField = { x: canvas.width / 2 - 150, y: 200, width: 300, height: 40 };
const passField = { x: canvas.width / 2 - 150, y: 260, width: 300, height: 40 };
const newGameButton = { x: canvas.width / 2 - 75, y: 300, width: 150, height: 50 };
const continueHordeButton = { x: canvas.width / 2 - 75, y: 360, width: 150, height: 40 };
const exitToMenuButton = { x: canvas.width / 2 - 75, y: 420, width: 150, height: 40 };

const gameState = {
  screen: 'LOGIN',
  userInput: '',
  passInput: '',
  passFocused: false,
  userToken: '',
  gameOverTime: 0,
  winTime: 0,
  player: {
    x: 375,
    y: 520,
    width: 50,
    height: 50,
    speed: 300,
    bullets: [],
    lastShotTime: 0,
    shotCooldown: 200,
    health: 3,
    shieldActive: false,
    shieldEndTime: 0,
    multiShotActive: false,
    multiShotEndTime: 0
  },
  enemies: [],
  enemyBullets: [],
  powerUps: [],
  explosions: [],
  stars: [],
  keys: {},
  score: 0,
  gameOver: false,
  paused: false,
  wave: 1,
  waveInProgress: false,
  waveEnemies: 0,
  waveBossSpawned: false,
  bossExplosion: null,
  hordeMode: false,
  hordeDelayActive: false,
  hordeDelayStart: 0
};

const playerImg = new Image();
playerImg.src = 'player.png';
const enemyImg = new Image();
enemyImg.src = 'enemy.png';
const bossImg = new Image();
bossImg.src = 'boss.png';
const explosionGif = new Image();
explosionGif.src = 'explosion.gif';
let explosion = null;
let highScores = [];

window.addEventListener('keydown', e => {
  gameState.keys[e.key] = true;
  if (e.key === 'p' && gameState.screen === 'GAME') gameState.paused = !gameState.paused;
  if (gameState.screen === 'LOGIN') {
    if (e.key === 'Backspace') {
      if (gameState.passFocused) gameState.passInput = gameState.passInput.slice(0, -1);
      else gameState.userInput = gameState.userInput.slice(0, -1);
    } else if (e.key === 'Tab') {
      gameState.passFocused = !gameState.passFocused;
      e.preventDefault();
    } else if (e.key.length === 1) {
      if (gameState.passFocused) gameState.passInput += e.key;
      else gameState.userInput += e.key;
    }
  }
});

window.addEventListener('keyup', e => {
  gameState.keys[e.key] = false;
});

canvas.addEventListener('mousedown', e => {
  const rect = canvas.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const clickY = e.clientY - rect.top;
  if (gameState.screen === 'LOGIN') {
    if (clickInside(clickX, clickY, loginButton)) loginUser(gameState.userInput, gameState.passInput);
    else if (clickInside(clickX, clickY, createAccountButton)) registerUser(gameState.userInput, gameState.passInput);
    if (clickInside(clickX, clickY, userField)) gameState.passFocused = false;
    else if (clickInside(clickX, clickY, passField)) gameState.passFocused = true;
    return;
  }
  if (gameState.screen === 'MENU') {
    if (clickInside(clickX, clickY, newGameButton)) startNewGame();
    return;
  }
  if (gameState.screen === 'WIN') {
    if (clickInside(clickX, clickY, continueHordeButton)) {
      gameState.hordeMode = true;
      gameState.wave = 11;
      gameState.screen = 'GAME';
      gameState.hordeDelayActive = true;
      gameState.hordeDelayStart = Date.now();
    } else if (clickInside(clickX, clickY, exitToMenuButton)) {
      submitScore(gameState.score);
      gameState.screen = 'MENU';
    }
    return;
  }
});

function clickInside(cx, cy, r) {
  return cx >= r.x && cx <= r.x + r.width && cy >= r.y && cy <= r.y + r.height;
}

function loadHighScores() {
  fetch('http://localhost:5285/api/scores')
    .then(r => r.json())
    .then(scores => { highScores = scores; })
    .catch(err => console.error(err));
}

function loginUser(username, password) {
  fetch('http://localhost:5285/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  })
    .then(r => { if (!r.ok) throw new Error('Login failed'); return r.json(); })
    .then(data => {
      gameState.userToken = data.token;
      gameState.screen = 'MENU';
      gameState.userInput = '';
      gameState.passInput = '';
    })
    .catch(err => alert(err.message));
}

function registerUser(username, password) {
  fetch('http://localhost:5285/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  })
    .then(r => { if (!r.ok) throw new Error('Registration failed'); return r.text(); })
    .then(() => { alert('User created'); })
    .catch(err => alert(err.message));
}

function submitScore(points) {
  if (!gameState.userToken) return;
  fetch('http://localhost:5285/api/scores', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + gameState.userToken
    },
    body: JSON.stringify({ points })
  })
    .then(r => r.json())
    .then(() => { loadHighScores(); })
    .catch(err => console.error(err));
}

function startNewGame() {
  resetGameState();
  gameState.screen = 'GAME';
}

function resetGameState() {
  gameState.player.x = 375;
  gameState.player.y = 520;
  gameState.player.health = 3;
  gameState.player.bullets = [];
  gameState.player.lastShotTime = 0;
  gameState.player.shotCooldown = 200;
  gameState.player.shieldActive = false;
  gameState.player.shieldEndTime = 0;
  gameState.player.multiShotActive = false;
  gameState.player.multiShotEndTime = 0;
  gameState.enemies = [];
  gameState.enemyBullets = [];
  gameState.powerUps = [];
  gameState.explosions = [];
  gameState.score = 0;
  gameState.gameOver = false;
  gameState.paused = false;
  gameState.wave = 1;
  gameState.waveInProgress = false;
  gameState.waveEnemies = 0;
  gameState.waveBossSpawned = false;
  gameState.bossExplosion = null;
  gameState.hordeMode = false;
  gameState.hordeDelayActive = false;
  gameState.hordeDelayStart = 0;
  explosion = null;
}

function shootBullet() {
  const now = Date.now();
  if (now - gameState.player.lastShotTime > gameState.player.shotCooldown) {
    if (gameState.player.multiShotActive) {
      const angles = [270, 315, 0, 45, 90, 135, 180, 225];
      const speed = 400;
      angles.forEach(a => {
        const rad = a * Math.PI / 180;
        const xSpeed = speed * Math.cos(rad);
        const ySpeed = speed * Math.sin(rad) * -1;
        gameState.player.bullets.push({
          x: gameState.player.x + gameState.player.width / 2 - 2.5,
          y: gameState.player.y,
          width: 5,
          height: 10,
          xSpeed: xSpeed,
          ySpeed: ySpeed
        });
      });
    } else {
      gameState.player.bullets.push({
        x: gameState.player.x + gameState.player.width / 2 - 2.5,
        y: gameState.player.y,
        width: 5,
        height: 10,
        speed: -400
      });
    }
    gameState.player.lastShotTime = now;
  }
}

function isColliding(a, b) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

function spiralPathA(t, cx, cy) {
  const radius = 50 + 80 * t;
  const angle = 2 * Math.PI * t * 1.5;
  return { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) };
}

function spiralPathB(t, cx, cy) {
  const radius = 60 + 70 * t;
  const angle = 2 * Math.PI * t * 2;
  return { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) };
}

function spiralPathC(t, cx, cy) {
  const radius = 40 + 100 * t;
  const angle = Math.PI * t * 3;
  return { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) };
}

function getPathPoint(pathType, t, cx, cy) {
  if (pathType === 'A') return spiralPathA(t, cx, cy);
  if (pathType === 'B') return spiralPathB(t, cx, cy);
  return spiralPathC(t, cx, cy);
}

function getRandomCenter() {
  const margin = 100;
  const x = margin + Math.random() * (canvas.width - 2 * margin);
  const y = 0;
  return { x, y };
}

function spawnFormation(rows, cols, pathType, enteringType = null) {
  if (enteringType === null) enteringType = Math.random() < 0.5 ? "spiral" : "warp";
  const offsetX = 50;
  const offsetY = 50;
  const { x: centerX, y: centerY } = getRandomCenter();
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const xOffset = col * offsetX;
      const yOffset = row * offsetY;
      const paramOffset = (row + col) * 0.05;
      let enemy = {
        x: 0,
        y: 0,
        width: 40,
        height: 40,
        lastShotTime: 0,
        entering: true,
        param: paramOffset,
        paramSpeed: 0.6,
        pathType: pathType,
        speed: 120,
        xOffset: xOffset,
        yOffset: yOffset,
        centerX: centerX,
        centerY: centerY,
        health: 1,
        isBoss: false,
        isHordeBoss: false,
        enteringType: enteringType
      };
      if (enteringType === "warp") {
        enemy.targetX = centerX + xOffset;
        enemy.targetY = centerY + yOffset;
        enemy.warpSpeed = 300;
        enemy.x = enemy.targetX;
        enemy.y = -40;
      }
      gameState.enemies.push(enemy);
      gameState.waveEnemies++;
    }
  }
}

function spawnSingleShip() {
  const xPos = Math.random() * (canvas.width - 40);
  gameState.enemies.push({
    x: xPos,
    y: -40,
    width: 40,
    height: 40,
    lastShotTime: 0,
    entering: false,
    param: 0,
    paramSpeed: 0,
    pathType: 'NONE',
    speed: 120,
    xOffset: 0,
    yOffset: 0,
    centerX: 0,
    centerY: 0,
    health: 1,
    isBoss: false,
    isHordeBoss: false
  });
  gameState.waveEnemies++;
}

function spawnBoss(health = 100, speed = 60, count = 1) {
  for (let i = 0; i < count; i++) {
    const offset = i * 120;
    gameState.enemies.push({
      x: canvas.width / 2 - 50 + offset,
      y: -120,
      width: 100,
      height: 100,
      lastShotTime: 0,
      entering: false,
      param: 0,
      paramSpeed: 0,
      pathType: 'NONE',
      speed: speed,
      xSpeed: 100 + i * 20,
      xDir: 1,
      movePhase: 'movingDown',
      xOffset: 0,
      yOffset: 0,
      centerX: 0,
      centerY: 0,
      health: health,
      isBoss: !gameState.hordeMode,
      isHordeBoss: gameState.hordeMode
    });
    gameState.waveEnemies++;
  }
  gameState.waveBossSpawned = true;
}

function isBossWave(w, h) {
  if (!h) return w === 10;
  return w % 5 === 0;
}

function startWave() {
  if (gameState.gameOver) return;
  gameState.waveInProgress = true;
  gameState.waveEnemies = 0;
  gameState.waveBossSpawned = false;
  if (!gameState.hordeMode) {
    const w = gameState.wave;
    if (w < 10) {
      if (w === 1) {
        spawnSingleShip();
        spawnFormation(1, 3, 'A');
      } else if (w === 2) {
        spawnSingleShip();
        spawnFormation(1, 2, 'A');
        spawnFormation(2, 3, 'B');
      } else if (w === 3) {
        spawnSingleShip();
        spawnFormation(1, 2, 'A');
        spawnFormation(2, 3, 'B');
        spawnFormation(2, 4, 'A');
      } else if (w === 4) {
        spawnSingleShip();
        spawnFormation(1, 2, 'A');
        spawnFormation(2, 3, 'B');
        spawnFormation(2, 4, 'A');
      } else if (w === 5) {
        spawnSingleShip();
        spawnFormation(1, 2, 'A');
        spawnFormation(2, 3, 'B');
        spawnFormation(2, 4, 'A');
      } else if (w === 6) {
        spawnFormation(2, 4, 'B');
        spawnFormation(2, 4, 'A');
      } else if (w === 7) {
        spawnFormation(2, 4, 'B');
        spawnFormation(2, 5, 'A');
      } else if (w === 8) {
        spawnFormation(2, 5, 'B');
        spawnFormation(2, 5, 'A');
      } else if (w === 9) {
        spawnFormation(2, 3, 'B');
        spawnFormation(2, 4, 'B');
        spawnFormation(2, 6, 'A');
      }
    } else if (w === 10) {
      spawnBoss(100, 60, 1);
    }
  } else {
    if (gameState.wave % 5 === 0) {
      const base = Math.floor(gameState.wave / 5);
      const bossHealth = 100 + base * 50;
      const bossSpeed = 60 + base * 10;
      const bossCount = base < 2 ? 1 : base < 3 ? 2 : 3;
      spawnBoss(bossHealth, bossSpeed, bossCount);
    } else {
      spawnSingleShip();
      spawnFormation(2, 3 + Math.floor(gameState.wave / 2), 'A');
      spawnFormation(2, 3 + Math.floor(gameState.wave / 3), 'B');
    }
  }
}

function finishWave() {
  gameState.waveInProgress = false;
  if (!gameState.hordeMode) {
    if (gameState.wave === 10) {
      gameState.screen = 'WIN';
      gameState.winTime = Date.now();
      return;
    }
    gameState.wave++;
    const delay = isBossWave(gameState.wave, false) ? 5000 : 3000;
    setTimeout(() => {
      if (!gameState.gameOver && gameState.screen === 'GAME') {
        if (gameState.enemies.length === 0) {
          startWave();
        }
      }
    }, delay);
  } else {
    gameState.wave++;
    const delay = isBossWave(gameState.wave, true) ? 5000 : 3000;
    setTimeout(() => {
      if (!gameState.gameOver && gameState.screen === 'GAME') {
        if (gameState.enemies.length === 0) {
          startWave();
        }
      }
    }, delay);
  }
}

function enemyShoot(enemy) {
  if (enemy.entering) return;
  const now = Date.now();
  if (!enemy.nextShotTime) {
    enemy.nextShotTime = now + ((enemy.isBoss || enemy.isHordeBoss) ? Math.random() * 500 + 500 : Math.random() * 1000 + 1000);
  }
  if (now >= enemy.nextShotTime) {
    if (enemy.isBoss || enemy.isHordeBoss) {
      [90, 60, 120].forEach(deg => {
        const rad = (deg * Math.PI) / 180;
        const speed = 200;
        const xSpeed = speed * Math.cos(rad);
        const ySpeed = speed * Math.sin(rad);
        gameState.enemyBullets.push({
          x: enemy.x + enemy.width / 2 - 2.5,
          y: enemy.y + enemy.height,
          width: 5,
          height: 10,
          xSpeed,
          ySpeed
        });
      });
    } else {
      gameState.enemyBullets.push({
        x: enemy.x + enemy.width / 2 - 2.5,
        y: enemy.y + enemy.height,
        width: 5,
        height: 10,
        xSpeed: 0,
        ySpeed: 240
      });
    }
    enemy.nextShotTime = now + ((enemy.isBoss || enemy.isHordeBoss) ? Math.random() * 500 + 500 : Math.random() * 1000 + 1000);
  }
}

function maybeSpawnPowerUp(x, y) {
  if (Math.random() < 0.1) {
    const possibleTypes = ['fasterShots', 'extraHealth', 'shield', 'multiShot'];
    const type = possibleTypes[Math.floor(Math.random() * possibleTypes.length)];
    gameState.powerUps.push({
      x: x + 10,
      y: y + 10,
      width: 20,
      height: 20,
      speed: 120,
      type: type
    });
  }
}

function applyPowerUp(type) {
  if (type === 'fasterShots') {
    const originalCooldown = gameState.player.shotCooldown;
    gameState.player.shotCooldown = originalCooldown / 3;
    setTimeout(() => {
      gameState.player.shotCooldown = originalCooldown;
    }, 5000);
  } else if (type === 'extraHealth') {
    gameState.player.health += 1;
  } else if (type === 'shield') {
    gameState.player.shieldActive = true;
    gameState.player.shieldEndTime = Date.now() + 5000;
  } else if (type === 'multiShot') {
    gameState.player.multiShotActive = true;
    gameState.player.multiShotEndTime = Date.now() + 10000;
  }
}

function updateBossPosition(enemy, dt) {
  if (enemy.movePhase === 'movingDown') {
    enemy.y += enemy.speed * dt;
    if (enemy.y >= 80) enemy.movePhase = 'sideToSide';
  } else if (enemy.movePhase === 'sideToSide') {
    enemy.x += enemy.xSpeed * enemy.xDir * dt;
    if (enemy.x <= 0) {
      enemy.x = 0;
      enemy.xDir = 1;
    }
    if (enemy.x + enemy.width >= canvas.width) {
      enemy.x = canvas.width - enemy.width;
      enemy.xDir = -1;
    }
  }
  if (enemy.y + enemy.height >= canvas.height) {
    explosion = { x: gameState.player.x, y: gameState.player.y, start: Date.now() };
    gameState.screen = 'EXPLODE';
  }
}

function updateEnemyPosition(enemy, dt) {
  if (enemy.isBoss || enemy.isHordeBoss) {
    updateBossPosition(enemy, dt);
    return;
  }
  if (enemy.entering) {
    if (enemy.enteringType === "warp") {
      enemy.y += enemy.warpSpeed * dt;
      if (enemy.y >= enemy.targetY) {
        enemy.y = enemy.targetY;
        enemy.entering = false;
      }
      return;
    } else {
      enemy.param += enemy.paramSpeed * dt;
      if (enemy.param >= 1) enemy.entering = false;
      else {
        const p = getPathPoint(enemy.pathType, enemy.param, enemy.centerX, enemy.centerY);
        enemy.x = p.x + enemy.xOffset;
        enemy.y = p.y + enemy.yOffset;
        return;
      }
    }
  }
  enemy.y += enemy.speed * dt;
}

function handlePlayerBulletEnemyBulletCollisions() {
  for (let pb = gameState.player.bullets.length - 1; pb >= 0; pb--) {
    const playerBullet = gameState.player.bullets[pb];
    for (let eb = gameState.enemyBullets.length - 1; eb >= 0; eb--) {
      const enemyBullet = gameState.enemyBullets[eb];
      if (isColliding(playerBullet, enemyBullet)) {
        gameState.player.bullets.splice(pb, 1);
        gameState.enemyBullets.splice(eb, 1);
        break;
      }
    }
  }
}

function handleEnemyBulletPlayerCollisions(dt) {
  for (let eb = gameState.enemyBullets.length - 1; eb >= 0; eb--) {
    const b = gameState.enemyBullets[eb];
    if (b.xSpeed != null && b.ySpeed != null) {
      b.x += b.xSpeed * dt;
      b.y += b.ySpeed * dt;
    } else {
      b.y += (b.ySpeed || 240) * dt;
    }
    if (b.y > canvas.height + 100) {
      gameState.enemyBullets.splice(eb, 1);
      continue;
    }
    if (isColliding(b, gameState.player)) {
      if (!gameState.player.shieldActive) {
        gameState.player.health -= 1;
        if (gameState.player.health <= 0) {
          explosion = { x: gameState.player.x, y: gameState.player.y, start: Date.now() };
          gameState.screen = 'EXPLODE';
          return;
        }
      }
      gameState.enemyBullets.splice(eb, 1);
    }
  }
}

function handleEnemyPlayerCollisions(dt) {
  for (let i = gameState.enemies.length - 1; i >= 0; i--) {
    const enemy = gameState.enemies[i];
    updateEnemyPosition(enemy, dt);
    enemyShoot(enemy);
    if (isColliding(enemy, gameState.player)) {
      if (!gameState.player.shieldActive) {
        gameState.player.health -= 1;
        if (gameState.player.health <= 0) {
          explosion = { x: gameState.player.x, y: gameState.player.y, start: Date.now() };
          gameState.screen = 'EXPLODE';
          return;
        }
      }
      enemy.y = canvas.height + 100;
    }
    if (!enemy.isBoss && !enemy.isHordeBoss && enemy.y > canvas.height) {
      gameState.score--;
      if (gameState.score < 0) {
        explosion = { x: gameState.player.x, y: gameState.player.y, start: Date.now() };
        gameState.screen = 'EXPLODE';
        return;
      }
      gameState.enemies.splice(i, 1);
      gameState.waveEnemies--;
      if (gameState.waveEnemies === 0 && gameState.waveInProgress) {
        finishWave();
      }
    }
  }
}

function handlePlayerBulletEnemyCollisions2(dt) {
  for (let b = gameState.player.bullets.length - 1; b >= 0; b--) {
    const bullet = gameState.player.bullets[b];
    if (bullet.xSpeed != null && bullet.ySpeed != null) {
      bullet.x += bullet.xSpeed * dt;
      bullet.y += bullet.ySpeed * dt;
    } else {
      bullet.y += (bullet.speed || -400) * dt;
    }
    if (bullet.y + bullet.height <= 0 || bullet.y > canvas.height + 50 || bullet.x < -50 || bullet.x > canvas.width + 50) {
      gameState.player.bullets.splice(b, 1);
      continue;
    }
    for (let ei = gameState.enemies.length - 1; ei >= 0; ei--) {
      const enemy = gameState.enemies[ei];
      if (isColliding(bullet, enemy)) {
        enemy.health -= 1;
        gameState.player.bullets.splice(b, 1);
        if (enemy.health <= 0) {
          gameState.explosions.push({ x: enemy.x, y: enemy.y, startTime: Date.now() });
          maybeSpawnPowerUp(enemy.x, enemy.y);
          gameState.enemies.splice(ei, 1);
          gameState.waveEnemies--;
          if (enemy.isBoss && gameState.wave === 10 && !gameState.hordeMode) {
            gameState.bossExplosion = { x: enemy.x, y: enemy.y, start: Date.now() };
            gameState.screen = 'BOSS_EXPLODE';
          } else if (enemy.isHordeBoss) {
            if (gameState.waveEnemies === 0 && gameState.waveInProgress) {
              finishWave();
            }
            gameState.score += 10;
          } else {
            if (gameState.waveEnemies === 0 && gameState.waveInProgress) {
              finishWave();
            }
            gameState.score += 10;
          }
        }
        break;
      }
    }
  }
}

function handlePowerUpPlayerCollisions(dt) {
  for (let i = gameState.powerUps.length - 1; i >= 0; i--) {
    const p = gameState.powerUps[i];
    p.y += p.speed * dt;
    if (p.y > canvas.height) {
      gameState.powerUps.splice(i, 1);
      continue;
    }
    if (isColliding(p, gameState.player)) {
      applyPowerUp(p.type);
      gameState.powerUps.splice(i, 1);
    }
  }
}

function updateGameLogic(dt) {
  if (gameState.gameOver || gameState.paused) return;
  if (gameState.hordeDelayActive) {
    const elapsed = Date.now() - gameState.hordeDelayStart;
    if (elapsed > 3000) {
      gameState.hordeDelayActive = false;
      startWave();
    }
    return;
  }

  if (!gameState.waveInProgress && !gameState.gameOver && !gameState.hordeMode) startWave();
  if (gameState.player.shieldActive && Date.now() >= gameState.player.shieldEndTime) {
    gameState.player.shieldActive = false;
  }

  if (gameState.player.multiShotActive && Date.now() >= gameState.player.multiShotEndTime) {
    gameState.player.multiShotActive = false;
  }

  if (gameState.keys['ArrowLeft'] && gameState.player.x > 0) gameState.player.x -= gameState.player.speed * dt;
  if (gameState.keys['ArrowRight'] && gameState.player.x + gameState.player.width < canvas.width) gameState.player.x += gameState.player.speed * dt;
  if (gameState.keys['ArrowUp'] && gameState.player.y > 0) gameState.player.y -= gameState.player.speed * dt;
  if (gameState.keys['ArrowDown'] && gameState.player.y + gameState.player.height < canvas.height) gameState.player.y += gameState.player.speed * dt;
  if (gameState.keys[' ']) shootBullet();

  handlePlayerBulletEnemyBulletCollisions();
  handleEnemyBulletPlayerCollisions(dt);
  handleEnemyPlayerCollisions(dt);
  handlePlayerBulletEnemyCollisions2(dt);
  handlePowerUpPlayerCollisions(dt);
}

function createStars(count) {
  for (let i = 0; i < count; i++) {
    gameState.stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      speed: 30 + Math.random() * 50,
      radius: 1 + Math.random() * 1
    });
  }
}

function updateStars(dt) {
  gameState.stars.forEach(star => {
    star.y += star.speed * dt;
    if (star.y > canvas.height) {
      star.y = 0;
      star.x = Math.random() * canvas.width;
    }
  });
}

function drawStars() {
  ctx.fillStyle = 'white';
  gameState.stars.forEach(star => {
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.radius, 0, 2 * Math.PI, false);
    ctx.fill();
  });
}

function draw() {
  if (gameState.screen === 'LOGIN') drawLogin();
  else if (gameState.screen === 'MENU') drawMenu();
  else if (gameState.screen === 'GAME') drawGame();
  else if (gameState.screen === 'EXPLODE') drawExplosion();
  else if (gameState.screen === 'BOSS_EXPLODE') drawBossExplosion();
  else if (gameState.screen === 'OVER') drawGameOver();
  else if (gameState.screen === 'WIN') drawWin();
}

function drawLogin() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawStars();
  ctx.fillStyle = 'white';
  ctx.font = '40px Arial';
  ctx.fillText('Login or Create Account', canvas.width / 2 - 180, 120);
  ctx.strokeStyle = 'white';
  ctx.strokeRect(userField.x, userField.y, userField.width, userField.height);
  ctx.strokeRect(passField.x, passField.y, passField.width, passField.height);
  ctx.font = '24px Arial';
  ctx.fillText(gameState.userInput, userField.x + 5, userField.y + 28);
  ctx.fillText('*'.repeat(gameState.passInput.length), passField.x + 5, passField.y + 28);
  ctx.fillStyle = 'blue';
  ctx.fillRect(loginButton.x, loginButton.y, loginButton.width, loginButton.height);
  ctx.fillRect(createAccountButton.x, createAccountButton.y, createAccountButton.width, createAccountButton.height);
  ctx.fillStyle = 'white';
  ctx.fillText('Login', loginButton.x + 40, loginButton.y + 27);
  ctx.fillText('Create', createAccountButton.x + 35, createAccountButton.y + 27);
}

function drawMenu() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawStars();
  ctx.fillStyle = 'white';
  ctx.font = '50px Arial';
  ctx.fillText('Star Defender', canvas.width / 2 - 200, 200);
  ctx.fillStyle = 'blue';
  ctx.fillRect(newGameButton.x, newGameButton.y, newGameButton.width, newGameButton.height);
  ctx.fillStyle = 'white';
  ctx.font = '24px Arial';
  ctx.fillText('New Game', newGameButton.x + 15, newGameButton.y + 32);
  ctx.font = '26px Arial';
  ctx.fillText('High Scores', canvas.width - 250, 80);
  let yPos = 120;
  ctx.font = '20px Arial';

  for (let i = 0; i < highScores.length; i++) {
    const s = highScores[i];
    ctx.fillText(`${i + 1}. ${s.playerName}: ${s.points}`, canvas.width - 259, yPos);
    yPos += 30;
  }
}

function drawGame() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawStars();
  const now = Date.now();

  gameState.explosions = gameState.explosions.filter(ex => {
    if (now - ex.startTime < 500) {
      ctx.drawImage(explosionGif, ex.x, ex.y, 40, 40);
      return true;
    }
    return false;
  });

  if (gameState.player.shieldActive) {
    ctx.save();
    ctx.fillStyle = 'blue';
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    ctx.arc(
      gameState.player.x + gameState.player.width / 2,
      gameState.player.y + gameState.player.height / 2,
      40,
      0,
      2 * Math.PI
    );
    ctx.fill();
    ctx.restore();
  }

  ctx.drawImage(playerImg, gameState.player.x, gameState.player.y, gameState.player.width, gameState.player.height);
  ctx.fillStyle = 'yellow';
  gameState.player.bullets.forEach(b => {
    ctx.fillRect(b.x, b.y, b.width, b.height);
  });

  ctx.fillStyle = 'red';
  gameState.enemyBullets.forEach(b => {
    ctx.fillRect(b.x, b.y, b.width, b.height);
  });

  gameState.enemies.forEach(enemy => {
    if (enemy.isBoss || enemy.isHordeBoss) {
      ctx.drawImage(bossImg, enemy.x, enemy.y, enemy.width, enemy.height);
      const barWidth = enemy.width;
      const ratio = enemy.isHordeBoss ? enemy.health / 1000 : enemy.health / 100;
      ctx.fillStyle = 'gray';
      ctx.fillRect(enemy.x, enemy.y - 10, barWidth, 5);
      ctx.fillStyle = 'red';
      ctx.fillRect(enemy.x, enemy.y - 10, barWidth * ratio, 5);
    } else {
      ctx.drawImage(enemyImg, enemy.x, enemy.y, enemy.width, enemy.height);
    }
  });

  gameState.powerUps.forEach(p => {
    if (p.type === 'fasterShots') {
      ctx.fillStyle = 'cyan';
    } else if (p.type === 'extraHealth') {
      ctx.fillStyle = 'green';
    } else if (p.type === 'shield') {
      ctx.fillStyle = 'blue';
    } else {
      ctx.fillStyle = 'magenta';
    }
    ctx.fillRect(p.x, p.y, p.width, p.height);
  });

  ctx.fillStyle = 'white';
  ctx.font = '20px Arial';
  ctx.fillText(`Wave: ${gameState.wave}`, 10, 20);
  ctx.fillText(`Score: ${gameState.score}`, 10, 45);
  ctx.fillText(`Health: ${gameState.player.health}`, 10, 70);

  if (gameState.hordeDelayActive) {
    const timeLeft = 3 - Math.floor((Date.now() - gameState.hordeDelayStart) / 1000);
    if (timeLeft > 0) {
      ctx.font = '30px Arial';
      ctx.fillText(`Horde begins in ${timeLeft}...`, canvas.width / 2 - 120, canvas.height / 2);
    }
  }
  if (gameState.paused) {
    ctx.fillStyle = 'yellow';
    ctx.font = '40px Arial';
    ctx.fillText('Paused', canvas.width / 2 - 80, canvas.height / 2);
  }
}

function drawBossExplosion() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawStars();
  if (!gameState.bossExplosion) return;
  const elapsed = Date.now() - gameState.bossExplosion.start;
  if (elapsed <= 2000) {
    ctx.drawImage(explosionGif, gameState.bossExplosion.x, gameState.bossExplosion.y, 100, 100);
  } else {
    if (!gameState.hordeMode) {
      gameState.screen = 'WIN';
      gameState.winTime = Date.now();
    } else {
      finishWave();
      gameState.bossExplosion = null;
    }
  }
}

function drawExplosion() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawStars();
  const elapsed = Date.now() - explosion.start;
  if (elapsed <= 2000) {
    ctx.drawImage(explosionGif, explosion.x, explosion.y, gameState.player.width, gameState.player.height);
  } else {
    gameState.screen = 'OVER';
    gameState.gameOverTime = Date.now();
  }
}

function drawGameOver() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawStars();
  ctx.fillStyle = 'red';
  ctx.font = '50px Arial';
  ctx.fillText('Game Over', canvas.width / 2 - 130, canvas.height / 2);
  if (Date.now() - gameState.gameOverTime > 2000) {
    submitScore(gameState.score);
    gameState.screen = 'MENU';
  }
}

function drawWin() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawStars();
  ctx.fillStyle = 'lime';
  ctx.font = '50px Arial';
  ctx.fillText('You Win!', canvas.width / 2 - 100, canvas.height / 2);
  ctx.fillStyle = 'blue';
  ctx.fillRect(continueHordeButton.x, continueHordeButton.y, continueHordeButton.width, continueHordeButton.height);
  ctx.fillRect(exitToMenuButton.x, exitToMenuButton.y, exitToMenuButton.width, exitToMenuButton.height);
  ctx.fillStyle = 'white';
  ctx.font = '24px Arial';
  ctx.fillText('Horde Mode', continueHordeButton.x + 15, continueHordeButton.y + 28);
  ctx.fillText('Exit Menu', exitToMenuButton.x + 25, exitToMenuButton.y + 28);
}
createStars(80);

if (!window.__TEST__) {
  loadHighScores();
}

let lastTime = 0;
function gameLoop(timestamp) {
  if (lastTime === 0) lastTime = timestamp;
  const delta = timestamp - lastTime;
  lastTime = timestamp;
  const dt = delta / 1000;
  updateStars(dt);
  if (gameState.screen === 'GAME') updateGameLogic(dt);
  draw();
  requestAnimationFrame(gameLoop);
}
requestAnimationFrame(gameLoop);


if (typeof module !== 'undefined' && module.exports) {
  module.exports = { clickInside, isColliding, spiralPathA, spiralPathB, spiralPathC, getPathPoint };
}