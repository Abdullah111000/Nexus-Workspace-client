# Nexus Workspace Manager - Client

A modern React frontend for managing workspaces, projects, tasks and team collaboration.

## Live Demo

- Frontend: `https://nexus-workspace-abdullah.vercel.app`
- Backend API: `https://nexus-workspace-server.vercel.app`

## Features

- User registration and login
- JWT-based authentication
- Multiple workspaces
- Workspace members and roles
- Project management
- Task creation and management
- Board, list and calendar views
- Drag-and-drop task sorting
- Task comments
- Activity history
- Notifications
- Global search
- Command palette
- Real-time updates with Socket.IO
- Responsive user interface
- File and image support
- Protected routes

## Technologies Used

- React
- Vite
- React Router
- Redux Toolkit
- Tailwind CSS
- Axios
- dnd-kit
- Lucide React
- Sonner
- date-fns

## Project Structure

```text
src/
├── components/
├── lib/
├── pages/
├── store/
├── App.jsx
├── index.css
└── main.jsx
```

## Installation

```bash
git clone https://github.com/Abdullah111000/Nexus-Workspace-client
cd Nexus-Workspace-client
npm install
```

## Environment Variables

For local development, the Vite configuration uses the local backend proxy. For production, configure these variables in Vercel:

```env
VITE_API_URL=https://nexus-workspace-server.vercel.app/api
VITE_SOCKET_URL=https://YOUR_BACKEND_VERCEL_URL
```

Do not commit private credentials or real secret values to this repository.

## Run Locally

```bash
npm run dev
```

The application runs at `http://localhost:5173`.

## Production Build

```bash
npm run build
```

## Deployment

The frontend is deployed on Vercel. Add `VITE_API_URL` in the Vercel project environment variables before deploying.

## Related Repository

Backend repository: `https://github.com/Abdullah111000/Nexus-Workspace-server`

## Author

Created by `Abdullah Iftikhar`.
