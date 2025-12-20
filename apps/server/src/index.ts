import { SocketService } from "./services/socket";
import http from "http";
import express, { Request, Response } from "express";
// import { consumeMessage } from "./services/kafka"; //  Kafka disabled for demo

(async () => {
  // consumeMessage(); //  Disabled: requires Redpanda + Postgres

  const app = express();
  const httpServer = http.createServer(app);
  const socketService = new SocketService();
  const PORT = process.env.PORT || 8000;

  app.get("/", (req: Request, res: Response) => {
    res.send("✅ Konect backend is up and running (demo mode, no Kafka/DB)");
  });

  socketService.io.attach(httpServer);
  socketService.initListeners();

  httpServer.listen(PORT, () => {
    console.log("Http server started at port:", PORT);
  });
})();
