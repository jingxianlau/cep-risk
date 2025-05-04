let bgDiv, mapDiv, doc;
function preload() {
  bgDiv = createDiv('');
  mapDiv = createDiv('');
  bgDiv.html(bg);
  mapDiv.html(map);
  doc = document.getElementById('ussr-map');
}

function setup() {
  createCanvas(doc.clientWidth, doc.clientHeight);
  document.querySelectorAll('#ussr-map path').forEach(e => {
    e.onmouseenter = () => {
      e.classList.add('in');
    };
    e.onmouseleave = () => {
      e.classList.remove('in');
    };
  });
}

function windowResized() {
  resizeCanvas(doc.clientWidth, doc.clientHeight);
}

function draw() {
  clear();
  for (let i = 0; i < territories.length; i++) {
    noStroke();
    textAlign(CENTER, CENTER);
    text(
      i + 1,
      territories[i].coords.x * doc.clientWidth,
      territories[i].coords.y * doc.clientHeight
    );
  }
}
