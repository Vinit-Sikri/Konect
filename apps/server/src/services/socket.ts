// apps/server/src/services/socket.ts

import { Server, Socket } from "socket.io"
import { produceMessage } from "./kafka"
import Redis from "ioredis"
import db from "./prisma"

const redisConfig = {
    host: process.env.REDIS_HOST || "localhost",
    port: Number(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: 5,
}

const pub = new Redis(redisConfig)
const sub = new Redis(redisConfig)

sub.subscribe("MESSAGES", (err, count) => {
    if (err) console.error("[ioredis] Redis subscribe error:", err)
    else console.log(`[ioredis] Subscribed to ${count} channels`)
})

export class SocketService {
    private _io: Server

    constructor() {
        console.log("Web socket server started")
        this._io = new Server({
            cors: {
                allowedHeaders: ["*"],
                origin: "*",
            },
        })
    }

    get io() {
        return this._io
    }

    public initListeners() {
        const io = this._io
        console.log("Initialized web socket event listeners")

        io.on("connect", async (socket: Socket) => {
            console.log("New web socket connection established", socket.id)

            // Send last 20 messages
            try {
                const lastMessages = await db.message.findMany({
                    orderBy: { createdAt: "desc" },
                    take: 20,
                })
                socket.emit("message:history", lastMessages.reverse())
            } catch (err) {
                console.error("Error fetching message history:", err)
            }

            socket.on("event:message", async ({ message, username }: { message: string, username: string }) => {
                console.log(username, message)
                await pub.publish("MESSAGES", JSON.stringify({ message, username }))
            })
        })

        sub.on("message", async (channel, msg) => {
            if (channel === "MESSAGES") {
                const { message, username } = JSON.parse(msg)
                io.emit("message", { message, username })

                try {
                    await db.message.create({ data: { message, username } })
                    await produceMessage(message)
                    console.log("Message saved to DB and produced to Kafka")
                } catch (err) {
                    console.error("Error saving or producing message:", err)
                }
            }
        })
    }
}
