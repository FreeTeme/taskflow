import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Button } from '../shared/Button'
import { useToast } from '../../providers/ToastProvider'
import { getAuthErrorMessage } from '../../lib/authErrors'

export function OAuthButton() {
  const toast = useToast()
  const [loading, setLoading] = useState(false)

  const handleGoogleSignIn = async () => {
    setLoading(true)

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/` },
      })
      if (error) toast.error(getAuthErrorMessage(error.message, error.code))
    } catch {
      toast.error('Unable to connect to Google. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      type="button"
      variant="secondary"
      className="w-full"
      loading={loading}
      onClick={() => void handleGoogleSignIn()}
    >
      Continue with Google
    </Button>
  )
}
