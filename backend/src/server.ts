import express from "express";
import authRoutes from "./routes/auth";
import dotenv from "dotenv";

dotenv.config();
const app = express();

app.use("", authRoutes);

app.listen(3000, () => console.log("Server on http://localhost:3000"));
