await Bun.build({
  entrypoints: [
    "./scriptsDev/geo.tsx",
    "./scriptsDev/render.tsx",
    "./scriptsDev/lizard.tsx",
    "./scriptsDev/newSpine.tsx",
    "./scriptsDev/newRender.tsx",
  ],
  target: "browser",
  outdir: "./scriptsProd",
});
Bun.serve({
  port: 8000,
  fetch(req) {
    switch (req.url.pathname) {
      case "/":
        return new Response(Bun.file("./index.html"));
      case "/index.css":
        return new Response(Bun.file("./index.css"));
      case "/lizard.js":
        return new Response(Bun.file("./scriptsProd/lizard.js"), {
          headers: { "Content-Type": "application/javascript" },
        });
      case "/pixi.min.js":
        return new Response(Bun.file("./pixi.min.js"));
      case "/new.html":
        return new Response(Bun.file("./new.html"));
      case "/scriptsProd/geo.tsx":
        return new Response(Bun.file("./scriptsProd/geo.js"), {
          headers: { "Content-Type": "application/javascript" },
        });
      default:
        return new Response("404 Not Found", { status: 404 });
    }
  },
  routes: {
    "/": new Response(Bun.file("./index.html")),
    "/index.css": new Response(Bun.file("./index.css")),
    "/lizardOld.js": new Response(Bun.file("./lizard.js"), {
      headers: { "Content-Type": "application/javascript" },
    }),
    "/pixi.min.js": new Response(Bun.file("./pixi.min.js")),
    "/new.html": new Response(Bun.file("./new.html")),
    "/geo.js": new Response(Bun.file("./scriptsProd/geo.js"), {
      headers: { "Content-Type": "application/javascript" },
    }),
    "/render.js": new Response(Bun.file("./scriptsProd/render.js"), {
      headers: { "Content-Type": "application/javascript" },
    }),
    "/lizard.js": new Response(Bun.file("./scriptsProd/lizard.js"), {
      headers: { "Content-Type": "application/javascript" },
    }),
    "/newSpine.js": new Response(Bun.file("./scriptsProd/newSpinejs"), {
      headers: { "Content-Type": "application/javascript" },
    }),
    "/newRender.js": new Response(Bun.file("./scriptsProd/newRender.js"), {
      headers: { "Content-Type": "application/javascript" },
    }),
  },
});
console.log("Server running on http://localhost:8000");
