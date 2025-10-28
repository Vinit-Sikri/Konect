// apps/server/src/services/socket.ts

import { Server, Socket } from "socket.io"
import { produceMessage } from "./kafka"
import Redis from "ioredis"
import db from "./prisma"

//  Use single REDIS_URL env variable (for Upstash or Render)
const redisUrl = process.env.REDIS_URL || "redis://localhost:6379"

const pub = new Redis(redisUrl, { maxRetriesPerRequest: 5 })
const sub = new Redis(redisUrl, { maxRetriesPerRequest: 5 })

sub.subscribe("MESSAGES", (err, count) => {
    if (err) console.error("[ioredis] Redis subscribe error:", err)
    else console.log(`[ioredis] Subscribed to ${count} channels`)
})

export class SocketService {
    private _io: Server

    constructor() {
        console.log("✅ WebSocket server started")
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
        console.log("✅ Initialized WebSocket event listeners")

        io.on("connect", async (socket: Socket) => {
            console.log("🔗 New WebSocket connection:", socket.id)

            // Send last 20 messages from DB
            try {
                const lastMessages = await db.message.findMany({
                    orderBy: { createdAt: "desc" },
                    take: 20,
                })
                socket.emit("message:history", lastMessages.reverse())
            } catch (err) {
                console.error("❌ Error fetching message history:", err)
            }

            // When user sends message
            socket.on("event:message", async ({ message, username }: { message: string, username: string }) => {
                console.log(`💬 ${username}: ${message}`)
                await pub.publish("MESSAGES", JSON.stringify({ message, username }))
            })
        })

        // When message is published to Redis channel
        sub.on("message", async (channel, msg) => {
            if (channel === "MESSAGES") {
                const { message, username } = JSON.parse(msg)
                io.emit("message", { message, username })

                try {
                    await db.message.create({ data: { message, username } })
                    await produceMessage(message)
                    console.log("✅ Message saved & sent to Kafka")
                } catch (err) {
                    console.error("❌ Error saving/producing message:", err)
                }
            }
        })
    }
}
