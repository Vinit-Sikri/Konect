// apps/server/src/services/socket.ts

import { Server, Socket } from "socket.io"
// import { produceMessage } from "./kafka"      // 🔕 Kafka disabled for demo
// import Redis from "ioredis"                   // 🔕 Redis disabled for demo
// import db from "./prisma"                     // 🔕 DB disabled for demo

// ⚠️ Demo Mode:
// Kafka, Redis Pub/Sub, and Prisma persistence are commented out.
// Direct socket broadcast is used for real-time chat.
// Uncomment when infra is available again.

export class SocketService {
    private _io: Server

    constructor() {
        console.log("✅ WebSocket server started (demo mode)")
        this._io = new Server({
            cors: {
                origin: "*",
                allowedHeaders: ["*"],
            },
        })
    }

    get io() {
        return this._io
    }

    public initListeners() {
        const io = this._io
        console.log("✅ Initialized WebSocket event listeners (demo mode)")

        io.on("connect", async (socket: Socket) => {
            console.log("🔗 New WebSocket connection:", socket.id)

            // 🔕 History from DB disabled
            // try {
            //     const lastMessages = await db.message.findMany({
            //         orderBy: { createdAt: "desc" },
            //         take: 20,
            //     })
            //     socket.emit("message:history", lastMessages.reverse())
            // } catch (err) {
            //     console.error("❌ Error fetching message history:", err)
            // }

            // ✅ Direct real-time broadcast
            socket.on("event:message", async ({ message, username }: { message: string; username: string }) => {
                console.log(`💬 ${username}: ${message}`)

                // 🔕 Redis publish disabled
                // await pub.publish("MESSAGES", JSON.stringify({ message, username }))

                // 🔕 Kafka + DB disabled
                // await produceMessage(message)
                // await db.message.create({ data: { message, username } })

                // ✅ Send directly to all clients
                io.emit("message", { message, username })
            })
        })

        // 🔕 Redis subscription disabled
        // sub.on("message", async (channel, msg) => {
        //     if (channel === "MESSAGES") {
        //         const { message, username } = JSON.parse(msg)
        //         io.emit("message", { message, username })
        //
        //         try {
        //             await db.message.create({ data: { message, username } })
        //             await produceMessage(message)
        //             console.log("✅ Message saved & sent to Kafka")
        //         } catch (err) {
        //             console.error("❌ Error saving/producing message:", err)
        //         }
        //     }
        // })
    }
}
