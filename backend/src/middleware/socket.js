import http from "http";
import express from"express";
import { Server as SocketServer } from "socket.io";
import supabase from '../config/supabase.js';

const app = express();
const server=http.createServer(app);

const io = new SocketServer(server, {
  path: "/api/socket.io",
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
  },
});

const userSocketMap={}; // {[userId]:{socketId,username}}

export function getReceiverSocketId(userId) {
  return userSocketMap[userId]?.socketId;
}

// WebSocket connection handler
io.on('connection', (socket) => {
  console.log('New client connected',socket.id);

  const userId = socket.handshake.query.userId;
  const username= socket.handshake.query.username;
  const role=socket.handshake.query.role;
  console.log("Connection attempt - userId:", userId, "username:", username);

  // Only add to socket map if we have valid userId and username
  if (userId && username && userId !== 'undefined' && username !== 'undefined') {
    userSocketMap[userId] = { socketId: socket.id, username, role};
    console.log(`User ${username} (${userId},${role}) connected with socket ${socket.id}`);
    console.log("Current userSocketMap:", Object.keys(userSocketMap));
    
    // Emit updated online users list
    emitOnlineUsers();
  } else {
    console.log("Invalid connection attempt - missing or invalid userId/username");
    console.log("Received userId:", userId, "username:", username, "role:",role);
    // Optionally disconnect invalid connections
    socket.disconnect(true);
    return;
  }

  socket.on("accept_request", async ({elderlyId, volunteerId, volunteerName}) =>{
    const message = `${volunteerName} has accepted your help request!`;
    
    await supabase.from("notifications").insert([
      {
        elderly_id: elderlyId,
        volunteer_id: volunteerId,
        message,
      },
    ]);

    const elderlySocketId = userSocketMap.get(elderlyId);

    if (elderlySocketId) {
      io.to(elderlySocketId).emit("notify", { message });
    }
  });

  socket.on("cancel_request", async({elderlyId, volunteerName}) =>{
    const message = `${volunteerName} has cancelled your help request!`;
    
    await supabase.from("notifications").insert([
      {
        elderly_id: elderlyId,
        volunteer_id: volunteerId,
        message,
      },
    ]);
    const elderlySocketId = userSocketMap.get(elderlyId);

    if (elderlySocketId) {
      io.to(elderlySocketId).emit("notify", { message });
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    if (userId && userSocketMap[userId]) {
      console.log(`User ${username} (${userId}) disconnected`);
      delete userSocketMap[userId];
      emitOnlineUsers();
    }
  });

  // Handle connection errors
  socket.on('error', (error) => {
    console.log('Socket error:', error);
  });
});

function emitOnlineUsers(){
  const onlineUsers= Object.entries(userSocketMap).map(([userId,data]) =>({
    userId,
    username: data.username,
    role:data.role
  }));
  console.log("Emitting online users:", onlineUsers);
  io.emit("getOnlineUsers", onlineUsers);
}

export {io,app,server};