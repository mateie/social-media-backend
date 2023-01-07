import { PubSub } from "graphql-subscriptions";
import Server from "#struct/Server";
import { Request } from "express";
import { GraphQLError } from "graphql";

import Notification from "#schemas/Notification";

export default {
    Query: {
        getNotifications: async (_: any, { username }: { username: string }, {
            server: { auth },
            req
        }: { server: Server, req: Request }) => {
            const user = auth.checkToken(req);

            if (user.username == username) {
                return await Notification.find({ username }).limit(100).sort({ createdAt: -1 }).limit(100);
            } else throw new GraphQLError("Queried username does not match your authenticated username");
        }
    },
    Mutation: {
        createNotification: async (_: any, {
            username,
            body,
            type,
            reference
        }: { username: string; body: string; type: string; reference: string; }, {
                                       server: { auth, util },
                                       req,
                                       pubsub
                                   }: { server: Server, req: Request, pubsub: PubSub }) => {
            const user = auth.checkToken(req);

            return new Notification({
                id: util.generateId("notification", username),
                body,
                username,
                createdAt: new Date().toISOString(),
                type,
                notifier: user.username,
                reference
            });
        }
    },
    Subscription: {
        createNotification: {
            subscribe: (_: any, __: any, { pubsub }: { pubsub: PubSub }) => {
                return pubsub.asyncIterator(`NEW_NOTIFICATION`);
            }
        }
    }
};