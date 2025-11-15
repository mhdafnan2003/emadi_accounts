import mongoose, { Document, Model } from 'mongoose'

export interface IVehicle {
  vehicleName: string
  vehicleNumber: string
  driverName: string
  coPassengerName: string
  createdAt?: Date
  updatedAt?: Date
}

export interface IVehicleDocument extends IVehicle, Document {}

const VehicleSchema = new mongoose.Schema<IVehicleDocument>({
  vehicleName: {
    type: String,
    required: [true, 'Vehicle name is required'],
    trim: true,
  },
  vehicleNumber: {
    type: String,
    required: [true, 'Vehicle number is required'],
    unique: true,
    trim: true,
    uppercase: true,
  },
  driverName: {
    type: String,
    required: [true, 'Driver name is required'],
    trim: true,
  },
  coPassengerName: {
    type: String,
    required: [true, 'Co-passenger name is required'],
    trim: true,
  },
}, {
  timestamps: true,
})

const Vehicle: Model<IVehicleDocument> = mongoose.models.Vehicle || mongoose.model<IVehicleDocument>('Vehicle', VehicleSchema)

export default Vehicle