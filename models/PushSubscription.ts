import mongoose, { Schema, Document } from 'mongoose';

export interface IPushSubscription extends Document {
    userId: string;
    subscription: {
        endpoint: string;
        keys: {
            p256dh: string;
            auth: string;
        };
    };
    deviceInfo?: string;
    createdAt: Date;
    updatedAt: Date;
}

const PushSubscriptionSchema = new Schema<IPushSubscription>(
    {
        userId: { type: String, required: true, index: true },
        subscription: {
            endpoint: { type: String, required: true },
            keys: {
                p256dh: { type: String, required: true },
                auth: { type: String, required: true },
            },
        },
        deviceInfo: { type: String },
    },
    {
        timestamps: true,
    }
);

// Ensure a user can have multiple device subscriptions, but avoid exact duplicates
PushSubscriptionSchema.index({ userId: 1, "subscription.endpoint": 1 }, { unique: true });

export default mongoose.models.PushSubscription || mongoose.model<IPushSubscription>('PushSubscription', PushSubscriptionSchema);
