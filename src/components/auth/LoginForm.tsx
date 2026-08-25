import { type FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getAuthErrorMessage } from '../../lib/authErrors'
import { useAuth } from '../../providers/AuthProvider'
import { useToast } from '../../providers/ToastProvider'
import { OAuthButton } from './OAuthButton'
import { Button } from '../shared/Button'
import { Input } from '../shared/Input'

export function LoginForm() {
  const { signIn } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    try {
      const { error } = await signIn(email, password)
      if (error) {
        toast.error(getAuthErrorMessage(error.message, error.code))
        return
      }
      navigate('/', { replace: true })
    } catch {
      toast.error('Unable to sign in. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label="Email"
        type="email"
        name="email"
        autoComplete="email"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="you@example.com"
      />
      <Input
        label="Password"
        type="password"
        name="password"
        autoComplete="current-password"
        required
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        placeholder="••••••••"
      />
      <Button type="submit" loading={loading} className="mt-2 w-full">
        Sign in
      </Button>
      <div className="relative my-2">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-surface px-2 text-text-muted">or</span>
        </div>
      </div>
      <OAuthButton />
      <p className="text-center text-sm text-text-muted">
        Don&apos;t have an account?{' '}
        <Link to="/register" className="rounded-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
          Create one
        </Link>
      </p>
    </form>
  )
}
