import mongoose from 'mongoose'

export interface ICategory {
  _id?: string
  name: string
  description?: string
  createdAt: Date
  updatedAt: Date
}

const CategorySchema = new mongoose.Schema<ICategory>({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    unique: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
}, {
  timestamps: true,
})

export default mongoose.models.Category || mongoose.model<ICategory>('Category', CategorySchema)