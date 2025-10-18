import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "@/handlers/auth";
import dotenv from "dotenv";
import { connectDb } from "./config/database";

dotenv.config();

const UI_URL = process.env.UI_URL!;
const app = express();

connectDb();

app.use(
  cors({
    origin: ["http://127.0.0.1:5173", "http://localhost:5173", UI_URL],
    credentials: true,
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());
app.use(cookieParser());
app.use("", authRoutes);

app.listen(3000, () => console.log("Server on http://localhost:3000"));
