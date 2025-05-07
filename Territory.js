class Territory {
  constructor(n, id, coords, econ) {
    this.name = n;
    this.id = id;
    this.coords = coords;
    this.faction = null;
    this.troops = 2;
    this.support = 0.5;
    this.revenue = 0;
    this.manpower = 3;
    this.econ = econ;
    this.colour = 'white';
  }

  // function invade(fromPlayer) {
  //   this.faction
  // }
}
