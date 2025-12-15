import ServerlessHttp from "serverless-http";
import "dotenv";
import app from "./app.js";

export const handler = async (event, context) => {
  return ServerlessHttp(app)(event, context);
};
