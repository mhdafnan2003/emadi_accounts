import mongoose, { Document, Model } from 'mongoose'

export interface IExpense {
  title: string
  amount: number
  category: string
  description?: string
  date: Date
  branchId?: mongoose.Types.ObjectId
  vehicleId?: string
  vehicleName?: string
  tripId?: string
  tripName?: string
  expenseType?: 'investment' | 'revenue' | 'other'
  createdAt?: Date
  updatedAt?: Date
}

export interface IExpenseDocument extends IExpense, Document {}

const ExpenseSchema = new mongoose.Schema<IExpenseDocument>({
  title: {
    type: String,
    required: [true, 'Expense title is required'],
    trim: true,
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount must be positive'],
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
    default: Date.now,
  },
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
  },
  vehicleId: {
    type: String,
    trim: true,
  },
  vehicleName: {
    type: String,
    trim: true,
  },
  tripId: {
    type: String,
    trim: true,
  },
  tripName: {
    type: String,
    trim: true,
  },
  expenseType: {
    type: String,
    enum: ['investment', 'revenue', 'other'],
    default: 'other',
  },
}, {
  timestamps: true,
})

// In Next.js dev (with hot reload), Mongoose can keep an old compiled model
// that doesn't include newly added fields (e.g., branchId). If that happens,
// unknown fields will be stripped due to strict schemas.
const ExistingExpenseModel = mongoose.models.Expense as Model<IExpenseDocument> | undefined
if (ExistingExpenseModel && !ExistingExpenseModel.schema.path('branchId')) {
  delete mongoose.models.Expense
}

const Expense: Model<IExpenseDocument> =
  (mongoose.models.Expense as Model<IExpenseDocument>) || mongoose.model<IExpenseDocument>('Expense', ExpenseSchema)

export default Expense