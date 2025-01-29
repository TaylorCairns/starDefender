const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 800;
canvas.height = 600;

const newGameButton = {
  x: canvas.width / 2 - 75,
  y: canvas.height / 2,
  width: 150,
  height: 50
};

const gameState = {
  screen: 'MENU',
  gameOverTime: 0,
  winTime: 0,
  player: {
    x: canvas.width / 2 - 25,
    y: canvas.height - 80,
    width: 50,
    height: 50,
    speed: 5,
    bullets: [],
    lastShotTime: 0,
    shotCooldown: 200,
    health: 3
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
  bossSpawnTime: 0,
  bossExplosion: null
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

window.addEventListener('keydown', (e) => {
  gameState.keys[e.key] = true;
  if (e.key === 'p' && gameState.screen === 'GAME') {
    gameState.paused = !gameState.paused;
  }
});

window.addEventListener('keyup', (e) => {
  gameState.keys[e.key] = false;
});

canvas.addEventListener('mousedown', (e) => {
  if (gameState.screen === 'MENU') {
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    if (
      clickX >= newGameButton.x &&
      clickX <= newGameButton.x + newGameButton.width &&
      clickY >= newGameButton.y &&
      clickY <= newGameButton.y + newGameButton.height
    ) {
      startNewGame();
    }
  }
});

function isColliding(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function resetGameState() {
  gameState.player.x = canvas.width / 2 - 25;
  gameState.player.y = canvas.height - 80;
  gameState.player.health = 3;
  gameState.player.bullets = [];
  gameState.player.lastShotTime = 0;
  gameState.player.shotCooldown = 200;
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
  gameState.bossSpawnTime = 0;
  gameState.bossExplosion = null;
  explosion = null;
}

function startNewGame() {
  resetGameState();
  gameState.screen = 'GAME';
}

function shootBullet() {
  const now = Date.now();
  if (now - gameState.player.lastShotTime > gameState.player.shotCooldown) {
    gameState.player.bullets.push({
      x: gameState.player.x + gameState.player.width / 2 - 2.5,
      y: gameState.player.y,
      width: 5,
      height: 10,
      speed: -7
    });
    gameState.player.lastShotTime = now;
  }
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

function spawnFormation(rows, cols, pathType) {
  const offsetX = 50;
  const offsetY = 50;
  const { x: centerX, y: centerY } = getRandomCenter();
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const xOffset = col * offsetX;
      const yOffset = row * offsetY;
      const paramOffset = (row + col) * 0.05;
      gameState.enemies.push({
        x: 0,
        y: 0,
        width: 40,
        height: 40,
        lastShotTime: 0,
        entering: true,
        param: paramOffset,
        paramSpeed: 0.01,
        pathType,
        speed: 2,
        xOffset,
        yOffset,
        centerX,
        centerY,
        health: 1,
        isBoss: false
      });
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
    speed: 2,
    xOffset: 0,
    yOffset: 0,
    centerX: 0,
    centerY: 0,
    health: 1,
    isBoss: false
  });
  gameState.waveEnemies++;
}

function spawnBoss() {
  gameState.enemies.push({
    x: canvas.width / 2 - 50,
    y: -120,
    width: 100,
    height: 100,
    lastShotTime: 0,
    entering: false,
    param: 0,
    paramSpeed: 0,
    pathType: 'NONE',
    speed: 1,
    xSpeed: 2,
    xDir: 1,
    movePhase: 'movingDown',
    xOffset: 0,
    yOffset: 0,
    centerX: 0,
    centerY: 0,
    health: 100,
    isBoss: true
  });
  gameState.waveEnemies++;
  gameState.waveBossSpawned = true;
}

function startWave() {
  if (gameState.gameOver) return;
  gameState.waveInProgress = true;
  gameState.waveEnemies = 0;
  gameState.waveBossSpawned = false;
  const wave = gameState.wave;
  if (wave < 10) {
    if (wave === 1) {
      spawnSingleShip();
      spawnFormation(1, 3, 'A');
    } else if (wave === 2) {
      spawnSingleShip();
      spawnFormation(1, 2, 'A');
      spawnFormation(2, 3, 'B');
    } else if (wave === 3) {
      spawnSingleShip();
      spawnFormation(1, 2, 'A');
      spawnFormation(2, 3, 'B');
      spawnFormation(2, 4, 'A');
    } else if (wave === 4) {
      spawnSingleShip();
      spawnFormation(1, 2, 'A');
      spawnFormation(2, 3, 'B');
      spawnFormation(2, 4, 'A');
    } else if (wave === 5) {
      spawnSingleShip();
      spawnFormation(1, 2, 'A');
      spawnFormation(2, 3, 'B');
      spawnFormation(2, 4, 'A');
    } else if (wave === 6) {
      spawnFormation(2, 4, 'B');
      spawnFormation(2, 4, 'A');
    } else if (wave === 7) {
      spawnFormation(2, 4, 'B');
      spawnFormation(2, 5, 'A');
    } else if (wave === 8) {
      spawnFormation(2, 5, 'B');
      spawnFormation(2, 5, 'A');
    } else if (wave === 9) {
      spawnFormation(2, 3, 'B');
      spawnFormation(2, 4, 'B');
      spawnFormation(2, 6, 'A');
    }
  } else if (wave === 10) {
    gameState.bossSpawnTime = Date.now() + 10000;
  }
}

function finishWave() {
  gameState.waveInProgress = false;
  if (gameState.wave === 10) {
    gameState.screen = 'WIN';
    gameState.winTime = Date.now();
    return;
  }
  gameState.wave++;
  setTimeout(() => {
    startWave();
  }, 5000);
}

function enemyShoot(enemy) {
  if (enemy.entering) return;
  const now = Date.now();
  const enemyShotCooldown = enemy.isBoss ? 1500 : 3000;
  if (!enemy.lastShotTime || now - enemy.lastShotTime > enemyShotCooldown) {
    if (enemy.isBoss) {
      const anglesDeg = [90, 60, 120];
      anglesDeg.forEach((deg) => {
        const rad = (deg * Math.PI) / 180;
        const speed = 4;
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
        ySpeed: 4
      });
    }
    enemy.lastShotTime = now;
  }
}

function maybeSpawnPowerUp(x, y) {
  const chance = 0.1;
  if (Math.random() < chance) {
    const type = Math.random() < 0.5 ? 'fasterShots' : 'extraHealth';
    gameState.powerUps.push({
      x: x + 10,
      y: y + 10,
      width: 20,
      height: 20,
      speed: 2,
      type
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
  }
}

function updateBossPosition(enemy) {
  if (enemy.movePhase === 'movingDown') {
    enemy.y += enemy.speed;
    if (enemy.y >= 80) {
      enemy.movePhase = 'sideToSide';
    }
  } else if (enemy.movePhase === 'sideToSide') {
    enemy.x += enemy.xSpeed * enemy.xDir;
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

function updateEnemyPosition(enemy) {
  if (enemy.isBoss) {
    updateBossPosition(enemy);
    return;
  }
  if (enemy.entering) {
    enemy.param += enemy.paramSpeed;
    if (enemy.param >= 1) {
      enemy.entering = false;
    } else {
      const p = getPathPoint(enemy.pathType, enemy.param, enemy.centerX, enemy.centerY);
      enemy.x = p.x + enemy.xOffset;
      enemy.y = p.y + enemy.yOffset;
      return;
    }
  }
  enemy.y += enemy.speed;
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

function handleEnemyBulletPlayerCollisions() {
  for (let eb = gameState.enemyBullets.length - 1; eb >= 0; eb--) {
    const b = gameState.enemyBullets[eb];
    b.x += b.xSpeed || 0;
    b.y += b.ySpeed || 0;
    if (b.y > canvas.height + 100) {
      gameState.enemyBullets.splice(eb, 1);
      continue;
    }
    if (isColliding(b, gameState.player)) {
      gameState.player.health -= 1;
      if (gameState.player.health <= 0) {
        explosion = { x: gameState.player.x, y: gameState.player.y, start: Date.now() };
        gameState.screen = 'EXPLODE';
        return;
      }
      gameState.enemyBullets.splice(eb, 1);
    }
  }
}

function handleEnemyPlayerCollisions() {
  for (let i = gameState.enemies.length - 1; i >= 0; i--) {
    const enemy = gameState.enemies[i];
    updateEnemyPosition(enemy);
    enemyShoot(enemy);
    if (isColliding(enemy, gameState.player)) {
      gameState.player.health -= 1;
      if (gameState.player.health <= 0) {
        explosion = { x: gameState.player.x, y: gameState.player.y, start: Date.now() };
        gameState.screen = 'EXPLODE';
        return;
      }
      enemy.y = canvas.height + 100;
    }
    if (!enemy.isBoss && enemy.y > canvas.height) {
      gameState.score--;
      if (gameState.score < 0) {
        explosion = { x: gameState.player.x, y: gameState.player.y, start: Date.now() };
        gameState.screen = 'EXPLODE';
        return;
      }
      gameState.enemies.splice(i, 1);
      gameState.waveEnemies--;
      if (gameState.waveEnemies === 0 && gameState.waveInProgress) {
        if (gameState.wave < 10) {
          finishWave();
        } else if (gameState.wave === 10 && !gameState.waveBossSpawned) {
          finishWave();
        }
      }
    }
  }
}

function handlePlayerBulletEnemyCollisions() {
  for (let b = gameState.player.bullets.length - 1; b >= 0; b--) {
    const bullet = gameState.player.bullets[b];
    bullet.y += bullet.speed;
    if (bullet.y + bullet.height <= 0) {
      gameState.player.bullets.splice(b, 1);
      continue;
    }
    for (let enemyIndex = gameState.enemies.length - 1; enemyIndex >= 0; enemyIndex--) {
      const enemy = gameState.enemies[enemyIndex];
      if (isColliding(bullet, enemy)) {
        enemy.health -= 1;
        gameState.player.bullets.splice(b, 1);
        if (enemy.health <= 0) {
          gameState.explosions.push({ x: enemy.x, y: enemy.y, startTime: Date.now() });
          maybeSpawnPowerUp(enemy.x, enemy.y);
          gameState.enemies.splice(enemyIndex, 1);
          gameState.waveEnemies--;
          if (enemy.isBoss && gameState.wave === 10) {
            gameState.bossExplosion = { x: enemy.x, y: enemy.y, start: Date.now() };
            gameState.screen = 'BOSS_EXPLODE';
          } else {
            if (gameState.waveEnemies === 0 && gameState.waveInProgress) {
              if (gameState.wave < 10) {
                finishWave();
              } else if (gameState.wave === 10 && gameState.waveBossSpawned) {
                finishWave();
              }
            }
            gameState.score += 10;
          }
        }
        break;
      }
    }
  }
}

function handlePowerUpPlayerCollisions() {
  for (let i = gameState.powerUps.length - 1; i >= 0; i--) {
    const p = gameState.powerUps[i];
    p.y += p.speed;
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

function updateGameLogic() {
  if (gameState.gameOver || gameState.paused) return;
  if (!gameState.waveInProgress && !gameState.gameOver) {
    startWave();
  }
  if (
    gameState.wave === 10 &&
    !gameState.waveBossSpawned &&
    Date.now() >= gameState.bossSpawnTime
  ) {
    spawnBoss();
  }
  if (gameState.keys['ArrowLeft'] && gameState.player.x > 0) {
    gameState.player.x -= gameState.player.speed;
  }
  if (
    gameState.keys['ArrowRight'] &&
    gameState.player.x + gameState.player.width < canvas.width
  ) {
    gameState.player.x += gameState.player.speed;
  }
  if (gameState.keys['ArrowUp'] && gameState.player.y > 0) {
    gameState.player.y -= gameState.player.speed;
  }
  if (
    gameState.keys['ArrowDown'] &&
    gameState.player.y + gameState.player.height < canvas.height
  ) {
    gameState.player.y += gameState.player.speed;
  }
  if (gameState.keys[' ']) {
    shootBullet();
  }
  handlePlayerBulletEnemyBulletCollisions();
  handleEnemyBulletPlayerCollisions();
  handleEnemyPlayerCollisions();
  handlePlayerBulletEnemyCollisions();
  handlePowerUpPlayerCollisions();
}

function drawMenu() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawStars();
  ctx.fillStyle = 'white';
  ctx.font = '50px Arial';
  ctx.fillText('Star Defender', canvas.width / 2 - 150, canvas.height / 2 - 100);
  ctx.fillStyle = 'blue';
  ctx.fillRect(newGameButton.x, newGameButton.y, newGameButton.width, newGameButton.height);
  ctx.fillStyle = 'white';
  ctx.font = '24px Arial';
  ctx.fillText('New Game', newGameButton.x + 15, newGameButton.y + 32);
}

function drawGame() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawStars();
  const now = Date.now();
  gameState.explosions = gameState.explosions.filter(explo => {
    if (now - explo.startTime < 500) {
      ctx.drawImage(explosionGif, explo.x, explo.y, 40, 40);
      return true;
    }
    return false;
  });
  ctx.drawImage(
    playerImg,
    gameState.player.x,
    gameState.player.y,
    gameState.player.width,
    gameState.player.height
  );
  ctx.fillStyle = 'yellow';
  gameState.player.bullets.forEach(b => {
    ctx.fillRect(b.x, b.y, b.width, b.height);
  });
  ctx.fillStyle = 'red';
  gameState.enemyBullets.forEach(b => {
    ctx.fillRect(b.x, b.y, b.width, b.height);
  });
  gameState.enemies.forEach(enemy => {
    if (enemy.isBoss) {
      ctx.drawImage(bossImg, enemy.x, enemy.y, enemy.width, enemy.height);
      const barWidth = enemy.width;
      const healthRatio = enemy.health / 100;
      ctx.fillStyle = 'gray';
      ctx.fillRect(enemy.x, enemy.y - 10, barWidth, 5);
      ctx.fillStyle = 'red';
      ctx.fillRect(enemy.x, enemy.y - 10, barWidth * healthRatio, 5);
    } else {
      ctx.drawImage(enemyImg, enemy.x, enemy.y, enemy.width, enemy.height);
    }
  });
  gameState.powerUps.forEach(p => {
    ctx.fillStyle = p.type === 'fasterShots' ? 'cyan' : 'green';
    ctx.fillRect(p.x, p.y, p.width, p.height);
  });
  ctx.fillStyle = 'white';
  ctx.font = '20px Arial';
  ctx.fillText(`Wave: ${gameState.wave}`, 10, 20);
  ctx.fillText(`Score: ${gameState.score}`, 10, 45);
  ctx.fillText(`Health: ${gameState.player.health}`, 10, 70);
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
    ctx.drawImage(
      explosionGif,
      gameState.bossExplosion.x,
      gameState.bossExplosion.y,
      100,
      100
    );
  } else {
    gameState.screen = 'WIN';
    gameState.winTime = Date.now();
  }
}

function drawExplosion() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawStars();
  const elapsed = Date.now() - explosion.start;
  if (elapsed <= 2000) {
    ctx.drawImage(
      explosionGif,
      explosion.x,
      explosion.y,
      gameState.player.width,
      gameState.player.height
    );
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
    gameState.screen = 'MENU';
  }
}

function drawWin() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawStars();
  ctx.fillStyle = 'lime';
  ctx.font = '50px Arial';
  ctx.fillText('You Win!', canvas.width / 2 - 100, canvas.height / 2);
  if (Date.now() - gameState.winTime > 2000) {
    gameState.screen = 'MENU';
  }
}

function update() {
  updateStars();
  if (gameState.screen === 'GAME') {
    updateGameLogic();
  }
}

function draw() {
  if (gameState.screen === 'MENU') {
    drawMenu();
  } else if (gameState.screen === 'GAME') {
    drawGame();
  } else if (gameState.screen === 'EXPLODE') {
    drawExplosion();
  } else if (gameState.screen === 'BOSS_EXPLODE') {
    drawBossExplosion();
  } else if (gameState.screen === 'OVER') {
    drawGameOver();
  } else if (gameState.screen === 'WIN') {
    drawWin();
  }
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

function createStars(count) {
  for (let i = 0; i < count; i++) {
    gameState.stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      speed: 1 + Math.random() * 1,
      radius: 1 + Math.random() * 1
    });
  }
}

function updateStars() {
  gameState.stars.forEach(star => {
    star.y += star.speed;
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

createStars(80);
gameLoop();