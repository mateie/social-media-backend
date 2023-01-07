import * as dotenv from 'dotenv';

dotenv.config();

import Server from "./struct/Server";

const server = new Server();

server.init();