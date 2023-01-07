import { ApolloServer } from "@apollo/server";
import { PubSub } from "graphql-subscriptions";
import { expressMiddleware } from "@apollo/server/express4";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { rateLimitDirective } from "graphql-rate-limit-directive";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import cors from "cors";
import mongoose from "mongoose";

import express from "express";
import helmet from "helmet";
import http from "http";
import bodyParser from "body-parser";

import typeDefs from "../gql/typeDefs";
import resolvers from "../gql/resolvers";
import * as process from "process";
import Auth from "./Auth";
import Util from "#struct/Util";

const app = express();
app.use(helmet());

const pubsub = new PubSub();

const httpServer = http.createServer(app);

const { rateLimitDirectiveTypeDefs, rateLimitDirectiveTransformer } = rateLimitDirective();

let schema = makeExecutableSchema({
    typeDefs: [rateLimitDirectiveTypeDefs, typeDefs],
    resolvers
});

schema = rateLimitDirectiveTransformer(schema);

export default class Server extends ApolloServer {
    readonly auth: Auth;
    readonly util: Util;

    constructor() {
        super({
            schema,
            csrfPrevention: true,
            plugins: [ApolloServerPluginDrainHttpServer({ httpServer })]
        });

        this.auth = new Auth();
        this.util = new Util();
    }


    async init() {
        await this.start();

        app.use(
            "/",
            bodyParser.json(),
            cors<cors.CorsRequest>(),
            expressMiddleware(this, {
                context: async ({ req }) => ({
                    req,
                    pubsub,
                    server: this
                })
            })
        );

        httpServer.listen({ port: process.env.PORT });

        console.log(`Server ready at port: ${process.env.PORT}`);

        mongoose.connect(process.env.DB as string).then(() => console.log("Connected to the database")).catch(console.error);
    }
}