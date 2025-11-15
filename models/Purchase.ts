import mongoose, { Document, Model } from 'mongoose'

export interface IPurchase {
  tripId: string
  tripName: string
  vehicleId: string
  vehicleName: string
  vehicleNumber: string
  date: Date
  price: number
  litre: number
  type: 'Purchase' | 'Sales'
  createdAt?: Date
  updatedAt?: Date
}

export interface IPurchaseDocument extends IPurchase, Document {}

const PurchaseSchema = new mongoose.Schema<IPurchaseDocument>({
  tripId: {
    type: String,
    required: [true, 'Trip ID is required'],
    trim: true,
  },
  tripName: {
    type: String,
    required: [true, 'Trip name is required'],
    trim: true,
  },
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
  date: {
    type: Date,
    required: [true, 'Date is required'],
    default: Date.now,
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price must be positive'],
  },
  litre: {
    type: Number,
    required: [true, 'Litre is required'],
    min: [0, 'Litre must be positive'],
  },
  type: {
    type: String,
    required: [true, 'Type is required'],
    enum: ['Purchase', 'Sales'],
  },
}, {
  timestamps: true,
})

const Purchase: Model<IPurchaseDocument> = mongoose.models.Purchase || mongoose.model<IPurchaseDocument>('Purchase', PurchaseSchema)

export default Purchase