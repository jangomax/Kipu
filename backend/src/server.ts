import express from "express";
import authRoutes from "./routes/auth";
import dotenv from "dotenv";
import { connectDb } from "./config/database";

dotenv.config();

const app = express();

connectDb();

app.use("", authRoutes);

app.listen(3000, () => console.log("Server on http://localhost:3000"));
