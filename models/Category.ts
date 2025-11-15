import mongoose, { Document, Model } from 'mongoose'

export interface ICategory {
  name: string
  description?: string
  createdAt?: Date
  updatedAt?: Date
}

export interface ICategoryDocument extends ICategory, Document {}

const CategorySchema = new mongoose.Schema<ICategoryDocument>({
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

const Category: Model<ICategoryDocument> = mongoose.models.Category || mongoose.model<ICategoryDocument>('Category', CategorySchema)

export default Category