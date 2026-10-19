<div align="center">

<img src="frontend/public/images/brand/logo.png" alt="Tessa logo" width="140" />

# Tessa

**Same dreams, new chapters, always you.**

A full-stack fashion e-commerce store for gowns, tops, sarees and tailored sets, with a burgundy-and-gold couture interface, flash sales and secure online payments.

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-Upstash-DC382D?logo=redis&logoColor=white)
![Razorpay](https://img.shields.io/badge/Payments-Razorpay-0C2451)

</div>

---

## Features

**Storefront**
- Couture-style UI in burgundy and antique gold, with arched image frames, Cormorant Garamond headings and Jost body text
- Home page with hero, collection cards, Flash Edit, featured pieces, lookbook and newsletter signup
- Product listing with category filters, search and sorting
- Product detail pages with image gallery, pricing, discount and stock status
- Cart, multi-step checkout and order history
- Fully responsive (mobile first)

**Flash sales**
- Time-limited sale prices with a live countdown
- Limited flash stock tracked in Redis so items cannot be oversold
- Separate rate limiting and payment flow for flash purchases

**Accounts and security**
- Email registration and login with JWT
- Google sign-in (OAuth)
- Separate admin login
- Protected routes, request validation and rate limiting

**Payments and email**
- Razorpay checkout with server-side payment verification
- Transactional and newsletter emails through Nodemailer

**Admin dashboard**
- Add, edit and delete products
- Start or stop flash sales on any product
- View all orders and update order status

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 18 (Create React App), React Router, CSS Modules, react-hot-toast |
| Backend | Node.js, Express |
| Database | MongoDB with Mongoose |
| Cache and stock control | Upstash Redis |
| Payments | Razorpay |
| Auth | JWT, bcryptjs, Google OAuth |
| Email | Nodemailer |

---

## Project structure

```
Ecommerce-main/
├── backend/
│   ├── config/         # database and Redis setup
│   ├── controllers/    # auth, products, cart, orders, payment, subscribers
│   ├── middleware/     # auth, rate limiting, validation
│   ├── models/         # Mongoose schemas
│   ├── routes/         # API routes
│   ├── scripts/seed.js # sample users, Tessa products and orders
│   ├── services/       # email, OTP, flash sale, payment, cache
│   ├── validators/
│   └── server.js
└── frontend/
    ├── public/
    │   └── images/     # brand logo and product photos
    └── src/
        ├── api/
        ├── components/ # layout (Navbar, Footer) and common (ProductCard, CheckoutFlow)
        ├── context/
        ├── hooks/
        ├── pages/      # Home, Products, ProductDetail, Cart, Orders, Login, Admin, policies
        └── styles/     # global.css with the design tokens
```

---

## Getting started

### Prerequisites

- Node.js 18 or newer
- A [MongoDB Atlas](https://www.mongodb.com/atlas) cluster (free tier is fine)
- An [Upstash Redis](https://upstash.com) database (free tier is fine)
- A [Razorpay](https://razorpay.com) account in test mode (for payments)

### 1. Clone the repository

```bash
git clone https://github.com/<your-username>/<your-repo>.git
cd <your-repo>
```

### 2. Set up the backend

```bash
cd backend
npm install
cp .env.example .env      # on Windows: copy .env.example .env
```

Open `backend/.env` and fill in your values:

```dotenv
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/tessa?retryWrites=true&w=majority
JWT_SECRET=a_long_random_string_of_at_least_32_characters
JWT_EXPIRES_IN=7d

UPSTASH_REDIS_REST_URL=https://<your-db>.upstash.io
UPSTASH_REDIS_REST_TOKEN=<your-token>

RAZORPAY_KEY_ID=rzp_test_xxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxx

ADMIN_EMAIL=admin@gmail.com
ADMIN_PASSWORD=Admin@123

# Optional: email and Google sign-in
EMAIL_HOST=
EMAIL_PORT=
EMAIL_USER=
EMAIL_PASS=
EMAIL_FROM=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
```

> Never commit your `.env` file. It is already listed in `.gitignore`.

### 3. Load the sample data

Run this from the `backend` folder (note: it clears the database first):

```bash
npm run seed
```

This creates the admin user, sample customers, the 20 Tessa products across Gowns, Tops, Co-ords and Sarees, and a few sample orders.

> If the seed script cannot find your `.env`, run it from inside `backend/scripts` instead: `node seed.js`.

### 4. Start the backend

```bash
npm run dev      # development with nodemon
# or
npm start
```

The API runs on `http://localhost:5000`.

### 5. Set up and start the frontend

Open a second terminal:

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```dotenv
REACT_APP_API_URL=http://localhost:5000/api
```

Then start the app:

```bash
npm start
```

The store opens at `http://localhost:3000`.

---

## Admin access

Log in with the `ADMIN_EMAIL` and `ADMIN_PASSWORD` from your backend `.env` (default: `admin@gmail.com` / `Admin@123`). Change these before deploying.

From the Admin page you can manage products, run flash sales and update orders. When adding a product, use an image path like `/images/products/your-photo.jpg` for photos stored in `frontend/public/images/products/`, or a full image URL.

---

## Available scripts

| Where | Command | What it does |
|---|---|---|
| backend | `npm run dev` | Start the API with nodemon |
| backend | `npm start` | Start the API |
| backend | `npm run seed` | Reset the database and load sample data |
| frontend | `npm start` | Start the React dev server |
| frontend | `npm run build` | Create a production build |

---

## Customizing the design

All colors, fonts, spacing and shadows live as CSS variables at the top of `frontend/src/styles/global.css`. Changing a value there updates the whole site.

| Token | Value | Used for |
|---|---|---|
| `--bg` | `#22060a` | Page background (deep oxblood) |
| `--surface` | `#380d15` | Cards |
| `--accent` | `#c9a45c` | Antique gold |
| `--ink` | `#f4e8d0` | Champagne text |

---

## Deployment

- **Frontend:** build with `npm run build` and deploy the `build` folder to Netlify, Vercel or similar. The build script adds a `_redirects` file so React Router works on refresh. Set `REACT_APP_API_URL` to your live API URL.
- **Backend:** deploy to Render, Railway or any Node host. Add all `.env` values as environment variables and set `CLIENT_URL` to your live frontend URL.

---

## Notes

- The product photos are placeholders. Replace them with images you own or have licensed before going live.
- Prices, stock and descriptions in the seed script are sample data. Edit them in `backend/scripts/seed.js` or from the Admin page.
- Use Razorpay test keys while developing.

---

## License

Add the license of your choice here (for example MIT).
