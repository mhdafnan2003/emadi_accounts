import mongoose, { Document, Model } from 'mongoose'

export interface IUser {
    username: string
    password: string
    name: string
    role: 'admin' | 'user'
    createdAt?: Date
    updatedAt?: Date
}

export interface IUserDocument extends IUser, Document { }

const UserSchema = new mongoose.Schema<IUserDocument>({
    username: {
        type: String,
        required: [true, 'Username is required'],
        unique: true,
        trim: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
    },
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
    },
    role: {
        type: String,
        enum: ['admin', 'user'],
        default: 'user',
    },
}, {
    timestamps: true,
})

const User: Model<IUserDocument> =
    (mongoose.models.User as Model<IUserDocument>) ||
    mongoose.model<IUserDocument>('User', UserSchema)

export default User
