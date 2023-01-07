import { model, Schema } from "mongoose";
import { IInfo } from "../@types";

export interface IPost {
    id: string;
    body: string;
    username: string;
    media: { path: string; isVideo: boolean };
    isVideo: boolean;
    isSpotlight: boolean;
    spotlightAt: string;
    createdAt: string;
    comments: {
        id: string;
        body: string;
        username: string;
        createdAt: string;
        lastInteraction: string;
        likes?: IInfo[];
        dislikes?: IInfo[];
        replies?: {
            id: string;
            body: string;
            username: string;
            to: string;
            createdAt: string;
            lastInteraction: string;
            likes?: IInfo[];
            dislikes?: IInfo[];
        }[],
    }[];
    likes: IInfo[];
    dislikes: IInfo[];
    lastInteraction: string;
}

export const Post = new Schema<IPost>({
    id: String,
    body: String,
    username: String,
    media: Object,
    isVideo: {
        type: Boolean
    },
    isSpotlight: Boolean,
    spotlightAt: String,
    createdAt: String,
    comments: [
        {
            id: String,
            body: String,
            username: String,
            createdAt: String,
            lastInteraction: String,
            likes: [
                {
                    username: String,
                    createdAt: String
                }
            ],
            dislikes: [
                {
                    username: String,
                    createdAt: String
                }
            ],
            replies: [
                {
                    id: String,
                    body: String,
                    username: String,
                    to: String,
                    createdAt: String,
                    lastInteraction: String,
                    likes: [
                        {
                            username: String,
                            createdAt: String
                        }
                    ],
                    dislikes: [
                        {
                            username: String,
                            createdAt: String
                        }
                    ]
                }
            ]
        }
    ],
    likes: [
        {
            username: String,
            createdAt: String
        }
    ],
    dislikes: [
        {
            username: String,
            createdAt: String
        }
    ],
    lastInteraction: String
});

export default model<IPost>("post", Post);