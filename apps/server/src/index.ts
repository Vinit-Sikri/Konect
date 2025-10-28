import { consumeMessage } from "./services/kafka";
import { SocketService } from "./services/socket";
import http from "http";
import express, { Request, Response } from "express"; // ✅ import types

(async () => {
  consumeMessage();

  const app = express();
  const httpServer = http.createServer(app);
  const socketService = new SocketService();
  const PORT = process.env.PORT || 8000;

  // ✅ Typed health check route
  app.get("/", (req: Request, res: Response) => {
    res.send("✅ Konect backend is up and running!");
  });

  socketService.io.attach(httpServer);
  socketService.initListeners();

  httpServer.listen(PORT, () => {
    console.log("Http server started at port:", PORT);
  });
})();
