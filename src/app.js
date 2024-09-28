import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import cors from "cors";
import authMiddleware from "./middlewares/auth.js";
import clientErrorHandler from "./middlewares/clientErrorHandler.js";
import errorHandler from "./middlewares/errorHandler.js";
import routes from "./routes/index.js";
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());
app.use(morgan("short"));

app.use(authMiddleware);
app.use(routes);
app.use(clientErrorHandler);
app.use(errorHandler);


export default app;
