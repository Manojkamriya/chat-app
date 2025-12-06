# Chat Application

## Overview

This is a real-time chat application built with a React frontend and Express backend. The application enables users to communicate in real-time through WebSocket connections, with message persistence and user presence tracking. The system uses Supabase for authentication and data storage, with Socket.IO handling real-time bidirectional communication between clients and server.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React 18 with Vite as the build tool
- **Rationale**: Vite provides fast development server with Hot Module Replacement (HMR), modern ES modules support, and optimized production builds
- **UI Components**: Custom components including EmojiPicker, MessageStatus, and chat interface elements
- **Styling**: Custom CSS with modern features (backdrop-filter, animations, flexbox layouts)
- **State Management**: React hooks for local state management
- **Real-time Communication**: Socket.IO client for WebSocket connections

**Key Design Decisions**:
- Single Page Application (SPA) architecture for smooth user experience
- Component-based structure for reusability and maintainability
- CSS animations for enhanced user interactions (emoji picker, message status)
- Responsive design principles with mobile-first considerations

### Backend Architecture

**Framework**: Express.js on Node.js
- **Rationale**: Lightweight, flexible, and well-suited for real-time applications with extensive middleware ecosystem
- **API Structure**: RESTful routes organized by domain (auth, users)
- **Real-time Layer**: Socket.IO server for WebSocket management and event handling
- **Process Management**: Nodemon for development auto-reload

**Key Design Decisions**:
- Separation of concerns with dedicated route handlers and socket logic
- CORS enabled for cross-origin requests with credentials support
- Dual-transport strategy (WebSocket and polling) for broad client compatibility
- Heartbeat mechanism (60-second timeout) to track user presence and clean up stale connections
- Centralized socket event handling in dedicated module

**Connection Management**:
- Automatic offline detection through heartbeat checking (30-second intervals)
- Graceful handling of stale connections with socket cleanup
- Real-time user status broadcasting to all connected clients

### Data Storage

**Primary Database**: Supabase (PostgreSQL-based)
- **Rationale**: Provides integrated authentication, real-time subscriptions, and PostgreSQL database with RESTful API
- **Schema Design**:
  - `profiles` table: User information (id, username, avatar, online status, last_seen, socket_id)
  - Message storage handled through Supabase tables
- **Authentication**: Supabase Auth for user management with JWT tokens
- **Advantages**: Real-time capabilities, built-in auth, auto-generated REST API, PostgreSQL reliability

**Legacy/Alternative**: MongoDB with Mongoose ODM
- **Status**: Configuration present but appears to be transitioning to Supabase
- **Models**: User and Chat schemas defined with Mongoose
- **Note**: Environment variable `MONGODB_URI` suggests MongoDB was originally used but system is migrating to Supabase

**Design Rationale**:
- Supabase chosen for its integrated authentication and real-time features
- Reduces backend complexity by leveraging managed services
- PostgreSQL provides ACID compliance for critical chat data

### Authentication & Authorization

**Provider**: Supabase Authentication
- **Method**: Email/password authentication with JWT tokens
- **Token Management**: Access tokens provided on signup/login for subsequent API requests
- **Session Handling**: Credentials-based CORS for secure cross-origin authentication
- **User Profiles**: Automatic profile creation on signup linking to auth.users

**Security Considerations**:
- JWT tokens for stateless authentication
- Environment-based secrets (SUPABASE_URL, SUPABASE_ANON_KEY)
- CORS configuration restricts unauthorized origins

## External Dependencies

### Third-Party Services

**Supabase** (Primary Backend Service)
- **Purpose**: Authentication, PostgreSQL database, real-time subscriptions
- **Configuration**: Requires `SUPABASE_URL` and `SUPABASE_ANON_KEY` environment variables
- **Integration**: `@supabase/supabase-js` client library
- **Usage**: User authentication, profile storage, message persistence, real-time updates

**MongoDB** (Legacy/Optional)
- **Purpose**: Alternative database (transitioning away)
- **Configuration**: `MONGODB_URI` environment variable
- **Integration**: Mongoose ODM for schema management
- **Status**: Present in codebase but Supabase appears to be primary data store

### Key NPM Packages

**Backend**:
- `socket.io`: Real-time WebSocket server for bidirectional communication
- `express`: Web framework for REST API routes
- `cors`: Cross-Origin Resource Sharing middleware
- `jsonwebtoken`: JWT token handling
- `mongoose`: MongoDB ODM (legacy)
- `@supabase/supabase-js`: Supabase client library
- `axios`: HTTP client for external API calls
- `dotenv`: Environment variable management

**Frontend**:
- `socket.io-client`: WebSocket client for server communication
- `react` & `react-dom`: UI framework
- `react-icons`: Icon library for UI elements
- `lodash`: Utility library for data manipulation
- `vite`: Build tool and development server

**Development**:
- `concurrently`: Run frontend and backend simultaneously in development
- `nodemon`: Auto-restart backend on file changes
- ESLint plugins for React code quality

### Environment Configuration

**Required Environment Variables**:
- Backend: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `PORT` (optional, defaults to 3001), `MONGODB_URI` (legacy)
- Frontend: Configured to connect to backend via Vite proxy or direct connection

### Deployment Considerations

- **Vercel Build**: Custom build script for Vercel deployment (`vercel-build`)
- **Static Assets**: Client built to static files for CDN deployment
- **Server Hosting**: Backend requires Node.js runtime environment
- **Port Configuration**: Backend defaults to port 3001, frontend dev server on port 5000
- **Host Binding**: Server binds to localhost (may need adjustment for production)