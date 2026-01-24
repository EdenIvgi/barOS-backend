# 🍺 Bar App - Backend

Bar management application - Backend API

## 🛠️ Technologies

- Node.js
- Express.js
- MongoDB
- CORS

## 📁 Project Structure

```
api/
├── item/        # Item routes, controller, service, model
├── category/    # Category routes, controller, service, model
├── order/       # Order routes, controller, service, model
├── user/        # User routes, controller, service, model
└── auth/        # Authentication routes, controller, service, model
config/          # Configuration files
services/        # Shared services (mongo, logger)
data/            # Data scripts and JSON files
```

## 🚀 Installation & Run

```bash
npm install
npm start
```

The server will run on `http://localhost:3031`

## 📋 API Endpoints

- `/api/item` - Item management
- `/api/category` - Category management
- `/api/order` - Order management
- `/api/user` - User management
- `/api/auth` - Authentication

## 📝 License

MIT
