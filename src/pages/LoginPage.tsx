import { Navigate } from 'react-router-dom'
import { LoginForm } from '../components/auth/LoginForm'
import { useAuth } from '../providers/AuthProvider'

export default function LoginPage() {
  const { session, loading } = useAuth()

  if (loading) {
    return null
  }

  if (session) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-8 shadow-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-lg font-bold text-white">
            TF
          </div>
          <h1 className="text-2xl font-bold text-text">Welcome back</h1>
          <p className="mt-2 text-sm text-text-muted">
            Sign in to continue to TaskFlow
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
