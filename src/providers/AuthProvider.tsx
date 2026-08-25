import type { AuthError, Session, User } from '@supabase/supabase-js'
import { useQueryClient } from '@tanstack/react-query'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { supabase } from '../lib/supabase'

interface AuthContextValue {
  session: Session | null
  user: User | null
  loading: boolean
  signUp: (
    email: string,
    password: string,
    name?: string,
  ) => Promise<{ error: AuthError | null; needsEmailConfirmation: boolean }>
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const queryClient = useQueryClient()
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const activeUserIdRef = useRef<string | null | undefined>(undefined)

  useEffect(() => {
    let mounted = true

    const applySession = (nextSession: Session | null) => {
      if (!mounted) return

      const nextUserId = nextSession?.user.id ?? null
      if (
        activeUserIdRef.current !== undefined
        && activeUserIdRef.current !== nextUserId
      ) {
        // All server data in this app is private. Clear queries and mutations
        // before rendering data for a different authenticated identity.
        queryClient.clear()
      }

      activeUserIdRef.current = nextUserId
      setSession(nextSession)
      setLoading(false)
    }

    void supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      applySession(initialSession)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      applySession(nextSession)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [queryClient])

  const signUp = useCallback(
    async (email: string, password: string, name?: string) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: name ? { name } : undefined,
          emailRedirectTo: `${window.location.origin}/`,
        },
      })
      return {
        error,
        needsEmailConfirmation: !error && !data.session,
      }
    },
    [],
  )

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error }
  }, [])

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      signUp,
      signIn,
      signOut,
    }),
    [session, loading, signUp, signIn, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
