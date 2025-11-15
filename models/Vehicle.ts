import mongoose from 'mongoose'

export interface IVehicle {
  _id?: string
  vehicleName: string
  vehicleNumber: string
  driverName: string
  coPassengerName: string
  createdAt: Date
  updatedAt: Date
}

const VehicleSchema = new mongoose.Schema<IVehicle>({
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

export default mongoose.models.Vehicle || mongoose.model<IVehicle>('Vehicle', VehicleSchema)