import mongoose, { Document, Model } from 'mongoose'

export type PurchaseSaleTransactionType = 'purchase' | 'sale' | 'expense'

export interface IPurchaseSaleTransaction {
  purchaseSaleId: mongoose.Types.ObjectId
  type: PurchaseSaleTransactionType
  date: Date
  amount: number
  tins?: number
  category?: string
  description?: string
  createdAt?: Date
  updatedAt?: Date
}

export interface IPurchaseSaleTransactionDocument extends IPurchaseSaleTransaction, Document {}

const PurchaseSaleTransactionSchema = new mongoose.Schema<IPurchaseSaleTransactionDocument>({
  purchaseSaleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PurchaseSale',
    required: [true, 'PurchaseSale is required'],
    index: true,
  },
  type: {
    type: String,
    enum: ['purchase', 'sale', 'expense'],
    required: [true, 'Transaction type is required'],
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
    default: Date.now,
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount must be positive'],
  },
  tins: {
    type: Number,
    min: [0, 'Tins must be positive'],
  },
  category: {
    type: String,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
}, {
  timestamps: true,
})

const PurchaseSaleTransaction: Model<IPurchaseSaleTransactionDocument> =
  (mongoose.models.PurchaseSaleTransaction as Model<IPurchaseSaleTransactionDocument>) ||
  mongoose.model<IPurchaseSaleTransactionDocument>('PurchaseSaleTransaction', PurchaseSaleTransactionSchema)

export default PurchaseSaleTransaction
