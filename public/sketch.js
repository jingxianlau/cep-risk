let bgDiv, mapDiv, doc;
let players = [];
let currentPlayer = 0;
let moveCount = 0;
let hovered = null;
let draggingPawn = null;
let previewTarget = null;
let gameOver = false;
let pawnImg;

// Dice and Events
let rollingDice = false;
let rolledDice = false;
let currentEvent = '';
let events = [
  {
    text: 'Government subsidy received! +5 money',
    effect: p => (p.money += 5)
  },
  {
    text: 'Corruption scandal! -3 support',
    effect: p => (p.polSupport -= 0.03)
  },
  {
    text: 'Mass protest backs you! +4 support',
    effect: p => (p.polSupport += 0.04)
  },
  { text: 'Black market arms deal! +3 money', effect: p => (p.money += 3) },
  { text: 'Economic downturn. -2 money', effect: p => (p.money -= 2) },
  {
    text: 'Community outreach success. +2 support',
    effect: p => (p.polSupport += 0.02)
  }
];

function preload() {
  bgDiv = createDiv('');
  mapDiv = createDiv('');
  bgDiv.html(bg);
  mapDiv.html(map);
  doc = document.getElementById('ussr-map');
  pawnImg = loadImage(
    'https://upload.wikimedia.org/wikipedia/commons/4/45/Chess_plt45.svg'
  );
}

function setup() {
  createCanvas(doc.clientWidth, doc.clientHeight);

  document.querySelectorAll('#ussr-map path').forEach(e => {
    e.onmouseenter = () => {
      // territories[e.id - 1].colour = 'orange';
      e.style.cursor = 'pointer';
      hovered = e.id - 1;
    };
    e.onmouseleave = () => {
      let f = territories[e.id - 1].faction;
      if (draggingPawn !== null) {
        if (!conn[draggingPawn].includes(e.id - 1)) {
          territories[e.id - 1].colour =
            f !== null ? players[f].color : 'white';
        }
        for (let loc of conn[draggingPawn]) {
          territories[loc].colour = 'green';
        }
      } else {
        territories[e.id - 1].colour = f !== null ? players[f].color : 'white';
      }
      e.style.cursor = 'default';
      hovered = null;
    };
  });
  initPlayers();
}

function initPlayers() {
  players = [
    {
      name: 'Red Revolutionaries',
      color: color(255, 0, 0),
      money: 100,
      polSupport: 0.5,
      manpower: 0
    },
    {
      name: 'Green Guerrillas',
      color: color(0, 200, 0),
      money: 100,
      polSupport: 0.5,
      manpower: 0
    },
    {
      name: 'Blue Bloc',
      color: color(0, 0, 255),
      money: 100,
      polSupport: 0.5,
      manpower: 0
    },
    {
      name: 'Beige Brigadiers',
      color: color(210, 180, 140),
      money: 100,
      polSupport: 0.5,
      manpower: 0
    }
  ];

  territories[0].faction = 0;
  territories[0].troops = 5;
  territories[0].colour =
    territories[0].faction !== null
      ? players[territories[0].faction].color
      : 'white';
}

function draw() {
  for (let i = 0; i < territories.length; i++) {
    document.getElementById(territories[i].id + 1).style.fill =
      territories[i].colour;
  }

  clear();
  drawMap();
  drawUI();

  if (draggingPawn !== null) {
    tint(255);
    imageMode(CENTER);
    image(pawnImg, mouseX - 15, mouseY - 15, 50, 50);
  }
}

function drawMap() {
  for (let t of territories) {
    drawPawns(t);
  }
}

function drawPawns(t) {
  imageMode(CENTER);
  let centerX = t.coords.x * doc.clientWidth;
  let centerY = t.coords.y * doc.clientHeight;

  if (t.troops > 5) {
    image(pawnImg, centerX, centerY, 30, 30);
    fill(0);
    textSize(14);
    textAlign(RIGHT, TOP);
    text(t.troops, centerX + 50 - 5, centerY + 5);
  } else {
    let offset = 15;
    for (let i = 0; i < t.troops; i++) {
      let angle = (TWO_PI / t.troops) * i;
      let x = centerX + cos(angle) * offset;
      let y = centerY + sin(angle) * offset;
      image(pawnImg, x, y, 30, 30);
    }
  }

  if (t.faction !== null) {
    fill(0);
    // textAlign(LEFT, TOP);
    // calcRevenue(t);
    // textAlign(CENTER, CENTER);
    // text((t.revenue < 0 ? '-$' : '$') + abs(t.revenue), centerX, centerY - 30);

    fill('#222');
    noStroke();
    rect(centerX - 25, centerY + 15, 50, 5);
    fill(t.support > 0 ? 'rgb(48,225,48)' : 'red');
    let w = min(1, abs(t.support)) * 50;
    let offsetX = t.support > 0 ? 0 : 50 - w;
    rect(centerX - 25 + offsetX, centerY + 15, w, 5);
  }
}

function drawUI() {
  fill(240);
  rect(0, 0, doc.clientWidth, 90);
  fill(0);
  textSize(16);

  textAlign(LEFT, TOP);
  let p = players[currentPlayer];
  text(`Faction: ${p.name}`, 10, 10);
  text(`Moves Left: ${5 - moveCount}`, 10, 30);
  text(`Money: $${p.money}`, 10, 50);
  text(`Manpower: ${p.manpower}`, 10, 70);
  text(`Event: ${currentEvent}`, 250, 30);
  if (moveCount >= 5)
    text('No moves left. Press SPACE to end your turn.', 10, 85);
  textSize(32);
  text('🎲', doc.clientWidth - 120, 40);
  textSize(20);
  text(rollingDice ? '...' : 5 - moveCount, doc.clientWidth - 80, 40);
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
  // if (key === 'r' && !rollingDice && !rolledDice && !gameOver) {
  //   rollingDice = true;
  //   rolledDice = true;
  // }
  if (key === 'b') {
    // let player = players[currentPlayer];
    // if (player.money >= 5 && player.manpower > 0) {
    //   player.money -= 5;
    //   player.manpower--;
    //   let ownedTiles = [];
    //   let maxSoldiers = 0;
    //   for (let y = 0; y < gridSize; y++) {
    //     for (let x = 0; x < gridSize; x++) {
    //       let tile = grid[y][x];
    //       if (tile.faction === currentPlayer) {
    //         if (tile.troops > maxSoldiers) {
    //           maxSoldiers = tile.troops;
    //           ownedTiles = [{ x, y }];
    //         } else if (tile.troops === maxSoldiers) {
    //           ownedTiles.push({ x, y });
    //         }
    //       }
    //     }
    //   }
    //   if (ownedTiles.length > 0) {
    //     let chosen = random(ownedTiles);
    //     grid[chosen.y][chosen.x].troops++;
    //   } else {
    //     alert('No controlled tiles to place a troop!');
    //   }
    // }
  }
}

function keyReleased() {
  // if (key === 'r' && rollingDice) {
  //   rollingDice = false;
  //   let extraMoves = floor(random(1, 7));
  //   moveCount = -extraMoves;
  //   console.log(extraMoves);
  // }
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
  let rawSupport = 0.2 + players[tile.faction].polSupport - 0.02 * tile.troops;
  rawSupport = constrain(rawSupport, -1, 1);
  tile.support = rawSupport;
  tile.revenue = round((50 + tile.support * 250) * tile.econ);
}

function isTileNeutral(a) {
  return territories[a].faction === null;
}

function validCoord(a) {
  return a !== null && a >= 0 && a <= 38;
}

function isAdjacent(a, b) {
  return validCoord(a) && validCoord(b) && conn[a].includes(b);
}

function checkVictory() {
  // CHANGE AT SOME POINT IN LIFE
  // let alive = new Set();
  // for (let row of grid) {
  //   for (let tile of row) {
  //     if (tile.troops > 0 && tile.faction !== null) {
  //       alive.add(tile.faction);
  //     }
  //   }
  // }
  // if (alive.size === 1) {
  //   gameOver = true;
  //   let winner = Array.from(alive)[0];
  //   alert(`${players[winner].name} has won the revolution!`);
  // }
}

function mousePressed() {
  if (gameOver || moveCount >= 5) return;
  if (!validCoord(hovered)) return;

  if (
    territories[hovered].faction === currentPlayer &&
    territories[hovered].troops > 0
  ) {
    draggingPawn = hovered;
    for (let loc of conn[hovered]) {
      territories[loc].colour = 'green';
    }
  }
}

function mouseReleased() {
  if (draggingPawn === null || hovered === null || gameOver || moveCount >= 5) {
    draggingPawn = null;
    previewTarget = null;
    return;
  }

  let from = draggingPawn;
  let to = hovered;

  for (let loc of conn[draggingPawn]) {
    territories[loc].colour = 'white';
  }
  draggingPawn = null;
  if (!validCoord(hovered)) return;
  if (!isAdjacent(from, to)) return;

  let fromTile = territories[from];
  let toTile = territories[to];

  fromTile.troops--;
  if (fromTile.troops === 0) fromTile.faction = null;

  if (toTile.troops === 0 || toTile.faction === currentPlayer) {
    if (toTile.faction === null) toTile.faction = currentPlayer;
    toTile.troops++;
  } else {
    if (random() < 0.5) {
      toTile.troops--;
      if (toTile.troops === 0) {
        toTile.faction = currentPlayer;
        toTile.troops = 1;
        toTile.support = 0.75 * (1 - toTile.support);
        toTile.colour = players[fromTile.faction].color;
      }
    }
  }
  moveCount++;
  draggingPawn = null;
  previewTarget = null;
}

function mouseMoved() {
  if (draggingPawn || gameOver || moveCount >= 5) {
    previewTarget = null;
    return;
  }
  previewTarget = hovered;
}

function windowResized() {
  resizeCanvas(doc.clientWidth, doc.clientHeight);
}
