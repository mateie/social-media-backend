import { GraphQLError } from "graphql";

import Post from "#schemas/Post";
import Notification from "#schemas/Notification";
import { Request } from "express";
import Server from "#struct/Server";
import { PubSub } from "graphql-subscriptions";


export default {
    Mutation: {
        createReply: async (_: any, { postId, commentId, body }: { postId: string; commentId: string; body: string }, {
            req,
            server: { auth, util },
            pubsub
        }: { req: Request, server: Server, pubsub: PubSub }) => {
            const { username } = auth.checkToken(req);

            if (body.trim() === "") throw new GraphQLError("Empty comment");

            const post = await Post.findOne({ id: postId });
            if (!post) throw new GraphQLError("Post not found");
            const comment = post.comments.find(c => c.id === commentId);
            if (!comment) throw new GraphQLError("Comment not found");
            const reply = {
                id: util.generateId("reply", username),
                body,
                username,
                to: comment.username,
                createdAt: new Date().toISOString(),
                lastInteraction: new Date().toISOString()
            };

            comment.lastInteraction = new Date().toISOString();
            post.lastInteraction = new Date().toISOString();

            if (!comment.replies) throw new GraphQLError("Something went from, please try again");

            comment.replies.unshift(reply);

            //Notification
            if (comment.username != username) {
                const notification = new Notification({
                    id: util.generateId("notification", comment.username),
                    body: `${username} replied to your comment: ${body}`,
                    username: comment.username,
                    createdAt: new Date().toISOString(),
                    type: "repliedComment",
                    notifier: username,
                    reference: post.id
                });

                await pubsub.publish("NEW_: anyNOTIFICATION", {
                    createNotification: notification
                });
            }

            await post.save();

            return reply;
        },
        likeReply: async (_: any, {
            postId,
            commentId,
            replyId,
            body
        }: { postId: string; commentId: string; replyId: string, body: string }, {
                              req,
                              server: { auth, util },
                              pubsub
                          }: { req: Request, server: Server, pubsub: PubSub }) => {
            const { username } = auth.checkToken(req);

            const post = await Post.findOne({ id: postId });
            if (!post) throw new GraphQLError("Post not found");

            const comment = post.comments.find(c => c.id === commentId);
            if (!comment) throw new GraphQLError("Comment not found");
            const reply = comment.replies?.find(r => r.id === replyId);
            if (!reply) throw new GraphQLError("Reply not found");
            if (!reply.likes) throw new GraphQLError("Something went wrong, try again");
            if (reply.likes.find(like => like.username === username)) {
                // Reply is already liked, unlike it
                reply.likes = reply.likes.filter(like => like.username !== username);
            } else {
                // Reply is not liked, like it
                reply.likes.push({
                    username,
                    createdAt: new Date().toISOString()
                });
                //Notification
                if (reply.username != username) {
                    const notification = new Notification({
                        id: util.generateId("notification", reply.username),
                        body: `${username} liked your comment: ${body}`,
                        username: reply.username,
                        createdAt: new Date().toISOString(),
                        type: "likedComment",
                        notifier: username,
                        reference: post.id
                    });

                    await pubsub.publish("NEW_: anyNOTIFICATION", {
                        createNotification: notification
                    });
                }
            }

            post.lastInteraction = new Date().toISOString();
            reply.lastInteraction = new Date().toISOString();

            await post.save();

            return reply;
        },
        dislikeReply: async (_: any, {
            postId,
            commentId,
            replyId
        }: { postId: string; commentId: string; replyId: string }, {
                                 req,
                                 server: { auth }
                             }: { req: Request, server: Server }) => {
            const { username } = auth.checkToken(req);

            const post = await Post.findOne({ id: postId });
            if (!post) throw new GraphQLError("Post not found");

            const comment = post.comments.find(c => c.id === commentId);
            if (!comment) throw new GraphQLError("Comment not found");
            if (!comment.replies) throw new GraphQLError("Something went wrong, try again");
            const reply = comment.replies.find(r => r.id === replyId);
            if (!reply) throw new GraphQLError("Reply not found");
            if (!reply.dislikes) throw new GraphQLError("Something went wrong, try again");

            if (reply.dislikes.find(dislike => dislike.username === username)) {
                // Reply is already liked, unlike it
                reply.dislikes = reply.dislikes.filter(dislike => dislike.username !== username);
            } else {
                // Reply is not liked, like it
                reply.dislikes.push({
                    username,
                    createdAt: new Date().toISOString()
                });
            }

            post.lastInteraction = new Date().toISOString();
            reply.lastInteraction = new Date().toISOString();

            await post.save();

            return reply;
        },
        deleteReply: async (_: any, {
            postId,
            commentId,
            replyId
        }: { postId: string; commentId: string; replyId: string }, {
                                req,
                                server: { auth }
                            }: { req: Request; server: Server }) => {
            const { username } = auth.checkToken(req);

            const post = await Post.findOne({ id: postId });
            if (!post) throw new GraphQLError("Post not found");

            const comment = post.comments.find(c => c.id === commentId);
            if (!comment) throw new GraphQLError("Comment not found");
            if (!comment.replies) throw new GraphQLError("Something went wrong, try again");
            const replyIndex = comment.replies.findIndex(r => r.id === replyId);

            if (comment.replies[replyIndex].username === username) {
                comment.replies.splice(replyIndex, 1);

                await post.save();

                return post;
            } else throw new GraphQLError("Action not permitted");
        }
    }
};