import { model, Schema } from 'mongoose';

export interface IReport {
    id: string;
    reason: string;
    by: string;
    username: string;
    postId: string;
    commentId: string;
    replyId: string;
    type: string;
    createdAt: string;
}

export const Report = new Schema<IReport>({
    id: String,
    reason: String,
    by: String,
    username: String,
    postId: String,
    commentId: String,
    replyId: String,
    type: String,
    createdAt: String,
});

export default model<IReport>('report', Report);