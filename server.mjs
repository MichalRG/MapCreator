import { createServer } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";

const ROOT = resolve(".");
const PORT = 4173;

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8"
};

function sendText(response, statusCode, message) {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "text/plain; charset=utf-8");
  response.end(message);
}

createServer((request, response) => {
  try {
    const requestPath = request.url === "/" ? "/index.html" : request.url;
    const sanitizedPath = normalize(decodeURIComponent(requestPath)).replace(/^(\.\.[/\\])+/, "");
    const filePath = join(ROOT, sanitizedPath);

    if (!filePath.startsWith(ROOT) || !existsSync(filePath) || statSync(filePath).isDirectory()) {
      sendText(response, 404, "Not found");
      return;
    }

    const extension = extname(filePath);
    response.statusCode = 200;
    response.setHeader("Content-Type", MIME_TYPES[extension] || "application/octet-stream");
    createReadStream(filePath).pipe(response);
  } catch (error) {
    console.error(error);
    sendText(response, 500, "Server error");
  }
}).listen(PORT, () => {
  console.log(`Map Creator running at http://localhost:${PORT}`);
});
