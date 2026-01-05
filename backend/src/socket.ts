
import { Server as SocketIOServer } from "socket.io";
import http from "http";
import ChatModel from "./models/chat.model.js"; // Adjust path as needed
import MemberModel from "./models/member.model.js"; // Adjust path as needed

let io: SocketIOServer;

export const initSocket = (server: http.Server) => {
    io = new SocketIOServer(server, {
        cors: {
            origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173", // Fallback or env
            credentials: true,
        },
    });

    io.on("connection", (socket) => {
        console.log("A user connected", socket.id);

        socket.on("join_room", async (workspaceId) => {
            // Ideally we verify user here. For now, trusting the join but we could add member check if we had userId in handshake.
            // We will assume the client sends valid requests, but real-time validation happens on message send.
            socket.join(workspaceId);
            console.log(`User ${socket.id} joined room ${workspaceId}`);
        });

        socket.on("send_message", async (data) => {
            const { workspaceId, senderId, content } = data;

            try {
                // Verify membership before saving
                const isMember = await MemberModel.exists({
                    workspaceId,
                    userId: senderId,
                });

                if (!isMember) {
                    console.error(`User ${senderId} is not a member of workspace ${workspaceId}`);
                    // Optionally emit error back to sender
                    return;
                }

                const newMessage = new ChatModel({
                    workspaceId,
                    senderId,
                    content,
                });
                await newMessage.save();

                // Populate sender info before broadcasting
                await newMessage.populate("senderId", "name profilePicture");

                io.to(workspaceId).emit("receive_message", newMessage);
            } catch (error) {
                console.error("Error saving message:", error);
            }
        });

        socket.on("disconnect", () => {
            console.log("User disconnected", socket.id);
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error("Socket.io not initialized!");
    }
    return io;
};
