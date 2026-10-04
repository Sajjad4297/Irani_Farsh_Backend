# Irani Farsh Backend

Backend API for **Irani Farsh** — an e-commerce platform for Iranian carpets/rugs. Built with NestJS, Fastify, and PostgreSQL.

## Tech Stack

- **Framework**: NestJS 11 + Fastify
- **Database**: PostgreSQL (via `pg`)
- **Auth**: JWT (cookie-based) + bcrypt
- **File Uploads**: `@fastify/multipart`
- **Caching**: `@nestjs/cache-manager`
- **Email**: Nodemailer
- **Validation**: class-validator + class-transformer

## Project Setup

```bash
pnpm install
```

### Database Setup

Run the schema initialization script against your PostgreSQL instance:

```bash
psql -U your_postgres_user -d your_database_name -f schema.sql
```

### Environment Variables

Create a `.env` file in the project root:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=your_postgres_user
DB_PASSWORD=your_postgres_password
DB_NAME=your_database_name
PORT=3000
COOKIE_SECRET=your_cookie_secret

# FarazSMS Configuration (IranPayamak)
FARAZSMS_API_KEY=your_farazsms_api_key
FARAZSMS_LINE_NUMBER=2191307530
FARAZSMS_BASE_URL=https://api.iranpayamak.com
```

## Run

```bash
# development (watch mode)
pnpm run start:dev

# production
pnpm run build
pnpm run start:prod
```

The API listens on `http://localhost:3000/api` by default.

## Modules

| Module | Path Prefix | Description |
|--------|-------------|-------------|
| **Users** | `/api/users` | Registration, SMS OTP verification, login, profile management |
| **Products** | `/api/products` | CRUD for carpet products with image upload |
| **Categories** | `/api/categories` | Product categories with slug-based lookup |
| **Comments** | `/api/comments` | User comments on products |
| **Cart Items** | `/api/cart-items` | Shopping cart and order placement |
| **Discounts** | `/api/discounts` | Discount code management (admin) |

## API Endpoints

### Users (`/api/users`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/register` | — | Register new user |
| POST | `/register/verify` | — | Verify phone with OTP |
| POST | `/register/resend` | — | Resend verification code |
| POST | `/login` | — | Login |
| GET | `/` | Admin | List all users |
| GET | `/info` | User | Get current user info |
| PUT | `/` | User | Update profile |
| PUT | `/profileImage` | User | Upload profile image |

### Products (`/api/products`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/` | Admin | Create product (with images) |
| GET | `/` | — | List all products |
| GET | `/:id` | — | Get product by ID |
| PUT | `/:id` | Admin | Update product |
| DELETE | `/:id` | Admin | Delete product |
| GET | `/search/:title` | — | Search products by title |

### Categories (`/api/categories`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/` | Admin | Create category (with image) |
| GET | `/` | — | List all categories |
| PUT | `/:id` | Admin | Update category |
| DELETE | `/:id` | Admin | Delete category |
| GET | `/:slug` | — | Get products by category slug |

### Comments (`/api/comments`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/` | User | Create comment |
| GET | `/` | Admin | List all comments |
| PUT | `/:id` | Admin | Update/moderate comment |

### Cart Items (`/api/cart-items`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/` | User | Add item to cart |
| PUT | `/` | User | Update cart item |
| POST | `/order` | User | Place order (checkout) |
| GET | `/order` | User | Get order history |

### Discounts (`/api/discounts`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/` | Admin | Create discount |
| GET | `/` | Admin | List all discounts |
| PUT | `/:id` | Admin | Update discount |
| DELETE | `/:id` | Admin | Delete discount |

## Auth

- **User auth**: JWT token stored in cookies, verified via `UserAuthGuard`
- **Admin auth**: Separate admin guard via `AdminAuthGuard`
- Uploaded images are served from `/uploads/`

## License

UNLICENSED
