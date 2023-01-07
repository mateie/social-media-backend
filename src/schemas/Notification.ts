import { model, Schema } from 'mongoose';

export interface INotification {
    id: string;
    body: string;
    username: string;
    createdAt: string;
    type: string;
    notifier: string;
    reference: string;
}

export const Notification = new Schema<INotification>({
    id: String,
    body: String,
    username: String,
    createdAt: String,
    type: String,
    notifier: String,
    reference: String,
});

export default model<INotification>('notification', Notification);