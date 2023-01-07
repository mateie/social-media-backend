import bcrypt from "bcryptjs";

import { v2 as cloudinary } from "cloudinary";

import Post from "#schemas/Post";
import User from "#schemas/User";
import { Request } from "express";
import Server from "#struct/Server";
import { GraphQLError } from "graphql";

export default {
    Query: {
        getUsers: async (_: any, __: any, { req, server: { auth } }: { req: Request, server: Server }) => {
            const user = auth.checkToken(req);
            return (await User.find().select("-password -email").lean()).filter(u => u.username !== user.username);
        },
        getUser: async (_: any, { username }: { username: string }) => {
            const user = await User.findOne({ username }).select("-password -email");
            if (!user) throw new Error("User not found");
            return user;
        },
        getRecentUsers: async () => {
            return await User.find().select("-password -email").sort({ createdAt: -1 }).limit(5);
        }
    },
    Mutation: {
        followUser: async (_: any, { username }: { username: string }, {
            req,
            server: { auth }
        }: { req: Request, server: Server }) => {
            const user = auth.checkToken(req);

            const userToFollow = await User.findOne({ username }).select("-password -email");
            const userWhoFollowed = await User.findOne({ username: user.username }).select("-password -email");

            if (!user) throw new GraphQLError("User not found");

            if (username === userWhoFollowed?.username) throw new GraphQLError("You cannot follow yourself");

            const follow = userToFollow?.followers.some(f => f.username === userWhoFollowed?.username) || userWhoFollowed?.following.some(f => f.username === userToFollow?.username);

            if (!follow) {
                userToFollow?.followers.push({
                    username: userWhoFollowed?.username ?? "",
                    createdAt: new Date().toISOString()
                });
                userWhoFollowed?.following.push({
                    username: userToFollow?.username ?? "",
                    createdAt: new Date().toISOString()
                });
            } else {
                if (!userToFollow || !userWhoFollowed) throw new GraphQLError("User not found");
                userToFollow.followers = userToFollow?.followers.filter(f => f.username !== userWhoFollowed?.username);
                userWhoFollowed.following = userWhoFollowed?.following.filter(f => f.username !== userToFollow?.username);
            }

            await userToFollow?.save();
            await userWhoFollowed?.save();

            return userToFollow;
        },
        warnUser: async (_: any, { username, reason }: { username: string; reason: string }, {
            req,
            server: { auth: { checkToken } }
        }: { req: Request, server: Server }) => {
            const auth = checkToken(req);

            if (auth.type !== "admin") throw new GraphQLError("Please check your permissions");

            const user = await User.findOne({ username });

            if (!user) throw new GraphQLError("User not found");
            if (user.username === auth.username) throw new GraphQLError("You cannot warn yourself");

            const warn = {
                by: auth.username,
                reason,
                createdAt: new Date().toISOString()
            };

            user.warns.push(warn);

            await user.save();

            return user;
        },
        updateUser: async (_: any, { newValues }: { newValues: any }, {
            req,
            server: { auth }
        }: { req: Request; server: Server }) => {
            const { username } = auth.checkToken(req);

            const user = await User.findOne({ username }).select("-password");
            if (!user) throw new GraphQLError("User not found");

            const keys = Object.keys(newValues);

            keys.forEach(key => {
                switch (key) {
                    case "bio":
                        user[key] = newValues[key];
                        break;
                }
            });

            await user.save();

            return user;

        },
        updateUserAvatar: async (_: any, { avatar }: { avatar: any }, {
            req,
            server: { auth }
        }: { req: Request; server: Server }) => {
            const { username } = auth.checkToken(req);

            const user = await User.findOne({ username }).select("-password");
            if (!user) throw new GraphQLError("User not found");

            try {
                const oldAvatars = await cloudinary.search
                    .expression(`folder=avatars/${user.username}`)
                    .execute();

                const oldAvatarIDs = [];

                for (let i = 1; i < oldAvatars.resources.length; i++) {
                    const avatar = oldAvatars.resources[i];
                    oldAvatarIDs.push(avatar.public_id);
                }

                if (oldAvatarIDs.length > 0) await cloudinary.api.delete_resources(oldAvatarIDs);

                const { createReadStream, mimetype } = await avatar;

                const avatarId = Math.random().toString(36).substring(7);
                const avatarType = mimetype.split("/")[1];

                const result: any = await new Promise((resolve, reject) => {
                    createReadStream(`avatar-${avatarId}.${avatarType}`).pipe(
                        cloudinary.uploader.upload_stream({
                            public_id: `avatars/${user.username}/avatar-${avatarId}`,
                            format: avatarType,
                            resource_type: "image"
                        }, (err, result) => {
                            if (err) reject(err);

                            resolve(result);
                        })
                    );
                });

                user.avatar = result.secure_url;

                await user.save();

                return user;
            } catch (err) {
                console.log(err);
            }
        },
        deleteUser: async (_: any, { username }: { username: string }, {
            req,
            server: { auth: { checkToken } }
        }: { req: Request, server: Server }) => {
            const auth = checkToken(req);

            if (auth.type !== "admin") throw new GraphQLError("Please check your permissions");
            const user = await User.findOne({ username });
            if (!user) throw new GraphQLError("User not found");
            if (user.type === "admin") throw new GraphQLError("You cannot delete an admin user");

            const posts = await Post.find();
            const users = await User.find();

            posts.filter(async post => {
                post.likes = post.likes.filter(like => like.username !== username);
                post.dislikes = post.dislikes.filter(dislike => dislike.username !== username);
                post.comments = post.comments.filter(comment => comment.username !== username);
                post.comments.filter(comment => {
                    comment.likes = comment.likes?.filter(like => like.username !== username);
                    comment.dislikes = comment.dislikes?.filter(dislike => dislike.username !== username);
                    comment.replies = comment.replies?.filter(reply => reply.username !== username);
                    comment.replies?.filter(reply => {
                        reply.likes = reply.likes?.filter(like => like.username !== username);
                        reply.dislikes = reply.dislikes?.filter(dislike => dislike.username !== username);

                        return reply;
                    });

                    return comment;
                });

                return await post.save();
            });

            await Post.deleteMany({ username });

            users.filter(async user => {
                user.followers = user.followers.filter(follower => follower.username !== username);
                user.following = user.following.filter(following => following.username !== username);

                return await user.save();
            });

            await User.deleteOne({ username });

            return "User Deleted";
        },
        authUser: async (_: any, { token }: { token: string }, { server: { auth } }: { server: Server }) => {
            return auth.authUser(token);
        },
        login: async (_: any, {
            username,
            password
        }: { username: string; password: string }, { server: { auth } }: { server: Server }) => {
            username = username.toLowerCase();
            // Validate user data

            const user = await User.findOne({ username }).lean();

            if (!user) throw new GraphQLError("User not found");

            const match = await bcrypt.compare(password, user.password);
            if (!match) throw new GraphQLError("Wrong username or password");

            const token = auth.generateToken(user);

            return token;
        },
        register: async (_: any, {
            registerInput: {
                username,
                email,
                password,
                confirmPassword
            }
        }: { registerInput: { username: string; email: string; password: string; confirmPassword: string } }, {
                             server: {
                                 auth
                             }
                         }: { server: Server }) => {
            // Validate user data
            username = username.toLowerCase();
            // Check if user exists
            const user = await User.findOne({ $or: [{ username }, { email }] });
            if (user) {
                if (username === user.username) throw new GraphQLError("Username is taken");
                if (email === user.email) throw new GraphQLError("Email is taken");
            }

            password = await bcrypt.hash(auth.crypt.encrypt(password), 12);

            const newUser = new User({
                email,
                username,
                password,
                createdAt: new Date().toISOString()
            });

            const res = await newUser.save();

            const token = auth.generateToken(res);

            return {
                ...res,
                id: res._id,
                token
            };
        }
    }
};