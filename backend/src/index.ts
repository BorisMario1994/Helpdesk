import express, { Express } from "express";
import dotenv from "dotenv";
import userRouter from "./routes/UserRoutes";
import bagianMasterRouter from "./routes/BagianMasterRoutes";
import orderMasterRouter from "./routes/OrderMasterRoutes";
import hardwareMasterRouter from "./routes/HardwareMasterRoutes";
import assetMasterRouter from "./routes/AssetMasterRoutes";
import bpMasterRouter from "./routes/BPMasterRoutes";
import helpdeskRouter from "./routes/HelpdeskRoutes";
import bpbRouter from "./routes/BpbRoutes";
import masterMasalahPKPRouter from "./routes/MasterMasalahPKPRoutes";
import authenticationRoutes from "./routes/AuthenticationRoutes";
import { authenticator } from "./middleware/authenticator";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import cors from "cors";
import compression from "compression";
import helmet from "helmet";
import prisma from "./PrismaConnection";

dotenv.config();

const port = process.env.PORT || 81;
const app: Express = express();

// Attach all required library as middleware. 
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());
app.use(morgan('tiny'));
app.use(cors({ origin: "http://192.168.52.27", credentials: true }));
app.use(compression());
app.use(helmet());

// Integrating all available routes to the app, and attach an authenticator as middleware to authorize every received request. 
app.use("/api-hock-helpdesk/auth", authenticationRoutes);
app.use(authenticator);
app.use("/api-hock-helpdesk/users", userRouter);
app.use("/api-hock-helpdesk/aktiva-master", assetMasterRouter);
app.use("/api-hock-helpdesk/bagian-master", bagianMasterRouter);
app.use("/api-hock-helpdesk/bp-master", bpMasterRouter);
app.use("/api-hock-helpdesk/order-master", orderMasterRouter);
app.use("/api-hock-helpdesk/hardware-master", hardwareMasterRouter);
app.use("/api-hock-helpdesk/helpdesk", helpdeskRouter);
app.use("/api-hock-helpdesk/bpb", bpbRouter);
app.use("/api-hock-helpdesk/pkp/master-masalah", masterMasalahPKPRouter);

// Starting the server. 
const server = app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});

// Disconnect prisma from database to free up connection pool. 
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  server.close(() => {
    console.log('Server closed and DB disconnected.');
    process.exit(0);
  });
});
