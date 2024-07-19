import * as net from "net";
import * as fs from "fs";

const args = process.argv.slice(2);

// You can use print statements as follows for debugging, they'll be visible when running tests.
console.log("Logs from your program will appear here!");

// Uncomment this to pass the first stage
const server = net.createServer((socket) => {
  socket.on("data", (data) => {
    const request = data.toString();
    const requestLines = request.split("\r\n");
    const requestLine = requestLines[0];
    const [method, url] = requestLine.split(" ");

    const userAgentHeader = requestLines.find((line) =>
      line.startsWith("User-Agent:")
    );

    if (method === "GET") {
      if (url === "/") socket.write(Buffer.from("HTTP/1.1 200 OK\r\n\r\n"));
      else if (url.startsWith("/echo/") && !url.endsWith("/echo/")) {
        const query = url.split("/")[2];
        socket.write(
          Buffer.from(
            `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${query.length}\r\n\r\n${query}`
          )
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
      } else socket.write(Buffer.from("HTTP/1.1 404 Not Found\r\n\r\n"));
    }
  });

  socket.on("close", () => {
    socket.end();
  });
});

server.listen(4221, "localhost");
