// src/router.tsx (or wherever your routeElements array is defined)

import { lazy, Suspense } from 'react';
import LoadingSpinner from './components/LoadingSpinner';

const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const NewProject = lazy(() => import('./pages/NewProject'));
const EditProject = lazy(() => import('./pages/EditProject'));
const EditProfile = lazy(() => import('./pages/EditProfile'));
const WebSocketChatPage = lazy(() => import('./pages/WebSocketChatPage')); // WebSocket chat

export const routeElements = [
  {
    index: true,
    element: (
      <Suspense fallback={<LoadingSpinner />}>
        <Login />
      </Suspense>
    ),
  },
  {
    path: 'login',
    element: (
      <Suspense fallback={<LoadingSpinner />}>
        <Login />
      </Suspense>
    ),
  },
  {
    path: 'home',
    element: (
      <Suspense fallback={<LoadingSpinner />}>
        <Home />
      </Suspense>
    ),
  },
  {
    path: 'register',
    element: (
      <Suspense fallback={<LoadingSpinner />}>
        <Register />
      </Suspense>
    ),
  },
  {
    path: 'new-project',
    element: (
      <Suspense fallback={<LoadingSpinner />}>
        <NewProject />
      </Suspense>
    ),
  },
  {
    path: 'edit-project/:id',
    element: (
      <Suspense fallback={<LoadingSpinner />}>
        <EditProject />
      </Suspense>
    ),
  },
  {
    path: 'edit-profile',
    element: (
      <Suspense fallback={<LoadingSpinner />}>
        <EditProfile />
      </Suspense>
    ),
  },
  {
    path: 'chat/:id', // WebSocket chat
    element: (
      <Suspense fallback={<LoadingSpinner />}>
        <WebSocketChatPage />
      </Suspense>
    ),
  },
];
