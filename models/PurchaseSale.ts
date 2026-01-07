import mongoose, { Document, Model } from 'mongoose'

export interface IPurchaseSale {
  date: Date
  vehicleId: string
  vehicleName?: string
  vehicleNumber?: string
  branchId?: mongoose.Types.ObjectId
  openingBalance: number
  currentBalance?: number
  currentTins?: number
  completed?: boolean
  completedAt?: Date
  openingExpenseId?: mongoose.Types.ObjectId
  collectionExpenseId?: mongoose.Types.ObjectId
  createdAt?: Date
  updatedAt?: Date
}

export interface IPurchaseSaleDocument extends IPurchaseSale, Document {}

const PurchaseSaleSchema = new mongoose.Schema<IPurchaseSaleDocument>({
  date: {
    type: Date,
    required: [true, 'Date is required'],
    default: Date.now,
  },
  vehicleId: {
    type: String,
    required: [true, 'Vehicle is required'],
    trim: true,
  },
  vehicleName: {
    type: String,
    trim: true,
  },
  vehicleNumber: {
    type: String,
    trim: true,
  },
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
  },
  openingBalance: {
    type: Number,
    required: [true, 'Opening balance is required'],
    min: [0, 'Opening balance must be positive'],
  },
  // currentBalance: {
  //   type: Number,
  //   min: [0, 'Current balance must be positive'],
  //   default: function (this: IPurchaseSaleDocument) {
  //     return this.openingBalance
  //   },
  // },
  currentTins: {
    type: Number,
    min: [0, 'Current tins must be positive'],
    default: 0,
  },
  completed: {
    type: Boolean,
    default: false,
  },
  completedAt: {
    type: Date,
  },
  openingExpenseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Expense',
  },
  collectionExpenseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Expense',
  },
}, {
  timestamps: true,
})

// In Next.js dev (with hot reload), Mongoose can keep an old compiled model
// that doesn't include newly added fields (e.g., branchId). If that happens,
// unknown fields will be stripped due to strict schemas.
const ExistingPurchaseSaleModel = mongoose.models.PurchaseSale as Model<IPurchaseSaleDocument> | undefined
if (
  ExistingPurchaseSaleModel &&
  (
    !ExistingPurchaseSaleModel.schema.path('branchId') ||
    !ExistingPurchaseSaleModel.schema.path('currentBalance') ||
    !ExistingPurchaseSaleModel.schema.path('currentTins') ||
    !ExistingPurchaseSaleModel.schema.path('completed') ||
    !ExistingPurchaseSaleModel.schema.path('openingExpenseId') ||
    !ExistingPurchaseSaleModel.schema.path('collectionExpenseId')
  )
) {
  delete mongoose.models.PurchaseSale
}

const PurchaseSale: Model<IPurchaseSaleDocument> =
  (mongoose.models.PurchaseSale as Model<IPurchaseSaleDocument>) ||
  mongoose.model<IPurchaseSaleDocument>('PurchaseSale', PurchaseSaleSchema)

export default PurchaseSale
