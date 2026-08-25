import { type FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getAuthErrorMessage } from '../../lib/authErrors'
import { useAuth } from '../../providers/AuthProvider'
import { useToast } from '../../providers/ToastProvider'
import { Button } from '../shared/Button'
import { Input } from '../shared/Input'

export function RegisterForm() {
  const { signUp } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    try {
      const { error, needsEmailConfirmation } = await signUp(
        email,
        password,
        name.trim() || undefined,
      )
      if (error) {
        toast.error(getAuthErrorMessage(error.message, error.code))
        return
      }
      if (needsEmailConfirmation) {
        toast.success('Account created. Open the confirmation link we sent to your email, then sign in.')
        navigate('/login', { replace: true })
        return
      }
      navigate('/', { replace: true })
    } catch {
      toast.error('Unable to create your account. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label="Name"
        type="text"
        name="name"
        autoComplete="name"
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Jane Doe"
      />
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
        autoComplete="new-password"
        required
        minLength={6}
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        placeholder="At least 6 characters"
      />
      <Button type="submit" loading={loading} className="mt-2 w-full">
        Create account
      </Button>
      <p className="text-center text-sm text-text-muted">
        Already have an account?{' '}
        <Link to="/login" className="rounded-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
          Sign in
        </Link>
      </p>
    </form>
  )
}
