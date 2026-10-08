const road = document.getElementById('road');
const playerCar = document.getElementById('playerCar');
const trafficLayer = document.getElementById('trafficLayer');
const startPanel = document.getElementById('startPanel');
const gameOverPanel = document.getElementById('gameOverPanel');
const scoreLabel = document.getElementById('score');
const bestLabel = document.getElementById('best');
const speedLabel = document.getElementById('speed');
const finalScoreLabel = document.getElementById('finalScore');
const startLine = document.getElementById('startLine');

const lanePositions = [25, 50, 75];
let playerLane = 1;
let traffic = [];
let score = 0;
let bestScore = Number(localStorage.getItem('midnight-sprint-best') || 0);
let speed = 1;
let running = false;
let lastTime = 0;
let spawnTimer = 0;
let animationFrame;

bestLabel.textContent = formatScore(bestScore);

function formatScore(value) {
  return String(Math.floor(value)).padStart(5, '0');
}

function setPlayerLane() {
  playerCar.style.left = `calc(${lanePositions[playerLane]}% - 24px)`;
}

function movePlayer(direction) {
  if (!running) return;
  playerLane = Math.max(0, Math.min(lanePositions.length - 1, playerLane + direction));
  setPlayerLane();
}

function createTrafficCar(lane) {
  const car = document.createElement('div');
  car.className = 'traffic-car';
  car.dataset.lane = lane;
  car.innerHTML = '<div class="traffic-body"><span class="windshield"></span><span class="hood-stripe"></span></div><span class="wheel wheel-left"></span><span class="wheel wheel-right"></span>';
  car.style.left = `calc(${lanePositions[lane]}% - 24px)`;
  trafficLayer.appendChild(car);
  traffic.push({ element: car, lane, y: -100, speedOffset: Math.random() * 0.35 });
}

function spawnTraffic() {
  const openLanes = lanePositions.map((_, index) => index).filter(lane => !traffic.some(car => car.lane === lane && car.y < 180));
  if (openLanes.length) createTrafficCar(openLanes[Math.floor(Math.random() * openLanes.length)]);
}

function overlapsPlayer(car) {
  const playerTop = playerCar.offsetTop;
  const playerBottom = playerTop + playerCar.offsetHeight;
  return car.lane === playerLane && car.y + 75 > playerTop && car.y < playerBottom - 12;
}

function endRace() {
  running = false;
  cancelAnimationFrame(animationFrame);
  finalScoreLabel.textContent = formatScore(score);
  if (score > bestScore) {
    bestScore = score;
    localStorage.setItem('midnight-sprint-best', bestScore);
    bestLabel.textContent = formatScore(bestScore);
  }
  gameOverPanel.classList.remove('hidden');
  startLine.style.display = 'block';
}

function clearTraffic() {
  traffic.forEach(car => car.element.remove());
  traffic = [];
}

function gameLoop(timestamp) {
  if (!running) return;
  const delta = Math.min(timestamp - lastTime, 40);
  lastTime = timestamp;
  score += delta * 0.012 * speed;
  speed = Math.min(9, 1 + score / 170);
  spawnTimer += delta;
  scoreLabel.textContent = formatScore(score);
  speedLabel.textContent = String(Math.floor(speed * 22)).padStart(2, '0');

  const roadHeight = road.clientHeight;
  const movement = delta * (0.13 + speed * 0.035);
  if (spawnTimer > Math.max(430, 920 - speed * 55)) {
    spawnTraffic();
    spawnTimer = 0;
  }

  traffic = traffic.filter(car => {
    car.y += movement + car.speedOffset;
    car.element.style.top = `${car.y}px`;
    if (overlapsPlayer(car)) {
      endRace();
      return true;
    }
    if (car.y > roadHeight + 110) {
      car.element.remove();
      return false;
    }
    return true;
  });

  animationFrame = requestAnimationFrame(gameLoop);
}

function startRace() {
  clearTraffic();
  score = 0;
  speed = 1;
  playerLane = 1;
  setPlayerLane();
  running = true;
  spawnTimer = 0;
  startPanel.classList.add('hidden');
  gameOverPanel.classList.add('hidden');
  startLine.style.display = 'none';
  lastTime = performance.now();
  animationFrame = requestAnimationFrame(gameLoop);
}

document.getElementById('startButton').addEventListener('click', startRace);
document.getElementById('restartButton').addEventListener('click', startRace);
document.getElementById('leftButton').addEventListener('click', () => movePlayer(-1));
document.getElementById('rightButton').addEventListener('click', () => movePlayer(1));

document.addEventListener('keydown', event => {
  if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a') {
    event.preventDefault();
    movePlayer(-1);
  }
  if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') {
    event.preventDefault();
    movePlayer(1);
  }
  if (event.key === 'Enter' && !running) startRace();
});

setPlayerLane();
