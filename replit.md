# WhatsApp-Style Chat Application

## Overview

This is a WhatsApp-style one-to-one messaging application built with React on the frontend and Node.js/Express on the backend. The application enables users to communicate privately in real-time using WebSocket connections through Socket.IO. Users can see online/offline status, send private messages, view chat history, and access a list of all available users or users they've previously chatted with. The application uses MongoDB for persistent data storage of users and chat messages.

## Recent Changes (October 2025)

- **Transformed from group chat to one-to-one messaging**: Implemented WhatsApp-style private messaging where users can select individual users to chat with
- **Added UserList component**: Two tabs - "Chats" shows users you've messaged, "All Users" shows all available users
- **WhatsApp-style UI**: Green color scheme, right-aligned sent messages (light green), left-aligned received messages (white), with timestamps
- **Improved Socket.IO implementation**: Stable connection lifecycle with proper cleanup, StrictMode compatibility, and state isolation between sessions
- **Online/Offline status**: Real-time presence tracking with visual indicators

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack**: React 18 with Vite build tool

**Problem**: Need a fast, modern development environment for building an interactive real-time chat interface.

**Solution**: React with Vite provides hot module replacement (HMR) for rapid development, while React's component-based architecture allows for clean separation of UI concerns.

**Key Design Decisions**:
- Component-based UI structure for modularity and reusability
- Vite as the build tool for faster development experience compared to traditional webpack setups
- Development server configured to run on port 5000 with host `0.0.0.0` and `allowedHosts: true` for Replit proxy compatibility
- Socket connection persisted using `useRef` to prevent reconnection on every render
- Separate refs (`selectedUserRef`, `isConnectedRef`) for stable message filtering and connection tracking
- Complete state reset on logout to prevent session leakage

**Components**:
- `ChatContainer`: Main container managing socket connection, state, and layout
- `UserList`: Displays users in two tabs (Chats/All Users) with online status and last message preview
- `ChatLists`: Shows WhatsApp-style message bubbles with timestamps
- `InputText`: Message input with Enter key support
- `UserLogin`: Simple username/avatar login

**Dependencies**:
- `react` and `react-dom` for UI rendering
- `socket.io-client` for real-time WebSocket communication with the server
- `react-icons` for UI iconography
- `lodash` for utility functions

### Backend Architecture

**Technology Stack**: Node.js with Express framework and Socket.IO

**Problem**: Need a lightweight server that can handle both HTTP requests and real-time WebSocket connections for instant messaging.

**Solution**: Express provides RESTful API capabilities while Socket.IO enables bidirectional event-based communication between clients and server.

**Key Design Decisions**:
- Event-driven architecture using Socket.IO for real-time features
- Separate HTTP server creation to attach Socket.IO instance
- CORS enabled for all origins to support cross-origin requests (configured with `origin: "*"`)
- User authentication handled through Socket.IO events rather than traditional session management

**WebSocket Events**:
- `userLogin`: Handles user authentication/registration and broadcasts online status
- `usersList`: Sends available users to newly connected clients
- `userOnline`/`userOffline`: Broadcasts user presence changes
- `loadMessages`: Loads chat history between two users and joins them to a room
- `privateMessage`: Sends one-to-one messages to specific users with timestamp
- `receiveMessage`: Delivers messages to both sender and receiver
- `getChatUsers`: Returns list of users the current user has chatted with

**Server Configuration**:
- Main entry point: `app.js`
- Development mode uses `nodemon` for automatic server restarts
- Environment variables loaded via `dotenv` package
- Runs on port 3002 (localhost) to avoid frontend port conflict

### Data Storage

**Database**: MongoDB with Mongoose ODM

**Problem**: Need flexible, scalable storage for chat messages and user data with quick read/write operations.

**Solution**: MongoDB's document-based structure naturally fits chat application data models, while Mongoose provides schema validation and simplified database operations.

**Data Models**:

1. **User Model** (`models/User.js`):
   - Stores username (unique), avatar, socketId, online status, and lastSeen timestamp
   - Supports tracking real-time user presence
   - SocketId updated on each connection for message routing

2. **Chat Model** (`models/Chat.js`):
   - Stores sender, receiver, message content, senderAvatar, and timestamp
   - Enables persistent one-to-one message history and retrieval
   - Supports querying conversations between specific users

**Connection Management**:
- Database connection handled in `db.js` module
- Supports both `MONGODB_URI` and `MONGOURI` environment variable names for flexibility
- Graceful error handling for connection failures

**Trade-offs**:
- **Pros**: Flexible schema, good performance for read-heavy operations, easy horizontal scaling
- **Cons**: No built-in relationships like SQL databases, requires careful index management for performance

### Authentication & Authorization

**Approach**: Simplified username-based authentication without passwords

**Problem**: Need quick user identification for a chat application while maintaining simplicity.

**Solution**: Users log in with username and avatar only. The system creates or updates user records on connection.

**Flow**:
1. Client emits `userLogin` event with username and avatar
2. Server checks if user exists in database
3. If new user, creates record; if existing, updates socketId and online status
4. Socket instance stores username for future message routing
5. Server sends list of available users and chat history to client
6. User selects a recipient from UserList to start private conversation
7. Messages are delivered in real-time to both sender and receiver via socket.id

**Alternatives Considered**:
- JWT-based authentication: More secure but adds complexity for a simple chat app
- OAuth integration: Overkill for this use case

**Trade-offs**:
- **Pros**: Simple implementation, fast onboarding, no password management
- **Cons**: No security verification, usernames can be impersonated without additional validation

## External Dependencies

### Third-Party Services

**MongoDB Database**:
- **Purpose**: Persistent storage for users and chat messages
- **Configuration**: Requires `MONGODB_URI` environment variable in server/.env file
- **Integration Point**: `server/db.js` handles connection management

### Key NPM Packages

**Backend**:
- `express` (^4.19.2): Web application framework for handling HTTP requests
- `socket.io` (^4.7.5): Real-time bidirectional event-based communication
- `mongoose` (^8.4.0): MongoDB object modeling and schema validation
- `cors` (^2.8.5): Enable Cross-Origin Resource Sharing
- `dotenv` (^17.2.3): Environment variable management
- `nodemon` (^3.1.1): Development tool for automatic server restarts

**Frontend**:
- `react` (^18.2.0): UI library for building component-based interfaces
- `react-dom` (^18.2.0): React rendering for web browsers
- `socket.io-client` (^4.7.5): Client-side WebSocket communication library
- `react-icons` (^5.2.1): Icon library for UI elements
- `lodash` (^4.17.21): JavaScript utility library
- `vite` (^5.2.0): Build tool and development server

### Environment Configuration

**Required Environment Variables**:
- `MONGODB_URI` or `MONGOURI`: MongoDB connection string (required for backend functionality)

**Development Setup**:
- Frontend runs on port 5000 (configured in `vite.config.js`)
- Backend server runs on port 3002 (localhost only, configured in `app.js`)
- Separate package.json files for frontend and server indicate monorepo structure

**Deployment Configuration**:
- Type: VM (maintains WebSocket connections and server state)
- Build: Vite build process for frontend
- Run: Both backend server and frontend preview running concurrently