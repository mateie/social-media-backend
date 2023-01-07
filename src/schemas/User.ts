import { model, Schema } from 'mongoose';
import { IInfo } from "../@types";

export interface IUser {
    username: string;
    password: string;
    email: string;
    bio: string;
    type: string;
    displayName: string;
    avatar: string;
    followers: IInfo[];
    following: IInfo[];
    warns: {
        by: string;
        reason: string;
        createdAt: string;
    }[];
    createdAt: string;
    isPremium: boolean;
    isBanned: boolean;
    banDuration: string;
    lastIP: string;
    lastActivity: string;
    badges: {
        badge: string;
        dateEarned: string;
    }[];
    currentBadge: string;
    spotlight: {
        postId: string;
        createdAt: string;
    }[];
    nameBadge: string;
    nameColor: string;
}

export const User = new Schema<IUser>({
    username: String,
    password: String,
    email: String,
    bio: {
        type: String,
        default: '',
    },
    type: {
        type: String,
        default: 'user',
    },
    displayName: {
        type: String,
        default: null,
    },
    avatar: {
        type: String,
        default: null,
    },
    followers: [
        {
            username: String,
            createdAt: String,
        }
    ],
    following: [
        {
            username: String,
            createdAt: String,
        }
    ],
    warns: [
        {
            by: String,
            reason: String,
            createdAt: String,
        }
    ],
    createdAt: String,
    isPremium: {
        type: Boolean,
        default: false,
    },
    isBanned: {
        type: Boolean,
        default: false,
    },
    banDuration: String,
    lastIP: String,
    lastActivity: String,
    badges: [
        {
            badge: String,
            dateEarned: String,
        }
    ],
    currentBadge: String,
    spotlight: [
        {
            postId: String,
            createdAt: String,
        }
    ],
    nameBadge: String,
    nameColor: String,
});

User.pre('save', function (next) {
    if (!this.displayName) {
        this.displayName = this.username ?? '';
    }

    next();
});

export default model<IUser>('user', User);