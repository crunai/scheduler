import { rateLimit } from "express-rate-limit";
import { LogsCollection } from "../database";

export const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  limit: 1000,
  handler: (_req, res, _next, options) => {
    LogsCollection.insertMany({
      message: "Rate Limited",
    });
    res.status(options.statusCode).send(options.message);
  },
  standardHeaders: true,
});
