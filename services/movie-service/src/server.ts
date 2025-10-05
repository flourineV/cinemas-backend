// server.ts
import { createApp } from "./app";
import { config } from "./config";
const app = createApp();
app.listen(config.port, () =>
  console.log(`${config.serviceName} listening on ${config.port}`)
);
