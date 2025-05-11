let bgDiv, mapDiv, doc;
let players = [];
let alive = [];
let currentPlayer = 0;
let moveCount = 0;
let hovered = null;
let draggingPawn = null;
let previewTarget = null;
let gameOver = false;
let pawnImg;
let territoryMenu;

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
  pawnImg = loadImage('assets/pawn.svg');
}

function setup() {
  createCanvas(doc.clientWidth, doc.clientHeight);
  territoryMenu = createDiv('');
  territoryMenu.style('position', 'absolute');
  territoryMenu.style('background', 'rgba(0, 0, 0, 0.8)');
  territoryMenu.style('color', 'white');
  territoryMenu.style('padding', '10px');
  territoryMenu.style('border-radius', '5px');
  territoryMenu.style('display', 'none');
  territoryMenu.style('pointer-events', 'none');
  territoryMenu.style('z-index', '1');

  window.addEventListener('keydown', e => {
    if (e.key === ' ' && e.target === document.body) {
      e.preventDefault();
    }
  });

  document.querySelectorAll('#ussr-map path').forEach(e => {
    e.onmouseenter = () => {
      e.classList.add('in');
      e.style.cursor = 'pointer';

      if (draggingPawn !== null && !conn[draggingPawn].includes(e.id - 1)) {
        e.style.cursor = 'not-allowed';
      }

      hovered = e.id - 1;

      reloadTerritoryMenu();
      if (draggingPawn === null) {
        territoryMenu.style('display', 'block');
      }
    };

    e.onmouseleave = () => {
      e.classList.remove('in');
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
      territoryMenu.style('display', 'none');
    };
    e.onmouseup = () => {
      e.style.cursor = 'pointer';
    };
  });
  initPlayers();
}

function reloadTerritoryMenu() {
  if (hovered === null) return;
  let t = territories[hovered];
  territoryMenu.html(`
    <span style="font-size: 18px;"><strong>${t.name}</strong></span>
    <span style="font-size: 18px;">(${t.econ}x)</span><br>

    ${
      t.faction !== null
        ? `
            <span style="font-size: 14px;">(${
              t.faction !== null ? players[t.faction].name : 'Neutral'
            })</span><br>
            <div style='height: 7px'></div>
            <strong>Revenue:</strong> ${
              t.revenue < 0 ? `-$${-t.revenue}` : `$${t.revenue}`
            } 
            <span style="font-size: 12px;">(${t.econ}x)</span><br>
            <strong>Support:</strong> ${
              (t.support * 100).toFixed(1) == '-0.0'
                ? '0'
                : (t.support * 100).toFixed(1)
            }%<br>
          `
        : ''
    }

    ${
      t.faction === currentPlayer
        ? `
            <div style='height: 7px'></div>
            <i>[B] Deploy Troop ($${players[currentPlayer].troopCost})</i>
          `
        : ''
    }
  `);
  territoryMenu.position(mouseX + 10, mouseY + 10);
}

function initPlayers() {
  players = [
    {
      name: 'Red Revolutionaries',
      color: color(255, 0, 0),
      money: 100,
      polSupport: 0.5,
      manpower: 3,
      troopCost: 150
    },
    {
      name: 'Green Guerrillas',
      color: color(0, 200, 0),
      money: 100,
      polSupport: 0.5,
      manpower: 0,
      troopCost: 150
    },
    {
      name: 'Blue Bloc',
      color: color(0, 0, 255),
      money: 100,
      polSupport: 0.5,
      manpower: 0,
      troopCost: 150
    },
    {
      name: 'Beige Brigadiers',
      color: color(210, 180, 140),
      money: 100,
      polSupport: 0.5,
      manpower: 0,
      troopCost: 150
    }
  ];

  territories[0].faction = 0;
  territories[0].troops = 5;
  territories[0].colour =
    territories[0].faction !== null
      ? players[territories[0].faction].color
      : 'white';

  territories[32].faction = 1;
  territories[32].troops = 5;
  territories[32].colour =
    territories[32].faction !== null
      ? players[territories[32].faction].color
      : 'white';

  territories[29].faction = 2;
  territories[29].troops = 5;
  territories[29].colour =
    territories[29].faction !== null
      ? players[territories[29].faction].color
      : 'white';

  territories[12].faction = 3;
  territories[12].troops = 5;
  territories[12].colour =
    territories[12].faction !== null
      ? players[territories[12].faction].color
      : 'white';
}

function draw() {
  // territory colours
  for (let i = 0; i < territories.length; i++) {
    document.getElementById(territories[i].id + 1).style.fill =
      territories[i].colour;

    if (territories[i].colour == 'green') {
      const f = territories[i].faction;
      document.getElementById(territories[i].id + 1).style.fill =
        f !== null ? players[f].color : 'white';
      document.getElementById(territories[i].id + 1).classList.add('tint');
    } else {
      document.getElementById(territories[i].id + 1).classList.remove('tint');
    }
  }

  clear();
  drawMap();
  drawUI();

  if (draggingPawn !== null) {
    tint(255);
    imageMode(CENTER);
    image(pawnImg, mouseX, mouseY, 50, 50);
  }
}

function drawMap() {
  strokeWeight(3);
  stroke('black');
  drawingContext.setLineDash([1, 5]);
  line(
    0.12 * doc.clientWidth,
    0.63 * doc.clientHeight,
    0.152 * doc.clientWidth,
    0.63 * doc.clientHeight
  );
  line(
    0.12 * doc.clientWidth,
    0.65 * doc.clientHeight,
    0.135 * doc.clientWidth,
    0.69 * doc.clientHeight
  );

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
    textAlign(LEFT, TOP);
    textStyle(BOLD);
    noStroke();
    fill('white');
    text(t.troops, centerX + 10, centerY);
    textStyle(NORMAL);
  } else if (t.troops === 1) {
    image(pawnImg, centerX, centerY, 30, 30);
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
    calcRevenue(t);

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
    moveCount = 0;
    checkVictory();
    do {
      currentPlayer = (currentPlayer + 1) % players.length;
    } while (!alive.includes(currentPlayer));
    const event = random(events);
    currentEvent = event.text;
    event.effect(currentPlayer);
    payout();
    manpowergain();
    rolledDice = false;
  }
  if (
    key === 'b' &&
    !gameOver &&
    territories[hovered].faction === currentPlayer
  ) {
    const player = players[currentPlayer];
    if (
      territories[hovered].troops > 0 &&
      player.money >= player.troopCost &&
      player.manpower
    ) {
      territories[hovered].troops += 1;
      player.money -= player.troopCost;
      player.troopCost += 10;
      player.manpower--;
    }
  }
}

function payout() {
  let amt = 0;
  for (let t of territories) {
    if (t.faction == currentPlayer) {
      players[t.faction].money += t.revenue;
      amt += t.revenue;
    }
  }
  return amt;
}

function manpowergain() {
  let men = 0;
  for (let t of territories) {
    if (t.faction == currentPlayer) {
      players[t.faction].manpower += t.manpower;
      men += t.manpower;
    }
  }
  return men;
}

function calcRevenue(tile) {
  let rawSupport = 0.2 + players[tile.faction].polSupport - 0.02 * tile.troops;
  rawSupport = constrain(rawSupport, -1, 1);
  tile.support = rawSupport;
  tile.revenue = round((50 + tile.support * 250) * tile.econ);
  reloadTerritoryMenu();
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
  alive = [];
  for (let t of territories) {
    if (t.troops > 0 && t.faction !== null) {
      alive.push(t.faction);
    }
  }
  if (alive.length === 1) {
    gameOver = true;
    alert(`${players[alive[0]].name} has won the revolution!`);
  }
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
    territoryMenu.style('display', 'none');
  }
}

function mouseReleased() {
  if (
    draggingPawn === null ||
    territories[draggingPawn].faction !== currentPlayer ||
    hovered === null ||
    gameOver ||
    moveCount >= 5
  ) {
    draggingPawn = null;
    previewTarget = null;
    return;
  }

  let from = draggingPawn;
  let to = hovered;

  for (let loc of conn[draggingPawn]) {
    const f = territories[loc].faction;
    territories[loc].colour = f !== null ? players[f].color : 'white';
  }
  draggingPawn = null;
  territoryMenu.style('display', 'block');
  if (!validCoord(hovered)) return;
  if (!isAdjacent(from, to)) return;

  let fromTile = territories[from];
  let toTile = territories[to];
  let fac = fromTile.faction;

  fromTile.troops--;
  if (fromTile.troops === 0) {
    fromTile.faction = null;
    fromTile.colour = 'white';
  }

  let adjacentOwnedByAttacker = conn[to].filter(
    loc => territories[loc].faction === currentPlayer
  ).length;
  let totalAdjacent = conn[to].length;
  let attackerAdvantage = adjacentOwnedByAttacker / totalAdjacent >= 0.5;

  if (toTile.troops === 0 || toTile.faction === currentPlayer) {
    if (toTile.faction === null) toTile.faction = currentPlayer;
    toTile.troops++;
    toTile.colour = fac !== null ? players[fac].color : 'white';
  } else {
    let winChance = attackerAdvantage ? 0.6 : 0.5;
    if (random() < winChance) {
      toTile.troops--;
      if (toTile.troops === 0) {
        toTile.faction = currentPlayer;
        toTile.troops = 1;
        toTile.support = 0.75 * (1 - toTile.support);
        console.log(fac);
        toTile.colour = fac !== null ? players[fac].color : 'white';
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
  if (territoryMenu.style('display') === 'block') {
    territoryMenu.position(mouseX + 10, mouseY + 10);
  }
}

function windowResized() {
  resizeCanvas(doc.clientWidth, doc.clientHeight);
}
