// Frontend types that include MongoDB _id field
export interface ICategoryWithId {
  _id: string
  name: string
  description?: string
  createdAt: Date
  updatedAt: Date
}

export interface IVehicleWithId {
  _id: string
  vehicleName: string
  vehicleNumber: string
  driverName: string
  coPassengerName: string
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

export interface IPurchaseWithId {
  _id: string
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

export interface IExpenseWithId {
  _id: string
  title: string
  amount: number
  category: string
  description?: string
  date: Date
  vehicleId?: string
  vehicleName?: string
  tripId?: string
  tripName?: string
  expenseType?: 'investment' | 'revenue' | 'other'
  createdAt: Date
  updatedAt: Date
}