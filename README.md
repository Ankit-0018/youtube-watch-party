# YouTube Watch Party

A real-time YouTube Watch Party application that allows multiple users to watch YouTube videos together in a shared room.

Users in the same room stay synchronized when the host or moderator plays, pauses, seeks, or changes the video. The application uses Socket.IO for real-time communication and maintains authoritative playback state on the server.

## Live Demo

Frontend: https://youtube-watch-party-1-uktw.onrender.com/

GitHub: https://github.com/Ankit-0018/youtube-watch-party

## Features

- Create a watch party room with a unique room code.
- Join a room using a room code or shareable URL.
- Real-time YouTube playback synchronization.
- Play, pause, seek, and video change synchronization.
- Host, Moderator, and Participant roles.
- Server-side permission validation.
- Host can assign roles and remove participants.
- Host can transfer host privileges.
- Real-time participant list updates.
- Real-time emoji reactions.
- Responsive desktop and mobile UI.
- YouTube URL and video ID support.

## Tech Stack

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Socket.IO Client
- YouTube IFrame Player API

### Backend

- Node.js
- Express
- TypeScript
- Socket.IO
- CORS

### Deployment

- Render

## Architecture

```text
                    ┌─────────────────────┐
                    │      React App      │
                    │      Frontend       │
                    └──────────┬──────────┘
                               │
                         Socket.IO
                               │
                               ▼
                    ┌─────────────────────┐
                    │   Node + Express    │
                    │      Backend        │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │    RoomManager      │
                    │                     │
                    │  Room 1             │
                    │  Room 2             │
                    │  Room 3             │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │      Room State     │
                    │                     │
                    │  Video ID           │
                    │  Play/Pause State   │
                    │  Current Time       │
                    │  Updated At         │
                    │  Participants       │
                    │  Host               │
                    └─────────────────────┘
```

## Real-Time Synchronization

The backend maintains the authoritative playback state.

A room stores:

```ts
{
  videoId: string | null,
  playState: "PLAYING" | "PAUSED",
  currentTime: number,
  updatedAt: number
}
```

When a user performs an action:

```text
User Action
     │
     ▼
Socket.IO Event
     │
     ▼
Backend Validation
     │
     ▼
Room State Updated
     │
     ▼
Broadcast New State
     │
     ▼
All Connected Clients
     │
     ▼
YouTube Player Updated
```

## Playback Drift Handling

The server stores both `currentTime` and `updatedAt`.

When playback is active, clients calculate the effective playback position:

```ts
const elapsed =
  (Date.now() - playback.updatedAt) / 1000;

const effectiveTime =
  playback.currentTime + elapsed;
```

This allows users joining an already-playing room to calculate the current playback position instead of always starting from the original timestamp.

## Role & Permission System

| Action | Host | Moderator | Participant |
|---|---:|---:|---:|
| Play | Yes | Yes | No |
| Pause | Yes | Yes | No |
| Seek | Yes | Yes | No |
| Change Video | Yes | Yes | No |
| Assign Role | Yes | No | No |
| Remove Participant | Yes | No | No |
| Transfer Host | Yes | No | No |
| Send Reaction | Yes | Yes | Yes |

Permissions are enforced on the backend rather than relying only on frontend UI restrictions.

## Project Structure

```text
youtube-watch-party/
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── constants/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── types/
│   │   ├── utils/
│   │   ├── App.tsx
│   │   └── main.tsx
│   │
│   ├── package.json
│   └── vite.config.ts
│
├── server/
│   ├── src/
│   │   ├── config/
│   │   ├── constants/
│   │   ├── middleware/
│   │   ├── rooms/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── socket/
│   │   ├── types/
│   │   ├── utils/
│   │   └── server.ts
│   │
│   ├── package.json
│   └── tsconfig.json
│
└── README.md
```

## Socket Events

### Client → Server

| Event | Purpose |
|---|---|
| `join_room` | Join a watch party |
| `leave_room` | Leave a watch party |
| `play` | Request playback |
| `pause` | Request pause |
| `seek` | Request seek |
| `change_video` | Change the current YouTube video |
| `assign_role` | Assign a participant role |
| `remove_participant` | Remove a participant |
| `transfer_host` | Transfer host privileges |
| `reaction` | Send a reaction |

### Server → Client

| Event | Purpose |
|---|---|
| `sync_state` | Send the latest room state |
| `user_joined` | Notify participants about a new user |
| `user_left` | Notify participants when someone leaves |
| `role_assigned` | Notify about role changes |
| `participant_removed` | Notify about participant removal |
| `reaction` | Broadcast participant reaction |
| `error` | Send socket-level errors |

## YouTube Integration

The application uses the YouTube IFrame Player API.

Users can enter a standard YouTube URL:

```text
https://www.youtube.com/watch?v=VIDEO_ID
```

or a shortened URL:

```text
https://youtu.be/VIDEO_ID
```

The application extracts the YouTube video ID and loads it into the player.

The YouTube player is initialized once and subsequent video changes use:

```ts
player.loadVideoById(videoId, 0);
```

## Local Development

### Prerequisites

- Node.js
- npm
- Git

### Clone the Repository

```bash
git clone https://github.com/Ankit-0018/youtube-watch-party.git
cd youtube-watch-party
```

### Backend Setup

```bash
cd server
npm install
```

Create `server/.env`:

```env
PORT=5000
CLIENT_URL=http://localhost:5173
```

Start the backend:

```bash
npm run dev
```

Backend:

```text
http://localhost:5000
```

Health check:

```text
http://localhost:5000/health
```

### Frontend Setup

Open another terminal:

```bash
cd client
npm install
```

Create `client/.env`:

```env
VITE_SERVER_URL=http://localhost:5000
```

Start the frontend:

```bash
npm run dev
```

Frontend:

```text
http://localhost:5173
```

## Production Build

### Backend

```bash
cd server
npm install
npm run build
npm start
```

### Frontend

```bash
cd client
npm install
npm run build
```

The production frontend build is generated in:

```text
client/dist
```

## Deployment

The project is deployed using Render.

### Backend

Create a Render Web Service with:

```text
Root Directory: server
Build Command: npm install && npm run build
Start Command: npm start
```

Set:

```env
CLIENT_URL=https://YOUR-FRONTEND-URL
```

### Frontend

Create a Render Static Site with:

```text
Root Directory: client
Build Command: npm install && npm run build
Publish Directory: dist
```

Set:

```env
VITE_SERVER_URL=https://YOUR-BACKEND-URL
```

For React Router, configure a rewrite:

```text
Source: /*
Destination: /index.html
Action: Rewrite
```

## Current Limitations

### In-Memory Room Storage

Room data is currently stored in memory using `RoomManager`.

This means room state is lost when the backend server restarts or is redeployed.

A production implementation could use Redis, PostgreSQL, or MongoDB for persistent state.

### Single Backend Instance

The current Socket.IO implementation is designed for a single server instance.

For horizontal scaling, a Socket.IO Redis adapter can be introduced so multiple backend instances can coordinate socket events.

## Security Considerations

- Playback permissions are validated on the backend.
- Only the host can transfer host privileges.
- Only authorized roles can control playback.
- Only the host can remove participants.
- Reaction sender identity is derived from the server-side participant state rather than trusted from the client.
- Room and participant existence are validated before protected operations.

## Future Improvements

- Redis-backed room state.
- Socket.IO Redis adapter.
- User authentication.
- Persistent rooms.
- Chat and message history.
- Improved reconnection handling.
- Rate limiting.
- Room expiration.
- Horizontal scaling.
- Automated unit and integration tests.
- End-to-end testing.

## Assignment Requirements

| Requirement | Status |
|---|---|
| Create room | Done |
| Join room | Done |
| Unique room code | Done |
| Shareable room URL | Done |
| Real-time communication | Done |
| Play synchronization | Done |
| Pause synchronization | Done |
| Seek synchronization | Done |
| Change video synchronization | Done |
| Host role | Done |
| Moderator role | Done |
| Participant role | Done |
| Backend permission validation | Done |
| Participant list | Done |
| Real-time participant updates | Done |
| Remove participant | Done |
| Assign roles | Done |
| Host transfer | Done |
| Reactions | Done |
| Responsive UI | Done |
| Public deployment | Done |
| Persistent database | Not implemented |
| Authentication | Not implemented |
| Redis scaling | Not implemented |

## Design Decisions

### Server-authoritative state

Playback state is maintained by the server so all clients receive a consistent state.

### Event-based synchronization

Only meaningful playback actions are sent through Socket.IO instead of continuously broadcasting the YouTube player's current time.

### TypeScript

TypeScript is used across both frontend and backend to provide type safety and explicit socket payload contracts.

### Separation of concerns

Room state, Socket.IO handlers, routes, utilities, constants, and UI components are separated into different modules.

### In-memory state for the MVP

An in-memory `RoomManager` keeps the implementation simple while satisfying the real-time assignment requirements. Persistent storage and Redis can be introduced when scaling becomes necessary.

## Author

**Ankit Kumar**

GitHub: https://github.com/Ankit-0018
