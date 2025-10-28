"use client"

import { useSocket } from "./context/SocketProvider"
import { useState, useEffect, useRef } from "react"

export default function HomePage() {
    const { sendMessage, messages } = useSocket()
    const [username, setUsername] = useState("")
    const [user, setUser] = useState(false)
    const [message, setMessage] = useState<string>("")
    const messagesEndRef = useRef<HTMLDivElement>(null)

    // Auto-scroll to bottom when new messages arrive
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const handleSend = (e: React.KeyboardEvent) => {
        if(e.key === "Enter" && message.trim()){
            e.preventDefault()
            sendMessage({ message: message.trim(), username })
            setMessage("")
        }
    }

    const handleSendClick = () => {
        if(message.trim()){
            sendMessage({ message: message.trim(), username })
            setMessage("")
        }
    }

    const handleUsernameSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if(username.trim()){
            setUser(true)
        }
    }

    return (
        <main>
            {/* Animated Background */}
            <div className="aurora">
                <div className="canvas-wrapper">
                    <div className='circle circle-0' />
                    <div className='circle circle-1' />
                    <div className='circle circle-2' />
                    <div className='circle circle-3' />
                </div>
            </div>

            {/* Login Screen */}
            { !user ? (
                <div className="login-container">
                    <div className="login-card">
                        <div className="login-header">
                            <h1>Welcome to Chat</h1>
                            <p>Enter your username to get started</p>
                        </div>
                        <form onSubmit={handleUsernameSubmit}>
                            <input 
                                value={username} 
                                onChange={(e) => setUsername(e.target.value)} 
                                placeholder="Enter username" 
                                type="text"
                                maxLength={20}
                                autoFocus
                            />
                            <button type="submit" className="btn-primary">
                                Start Chatting
                            </button>
                        </form>
                    </div>
                </div>
            ) : (
                /* Chat Interface */
                <div className="chat-container">
                    {/* Chat Header */}
                    <div className="chat-header">
                        <div className="header-content">
                            <div className="user-info">
                                <div className="avatar">{username.charAt(0).toUpperCase()}</div>
                                <div>
                                    <h2>{username}</h2>
                                    <p className="status">
                                        <span className="status-dot"></span>
                                        Online
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setUser(false)} 
                                className="btn-logout"
                                title="Logout"
                            >
                                Logout
                            </button>
                        </div>
                    </div>

                    {/* Messages Area */}
                    <div className="messages-container">
                        {messages.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-icon">💬</div>
                                <p>No messages yet</p>
                                <span>Start the conversation by sending a message!</span>
                            </div>
                        ) : (
                            messages.map((msg, index) => (
                                <div 
                                    key={index} 
                                    className={`message ${msg.username === username ? "message-sent" : "message-received"}`}
                                >
                                    {msg.username !== username && (
                                        <div className="message-avatar">
                                            {msg.username.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    <div className="message-content">
                                        {msg.username !== username && (
                                            <p className="message-username">{msg.username}</p>
                                        )}
                                        <div className="message-bubble">
                                            <p>{msg.message}</p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="input-container">
                        <div className="input-wrapper">
                            <input 
                                onKeyDown={(e) => handleSend(e)} 
                                placeholder="Type a message..." 
                                value={message} 
                                onChange={(e) => setMessage(e.target.value)} 
                                type="text"
                                maxLength={500}
                            />
                            <button 
                                onClick={handleSendClick}
                                className="btn-send"
                                disabled={!message.trim()}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                    <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    )
}