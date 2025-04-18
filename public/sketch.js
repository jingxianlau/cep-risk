let gridSize = 8;
let tileSize = 80;
let grid = [];
let players = [];
let currentPlayer = 0;
let moveCount = 0;
let draggingPawn = null;
let previewTarget = null;
let gameOver = false;
let uiHeight = 100;
let pawnImg;

function preload() {
  pawnImg = loadImage(
    'https://upload.wikimedia.org/wikipedia/commons/4/45/Chess_plt45.svg'
  );
}

function setup() {
  createCanvas(gridSize * tileSize, gridSize * tileSize + uiHeight);
  initGrid();
  initPlayers();
}

function draw() {
  background(255);
  drawGrid();
  drawUI();

  if (draggingPawn) {
    tint(255);
    imageMode(CENTER);
    image(pawnImg, mouseX, mouseY, 30, 30);
  }

  if (previewTarget && isTileNeutral(previewTarget.x, previewTarget.y)) {
    let px = previewTarget.x * tileSize;
    let py = previewTarget.y * tileSize + uiHeight;
    fill(255, 255, 255, 100);
    rect(px, py, tileSize, tileSize);
    imageMode(CENTER);
    tint(
      players[currentPlayer].color.levels[0],
      players[currentPlayer].color.levels[1],
      players[currentPlayer].color.levels[2],
      100
    );
    image(pawnImg, px + tileSize / 2, py + tileSize / 2, 30, 30);
  }
}

function initGrid() {
  for (let y = 0; y < gridSize; y++) {
    let row = [];
    for (let x = 0; x < gridSize; x++) {
      row.push({ faction: null, soldiers: 0 });
    }
    grid.push(row);
  }
  grid[0][0] = { faction: 0, soldiers: 30 };
  grid[0][gridSize - 1] = { faction: 1, soldiers: 30 };
  grid[gridSize - 1][0] = { faction: 2, soldiers: 30 };
  grid[gridSize - 1][gridSize - 1] = { faction: 3, soldiers: 30 };
}

function initPlayers() {
  players = [
    { name: 'Red Revolutionaries', color: color(255, 0, 0) },
    { name: 'Green Guerrillas', color: color(0, 200, 0) },
    { name: 'Blue Bloc', color: color(0, 0, 255) },
    { name: 'Beige Brigadiers', color: color(210, 180, 140) }
  ];
}

function drawGrid() {
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      let tile = grid[y][x];
      let px = x * tileSize;
      let py = y * tileSize + uiHeight;

      if (tile.faction !== null) {
        fill(players[tile.faction].color);
      } else {
        fill(0);
      }
      stroke(255);
      rect(px, py, tileSize, tileSize);

      if (tile.soldiers > 0) {
        drawPawns(tile.soldiers, px, py, tile.faction);
      }
    }
  }
}

function drawPawns(count, px, py, faction) {
  imageMode(CENTER);
  let colour = players[faction].color;
  tint(colour);
  stroke(0);
  let centerX = px + tileSize / 2;
  let centerY = py + tileSize / 2;

  if (count > 5) {
    image(pawnImg, centerX, centerY, 30, 30);
    fill(0);
    textSize(14);
    textAlign(RIGHT, TOP);
    text(count, px + tileSize - 5, py + 5);
  } else {
    let offset = 15;
    for (let i = 0; i < count; i++) {
      let angle = (TWO_PI / count) * i;
      let x = centerX + cos(angle) * offset;
      let y = centerY + sin(angle) * offset;
      image(pawnImg, x, y, 30, 30);
    }
  }
}

function drawUI() {
  fill(240);
  rect(0, 0, width, uiHeight);
  fill(0);
  textSize(16);
  textAlign(LEFT, TOP);
  let p = players[currentPlayer];
  text(`Faction: ${p.name}`, 10, 10);
  text(`Moves Left: ${5 - moveCount}`, 10, 30);

  if (moveCount >= 5) {
    text('No moves left. Press SPACE to end your turn.', 10, 60);
  }
}

function mousePressed() {
  if (mouseY < uiHeight || gameOver || moveCount >= 5) return;

  let x = floor(mouseX / tileSize);
  let y = floor((mouseY - uiHeight) / tileSize);
  if (!validCoord(x, y)) return;
  let tile = grid[y][x];
  if (tile.faction === currentPlayer && tile.soldiers > 0) {
    draggingPawn = { from: { x, y } };
  }
}

function mouseReleased() {
  if (!draggingPawn || gameOver || moveCount >= 5) return;

  let x = floor(mouseX / tileSize);
  let y = floor((mouseY - uiHeight) / tileSize);
  if (!validCoord(x, y)) {
    draggingPawn = null;
    previewTarget = null;
    return;
  }

  let from = draggingPawn.from;
  let to = { x, y };

  if (!isAdjacent(from, to)) {
    draggingPawn = null;
    previewTarget = null;
    return;
  }

  let fromTile = grid[from.y][from.x];
  let toTile = grid[to.y][to.x];

  if (toTile.faction === null || toTile.faction === currentPlayer) {
    fromTile.soldiers--;
    if (fromTile.soldiers === 0) fromTile.faction = null;

    if (toTile.faction === null) {
      toTile.faction = currentPlayer;
    }
    toTile.soldiers++;
    moveCount++;
  } else {
    // 50% chance of attacker or defender surviving
    let attackerWins = random() < 0.5;

    fromTile.soldiers--;
    if (fromTile.soldiers === 0) fromTile.faction = null;

    if (attackerWins) {
      toTile.soldiers--;
      if (toTile.soldiers === 0) {
        toTile.faction = currentPlayer;
        toTile.soldiers = 1;
      }
    } else {
      // defender survives, no change needed
    }

    moveCount++;
  }

  draggingPawn = null;
  previewTarget = null;
}

function mouseMoved() {
  if (!draggingPawn || gameOver || moveCount >= 5) {
    previewTarget = null;
    return;
  }

  let x = floor(mouseX / tileSize);
  let y = floor((mouseY - uiHeight) / tileSize);
  if (validCoord(x, y)) {
    previewTarget = { x, y };
  } else {
    previewTarget = null;
  }
}

function keyPressed() {
  if (key === ' ' && !gameOver) {
    moveCount = 0;
    currentPlayer = (currentPlayer + 1) % players.length;
    checkVictory();
  }
}

function validCoord(x, y) {
  return x >= 0 && x < gridSize && y >= 0 && y < gridSize;
}

function isTileNeutral(x, y) {
  return grid[y][x].faction === null;
}

function isAdjacent(a, b) {
  let dx = Math.abs(a.x - b.x);
  let dy = Math.abs(a.y - b.y);
  return dx <= 1 && dy <= 1 && dx + dy > 0;
}

function checkVictory() {
  let alive = new Set();
  for (let row of grid) {
    for (let tile of row) {
      if (tile.soldiers > 0 && tile.faction !== null) {
        alive.add(tile.faction);
      }
    }
  }
  if (alive.size === 1) {
    gameOver = true;
    let winner = Array.from(alive)[0];
    alert(`${players[winner].name} has won the revolution!`);
  }
}
