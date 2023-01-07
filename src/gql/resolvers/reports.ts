import { GraphQLError } from "graphql";
import { Request } from "express";

import Post from "#schemas/Post";
import User from "#schemas/User";
import Report from "#schemas/Report";
import Server from "#struct/Server";

export default {
    Query: {
        getUserReports: async (_: any, __: any, { req, server: { auth } }: { req: Request, server: Server }) => {
            const user = auth.checkToken(req);

            if (user.type !== "admin") throw new GraphQLError("Check your permissions");

            return await Report.find({ type: "user" }).lean();
        },
        getPostReports: async (_: any, __: any, { req, server: { auth } }: { req: Request; server: Server }) => {
            const user = auth.checkToken(req);

            if (user.type !== "admin") throw new GraphQLError("Check your permissions");

            return await Report.find({ type: "post" }).lean();
        },
        getCommentReports: async (_: any, __: any, { req, server: { auth } }: { req: Request, server: Server }) => {
            const user = auth.checkToken(req);

            if (user.type !== "admin") throw new GraphQLError("Check your permissions");

            return await Report.find({ type: "comment" }).lean();
        },
        getReplyReports: async (_: any, __: any, { req, server: { auth } }: { req: Request, server: Server }) => {
            const user = auth.checkToken(req);

            if (user.type !== "admin") throw new GraphQLError("Check your permissions");

            return await Report.find({ type: "reply" }).lean();
        }
    },
    Mutation: {
        reportUser: async (_: any, { username, reason }: { username: string; reason: string }, {
            req,
            server: { auth, util }
        }: { req: Request, server: Server }) => {
            const reportedBy = auth.checkToken(req);

            if (reason.trim() === "") throw new GraphQLError("Reason must be provided");

            if (reportedBy.username === username) throw new GraphQLError("You cannot report yourself");

            const who = await User.findOne({ username });

            if (!who) throw new GraphQLError("User not found");

            new Report({
                id: util.generateId("userReport", username),
                reason: reason.replace(/\s+/g, " ").trim(),
                by: reportedBy.username,
                username,
                type: "user",
                createdAt: new Date().toISOString()
            });

            return "User Reported";
        },
        reportPost: async (_: any, { postId, reason }: { postId: string; reason: string }, {
            req,
            server: { auth, util }
        }: { req: Request; server: Server }) => {
            const reportedBy = auth.checkToken(req);

            if (reason.trim() === "") throw new GraphQLError("Reason must be provided");

            const post = await Post.findOne({ id: postId });
            if (!post) throw new GraphQLError("Post not found");

            if (reportedBy.username === post.username) throw new GraphQLError("You cannot report your own post");

            new Report({
                id: util.generateId("postReport", post.username),
                reason: reason.replace(/\s+/g, " ").trim(),
                by: reportedBy.username,
                postId,
                type: "post",
                createdAt: new Date().toISOString()
            });

            return "Post Reported";
        },
        reportComment: async (_: any, { commentId, reason }: { commentId: string; reason: string }, {
            req,
            server: { auth, util }
        }: { req: Request; server: Server }) => {
            const reportedBy = auth.checkToken(req);

            if (reason.trim() === "") throw new GraphQLError("Reason must be provided");

            const posts = await Post.find();

            const post = posts.find(post => post.comments.find(c => c.id === commentId));

            if (!post) throw new GraphQLError("Post not found");

            const comment = post.comments.find(c => c.id === commentId);

            if (!comment) throw new GraphQLError("Comment not found");

            if (reportedBy.username === comment.username) throw new GraphQLError("You cannot report your own comment");

            new Report({
                id: util.generateId("commentReport", comment.username),
                reason: reason.replace(/\s+/g, " ").trim(),
                by: reportedBy.username,
                postId: post.id,
                commentId,
                type: "comment",
                createdAt: new Date().toISOString()
            });

            return "Comment Reported";

        },
        reportReply: async (_: any, { replyId, reason }: { replyId: string; reason: string }, {
            req,
            server: { auth, util }
        }: { req: Request, server: Server }) => {
            const reportedBy = auth.checkToken(req);

            if (reason.trim() === "") throw new GraphQLError("Reason must be provided");

            const posts = await Post.find();

            const post = posts.find(post => post.comments.find(comment => comment.replies?.find(r => r.id === replyId)));
            if (!post) throw new GraphQLError("Post not found");
            const comment = post.comments.find(comment => comment.replies?.find(r => r.id === replyId));
            if (!comment) throw new GraphQLError("Comment not found");
            if (!comment.replies) throw new GraphQLError("Something went wrong");

            const reply = comment.replies.find(r => r.id === replyId);
            if (!reply) throw new GraphQLError("Reply not found");

            if (reportedBy.username === reply.username) throw new GraphQLError("You cannot report your own reply");

            new Report({
                id: util.generateId("replyReport", reply.username),
                reason: reason.replace(/\s+/g, " ").trim(),
                by: reportedBy.username,
                postId: post.id,
                commentId: comment.id,
                replyId,
                type: "reply",
                createdAt: new Date().toISOString()
            });

            return "Reply Reported";
        }
    }
};