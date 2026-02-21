import express from "express";
import "dotenv/config";
import cors from "cors";
import connnectDB from "./configs/db.js";
import userRotuer from "./routes/userRoutes.js";
import ownerRouter from "./routes/ownerRoutes.js";
import bookingRouter from "./routes/bookingRoutes.js";

const app = express();

// connect database
await connnectDB();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("server is running");
});
app.use("/api/user", userRotuer);
app.use("/api/owner", ownerRouter);
app.use("/api/bookings", bookingRouter);

app.listen(PORT, console.log(`app is listening on port ${PORT}`));
