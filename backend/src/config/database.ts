import mongoose from "mongoose";

export const connectDb = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
      throw new Error("MONGODB_URI is not defined in env");
    }

    await mongoose.connect(mongoUri);
    await mongoose.connection.db?.admin().command({ ping: 1 });

    console.log("Successfully connected to MongoDB");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

mongoose.connection.on("disconnected", () => {
  console.log("MongoDB disconnected");
});

mongoose.connection.on("error", (error) => {
  console.error(`MongoDB error: ${error}`);
});
