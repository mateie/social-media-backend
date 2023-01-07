import usersResolvers from "./users";
import postsResolvers from "./posts";
import commentsResolvers from "./comments";
import repliesResolvers from "./replies";
import reportsResolvers from "./reports";
import notificationsResolvers from "./notifications";

import User from "#schemas/User";
import Post from "#schemas/Post";

export default {
    User: {
        posts: async (parent: any) => {
            const userPosts = await Post.find({ username: parent.username }).sort({ createdAt: -1 });

            return parent.posts = userPosts;
        },
        followers: async (parent: any) => {
            const userData = await User.findOne({ username: parent.username }).select("-password -email");
            return userData?.followers
                .sort((a, b) => {
                    const aCAt = new Date(a.createdAt) as any;
                    const bCAt = new Date(b.createdAt) as any;
                    return bCAt - aCAt;
                });
        },
        following: async (parent: any) => {
            const userData = await User.findOne({ username: parent.username }).select("-password -email");

            return userData?.following.sort((a, b) => {
                const aCAt = new Date(a.createdAt) as any;
                const bCAt = new Date(b.createdAt) as any;
                return bCAt - aCAt;
            });
        },
        followerCount: (parent: any) => parent.followers.length,
        followingCount: (parent: any) => parent.following.length,
        warnCount: (parent: any) => parent.warns.length
    },
    Follow: {
        user: async (parent: any) => {
            const userData = await User.findOne({ username: parent.username }).select("-password -email");

            return parent.user = userData;
        }
    },
    Post: {
        likeCount: (parent: any) => parent.likes.length,
        dislikeCount: (parent: any) => parent.dislikes.length,
        commentCount: (parent: any) => parent.comments.length,
        poster: async (parent: any) => {
            const userData = await User.findOne({ username: parent.username }).select("-password -email");

            return parent.poster = userData;
        }
    },
    Like: {
        liker: async (parent: any) => {
            const userData = await User.findOne({ username: parent.username }).select("-password -email");

            return parent.liker = userData;
        }
    },
    Dislike: {
        disliker: async (parent: any) => {
            const userData = await User.findOne({ username: parent.username }).select("-password -email");

            return parent.disliker = userData;
        }
    },
    Comment: {
        commenter: async (parent: any) => {
            const userData = await User.findOne({ username: parent.username }).select("-password -email");

            return parent.commenter = userData;
        },
        likeCount: (parent: any) => parent.likes.length,
        dislikeCount: (parent: any) => parent.dislikes.length,
        replyCount: (parent: any) => parent.replies.length
    },
    Reply: {
        replier: async (parent: any) => {
            const userData = await User.findOne({ username: parent.username }).select("-password -email");

            return parent.replier = userData;
        },
        to: async (parent: any) => {
            const userData = await User.findOne({ username: parent.to }).select("-password -email");

            return parent.to = userData;
        },
        likeCount: (parent: any) => parent.likes.length,
        dislikeCount: (parent: any) => parent.dislikes.length
    },
    UserReport: {
        user: async (parent: any) => {
            const userData = await User.findOne({ username: parent.username }).select("-password -email");

            return parent.user = userData;
        }
    },
    PostReport: {
        post: async (parent: any) => {
            const postData = await Post.findOne({ id: parent.postId });

            return parent.post = postData;
        }
    },
    CommentReport: {
        comment: async (parent: any) => {
            const postData = await Post.findOne({ id: parent.postId });
            const commentData = await postData?.comments.find(c => c.id === parent.commentId);

            return parent.comment = commentData;
        }
    },
    ReplyReport: {
        reply: async (parent: any) => {
            const postData = await Post.findOne({ id: parent.postId });
            const commentData = postData?.comments.find(c => c.id === parent.commentId);
            const replyData = commentData?.replies?.find(r => r.id === parent.replyId);

            return parent.reply = replyData;
        }
    },
    Notification: {
        user: async (parent: any) => {
            const userData = await Post.findOne({ username: parent.username });

            return parent.user = userData;
        }
    },
    Query: {
        ...usersResolvers.Query,
        ...postsResolvers.Query,
        ...reportsResolvers.Query,
        ...notificationsResolvers.Query
    },
    Mutation: {
        ...usersResolvers.Mutation,
        ...postsResolvers.Mutation,
        ...commentsResolvers.Mutation,
        ...repliesResolvers.Mutation,
        ...reportsResolvers.Mutation,
        ...notificationsResolvers.Mutation
    },
    Subscription: {
        ...notificationsResolvers.Subscription
    }
};