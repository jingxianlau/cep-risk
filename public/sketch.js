let gridSize = 8;
let tileSize = 60;
let grid = [];
let players = [];
let currentPlayer = 0;
let movePoints = 0;
let maxPlayers = 4;
let selectedTile = null;
let dragging = false;
let pawnImg;
let diceImg;
let diceFrame = 0;
let rollingDice = false;
let rolledDice = false;
let gameStarted = false;
let events = [
  {
    text: 'Government subsidy received! +5 resources',
    effect: p => (p.resources += 5)
  },
  {
    text: 'Corruption scandal! -3 public support',
    effect: p => (p.support -= 3)
  },
  {
    text: 'Mass protest backs you! +4 public support',
    effect: p => (p.support += 4)
  },
  {
    text: 'Black market arms deal! +3 resources',
    effect: p => (p.resources += 3)
  },
  { text: 'Economic downturn. -2 resources', effect: p => (p.resources -= 2) },
  {
    text: 'Community outreach success. +2 support',
    effect: p => (p.support += 2)
  }
];
let currentEvent = '';

function preload() {
  pawnImg = loadImage(
    'https://upload.wikimedia.org/wikipedia/commons/4/45/Chess_plt45.svg'
  );
}

function setup() {
  createCanvas(gridSize * tileSize, gridSize * tileSize + 120);
  initGrid();
  initPlayers();
  startTurn();
}

function initGrid() {
  for (let y = 0; y < gridSize; y++) {
    let row = [];
    for (let x = 0; x < gridSize; x++) {
      row.push({ faction: null, soldiers: 0 });
    }
    grid.push(row);
  }
  // Initial spawn
  grid[0][0].faction = 0;
  grid[0][0].soldiers = 5;
  grid[0][gridSize - 1].faction = 1;
  grid[0][gridSize - 1].soldiers = 5;
  grid[gridSize - 1][0].faction = 2;
  grid[gridSize - 1][0].soldiers = 5;
  grid[gridSize - 1][gridSize - 1].faction = 3;
  grid[gridSize - 1][gridSize - 1].soldiers = 5;
}

function initPlayers() {
  let names = [
    'Red Revolutionaries',
    'Blue Brigadiers',
    'Green Guerrillas',
    'Beige Battalion'
  ];
  let cols = ['red', 'blue', 'green', 'tan'];
  for (let i = 0; i < maxPlayers; i++) {
    players.push({
      name: names[i],
      colour: cols[i],
      manpower: 25,
      resources: 25,
      support: 10
    });
  }
}

function draw() {
  background(255);
  drawUI();
  drawGrid();

  if (dragging && selectedTile) {
    image(pawnImg, mouseX - 20, mouseY - 20, 30, 30);
  }
}

function drawUI() {
  fill(0);
  textSize(18);
  let p = players[currentPlayer];
  text(`${p.name}`, 10, 25);
  text(`Manpower: ${p.manpower}`, 10, 50);
  text(`Resources: ${p.resources}`, 10, 70);
  text(`Public Support: ${p.support}`, 10, 90);
  text(`Event: ${currentEvent}`, 250, 50);
  if (movePoints === 0) text('Press SPACE to end turn', 250, 75);
  else text(`Moves Left: ${movePoints}`, 250, 75);

  // Dice display using emoji
  textSize(32);
  text('🎲', width - 120, 45);
  textSize(20);
  if (rollingDice) {
    text(movePoints, width - 80, 50);
  } else if (movePoints > 0) {
    text(movePoints, width - 80, 50);
  }

  // Buy troops button
  fill(200);
  rect(width - 150, 80, 120, 30);
  fill(0);
  textSize(12);
  text('Buy Troop (5 res)', width - 145, 100);
}

function drawGrid() {
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      let tile = grid[y][x];
      stroke(255);
      if (tile.faction !== null) {
        fill(players[tile.faction].colour);
      } else {
        fill(0);
      }
      rect(x * tileSize, y * tileSize + 120, tileSize, tileSize);

      if (tile.soldiers > 0) {
        drawSoldiers(x, y, tile.soldiers, tile.faction);
      }
    }
  }

  if (selectedTile) {
    stroke(players[currentPlayer].colour);
    strokeWeight(3);
    noFill();
    rect(
      selectedTile.x * tileSize,
      selectedTile.y * tileSize + 120,
      tileSize,
      tileSize
    ); // <- Fixed +120
    strokeWeight(1);
    noStroke();
  }
}

function drawSoldiers(x, y, count, faction) {
  let cx = x * tileSize + tileSize / 2;
  let cy = y * tileSize + 120 + tileSize / 2; // <- Fixed +120

  if (count > 5) {
    image(pawnImg, cx - 15, cy - 15, 30, 30);
    fill(0);
    textSize(12);
    textAlign(RIGHT, TOP);
    text(count, x * tileSize + tileSize - 4, y * tileSize + 120 + 4); // <- Fixed +120
    textAlign(LEFT, BASELINE);
  } else {
    for (let i = 0; i < count; i++) {
      let angle = (TWO_PI / count) * i;
      let px = cx + cos(angle) * 10;
      let py = cy + sin(angle) * 10;
      image(pawnImg, px - 10, py - 10, 20, 20);
    }
  }
}

function mousePressed() {
  if (dragging || movePoints <= 0) return;
  let x = floor(mouseX / tileSize);
  let y = floor((mouseY - 120) / tileSize);
  if (x >= gridSize || y >= gridSize || y < 0) return;

  let tile = grid[y][x];
  if (tile.faction === currentPlayer && tile.soldiers > 0) {
    selectedTile = { x, y };
    dragging = true;
  }
}
function mouseReleased() {
  if (!dragging || !selectedTile || movePoints <= 0) return;
  let toX = floor(mouseX / tileSize);
  let toY = floor((mouseY - 120) / tileSize);
  if (toX >= gridSize || toY >= gridSize || toY < 0) {
    dragging = false;
    return;
  }

  let fromTile = grid[selectedTile.y][selectedTile.x];
  let toTile = grid[toY][toX];

  if (!isAdjacent(selectedTile, { x: toX, y: toY })) {
    dragging = false;
    selectedTile = null;
    return;
  }

  if (toTile.faction === null) {
    toTile.faction = currentPlayer;
    toTile.soldiers = 1;
    fromTile.soldiers--;
  } else if (toTile.faction === currentPlayer) {
    toTile.soldiers++;
    fromTile.soldiers--;
  } else {
    toTile.soldiers--;
    fromTile.soldiers--;
    if (toTile.soldiers <= 0) {
      toTile.faction = null;
      toTile.soldiers = 0;
    }
  }

  if (fromTile.soldiers <= 0) {
    fromTile.faction = null;
  }

  dragging = false;
  selectedTile = null;
  movePoints--;
}

function isAdjacent(a, b) {
  let dx = abs(a.x - b.x);
  let dy = abs(a.y - b.y);
  return dx <= 1 && dy <= 1 && dx + dy > 0;
}

function keyPressed() {
  if (key === ' ' && movePoints === 0 && gameStarted) {
    currentPlayer = (currentPlayer + 1) % maxPlayers;
    startTurn();
  }
  if (key === 'r' && !rollingDice && gameStarted && rolledDice == false) {
    rollingDice = true;
    rolledDice = true;
  }
  if (key === 'b') {
    let player = players[currentPlayer];
    if (player.resources >= 5 && player.manpower > 0) {
      player.resources -= 5;
      player.manpower--;

      // Find tiles owned by player with max soldiers
      let ownedTiles = [];
      let maxSoldiers = 0;

      for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
          let tile = grid[y][x];
          if (tile.faction === currentPlayer) {
            if (tile.soldiers > maxSoldiers) {
              maxSoldiers = tile.soldiers;
              ownedTiles = [{ x, y }];
            } else if (tile.soldiers === maxSoldiers) {
              ownedTiles.push({ x, y });
            }
          }
        }
      }

      if (ownedTiles.length > 0) {
        // Randomly select one tile among the max
        let chosen = random(ownedTiles);
        grid[chosen.y][chosen.x].soldiers++;
      } else {
        // No owned tiles?? (shouldn't happen unless they lost everything)
        alert('No controlled tiles to place a troop!');
      }
    }
  }
}

function keyReleased() {
  if (key === 'r' && rollingDice) {
    rollingDice = false;
    movePoints = floor(random(1, 7));
  }
}

function startTurn() {
  gameStarted = true;
  rolledDice = false;
  let player = players[currentPlayer];
  let event = random(events);
  currentEvent = event.text;
  event.effect(player);
  player.resources += floor(player.support / 2);
  movePoints = 0;
}
