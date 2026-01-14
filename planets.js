class Planet {
  constructor({ name, diameter, dist, orbitSpeed, spinSpeed, isSun }) {
    this.name = name;
    this.diameter = diameter;
    this.dist = dist;
    this.orbitSpeed = orbitSpeed;
    this.spinSpeed = spinSpeed;
    this.isSun = isSun;
  }
}

const planets = [
  new Planet({
    name: "sun",
    diameter: 1391.4,
    dist: 0,
    orbitSpeed: 0,
    spinSpeed: 720,
    isSun: true,
  }),
  new Planet({
    name: "mercury",
    diameter: 4.879,
    // dist: 5790,
    dist: 3000,
    orbitSpeed: 88,
    spinSpeed: 4222.6,
    isSun: false,
  }),
  new Planet({
    name: "venus",
    diameter: 12.104,
    // dist: 10820,
    dist: 3750,
    orbitSpeed: 225,
    spinSpeed: 2802,
    isSun: false,
  }),
  new Planet({
    name: "earth",
    diameter: 12.756,
    // dist: 14960,
    dist: 4500,
    orbitSpeed: 365,
    spinSpeed: 24,
    isSun: false,
  }),
  new Planet({
    name: "mars",
    diameter: 6.792,
    // dist: 22790,
    dist: 5250,
    orbitSpeed: 687,
    spinSpeed: 24.7,
    isSun: false,
  }),
  new Planet({
    name: "jupiter",
    diameter: 142.984,
    // dist: 77860,
    dist: 6000,
    orbitSpeed: 4333,
    spinSpeed: 9.9,
    isSun: false,
  }),
  new Planet({
    name: "saturn",
    diameter: 120.536,
    // dist: 143350,
    dist: 6750,
    orbitSpeed: 10759,
    spinSpeed: 10.7,
    isSun: false,
  }),
  new Planet({
    name: "uranus",
    // diameter: 51.118,
    // dist: 287250,
    dist: 7500,
    orbitSpeed: 30687,
    spinSpeed: 17.2,
    isSun: false,
  }),
  new Planet({
    name: "neptune",
    diameter: 49.528,
    // dist: 449510,
    dist: 8250,
    orbitSpeed: 60190,
    spinSpeed: 16.1,
    isSun: false,
  }),
  new Planet({
    name: "pluto",
    diameter: 2.37,
    // dist: 590640,
    dist: 9000,
    orbitSpeed: 90520,
    spinSpeed: 153.3,
    isSun: false,
  }),
];
