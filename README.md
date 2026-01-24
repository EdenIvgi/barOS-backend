# BarApp Backend

Backend server for BarApp application built with Express.js and MongoDB.

## Features

- Authentication (login, signup, logout)
- User management
- Order management

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set environment variables (optional):
- `DB_URL`: MongoDB connection string
- `DB_NAME`: Database name (default: 'bandit_db')
- `PORT`: Server port (default: 3030)

3. Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login user
- `POST /api/auth/signup` - Signup new user
- `POST /api/auth/logout` - Logout user

### Users
- `GET /api/user` - Get all users

### Orders
- `GET /api/order` - Get all orders (with optional query params: userId, status)
- `GET /api/order/active` - Get active orders
- `GET /api/order/:id` - Get order by ID
- `POST /api/order` - Create new order
- `PUT /api/order/:id` - Update order
- `PUT /api/order/:id/status` - Update order status
- `DELETE /api/order/:id` - Delete order

## Database Structure

The application uses MongoDB with the following collections in the `bandit_db` database:
- `user` - User accounts
- `items` - Products/Items
- `order` - Orders

## Project Structure

```
barApp-backend/
├── api/
│   ├── auth/        # Authentication module
│   ├── user/        # User module
│   └── order/       # Order module
├── config/          # Configuration files
├── services/        # Core services (MongoDB, Logger)
└── server.js        # Main server file
```
