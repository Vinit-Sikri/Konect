"use client"

import { createContext, useCallback, useContext, useEffect, useState } from "react"
import { Socket, io } from "socket.io-client"

interface SocketProviderProps {
    children: React.ReactNode
}

interface ISocketContext {
    sendMessage: ({ message, username }: { message: string, username: string }) => void
    messages: { message: string, username: string }[]
}

const SocketContext = createContext<ISocketContext | null>(null)

export const useSocket = () => {
    const state = useContext(SocketContext)
    if (!state) throw new Error("State is undefined")
    return state
}

export const SocketProvider = ({ children }: SocketProviderProps) => {
    const [socket, setSocket] = useState<Socket>()
    const [messages, setMessages] = useState<{ message: string, username: string }[]>([])

    const sendMessage: ISocketContext["sendMessage"] = useCallback(
        ({ message, username }) => {
            if (socket) socket.emit("event:message", { message, username })
        },
        [socket]
    )

    const onMessageReceived = useCallback(({ message, username }: { message: string, username: string }) => {
        setMessages(prev => [...prev, { message, username }])
    }, [])

    const onHistoryReceived = useCallback((history: { message: string, username: string }[]) => {
        setMessages(history)
    }, [])

    useEffect(() => {
        const _socket = io("http://localhost:4000", {
            transports: ["websocket"],
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        })

        _socket.on("message", onMessageReceived)
        _socket.on("message:history", onHistoryReceived)

        setSocket(_socket)

        return () => {
            _socket.disconnect()
            _socket.off("message", onMessageReceived)
            _socket.off("message:history", onHistoryReceived)
            setSocket(undefined)
        }
    }, [])

    return (
        <SocketContext.Provider value={{ sendMessage, messages }}>
            {children}
        </SocketContext.Provider>
    )
}
