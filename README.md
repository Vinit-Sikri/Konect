# Konect

> A full-stack real-time chat platform built with Next.js, Node.js, WebSockets, Kafka, Redis, and PostgreSQL.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Visit-brightgreen)](https://konect-frontendd.onrender.com/)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-blue)](https://github.com/Vinit-Sikri/Konect)

---

## Overview

Konect is a scalable chat application that leverages modern backend infrastructure to deliver low-latency, real-time messaging. It uses **Kafka (Redpanda)** for asynchronous event processing, **Redis Pub/Sub** for multi-instance message broadcasting, and **WebSockets** for persistent client connections — all backed by a **PostgreSQL** database managed through **Prisma ORM**.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js (React), TypeScript |
| Backend | Node.js, Express, TypeScript |
| Real-time | WebSockets (Socket.IO) |
| Message Queue | Kafka via Redpanda |
| Caching / Pub-Sub | Redis |
| Database | PostgreSQL + Prisma ORM |
| CI/CD | GitHub Actions → Render |

---

## Architecture

```
Client (Next.js)
    │
    └── WebSocket (Socket.IO)
            │
        Node.js Server
        ├── Redis Pub/Sub  ──── broadcasts to all server instances
        ├── Kafka (Redpanda) ── async event queue for persistence
        └── Prisma ORM ──────── PostgreSQL for durable storage
```

- **WebSockets** maintain persistent connections between clients and the server, enabling near-instant message delivery.
- **Kafka (Redpanda)** decouples message ingestion from persistence, handling async event processing reliably under load.
- **Redis Pub/Sub** enables horizontal scaling by broadcasting messages across multiple server instances.
- **Prisma + PostgreSQL** handle structured data storage and retrieval with type-safe queries.

---

## Project Structure

```
Konect/
├── apps/
│   ├── server/              # Node.js backend
│   │   ├── prisma/          # Prisma schema & migrations
│   │   └── src/
│   │       ├── services/
│   │       │   ├── kafka.ts     # Kafka producer/consumer setup
│   │       │   ├── prisma.ts    # Prisma client instance
│   │       │   └── socket.ts    # Socket.IO service & listeners
│   │       └── index.ts         # App entry point
│   └── web/                 # Next.js frontend
│       └── app/
│           ├── context/
│           │   └── SocketProvider.tsx   # Socket context for client
│           ├── layout.tsx
│           └── page.tsx
├── docs/
├── packages/
├── docker-compose.yml
└── .eslintrc.js
```

---

## Getting Started

### Prerequisites

- Node.js >= 18
- Docker & Docker Compose (for Kafka/Redis/PostgreSQL)
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/Vinit-Sikri/Konect.git
cd Konect

# Install dependencies
npm install
```

### Environment Setup

Copy the example env file and fill in your values:

```bash
cp apps/server/.env.example apps/server/.env
```

Key environment variables:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/konect
REDIS_URL=redis://localhost:6379
KAFKA_BROKER=localhost:9092
PORT=8000
```

### Running with Docker

```bash
# Start Kafka (Redpanda), Redis, and PostgreSQL
docker-compose up -d
```

### Running the App

```bash
# Run both server and web in dev mode (from root)
npm run dev
```

The backend will start at `http://localhost:8000` and the frontend at `http://localhost:3000`.

---

## Key Features

- **Real-time messaging** with WebSocket connections and near 100% uptime
- **Scalable architecture** using Redis Pub/Sub for multi-instance broadcasting
- **Durable message persistence** via Kafka async event queue and PostgreSQL storage
- **Type-safe data layer** with Prisma ORM and TypeScript throughout
- **CI/CD pipeline** via GitHub Actions with automated deployments to Render

---

## Deployment

The project is deployed on [Render](https://render.com/) with CI/CD configured through GitHub Actions. On every push to `main`, the pipeline builds and deploys both the frontend and backend services automatically.

---

## License

This project is open source. See [LICENSE](LICENSE) for details.

---

## Author

**Vinit Sikri** — [GitHub](https://github.com/Vinit-Sikri)
