class Territory {
  constructor(id, econ) {
    this.id = id;
    this.owner = null;
    this.troops = 2;
    this.support = 0.5;
    this.revenue = 0;
    this.invasionBonus = 100;
    this.econ = econ;
  }
}
