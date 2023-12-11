import { Server } from "socket.io";

export const initialize = () => {
  const io = new Server(3001);

  io.on("connection", (socket) => {
    const clientData = {
      id: socket.id,
      handshake: socket.handshake,
    };

    console.log("Client connected", clientData);
  });
};
