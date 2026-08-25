import { Navigate } from 'react-router-dom'
import { RegisterForm } from '../components/auth/RegisterForm'
import { useAuth } from '../providers/AuthProvider'
import { Spinner } from '../components/shared/Spinner'

export default function RegisterPage() {
  const { session, loading } = useAuth()

  if (loading) {
    return <main className="flex min-h-screen items-center justify-center"><Spinner size="lg" className="text-primary" label="Checking your session" /></main>
  }

  if (session) {
    return <Navigate to="/" replace />
  }

  return (
    <main id="main-content" className="flex min-h-screen items-center justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8">
        <div className="mb-8 text-center">
          <div aria-hidden="true" className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-lg font-bold text-primary-foreground">
            TF
          </div>
          <h1 className="text-2xl font-bold text-text">Create your account</h1>
          <p className="mt-2 text-sm text-text-muted">
            Get started with TaskFlow in seconds
          </p>
        </div>
        <RegisterForm />
      </div>
    </main>
  )
}
