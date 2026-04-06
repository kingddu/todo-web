import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { groupApi } from '../api/group'
import type { GroupInvitationSummary } from '../types'
import { useAuth } from './AuthContext'

interface InvitationContextValue {
  invitations: GroupInvitationSummary[]
  count: number
  refresh: () => void
}

const InvitationContext = createContext<InvitationContextValue>({
  invitations: [],
  count: 0,
  refresh: () => {},
})

export function InvitationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [invitations, setInvitations] = useState<GroupInvitationSummary[]>([])

  const refresh = useCallback(() => {
    if (!user) { setInvitations([]); return }
    groupApi.getMyInvitations()
      .then(res => setInvitations(res.data))
      .catch(() => {})
  }, [user])

  useEffect(() => {
    refresh()
  }, [refresh])

  return (
    <InvitationContext.Provider value={{ invitations, count: invitations.length, refresh }}>
      {children}
    </InvitationContext.Provider>
  )
}

export const useInvitations = () => useContext(InvitationContext)
