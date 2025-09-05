var __commonJS = (cb, mod) => () => (mod || cb((mod = { exports: {} }).exports, mod), mod.exports);

// scriptsDev/render.tsx
var require_render = __commonJS(() => {
  var app = new PIXI.Application;
  (async function() {
    await app.init({ background: "#FFF", resizeTo: window, antialias: true });
    console.log(app);
    document.getElementById("graphics").appendChild(app.canvas);
  })();
  var gfx = new PIXI.graphics;
});
export default require_render();
