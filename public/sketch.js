document.querySelectorAll('#ussr-map path').forEach(e => {
  e.onmouseenter = () => {
    e.classList.add('in');
  }
  e.onmouseleave = () => {
    e.classList.remove('in');
  }
})
