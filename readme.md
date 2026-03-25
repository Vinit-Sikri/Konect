<div align="center">

# 💬 Konect

### *Connecting Conversations in Real-Time*

[![Live Demo](https://img.shields.io/badge/🚀%20Live%20Demo-konect--f.onrender.com-6c63ff?style=for-the-badge)](https://konect-f.onrender.com/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socketdotio&logoColor=white)](https://socket.io/)
[![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![Render](https://img.shields.io/badge/Deployed%20on-Render-46e3b7?style=for-the-badge)](https://render.com/)

<br/>

> A production-ready, real-time chat application built with WebSockets — supporting room-based messaging, multiple users, and instant communication.

</div>

---

## 📌 Table of Contents

- [Overview](#-overview)
- [Live Demo](#-live-demo)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Real-Time Communication Flow](#-real-time-communication-flow)
- [Project Structure](#-project-structure)
- [Setup & Installation](#-setup--installation)
- [Deployment](#-deployment)
- [Key Highlights](#-key-highlights)
- [Future Improvements](#-future-improvements)
- [Contributing](#-contributing)
- [Contact](#-contact)

---

## 🌐 Overview

**Konect** is a scalable, production-level chat application that enables users to create and join chat rooms and communicate instantly over WebSockets. Built from scratch, it showcases strong fundamentals in:

- ⚡ Real-time systems design
- 🧱 Client-server architecture
- 🌐 Production deployment
- 🎨 Clean and responsive UI engineering

---

## 🔗 Live Demo

👉 **[https://konect-f.onrender.com/](https://konect-f.onrender.com/)**

> Try it live — open in two different tabs or devices and chat in real-time!

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔴 **Real-Time Messaging** | Instant communication powered by WebSockets |
| 🏠 **Chat Rooms** | Create or join named rooms with ease |
| 👥 **Multi-User Support** | Multiple users can communicate in the same room simultaneously |
| 🟢 **Online Interaction** | See and interact with active users |
| ⚡ **Zero Latency Feel** | Messages delivered and received instantly |
| 🌐 **Production Deployed** | Fully live and accessible from anywhere |

---

## 🧱 Tech Stack

### Frontend
- **HTML5** — Semantic markup
- **CSS3** — Responsive, clean UI design
- **JavaScript (Vanilla)** — DOM manipulation & Socket.io client

### Backend
- **Node.js** — Server-side runtime
- **Express.js** — HTTP server & routing
- **Socket.io** — WebSocket abstraction for real-time communication

### Deployment
- **Render** — Cloud platform for hosting frontend and backend

---

## 🏗️ Architecture

Konect follows a clean **Client-Server architecture** using persistent WebSocket connections.

```
┌─────────────────────────────────────────────┐
│                   CLIENT                    │
│  ┌─────────────┐       ┌─────────────────┐  │
│  │  index.html │       │ dashboard.html  │  │
│  │  (Login)    │──────▶│  (Chat Room)    │  │
│  └─────────────┘       └────────┬────────┘  │
│                                 │           │
│                         Socket.io Client    │
└─────────────────────────────────┼───────────┘
                                  │  WebSocket
                   ┌──────────────▼────────────┐
                   │          SERVER            │
                   │  ┌──────────────────────┐  │
                   │  │     Express.js        │  │
                   │  │  (HTTP + Static)      │  │
                   │  └──────────────────────┘  │
                   │  ┌──────────────────────┐  │
                   │  │    Socket.io Server  │  │
                   │  │  ┌────────────────┐  │  │
                   │  │  │  Room Manager  │  │  │
                   │  │  │  Msg Broadcast │  │  │
                   │  │  └────────────────┘  │  │
                   │  └──────────────────────┘  │
                   └────────────────────────────┘
```

---

## 🔄 Real-Time Communication Flow

```
User Opens App
      │
      ▼
Enter Username / Dashboard
      │
      ▼
Create or Join a Room
      │
      ▼
Socket Connection Established  ──────▶  Server registers user in room
      │
      ▼
User sends message
  emit('sendMessage')  ──────────────▶  Server receives event
                                              │
                                              ▼
                                   broadcast('receiveMessage')
                                              │
                              ┌───────────────▼───────────────┐
                              │  All users in the room        │
                              │  receive the message instantly│
                              └───────────────────────────────┘
```

**Socket Events:**

| Event | Direction | Description |
|---|---|---|
| `joinRoom` | Client → Server | User joins a specific chat room |
| `sendMessage` | Client → Server | User sends a message |
| `receiveMessage` | Server → Client | Broadcast message to room |
| `disconnect` | Auto | Handles user leaving |

---

## 📂 Project Structure

```
Konect/
│
├── client/                   # Frontend
│   ├── index.html            # Login / Entry page
│   ├── dashboard.html        # Chat room interface
│   ├── styles/               # CSS stylesheets
│   └── scripts/              # Client-side JS (socket logic, UI)
│
├── server/                   # Backend
│   ├── controllers/          # Request & event handlers
│   ├── socket/               # Socket.io event logic
│   └── index.js              # Server entry point
│
├── package.json
└── README.md
```

---

## ⚙️ Setup & Installation

### Prerequisites
- [Node.js](https://nodejs.org/) v14+
- npm

### Steps

**1. Clone the repository**
```bash
git clone https://github.com/your-username/konect.git
cd konect
```

**2. Install dependencies**
```bash
npm install
```

**3. Start the development server**
```bash
npm run dev
```

**4. Run the frontend**

Open `client/index.html` using **Live Server** (VS Code extension), or access the deployed version directly at:

> 🌐 [https://konect-f.onrender.com/](https://konect-f.onrender.com/)

---

## 🚀 Deployment

Konect is fully deployed on **[Render](https://render.com/)** — both frontend and backend:

| Service | URL |
|---|---|
| 🌐 Live App | [https://konect-f.onrender.com/](https://konect-f.onrender.com/) |

---

## 🎯 Key Highlights

- ✅ Built a real-time communication system **from scratch** using WebSockets
- ✅ Designed a **room-based architecture** supporting multiple concurrent users
- ✅ Achieved **low-latency messaging** via persistent Socket.io connections
- ✅ Created a **clean, responsive UI** for seamless cross-device experience
- ✅ Deployed a **fully functional production application** on Render

---

## 📈 Future Improvements

- [ ] 🔔 **Typing Indicators** — Show when someone is typing
- [ ] ✅ **Read Receipts** — Message seen status
- [ ] 🗄️ **Message Persistence** — Store messages in a database (MongoDB)
- [ ] 🔐 **Authentication** — JWT-based login and user sessions
- [ ] 📲 **Push Notifications** — Notify users of new messages
- [ ] 😄 **Emoji Reactions** — React to messages
- [ ] 🔍 **Message Search** — Search within a room's history

---

## 🤝 Contributing

Contributions are welcome and appreciated!

```bash
# Fork the repo
# Create your feature branch
git checkout -b feature/amazing-feature

# Commit your changes
git commit -m "Add some amazing feature"

# Push to the branch
git push origin feature/amazing-feature

# Open a Pull Request
```

---

## 📬 Contact

**Built with ❤️ by Vinit Sikri to demonstrate real-time system design and frontend engineering.**

| Platform | Link |
|---|---|
| 🐙 GitHub | [github.com/your-username](https://github.com/Vinit-Sikri) |
| 💼 LinkedIn | [linkedin.com/in/your-profile](https://www.linkedin.com/in/vinit-sikri-46a997252) |

---

<div align="center">

⭐ **If you found this project useful, please consider giving it a star!** ⭐

<br/>

*💡 Konect — Connecting conversations in real-time.*

</div>
