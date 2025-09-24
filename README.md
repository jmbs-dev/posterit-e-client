# Posterit-E: Client Application

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)

This repository contains the source code for the Posterit-E client-side application. This is a pure vanilla JavaScript application responsible for the user interface, client-side cryptography, and communication with the serverless backend API.

The client is built with Vite for a fast and modern development experience.

---

## ✨ Core Principles

- **🔐 Zero-Knowledge:** The client is the only place where data is ever in a plaintext state. All cryptographic operations (encryption and decryption) are performed exclusively in the user's browser using the standard Web Crypto API.
- **🚀 Static First:** The final output of this project is a set of static files (`.html`, `.js`, `.css`) designed to be hosted on a service like AWS S3, ensuring global scalability and low cost.
- **💡 Simplicity:** Built with vanilla JavaScript to keep the MVP lean and focused on the core functionality without the overhead of a large framework.

---

## 🚀 Getting Started

Follow these instructions to set up and run the project on your local machine for development and testing purposes.

### Prerequisites
- **Node.js** (version 18.x or higher is recommended)
- **npm** (usually comes with Node.js)

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/posterit-e-client.git
cd posterit-e-client
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

This application requires environment variables to connect to the backend API. These are managed using `.env` files.

- In the root directory of the project, create a new file named `.env.local`.
- Open the `.env.local` file and add the following variables, replacing the placeholder values with your actual API details:

```env
# .env.local
# This file is for local development and is ignored by Git.

# The base URL of your deployed Posterit-E API Gateway stage
VITE_API_URL=https://xxxxxxxxxx.execute-api.us-east-2.amazonaws.com/Prod

# The API Key required to access protected endpoints (e.g., POST /secrets)
VITE_API_KEY=YourApiKeyStringGoesHere
```

> **Important:** Vite requires that environment variables exposed to the client-side code be prefixed with `VITE_` to prevent accidental exposure of sensitive keys.

### 4. Run the Development Server

This project uses Vite's fast development server, which provides features like Hot Module Replacement (HMR) for an instant feedback loop.

```bash
npm run dev
```

The terminal will display a local URL, typically `http://localhost:5173`. Open this URL in your web browser to see the application running.

Any changes you make to the source files (`.js`, `.css`, `.html`) will be reflected in the browser instantly without needing a full page reload.

---

## 📦 Building for Production

When you are ready to deploy the application, you need to create an optimized, static build.

```bash
npm run build
```

This command will create a `dist/` directory in your project root. The contents of this `dist/` folder are all you need to deploy.

### Previewing the Production Build

To test the production build locally before deploying, you can use the preview command:

```bash
npm run preview
```

This will start a simple static file server for the `dist/` directory, allowing you to interact with the application exactly as a user would.

---

## 📜 Available Scripts

- `npm run dev`: Starts the Vite development server.
- `npm run build`: Bundles and optimizes the application for production into the `dist/` folder.
- `npm run preview`: Serves the contents of the `dist/` folder to preview the production build locally.

---


