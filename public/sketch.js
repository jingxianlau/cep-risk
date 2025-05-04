// === Merged Revolution Strategy Game ===

let gridSize = 8;
let tileSize = 80;
let grid = [];
let players = [];
let currentPlayer = 0;
let moveCount = 0;
let draggingPawn = null;
let hasDragged = false;
let previewTarget = null;
let gameOver = false;
let uiHeight = 100;
let pawnImg;

// Dice and Events
let rollingDice = false;
let rolledDice = false;
let currentEvent = '';
let events = [
  { text: 'Government subsidy received! +5 money', effect: p => (p.money += 5) },
  { text: 'Corruption scandal! -3 support', effect: p => (p.polSupport -= 0.03) },
  { text: 'Mass protest backs you! +4 support', effect: p => (p.polSupport += 0.04) },
  { text: 'Black market arms deal! +3 money', effect: p => (p.money += 3) },
  { text: 'Economic downturn. -2 money', effect: p => (p.money -= 2) },
  { text: 'Community outreach success. +2 support', effect: p => (p.polSupport += 0.02) }
];

function preload() {
  pawnImg = loadImage('https://upload.wikimedia.org/wikipedia/commons/4/45/Chess_plt45.svg');
}

function setup() {
  createCanvas(gridSize * tileSize, gridSize * tileSize + uiHeight);
  initPlayers();
  initGrid();
}

function initPlayers() {
  players = [
    { name: "Red Revolutionaries", color: color(255, 0, 0), money: 100, polSupport: 0.5, manpower: 0 },
    { name: "Green Guerrillas", color: color(0, 200, 0), money: 100, polSupport: 0.5 , manpower: 0 },
    { name: "Blue Bloc", color: color(0, 0, 255), money: 100, polSupport: 0.5, manpower: 0 },
    { name: "Beige Brigadiers", color: color(210, 180, 140), money: 100, polSupport: 0.5 , manpower: 0 }
  ];
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

  if (
  draggingPawn &&
  previewTarget &&
  validCoord(previewTarget.x, previewTarget.y) &&
  isAdjacent(draggingPawn.from, previewTarget)
) {
  const toTile = grid[previewTarget.y][previewTarget.x];
  const fromTile = grid[draggingPawn.from.y][draggingPawn.from.x];
  if (toTile.faction === null || toTile.faction === currentPlayer || toTile.faction !== currentPlayer) {
    let px = previewTarget.x * tileSize;
    let py = previewTarget.y * tileSize + uiHeight;
    let tintColor = (toTile.faction === null || toTile.faction === currentPlayer) ? color(0, 255, 0, 100) : color(255, 0, 0, 100);
    fill(tintColor);
    rect(px, py, tileSize, tileSize);
    imageMode(CENTER);
    tint(players[currentPlayer].color.levels[0], players[currentPlayer].color.levels[1], players[currentPlayer].color.levels[2], 100);
    image(pawnImg, px + tileSize / 2, py + tileSize / 2, 30, 30);
  }
    let py = previewTarget.y * tileSize + uiHeight;
    fill(255, 255, 255, 100);
    rect(px, py, tileSize, tileSize);
    imageMode(CENTER);
    tint(players[currentPlayer].color.levels[0], players[currentPlayer].color.levels[1], players[currentPlayer].color.levels[2], 100);
    image(pawnImg, px + tileSize / 2, py + tileSize / 2, 30, 30);
  }

}

function mousePressed() {
  if (mouseY < uiHeight || gameOver || moveCount >= 5) return;
  let x = floor(mouseX / tileSize);
  let y = floor((mouseY - uiHeight) / tileSize);
  if (!validCoord(x, y)) return;
  let tile = grid[y][x];
  if (tile.faction === currentPlayer && tile.troops > 0) {
    draggingPawn = { from: { x, y } };
    hasDragged = false;
  }
}

function mouseDragged() {
  if (draggingPawn) {
    hasDragged = true;
  }
}

function mouseReleased() {
  if (!draggingPawn || !hasDragged || gameOver || moveCount >= 5) {
    draggingPawn = null;
    previewTarget = null;
    return;
  }
  let x = floor(mouseX / tileSize);
  let y = floor((mouseY - uiHeight) / tileSize);
  if (!validCoord(x, y)) return;

  let from = draggingPawn.from;
  let to = { x, y };
  if (!isAdjacent(from, to)) return;

  let fromTile = grid[from.y][from.x];
  let toTile = grid[to.y][to.x];

  fromTile.troops--;
  if (fromTile.troops === 0) fromTile.faction = null;

  if (toTile.troops === 0 || toTile.faction === currentPlayer) {
    if (toTile.faction === null) toTile.faction = currentPlayer;
    toTile.troops++;
  } else {
    toTile.anger[fromTile.faction]++;
    if (random() < 0.5) {
      toTile.troops--;
      if (toTile.troops === 0) {
        toTile.faction = currentPlayer;
        toTile.troops = 1;
        toTile.support = 0.75 * (1 - toTile.support);
      }
    }
  }
  moveCount++;
  draggingPawn = null;
  previewTarget = null;
  hasDragged = false;
}

function mouseMoved() {
  if (draggingPawn || gameOver || moveCount >= 5) {
    previewTarget = null;
    return;
  }
  let x = floor(mouseX / tileSize);
  let y = floor((mouseY - uiHeight) / tileSize);
  previewTarget = validCoord(x, y) ? { x, y } : null;
}

function initGrid() {
  for (let y = 0; y < gridSize; y++) {
    let row = [];
    for (let x = 0; x < gridSize; x++) {
      row.push({
        id: `${x}${y}`,
        faction: null,
        troops: 2,
        support: 0.7,
        revenue: 0,
        manpower: 3,
        econ: 1,
        anger: new Array(players.length).fill(0)
      });
    }
    grid.push(row);
  }

  grid[0][0].faction = 0;
  grid[0][0].troops = 30;
  grid[0][gridSize - 1].faction = 1;
  grid[0][gridSize - 1].troops = 30;
  grid[gridSize - 1][0].faction = 2;
  grid[gridSize - 1][0].troops = 30;
  grid[gridSize - 1][gridSize - 1].faction = 3;
  grid[gridSize - 1][gridSize - 1].troops = 30;
} 

function drawGrid() {
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      let tile = grid[y][x];
      let px = x * tileSize;
      let py = y * tileSize + uiHeight;
      fill(tile.faction !== null ? players[tile.faction].color : 0);
      stroke(255);
      rect(px, py, tileSize, tileSize);
      if (tile.troops > 0) drawPawns(tile.troops, px, py, tile);
    }
  }
}

function drawPawns(count, px, py, tile) {
  imageMode(CENTER);
  let colour = tile.faction !== null ? players[tile.faction].color : 'white';
  tint(colour);
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

  if (tile.faction !== null) {
    fill(0);
    textAlign(LEFT, TOP);
    calcRevenue(tile);
    text((tile.revenue < 0 ? '-$' : '$') + abs(tile.revenue), px + 5, py + 5);

    fill('#222');
    noStroke();
    rect(px, py + tileSize - 5, tileSize, 5);
    fill(tile.support > 0 ? 'rgb(48,225,48)' : 'red');
    let w = min(1, abs(tile.support)) * tileSize;
    let offsetX = tile.support > 0 ? 0 : tileSize - w;
    rect(px + offsetX, py + tileSize - 5, w, 5);
  }
}

function drawUI() {
  fill(240);
  rect(0, 0, width, uiHeight);
  fill(0);
  textSize(16);
  let p = players[currentPlayer];
  text(`Faction: ${p.name}`, 10, 10);
  text(`Moves Left: ${5 - moveCount}`, 10, 30);
  text(`Money: $${p.money}`, 10, 50);
  text(`Manpower: ${p.manpower}`, 10, 70);
  text(`Event: ${currentEvent}`, 250, 30);
  if (moveCount >= 5) text("No moves left. Press SPACE to end your turn.", 10, 85);
  textSize(32);
  text('🎲', width - 120, 10);
  textSize(20);
  text(rollingDice ? '...' : 5 - moveCount, width - 80, 20);
}

function keyPressed() {
  if (key === ' ' && !gameOver) {
    const player = players[currentPlayer];
    moveCount = 0;
    currentPlayer = (currentPlayer + 1) % players.length;
    const event = random(events);
    currentEvent = event.text;
    event.effect(player);
    checkVictory();
    payout();
    manpowergain();
    rolledDice = false;
  }
  if (key === 'r' && !rollingDice && !rolledDice && !gameOver) {
    rollingDice = true;
    rolledDice = true;
  }
  if (key === 'b') {
    let player = players[currentPlayer];
    if (player.money >= 5 && player.manpower > 0) {
      player.money -= 5;
      player.manpower--;
      let ownedTiles = [];
      let maxSoldiers = 0;
      for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
          let tile = grid[y][x];
          if (tile.faction === currentPlayer) {
            if (tile.troops > maxSoldiers) {
              maxSoldiers = tile.troops;
              ownedTiles = [{ x, y }];
            } else if (tile.troops === maxSoldiers) {
              ownedTiles.push({ x, y });
            }
          }
        }
      }
      if (ownedTiles.length > 0) {
        let chosen = random(ownedTiles);
        grid[chosen.y][chosen.x].troops++;
      } else {
        alert('No controlled tiles to place a troop!');
      }
    }
  }
}

function keyReleased() {
  if (key === 'r' && rollingDice) {
    rollingDice = false;
    let extraMoves = floor(random(1, 7));
    moveCount = max(0, moveCount - extraMoves);
  }
}

function payout() {
  let amt = 0;
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      if (grid[y][x].faction == currentPlayer) {
        players[grid[y][x].faction].money += grid[y][x].revenue;
        amt += grid[y][x].revenue;
        grid[y][x].anger = grid[y][x].anger.map(a => max(0, a - 1));
      }
    }
  }
  return amt;
}

function manpowergain() {
  let men = 0;
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      if (grid[y][x].faction == currentPlayer) {
        players[grid[y][x].faction].manpower += grid[y][x].manpower;
        men += grid[y][x].revenue;
      }
    }
  }
  return men;
}

function calcRevenue(tile) {
  let rawSupport = 0.2 + players[tile.faction].polSupport - (0.02 * tile.troops);
  rawSupport = constrain(rawSupport, -1, 1);
  tile.support = rawSupport;
  tile.revenue = round((50 + tile.support * 250 - tile.anger[tile.faction] * 20) * tile.econ);
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
  return dx <= 1 && dy <= 1 && (dx + dy > 0);
}

function checkVictory() {
  let alive = new Set();
  for (let row of grid) {
    for (let tile of row) {
      if (tile.troops > 0 && tile.faction !== null) {
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
