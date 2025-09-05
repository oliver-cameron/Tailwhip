await Bun.build({
  entrypoints: [
    "./scriptsDev/geo.tsx",
    "./scriptsDev/render.tsx",
    "./scriptsDev/lizard.tsx",
  ],
  target: "browser",
  outdir: "./scriptsProd",
});
// Bun.serve({
//   port: 8000,
//   fetch(req) {
//     switch (req.url.pathname) {
//       case "/":
//         return new Response(Bun.file("./index.html"));
//       case "/index.css":
//         return new Response(Bun.file("./index.css"));
//       case "/lizard.js":
//         return new Response(Bun.file("./scriptsProd/lizard.js"), {
//           headers: { "Content-Type": "application/javascript" },
//         });
//       case "/pixi.min.js":
//         return new Response(Bun.file("./pixi.min.js"));
//       case "/new.html":
//         return new Response(Bun.file("./new.html"));
//       case "/scriptsProd/geo.tsx":
//         return new Response(Bun.file("./scriptsProd/geo.js"), {
//           headers: { "Content-Type": "application/javascript" },
//         });
//       default:
//         return new Response("404 Not Found", { status: 404 });
//     }
//   },
// });
console.log("Server running on http://localhost:8000");
