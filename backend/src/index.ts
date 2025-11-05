import "dotenv/config";
import { config } from "./config/app.config.js";
import express from "express";
import type { Request, Response, NextFunction } from "express";
import cors from "cors";
import session from "cookie-session";

const app = express();
const BASE_PATH = config.BASE_PATH;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    name: "session",
    keys: [config.SESSION_SECRET],
    maxAge: 24 * 60 * 60 * 1000,
    secure: config.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
  })
);
app.use(
  cors({
    origin: config.FRONTEND_ORIGIN,
    credentials: true,
  })
);

app.get("/", (req: Request, res: Response, next: NextFunction) => {
  res.status(200).json({
    message: "This is the base url",
  });
});

app.listen(config.PORT, async () => {
  console.log(
    `Server is listening on port ${config.PORT} in ${config.NODE_ENV}`
  );
});
