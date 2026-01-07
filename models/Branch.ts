import mongoose, { Document, Model } from 'mongoose'

export interface IBranch {
  branchName: string
  phoneNumber?: string
  address?: string
  createdAt?: Date
  updatedAt?: Date
}

export interface IBranchDocument extends IBranch, Document {}

function sanitizePhone(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  if (!trimmed) return undefined
  // Remove spaces, dashes, parentheses, etc. Keep leading + if present.
  const normalized = trimmed.replace(/[\s\-()]/g, '')
  return normalized
}

const BranchSchema = new mongoose.Schema<IBranchDocument>(
  {
    branchName: {
      type: String,
      required: [true, 'Branch name is required'],
      trim: true,
    },
    phoneNumber: {
      type: String,
      trim: true,
      set: sanitizePhone,
    },
    address: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
)

const Branch: Model<IBranchDocument> =
  mongoose.models.Branch || mongoose.model<IBranchDocument>('Branch', BranchSchema)

export default Branch
