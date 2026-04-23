# Infflux Backend API

Backend API for the hackathon project built with Node.js, TypeScript, Express, PostgreSQL, JWT authentication, and role-based access control.

## Tech Stack

- Node.js
- TypeScript
- Express
- PostgreSQL
- JWT
- bcrypt
- Swagger
- Docker Compose

## Roles

The API supports 3 roles:

- `admin`
- `client`
- `partner`

For now:

- `admin` can view all orders
- `client` can register, log in, create orders, and view their own orders
- `partner` is authenticated but not yet used in order flows

# Installation
npm install

# Start the server
## With Docker:
docker compose up --build

## Without Docker
Development mode:
npm run dev

Build for production:
npm run build
npm start

# API Base URL
http://localhost:3000

# Swagger available at:
http://localhost:3000/api/docs
