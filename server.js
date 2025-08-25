Bun.serve({
  port: 8000,
  routes: {
    "/index.html": new Response(await Bun.file("./index.html").bytes()),
    "/index.css": new Response(await Bun.file("./index.css").bytes()),
    "/lizard.js": new Response(await Bun.file("./lizard.js").bytes(), {
      headers: { "Content-Type": "application/javascript" },
    }),
    "/pixi.min.js": new Response(await Bun.file("./pixi.min.js").bytes()),
    "/*": new Response("404 Not Found", { status: 404 }),
  },
});
