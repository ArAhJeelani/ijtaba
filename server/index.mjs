import { createServer } from "node:http";
import { cityMiddleware } from "./cities.mjs";
// For deployment, route /api/* from the frontend host to this service.
const port = Number(process.env.PORT || 3001);
createServer((req, res) => {
  void cityMiddleware(req, res, () => {
    res.statusCode = 404;
    res.end("Not found");
  }).catch(() => {
    if (res.headersSent) {
      res.destroy();
      return;
    }
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    res.end(JSON.stringify({ error: "Internal server error." }));
  });
}).listen(port, process.env.HOST || "127.0.0.1", () =>
  console.log(`Ijabah timetable API listening on ${port}`),
);
