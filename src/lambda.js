import ServerlessHttp from "serverless-http";
import "dotenv";
import app from "./app.js";

const serverlessHandler = ServerlessHttp(app, {
  binary: ['multipart/form-data', 'image/*', 'application/octet-stream']
});

export const handler = async (event, context) => {
  return serverlessHandler(event, context);
};
