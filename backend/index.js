import express from "express";
import cors from "cors";
import routes from "./routes.js";

// Remove trailing slash from FRONTEND_URL for CORS matching
const FRONTEND_URL = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, '');

const app = express();

app.use(cors({
    origin: FRONTEND_URL,
    credentials: true
}));
app.use(express.json());
app.use('', routes);

export default app;