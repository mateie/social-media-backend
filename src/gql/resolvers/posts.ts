import { GraphQLError } from "graphql";

import { v2 as cloudinary } from "cloudinary";

import Post from "#schemas/Post";
import User from "#schemas/User";
import Notification from "#schemas/Notification";
import { Request } from "express";
import Server from "#struct/Server";
import { PubSub } from "graphql-subscriptions";


export default {
    Query: {
        getPosts: async () => {
            return await Post.find().sort();
        },
        getFreshPosts: async () => {
            return await Post.find().sort({ createdAt: -1 });
        },
        getFollowingPosts: async (_: any, { username }: { username: string }) => {
            const follower = await User.findOne({ username }).select("-password -email").lean();

            const following: any[] = [];
            follower?.following.forEach(follow => {
                following.push(follow.username);
            });

            return await Post.find({ username: following }).sort({ createdAt: -1 });
        },
        getUserPosts: async (_: any, { username }: { username: string }) => {
            return await Post.find({ username }).sort({ createdAt: -1 });
        },
        getSpotlightPosts: async () => {
            return await Post.find({ isSpotlight: true }).sort({ spotlightAt: -1 });
        },
        getPost: async (_: any, { postId }: { postId: string }) => {
            const post = await Post.findOne({ id: postId });
            if (!post) throw new GraphQLError("Post not found");
            return post;
        },
        getRanked: async () => {
            const posts = await Post.aggregate([
                {
                    $match:
                        { username: { $ne: "" } }
                }, //end $match
                {
                    $project:
                        {
                            item: "$$ROOT",
                            ranking: {
                                $divide: [
                                    {
                                        $add: [
                                            { $size: "$likes" },
                                            { $multiply: [{ $size: "$comments" }, 0.08] },
                                            { $multiply: [{ $add: [{ $size: "$likes" }, { $size: "$dislikes" }] }, 0.002] },
                                            0.75
                                        ]
                                    }, //end $add
                                    {
                                        $add: [
                                            1,
                                            {
                                                $subtract: [
                                                    {
                                                        $multiply: [ // this is a workaround for mongo version 3.0 (no $pow)
                                                            {
                                                                $multiply: [
                                                                    { $divide: [{ $subtract: [new Date(), new Date("$createdAt")] }, 14400000] },
                                                                    .4
                                                                ]
                                                            }, //end $multiply
                                                            {
                                                                $multiply: [
                                                                    { $divide: [{ $subtract: [new Date(), new Date("$createdAt")] }, 14400000] },
                                                                    .4
                                                                ]
                                                            } //end $multiply
                                                        ]
                                                    }, //end $multiply
                                                    {
                                                        $multiply: [ // this is a workaround for mongo version 3.0 (no $pow)
                                                            {
                                                                $multiply: [
                                                                    {
                                                                        $subtract: [
                                                                            { $divide: [{ $subtract: [new Date(), new Date("$createdAt")] }, 14400000] },
                                                                            { $divide: [{ $subtract: [new Date(), new Date("$lastInteraction")] }, 14400000] } // DONE: Changed to "lastInteraction" - Robert
                                                                        ]
                                                                    }, //end $subtract
                                                                    .3
                                                                ]
                                                            }, //end $multiply
                                                            {
                                                                $multiply: [
                                                                    {
                                                                        $subtract: [
                                                                            { $divide: [{ $subtract: [new Date(), new Date("$createdAt")] }, 14400000] },
                                                                            { $divide: [{ $subtract: [new Date(), new Date("$lastInteraction")] }, 14400000] } // DONE: Changed to "lastInteraction" - Robert
                                                                        ]
                                                                    }, //end $subtract
                                                                    .3
                                                                ]
                                                            } //end $multiply
                                                        ]
                                                    } //end $multiply
                                                ]
                                            } //end $subtract
                                        ]
                                    } //end $add
                                ]
                            } //end $divide
                        }
                }, //end $project
                { $sort: { ranking: 1 } },
                { $limit: 100 }
            ]);

            return posts.map(a => a.item);
        }
    },
    Mutation: {
        createPost: async (_: any, { media, body }: { media: any, body: string }, {
            req,
            server: { auth, util }
        }: { req: Request, server: Server }) => {
            const user = await auth.checkToken(req);

            if (!media) throw new GraphQLError("Image or a Video must be provided");

            const { createReadStream, mimetype } = await media;

            if (!mimetype.includes("video") && !mimetype.includes("image")) throw new GraphQLError("Image or a Video must be provided");

            const mediaId = Math.random().toString(36).substring(7);
            const mediaType = mimetype.split("/")[1] === "quicktime" ? "mov" : mimetype.split("/")[1];

            let result;

            const isVideo = mimetype.includes("video");

            if (!isVideo) {
                result = await new Promise((resolve, reject) => {
                    createReadStream(`${user.username}-${mediaId}.${mediaType}`).pipe(
                        cloudinary.uploader.upload_stream({
                            public_id: `posts/${user.username}-${mediaId}`,
                            format: mediaType
                        }, (err, result) => {
                            if (err) reject(err);

                            resolve(result);
                        })
                    );
                });
            } else {
                result = await new Promise((resolve, reject) => {
                    createReadStream(`${user.username}-${mediaId}.${mediaType}`).pipe(
                        cloudinary.uploader.upload_stream({
                            public_id: `posts/${user.username}-${mediaId}`,
                            format: mediaType,
                            resource_type: "video"
                        }, (err, result) => {
                            if (err) reject(err);

                            resolve(result);
                        })
                    );
                });
            }

            const newMedia = { path: (result as any).secure_url, isVideo };

            return new Post({
                id: util.generateId("post", user.username),
                body: body.replace(/\s+/g, " ").trim(),
                media: newMedia,
                user: user.id,
                username: user.username,
                isSpotlight: false,
                spotlightAt: "",
                createdAt: new Date().toISOString(),
                lastInteraction: new Date().toISOString(),
                views: 1
            });
        },
        deletePost: async (_: any, { postId }: { postId: string }, {
            req,
            server: { auth }
        }: { req: Request, server: Server }) => {
            const user = await auth.checkToken(req);

            const post = await Post.findOne({ id: postId });
            if (!post) throw new GraphQLError("Post not found");

            if (user.username === post.username || user.type === "admin") {
                const assetId = post.media.path.split("/").slice(7, post.media.path.length).join("/").split(".")[0];

                if (assetId) await cloudinary.api.delete_resources([assetId]);
                await post.delete();

                return "Post deleted successfully";
            } else throw new GraphQLError("Action not permitted");

        },
        likePost: async (_: any, { postId }: { postId: string }, {
            req,
            server: { auth, util },
            pubsub
        }: { req: Request, server: Server, pubsub: PubSub }) => {
            const { username } = auth.checkToken(req);

            const post = await Post.findOne({ id: postId });
            if (!post) throw new GraphQLError("Post not found");

            if (post.likes.find(like => like.username === username)) {
                // Post already liked, unlike it
                post.likes = post.likes.filter(like => like.username !== username);
            } else {
                // Not liked, like it
                post.likes.push({
                    username,
                    createdAt: new Date().toISOString()
                });
                //Notification
                if (post.username != username) {
                    const notification = new Notification({
                        id: util.generateId("notification", post.username),
                        body: `${username} liked your post`,
                        username: post.username,
                        createdAt: new Date().toISOString(),
                        type: "likedPost",
                        notifier: username,
                        reference: post.id
                    });

                    await pubsub.publish("NEW_NOTIFICATION", {
                        createNotification: notification
                    });
                }
            }
            post.lastInteraction = new Date().toISOString();

            await post.save();

            return post;
        },
        dislikePost: async (_: any, { postId }: { postId: string }, {
            req,
            server: { auth }
        }: { req: Request; server: Server }) => {
            const { username } = auth.checkToken(req);

            const post = await Post.findOne({ id: postId });
            if (!post) throw new GraphQLError("Post not found");

            if (post.dislikes.find(dislike => dislike.username === username)) {
                // Post already disliked, unlike it
                post.dislikes = post.dislikes.filter(dislike => dislike.username !== username);
            } else {
                // Not disliked, dislike it
                post.dislikes.push({
                    username,
                    createdAt: new Date().toISOString()
                });
            }
            post.lastInteraction = new Date().toISOString();
            await post.save();

            return post;
        },
        spotlightPost: async (_: any, { postId }: { postId: string }, {
            req,
            server: { auth }
        }: { req: Request, server: Server }) => {
            const user = auth.checkToken(req);

            if (user.type !== "admin") throw new GraphQLError("Please check your permissions");

            const post = await Post.findOne({ id: postId });
            if (!post) throw new GraphQLError("Post not found");
            const poster = await User.findOne({ username: post.username });
            if (!poster) throw new GraphQLError("User not found");

            if (!post.isSpotlight) {
                post.isSpotlight = true;
                post.spotlightAt = new Date().toISOString();
                poster.spotlight.unshift({
                    postId: post.id,
                    createdAt: post.createdAt
                });
            } else {
                post.isSpotlight = false;
                post.spotlightAt = "";
                poster.spotlight = poster.spotlight.filter(p => p.postId !== post.id);
            }

            await post.save();

            await poster.save();

            return post;
        }
    }
};