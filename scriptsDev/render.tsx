var app = new PIXI.Application();
(async function () {
  await app.init({ background: "#FFF", resizeTo: window, antialias: true });
  console.log(app);
  document.getElementById("graphics").appendChild(app.canvas);
})();
let gfx = new PIXI.graphics();
