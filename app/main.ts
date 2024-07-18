import * as net from "net";

// You can use print statements as follows for debugging, they'll be visible when running tests.
console.log("Logs from your program will appear here!");

// Uncomment this to pass the first stage
const server = net.createServer((socket) => {
  socket.on("data", (data) => {
    const request = data.toString();
    const requestLine = request.split("\r\n")[0];
    const [method, url] = requestLine.split(" ");

    if (method === "GET") {
      if (url === "/") socket.write(Buffer.from("HTTP/1.1 200 OK\r\n\r\n"));
      else if (url.startsWith("/echo/") && !url.endsWith("/echo/")) {
        const query = url.split("/")[2];
        socket.write(
          Buffer.from(
            `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${query.length}\r\n\r\n${query}`
          )
        );
      } else socket.write(Buffer.from("HTTP/1.1 404 Not Found\r\n\r\n"));
    }
  });

  socket.on("close", () => {
    socket.end();
  });
});

server.listen(4221, "localhost");
