import * as net from "net";
import * as fs from "fs";
import * as zlib from "zlib";

const args = process.argv.slice(2);

const server = net.createServer((socket) => {
  socket.on("data", (data) => {
    const request = data.toString();
    const [headers, requestBody] = request.split("\r\n\r\n");
    const requestLines = headers.split("\r\n");
    const requestLine = requestLines[0];
    const [method, url] = requestLine.split(" ");

    const userAgentHeader = requestLines.find((line) =>
      line.startsWith("User-Agent:")
    );
    const acceptEncodingHeader = requestLines.find((line) =>
      line.startsWith("Accept-Encoding:")
    );

    if (url === "/") socket.write(Buffer.from("HTTP/1.1 200 OK\r\n\r\n"));
    else if (url.startsWith("/echo/") && !url.endsWith("/echo/")) {
      const query = url.split("/")[2];

      const clientCompressionSchemes = acceptEncodingHeader
        ?.split(": ")[1]
        .split(", ");
      clientCompressionSchemes?.forEach((compressionScheme) => {
        if (compressionScheme === "gzip") {
          const compressedQuery = zlib.gzipSync(query);
          socket.write(
            `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${compressedQuery.length}\r\nContent-Encoding: gzip\r\n\r\n${compressedQuery}`
          );
        }
      });
      socket.write(
        `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${query.length}\r\n\r\n${query}`
      );
    } else if (url === "/user-agent" && userAgentHeader) {
      const userAgent = userAgentHeader.split(": ")[1];
      socket.write(
        Buffer.from(
          `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${userAgent.length}\r\n\r\n${userAgent}`
        )
      );
    } else if (
      url.startsWith("/files/") &&
      !url.endsWith("/files/") &&
      args[0] === "--directory"
    ) {
      const dir = args[1];
      const file = url.split("/")[2];
      const filePath = dir + file;
      if (method === "GET") {
        fs.readFile(filePath, "utf8", (err, data) => {
          if (err) socket.write(Buffer.from("HTTP/1.1 404 Not Found\r\n\r\n"));
          else {
            socket.write(
              Buffer.from(
                `HTTP/1.1 200 OK\r\nContent-Type: application/octet-stream\r\nContent-Length: ${data.length}\r\n\r\n${data}`
              )
            );
          }
        });
      }
      if (method === "POST") {
        fs.writeFile(filePath, requestBody, "utf-8", (err) => {
          if (!err) socket.write(Buffer.from("HTTP/1.1 201 Created\r\n\r\n"));
        });
      }
    } else socket.write(Buffer.from("HTTP/1.1 404 Not Found\r\n\r\n"));
  });

  socket.on("close", () => {
    socket.end();
  });
});

server.listen(4221, "localhost");
