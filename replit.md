# Chat Application

## Overview

This is a real-time chat application built with a React frontend and Express backend. The application enables users to communicate in real-time through WebSocket connections, with message persistence and user presence tracking. The system uses Supabase for authentication and data storage, with Socket.IO handling real-time bidirectional communication between clients and server.

## Recent Changes (December 2024)

### New Features Implemented

1. **Offline Message Queue System**
   - Messages are queued when recipient is offline or has network interruption
   - Queued messages are delivered automatically when user reconnects
   - Message status tracking: sending → queued → delivered → read

2. **Last Message Indexing**
   - WhatsApp-style conversation list with last message preview
   - Shows "You:" prefix for messages sent by current user
   - Timestamps formatted relative to current time (Today, Yesterday, weekday, date)

3. **Unread Message Count UI**
   - Green badges showing unread message count per conversation
   - Total unread count displayed in sidebar header
   - Automatic count reset when opening a conversation

4. **End-to-End Encryption Infrastructure** (Foundation Ready)
   - ECDH key pair generation using Web Crypto API
   - AES-GCM encryption for message content
   - Key backup/restore with passphrase protection (PBKDF2)
   - Local key storage with session key caching
   - Note: Requires database schema updates (public_key, ciphertext, iv columns) to fully activate

5. **MessagePack Binary Serialization** (Utilities Ready)
   - Compression utilities for reduced payload size
   - Message packing/unpacking helpers
   - Note: Can be activated by wrapping socket.emit calls with pack/unpack

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

**Key Components**:
- `ChatContainer.jsx` - Main chat application container with socket management
- `ChatLists.jsx` - Message display with date grouping and status indicators
- `UserList.jsx` - Conversation list with unread badges and last message preview
- `InputText.jsx` - Message input with keyboard handling

**Utilities**:
- `utils/crypto.js` - End-to-end encryption utilities (ECDH, AES-GCM)
- `utils/messagepack.js` - Binary serialization for reduced payload
- `hooks/useCrypto.js` - React hook for encryption management

### Backend Architecture

**Framework**: Express.js on Node.js
- **Rationale**: Lightweight, flexible, and well-suited for real-time applications with extensive middleware ecosystem
- **API Structure**: RESTful routes organized by domain (auth, users)
- **Real-time Layer**: Socket.IO server for WebSocket management and event handling
- **Process Management**: Nodemon for development auto-reload

**Socket Events**:
- `privateMessage` / `sendEncryptedMessage` - Send messages (with optional E2E encryption)
- `deliverPendingMessages` - Deliver queued messages on reconnect
- `markAsRead` - Mark messages as read and update status
- `getChatUsers` - Get conversation list with unread counts
- `registerPublicKey` / `requestPublicKey` - E2E encryption key exchange
- `saveKeyBackup` / `getKeyBackup` - Encryption key backup management

**Connection Management**:
- Automatic offline detection through heartbeat checking (30-second intervals)
- Message queue for offline recipients with automatic delivery
- Real-time user status broadcasting to all connected clients

### Data Storage

**Primary Database**: Supabase (PostgreSQL-based)
- **Rationale**: Provides integrated authentication, real-time subscriptions, and PostgreSQL database with RESTful API

**Tables**:
- `profiles` - User information (id, username, avatar, online, last_seen, socket_id, public_key, encryption_version)
- `chats` - Messages (sender_id, receiver_id, message, status, ciphertext, iv, is_encrypted, queued_at, delivered_at, read_at)
- `key_backups` - Encrypted E2E keys (user_id, public_key, encrypted_key, salt, iv)

**Message Status Flow**:
```
sending → queued (if offline) → delivered → read
                ↓
              sent (if online)
```

### Authentication & Authorization

**Provider**: Supabase Authentication
- **Method**: Email/password authentication with JWT tokens
- **Token Management**: Access tokens provided on signup/login for subsequent API requests
- **Session Handling**: Credentials-based CORS for secure cross-origin authentication

## External Dependencies

### Third-Party Services

**Supabase** (Primary Backend Service)
- **Purpose**: Authentication, PostgreSQL database, real-time subscriptions
- **Configuration**: Requires `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` environment variables
- **Integration**: `@supabase/supabase-js` client library

### Key NPM Packages

**Backend**:
- `socket.io`: Real-time WebSocket server
- `express`: Web framework for REST API routes
- `cors`: Cross-Origin Resource Sharing middleware
- `@supabase/supabase-js`: Supabase client library
- `@msgpack/msgpack`: Binary serialization
- `dotenv`: Environment variable management

**Frontend**:
- `socket.io-client`: WebSocket client
- `react` & `react-dom`: UI framework
- `react-icons`: Icon library
- `@msgpack/msgpack`: Binary serialization
- `vite`: Build tool and development server

### Environment Configuration

**Required Environment Variables**:
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_ANON_KEY`: Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key (for admin operations)
- `PORT`: Backend port (defaults to 3001)
- `VITE_API_URL`: Frontend API URL for backend connection

### Running the Application

**Development**:
```bash
npm install
cd client && npm install
cd ../server && npm install
npm run dev
```

**Port Configuration**:
- Backend: Port 3001
- Frontend: Port 5000 (exposed externally)
