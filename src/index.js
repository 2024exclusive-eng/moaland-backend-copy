import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.staging' });
import { createServer } from 'http';
import app from './app.js'; // env import 하단에 작성

const server = createServer(app);
server.listen(3000);
console.log('=== 서버실행 ===');
