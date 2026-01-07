// Frontend types that include MongoDB _id field
export interface ICategoryWithId {
  _id: string
  name: string
  description?: string
  createdAt: Date
  updatedAt: Date
}

export interface IBranchWithId {
  _id: string
  branchName: string
  phoneNumber?: string
  address?: string
  createdAt: Date
  updatedAt: Date
}

export interface IVehicleWithId {
  _id: string
  vehicleName: string
  vehicleNumber: string
  driverName: string
  coPassengerName: string
  branchId?: string
  createdAt: Date
  updatedAt: Date
}

export interface ITripWithId {
  _id: string
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
  createdAt: Date
  updatedAt: Date
}

export interface IExpenseWithId {
  _id: string
  title: string
  amount: number
  category: string
  description?: string
  date: Date
  branchId?: string
  vehicleId?: string
  vehicleName?: string
  tripId?: string
  tripName?: string
  expenseType?: 'investment' | 'revenue' | 'other'
  createdAt: Date
  updatedAt: Date
}

export interface IPurchaseSaleWithId {
  _id: string
  date: Date
  vehicleId: string
  vehicleName?: string
  vehicleNumber?: string
  branchId?: string
  openingBalance: number
  currentBalance?: number
  currentTins?: number
  completed?: boolean
  completedAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface IPurchaseSaleTransactionWithId {
  _id: string
  purchaseSaleId: string
  type: 'purchase' | 'sale' | 'expense'
  date: Date
  amount: number
  tins?: number
  category?: string
  description?: string
  createdAt: Date
  updatedAt: Date
}