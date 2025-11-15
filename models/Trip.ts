import mongoose, { Document, Model } from 'mongoose'

export interface ITrip {
  vehicleId: string
  vehicleName: string
  vehicleNumber: string
  tripName: string
  startDate: Date
  endDate?: Date
  status: 'Active' | 'Completed'
  totalPurchases: number
  totalSales: number
  totalPurchaseLitres: number
  totalSalesLitres: number
  profitLoss: number
  isProfitable: boolean
  hasReachedBreakeven: boolean
  createdAt?: Date
  updatedAt?: Date
}

export interface ITripDocument extends ITrip, Document {}

const TripSchema = new mongoose.Schema<ITripDocument>({
  vehicleId: {
    type: String,
    required: [true, 'Vehicle ID is required'],
    trim: true,
  },
  vehicleName: {
    type: String,
    required: [true, 'Vehicle name is required'],
    trim: true,
  },
  vehicleNumber: {
    type: String,
    required: [true, 'Vehicle number is required'],
    trim: true,
  },
  tripName: {
    type: String,
    required: [true, 'Trip name is required'],
    trim: true,
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required'],
    default: Date.now,
  },
  endDate: {
    type: Date,
  },
  status: {
    type: String,
    required: [true, 'Status is required'],
    enum: ['Active', 'Completed'],
    default: 'Active',
  },
  totalPurchases: {
    type: Number,
    default: 0,
  },
  totalSales: {
    type: Number,
    default: 0,
  },
  totalPurchaseLitres: {
    type: Number,
    default: 0,
  },
  totalSalesLitres: {
    type: Number,
    default: 0,
  },
  profitLoss: {
    type: Number,
    default: 0,
  },
  isProfitable: {
    type: Boolean,
    default: false,
  },
  hasReachedBreakeven: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
})

const Trip: Model<ITripDocument> = mongoose.models.Trip || mongoose.model<ITripDocument>('Trip', TripSchema)

export default Trip