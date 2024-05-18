import express from "express";
import schedules from "./routes/schedules/router";
import users from "./routes/users/router";
import admin from "./routes/admin/router";
import health from "./routes/health/router";
import { errorHandler } from "./middleware/error";
import { logger } from "./middleware/logger";
import "dotenv/config";
import swaggerUi from "swagger-ui-express";
import fs from "fs";
import YAML from "yaml";
import { limiter } from "./middleware/rateLimiter";
import cors from "cors";

export const app = express();
app.use(express.json());
app.use(cors());

if (process.env.NODE_ENV === "production") {
  app.use(limiter);
  app.use(logger);
}

app.use("/", health);
app.use("/users", users);
app.use("/schedules", schedules);
app.use("/admin", admin);

const swaggerFile = fs.readFileSync("./swagger.yaml", "utf8");
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(YAML.parse(swaggerFile)));

app.use(errorHandler);
