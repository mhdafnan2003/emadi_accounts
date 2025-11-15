# Fleet Manager - Professional Vehicle Management System

A modern, responsive Next.js application for comprehensive vehicle fleet management with expense tracking, fuel purchase monitoring, and analytics.

## ✨ Features

### 🚗 Vehicle Management
- Complete vehicle fleet tracking
- Driver assignment and management
- Vehicle status monitoring
- Maintenance scheduling

### 💰 Expense Tracking
- Categorized expense management
- Real-time expense monitoring
- Monthly and yearly analytics
- Custom expense categories

### ⛽ Fuel Purchase Management
- Fuel purchase tracking
- Trip-based fuel logging
- Cost analysis and reporting
- Fuel efficiency monitoring

### 🎨 Modern UI/UX
- **Fully Responsive**: Optimized for mobile, tablet, and desktop
- **Dark/Light Mode**: System-aware theme switching
- **Professional Design**: Clean, modern interface with consistent design language
- **Smooth Animations**: Thoughtful transitions and micro-interactions
- **Accessibility**: WCAG compliant with proper ARIA labels

### 🏗️ Technical Features
- **Next.js 14**: Latest App Router architecture
- **TypeScript**: Full type safety
- **Tailwind CSS**: Utility-first styling with custom design system
- **MongoDB**: Scalable database with Mongoose ODM
- **Responsive Design**: Mobile-first approach
- **Component Library**: Reusable UI components
- **Error Boundaries**: Graceful error handling
- **Loading States**: Skeleton loaders and spinners

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- MongoDB database
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd fleet-manager
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.local.example .env.local
   ```
   
   Update `.env.local` with your configuration:
   ```env
   MONGODB_URI=mongodb://localhost:27017/fleet-manager
   NEXTAUTH_SECRET=your-secret-key
   NEXTAUTH_URL=http://localhost:3000
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📱 Responsive Design

The application is fully responsive across all device sizes:

- **Mobile (320px+)**: Touch-optimized interface with bottom navigation
- **Tablet (768px+)**: Optimized layout with collapsible sidebar
- **Desktop (1024px+)**: Full sidebar with expanded features
- **Large Screens (1440px+)**: Maximum content width with centered layout

## 🎨 Design System

### Color Palette
- **Primary**: Blue scale (50-950) for main actions and navigation
- **Gray**: Neutral scale (50-950) for text and backgrounds
- **Semantic Colors**: Success (green), Warning (yellow), Error (red), Info (blue)

### Typography
- **Font**: Inter (Google Fonts)
- **Scales**: Responsive typography with proper line heights
- **Weights**: 300-800 for various emphasis levels

### Components
- **Buttons**: Multiple variants (primary, secondary, outline, danger, ghost)
- **Inputs**: Consistent styling with error states and validation
- **Cards**: Elevated surfaces with proper shadows and borders
- **Navigation**: Responsive sidebar and mobile bottom navigation
- **Loading States**: Skeleton loaders and spinners
- **Badges**: Status indicators with semantic colors

## 📁 Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── categories/        # Category management
│   ├── expenses/          # Expense tracking
│   ├── purchases/         # Fuel purchases
│   ├── vehicles/          # Vehicle management
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx          # Dashboard
├── components/            # Reusable components
│   ├── ui/               # UI component library
│   ├── forms/            # Form components
│   └── layout/           # Layout components
├── lib/                  # Utilities and configurations
│   ├── mongodb.ts        # Database connection
│   └── utils.ts          # Helper functions
├── models/               # Database models
│   ├── Category.ts
│   ├── Expense.ts
│   ├── Purchase.ts
│   ├── Trip.ts
│   └── Vehicle.ts
└── public/               # Static assets
```

## 🛠️ Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Database
npm run db:seed      # Seed database with sample data
npm run db:reset     # Reset database
```

## 🌙 Theme System

The application supports both light and dark modes:

- **System**: Automatically follows system preference
- **Light**: Clean, bright interface
- **Dark**: Easy on the eyes for low-light environments
- **Persistent**: Theme preference saved in localStorage

## 📊 Database Schema

### Vehicle
- Basic information (make, model, year, license plate)
- Driver assignment
- Status tracking
- Maintenance records

### Expense
- Amount and description
- Category assignment
- Date and vehicle association
- Receipt attachments

### Purchase (Fuel)
- Fuel type and quantity
- Cost and location
- Trip association
- Odometer readings

### Category
- Name and description
- Color coding
- Usage statistics

## 🔒 Security Features

- Input validation and sanitization
- CSRF protection
- Secure headers
- Environment variable protection
- Error boundary implementation

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your repository to Vercel
2. Configure environment variables
3. Deploy automatically on push

### Docker
```bash
docker build -t fleet-manager .
docker run -p 3000:3000 fleet-manager
```

### Manual Deployment
```bash
npm run build
npm run start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Review the FAQ section

---

Built with ❤️ using Next.js, TypeScript, and Tailwind CSS