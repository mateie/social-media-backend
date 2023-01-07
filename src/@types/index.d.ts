export interface IInfo {
    username: string;
    createdAt: string;
}

export type GenerateIdType =
    "post"
    | "comment"
    | "reply"
    | "userReport"
    | "postReport"
    | "commentReport"
    | "replyReport"
    | "notification";