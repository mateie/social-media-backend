import { GraphQLError } from "graphql";

import Post from "#schemas/Post";
import Notification from "#schemas/Notification";
import Server from "#struct/Server";
import { Request } from "express";
import { PubSub } from "graphql-subscriptions";

export default {
    Mutation: {
        createComment: async (_: any, { postId, body }: { postId: string; body: string; }, {
            server: { auth, util },
            req,
            pubsub
        }: { server: Server, req: Request, pubsub: PubSub }) => {
            const { username } = auth.checkToken(req);

            if (body.trim() === "") throw new GraphQLError("Empty comment");

            const post = await Post.findOne({ id: postId });

            if (!post) throw new GraphQLError("Post not found");

            const comment = {
                id: util.generateId("comment", username),
                body,
                username,
                createdAt: new Date().toISOString(),
                lastInteraction: new Date().toISOString()
            };

            post.lastInteraction = new Date().toISOString();

            post.comments.unshift(comment);

            await post.save();

            // Notification
            if (post.username != username) {
                const notification = new Notification({
                    id: util.generateId("notification", post.username),
                    body: `${username} commented on your post`,
                    username: post.username,
                    createdAt: new Date().toISOString(),
                    type: "postComment",
                    notifier: username,
                    reference: post.id
                });

                await pubsub.publish("NEW_NOTIFICATION", {
                    createNotification: notification
                });
            }

            return comment;
        },
        likeComment: async (_: any, { postId, commentId }: { postId: string; commentId: string }, {
            server: { auth, util },
            req,
            pubsub
        }: { server: Server, req: Request, pubsub: PubSub }) => {
            const { username } = auth.checkToken(req);

            const post = await Post.findOne({ id: postId });

            if (!post) throw new GraphQLError("Post not found");

            const comment = post.comments.find(c => c.id === commentId);
            if (!comment) throw new GraphQLError("Comment not found");
            if (!comment.likes) throw new GraphQLError("Something went wrong, try again");

            if (comment.likes.find(like => like.username === username)) {
                // Comment is already liked, unlike it.
                comment.likes = comment.likes.filter(like => like.username !== username);
            } else {
                // Comment is not liked, like it
                comment.likes.push({
                    username,
                    createdAt: new Date().toISOString()
                });
                //Notification
                if (comment.username != username) {
                    const notification = new Notification({
                        id: util.generateId("notification", comment.username),
                        body: `${username} liked your comment: ${comment.body}`,
                        username: comment.username,
                        createdAt: new Date().toISOString(),
                        type: "likedComment",
                        notifier: username,
                        reference: post.id
                    });

                    await pubsub.publish("NEW_NOTIFICATION", {
                        createNotification: notification
                    });
                }
            }

            post.lastInteraction = new Date().toISOString();
            comment.lastInteraction = new Date().toISOString();

            await post.save();

            return comment;
        },
        dislikeComment: async (_: any, { postId, commentId }: { postId: string; commentId: string }, {
            server: { auth },
            req
        }: { server: Server; req: Request }) => {
            const { username } = auth.checkToken(req);

            const post = await Post.findOne({ id: postId });
            if (!post) throw new GraphQLError("Post not found");
            const comment = post.comments.find(c => c.id === commentId);
            if (!comment) throw new GraphQLError("Comment not found");
            if (!comment.dislikes) throw new GraphQLError("Something went wrong, try again");

            if (comment.dislikes.find(dislike => dislike.username === username)) {
                // Comment is already disliked it, like it
                comment.dislikes = comment.dislikes.filter(dislike => dislike.username !== username);
            } else {
                // Comment is not disliked, dislike it
                comment.dislikes.push({
                    username,
                    createdAt: new Date().toISOString()
                });
            }

            post.lastInteraction = new Date().toISOString();
            comment.lastInteraction = new Date().toISOString();

            await post.save();

            return comment;

        },
        deleteComment: async (_: any, { postId, commentId }: { postId: string; commentId: string }, {
            server: { auth },
            req
        }: { server: Server, req: Request }) => {
            const { username } = auth.checkToken(req);

            const post = await Post.findOne({ id: postId });
            if (!post) throw new GraphQLError("Post not found");
            const commentIndex = post.comments.findIndex(c => c.id === commentId);

            if (!post.comments[commentIndex].username === username) throw new GraphQLError("You can't delete this comment");

            post.comments.splice(commentIndex, 1);
            await post.save();

            return post;
        }
    }
};