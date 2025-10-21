# 🏥 RemedyEase

> **LIVE calls and live chat with doctors now made easy**

A comprehensive healthcare platform connecting patients with doctors through real-time video consultations and live chat.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Visit%20Site-brightgreen)](https://remedy-ease-new.vercel.app)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Deployment](#-deployment)
- [Project Structure](#-project-structure)
- [API Documentation](#-api-documentation)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Features

### 👤 **For Patients**
- 🔐 Secure user registration and authentication
- 👨‍⚕️ Browse and search doctors by name and specialization
- 📅 Book appointments with preferred doctors
- 📊 View appointment history and status
- 💬 Real-time live chat with doctors during appointments
- 🎥 Video call consultations with doctors
- 🤖 AI-powered health recommendations
- 📝 Update personal profile and medical information

### 👨‍⚕️ **For Doctors**
- 🔐 Secure doctor registration and authentication
- 📋 Manage appointment requests (confirm/reject)
- 📅 Calendar view of scheduled appointments
- 👥 View patient consultation history
- 💬 Real-time live chat with patients
- 🎥 Video call consultations with patients
- 🤖 AI-powered treatment suggestions based on symptoms and history
- 📄 Add treatment details and medical notes
- 📊 Comprehensive dashboard with analytics

### 🚀 **Core Features**
- ⚡ Real-time communication using Socket.io
- 🔒 Secure authentication with JWT tokens
- ☁️ Cloud-based image storage (Cloudinary)
- 🎨 Modern and responsive UI design
- 📱 Mobile-friendly interface
- 🌐 Production-ready deployment setup

---

## 🛠 Tech Stack

### **Frontend**
- **React 19.1.1** - UI library
- **Vite 7.1.7** - Build tool and dev server
- **React Router DOM** - Navigation
- **Socket.io Client 4.8.1** - Real-time communication
- **Tailwind CSS** - Styling framework

### **Backend**

#### User Backend (Port 8000)
- **Node.js** - Runtime environment
- **Express 4.18.2** - Web framework
- **MongoDB/Mongoose 8.0.0** - Database
- **JWT** - Authentication
- **Cloudinary** - Image storage
- **Bcrypt** - Password hashing

#### Doctor Backend (Port 5001)
- **Node.js** - Runtime environment
- **Express 4.18.2** - Web framework
- **Socket.io 4.7.2** - Real-time features
- **MongoDB/Mongoose 8.0.0** - Database
- **Groq AI** - AI-powered medical suggestions
- **Cloudinary** - Image storage

### **Database**
- **MongoDB Atlas** - Cloud database

### **Deployment**
- **Vercel** - Frontend hosting
- **Render** - Backend hosting
- **MongoDB Atlas** - Database hosting

---

## 🏗 Architecture

```
RemedyEase
│
├── Frontend (React + Vite)
│   ├── User Interface
│   ├── Doctor Interface
│   └── Real-time Features (Socket.io)
│
├── User Backend (Port 8000)
│   ├── User Authentication
│   ├── User Profile Management
│   └── User-specific APIs
│
└── Doctor Backend (Port 5001)
    ├── Doctor Authentication
    ├── Appointment Management
    ├── Real-time Chat & Video (Socket.io)
    ├── AI Medical Suggestions
    └── Consultation History
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **MongoDB** (local or Atlas account)
- **Cloudinary** account
- **Groq AI** API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ramit8508/RemedyEase_New.git
   cd RemedyEase_New
   ```

2. **Install dependencies for all services**

   ```bash
   # Install Frontend dependencies
   cd ALL_FILES/RemedyEase
   npm install

   # Install User Backend dependencies
   cd ../Backend
   npm install

   # Install Doctor Backend dependencies
   cd ../Bckend_for_Doctor
   npm install
   ```

3. **Set up environment variables** (see [Environment Variables](#-environment-variables))

4. **Start all services**

   Open 3 terminal windows:

   **Terminal 1 - User Backend:**
   ```bash
   cd ALL_FILES/Backend
   npm run dev
   ```
   Server runs on `http://localhost:8000`

   **Terminal 2 - Doctor Backend:**
   ```bash
   cd ALL_FILES/Bckend_for_Doctor
   npm run dev
   ```
   Server runs on `http://localhost:5001`

   **Terminal 3 - Frontend:**
   ```bash
   cd ALL_FILES/RemedyEase
   npm run dev
   ```
   App runs on `http://localhost:5173`

5. **Access the application**
   - Open browser and navigate to `http://localhost:5173`

---

## 🔐 Environment Variables

### **Frontend (.env)**

Create `.env` file in `ALL_FILES/RemedyEase/`:

```env
# Local Development Backend URLs
VITE_USER_BACKEND_URL=http://localhost:8000
VITE_DOCTOR_BACKEND_URL=http://localhost:5001
```

### **User Backend (.env)**

Create `.env` file in `ALL_FILES/Backend/`:

```env
# Database
MONGODB_URI=your_mongodb_connection_string

# Server
PORT=8000
CORS_ORIGIN=http://localhost:5173

# JWT
ACCESS_TOKEN_SECRET=your_access_token_secret
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_SECRET=your_refresh_token_secret
REFRESH_TOKEN_EXPIRY=10d

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

### **Doctor Backend (.env)**

Create `.env` file in `ALL_FILES/Bckend_for_Doctor/`:

```env
# Database
MONGODB_URI=your_mongodb_connection_string

# Server
PORT=5001
CORS_ORIGIN=http://localhost:5173

# JWT
ACCESS_TOKEN_SECRET=your_access_token_secret
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_SECRET=your_refresh_token_secret
REFRESH_TOKEN_EXPIRY=10d

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Groq AI
GROQ_API_KEY=your_groq_api_key
```

---

## 🌐 Deployment

### **Vercel (Frontend)**

1. **Push code to GitHub**
2. **Connect repository to Vercel**
3. **Add environment variables:**
   - `VITE_USER_BACKEND_URL` = Your User Backend URL on Render
   - `VITE_DOCTOR_BACKEND_URL` = Your Doctor Backend URL on Render
   - `NODE_ENV` = `production`
4. **Deploy**

### **Render (Backends)**

#### User Backend
1. Create new **Web Service** on Render
2. Connect your GitHub repository
3. **Build Command:** `npm install`
4. **Start Command:** `npm start`
5. Add all environment variables from User Backend `.env`
6. Deploy

#### Doctor Backend
1. Create new **Web Service** on Render
2. Connect your GitHub repository
3. **Build Command:** `npm install`
4. **Start Command:** `npm start`
5. Add all environment variables from Doctor Backend `.env`
6. Deploy

### **MongoDB Atlas**
1. Create cluster on MongoDB Atlas
2. Get connection string
3. Add to backend environment variables

---

## 📁 Project Structure

```
RemedyEase_New/
│
├── ALL_FILES/
│   │
│   ├── RemedyEase/                    # Frontend (React + Vite)
│   │   ├── src/
│   │   │   ├── components/           # Reusable components
│   │   │   │   ├── LiveChat.jsx      # Real-time chat component
│   │   │   │   ├── VideoCall.jsx     # Video call component
│   │   │   │   └── ...
│   │   │   ├── pages/                # Page components
│   │   │   │   ├── User_DashBoardComponents/
│   │   │   │   ├── Doctor_DashBoardComponents/
│   │   │   │   └── ...
│   │   │   ├── utils/                # Utility functions
│   │   │   ├── Css_for_all/          # CSS files
│   │   │   ├── App.jsx               # Main app component
│   │   │   └── main.jsx              # Entry point
│   │   ├── .env                      # Environment variables
│   │   ├── package.json
│   │   └── vite.config.js            # Vite configuration
│   │
│   ├── Backend/                       # User Backend (Port 8000)
│   │   ├── src/
│   │   │   ├── controllers/          # Request handlers
│   │   │   ├── models/               # MongoDB models
│   │   │   ├── routes/               # API routes
│   │   │   ├── middleware/           # Custom middleware
│   │   │   ├── utils/                # Utility functions
│   │   │   ├── db/                   # Database connection
│   │   │   ├── app.js                # Express app setup
│   │   │   └── index.js              # Server entry point
│   │   ├── .env                      # Environment variables
│   │   └── package.json
│   │
│   └── Bckend_for_Doctor/            # Doctor Backend (Port 5001)
│       ├── src/
│       │   ├── controllers/          # Request handlers
│       │   ├── models/               # MongoDB models
│       │   ├── routes/               # API routes
│       │   ├── middleware/           # Custom middleware
│       │   ├── utils/                # Utility functions
│       │   ├── db/                   # Database connection
│       │   ├── app.js                # Express app setup
│       │   └── index.js              # Server + Socket.io setup
│       ├── .env                      # Environment variables
│       └── package.json
│
├── .gitignore
└── README.md
```

---

## 📡 API Documentation

### **User Backend APIs (Port 8000)**

#### Authentication
```
POST   /api/v1/users/register       # Register new user
POST   /api/v1/users/login          # User login
```

#### User Profile
```
GET    /api/v1/users/profile        # Get user profile
PUT    /api/v1/users/profile/update # Update user profile
```

#### Appointments
```
GET    /api/v1/appointments/user/:email  # Get user appointments
```

---

### **Doctor Backend APIs (Port 5001)**

#### Authentication
```
POST   /api/v1/doctors/register     # Register new doctor
POST   /api/v1/doctors/login        # Doctor login
```

#### Doctor Profile
```
GET    /api/v1/doctors/profile      # Get doctor profile
PUT    /api/v1/doctors/profile/update # Update doctor profile
GET    /api/v1/doctors/all          # Get all doctors
```

#### Appointments
```
POST   /api/v1/appointments/book                    # Book appointment
GET    /api/v1/appointments/doctor/:email           # Get doctor appointments
GET    /api/v1/appointments/user/:email             # Get user appointments
GET    /api/v1/appointments/:appointmentId          # Get appointment by ID
PUT    /api/v1/appointments/confirm/:appointmentId  # Confirm appointment
PUT    /api/v1/appointments/treatment/:appointmentId # Add treatment details
PUT    /api/v1/appointments/symptoms/:appointmentId  # Add symptoms
GET    /api/v1/appointments/doctor/:email/history   # Get consultation history
```

#### Live Features
```
POST   /api/v1/live/chat/send                  # Send chat message
GET    /api/v1/live/chat/history/:appointmentId # Get chat history
POST   /api/v1/live/call/start/:appointmentId  # Start video call
POST   /api/v1/live/call/end/:appointmentId    # End video call
POST   /api/v1/live/status/:appointmentId      # Update online status
GET    /api/v1/live/status/:appointmentId      # Get online status
```

#### AI Suggestions
```
POST   /api/v1/doctor-ai/doctorsuggestions    # Get AI treatment suggestions
```

---

### **Socket.io Events**

#### Client → Server
```javascript
'join-appointment-room'    // Join chat/video room
'send-chat-message'        // Send message
'typing'                   // User typing indicator
'stop-typing'              // Stop typing indicator
```

#### Server → Client
```javascript
'receive-chat-message'     // Receive message
'user-typing'              // Show typing indicator
'user-stopped-typing'      // Hide typing indicator
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a new branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Ramit Kumar**
- GitHub: [@ramit8508](https://github.com/ramit8508)

---

## 🙏 Acknowledgments

- Thanks to all contributors who helped build this project
- Inspired by the need for accessible healthcare solutions
- Built with modern web technologies and best practices

---

## 📞 Support

For support, email your-email@example.com or create an issue in the repository.

---

## 🔮 Future Enhancements

- [ ] Mobile app (React Native)
- [ ] Prescription management system
- [ ] Payment gateway integration
- [ ] Multi-language support
- [ ] Advanced analytics dashboard
- [ ] Email notifications
- [ ] SMS reminders for appointments
- [ ] Medical report upload and storage
- [ ] Lab test integration

---

<div align="center">
  Made with ❤️ by Ramit Kumar
  <br>
  ⭐ Star this repo if you find it helpful!
</div>
