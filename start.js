require("dotenv").config();

const http = require("http");
const { Server } = require("socket.io");
const app = require("./server");

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: true,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.set("io", io);

io.on("connection", (socket) => {
  console.log("Socket.IO client connected:", socket.id);

  socket.on("disconnect", (reason) => {
    console.log("Socket.IO client disconnected:", socket.id, reason);
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log("Socket.IO is ready");
});
