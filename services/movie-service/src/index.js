const app = require("./app");
const { port } = require("./config");
const { connectMongo } = require("./config/db");

async function bootstrap() {
  await connectMongo();
  console.log("After connectMongo, starting server...");

  app.listen(port, () => {
    console.log(`Movie service listening on port ${port}`);
  });
}

bootstrap();
