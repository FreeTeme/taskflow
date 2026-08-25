import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './components/auth/ProtectedRoute'

const BoardPage = lazy(() => import('./pages/BoardPage').then((module) => ({ default: module.BoardPage })))
const BoardsPage = lazy(() => import('./pages/BoardsPage').then((module) => ({ default: module.BoardsPage })))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage').then((module) => ({ default: module.ProfilePage })))
const RegisterPage = lazy(() => import('./pages/RegisterPage'))

function PageFallback() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-muted" aria-busy="true">
      <span className="sr-only">Loading page</span>
      <div aria-hidden="true" className="h-10 w-10 motion-safe:animate-spin rounded-full border-4 border-border border-t-primary" />
    </main>
  )
}

export default function App() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route element={<ProtectedRoute />}>
          <Route index element={<BoardsPage />} />
          <Route path="boards/:boardId" element={<BoardPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
