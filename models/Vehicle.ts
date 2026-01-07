import mongoose, { Document, Model } from 'mongoose'

export interface IVehicle {
  vehicleName?: string
  vehicleNumber: string
  driverName: string
  coPassengerName: string
  branchId?: mongoose.Types.ObjectId
  createdAt?: Date
  updatedAt?: Date
}

export interface IVehicleDocument extends IVehicle, Document {}

const VehicleSchema = new mongoose.Schema<IVehicleDocument>({
  vehicleName: {
    type: String,
    trim: true,
    default: function (this: IVehicleDocument) {
      return this.vehicleNumber
    },
  },
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
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

// In Next.js dev (with hot reload), Mongoose can keep an old compiled model
// that doesn't include newly added fields (e.g., branchId). If that happens,
// unknown fields will be stripped due to strict schemas.
const ExistingVehicleModel = mongoose.models.Vehicle as Model<IVehicleDocument> | undefined
if (ExistingVehicleModel && !ExistingVehicleModel.schema.path('branchId')) {
  delete mongoose.models.Vehicle
}

const Vehicle: Model<IVehicleDocument> =
  (mongoose.models.Vehicle as Model<IVehicleDocument>) || mongoose.model<IVehicleDocument>('Vehicle', VehicleSchema)

export default Vehicle