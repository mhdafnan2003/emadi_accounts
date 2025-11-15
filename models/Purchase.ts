import mongoose from 'mongoose'

export interface IPurchase {
  _id?: string
  tripId: string
  tripName: string
  vehicleId: string
  vehicleName: string
  vehicleNumber: string
  date: Date
  price: number
  litre: number
  type: 'Purchase' | 'Sales'
  createdAt: Date
  updatedAt: Date
}

const PurchaseSchema = new mongoose.Schema<IPurchase>({
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

export default mongoose.models.Purchase || mongoose.model<IPurchase>('Purchase', PurchaseSchema)