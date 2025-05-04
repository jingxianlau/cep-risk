function preload() {
  let bgDiv = createDiv('');
  let mapDiv = createDiv('');
  bgDiv.html(bg);
  mapDiv.html(map);
}

function setup() {
  createCanvas(windowWidth - 15, 0.61853 * windowWidth - 25);
  document.querySelectorAll('#ussr-map path').forEach(e => {
    e.onmouseenter = () => {
      e.classList.add('in');
    };
    e.onmouseleave = () => {
      e.classList.remove('in');
    };
  });
}

function draw() {}
