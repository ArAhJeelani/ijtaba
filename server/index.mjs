import { createServer } from "node:http";
import { cityMiddleware } from "./cities.mjs";
// For deployment, route /api/* from the frontend host to this service.
const port = Number(process.env.PORT || 3001);
createServer((req, res) => {
  void cityMiddleware(req, res, () => {
    res.statusCode = 404;
    res.end("Not found");
  });
}).listen(port, process.env.HOST || "127.0.0.1", () =>
  console.log(`Ijabah timetable API listening on ${port}`),
);
