import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { groupApi } from '../api/group'
import { useAuth } from '../contexts/AuthContext'
import type { GroupDetail } from '../types'

export default function GroupDetailPage() {
  const { groupId } = useParams<{ groupId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [detail, setDetail] = useState<GroupDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // 이름 변경
  const [editingName, setEditingName] = useState(false)
  const [newName, setNewName] = useState('')
  const [nameLoading, setNameLoading] = useState(false)

  // 초대
  const [showInvite, setShowInvite] = useState(false)
  const [inviteInput, setInviteInput] = useState('')
  const [inviteEmails, setInviteEmails] = useState<string[]>([])
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteError, setInviteError] = useState('')

  const id = Number(groupId)

  const load = () => {
    setLoading(true)
    groupApi.getDetail(id)
      .then(res => {
        setDetail(res.data)
        setNewName(res.data.groupName)
      })
      .catch(() => setError('그룹 정보를 불러올 수 없어요.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [id])

  const isLeader = detail?.members.find(m => m.userId === user?.id)?.role === 'LEADER'
  const isActive = detail?.status === 'ACTIVE'

  const handleChangeName = async () => {
    if (!newName.trim()) return
    setNameLoading(true)
    try {
      await groupApi.changeName(id, newName.trim())
      setEditingName(false)
      load()
    } catch {
      // 실패해도 무시
    } finally {
      setNameLoading(false)
    }
  }

  const addEmail = () => {
    const email = inviteInput.trim()
    if (!email || inviteEmails.includes(email)) { setInviteInput(''); return }
    setInviteEmails(prev => [...prev, email])
    setInviteInput('')
  }

  const handleInvite = async () => {
    if (inviteEmails.length === 0) { setInviteError('초대할 이메일을 입력해주세요.'); return }
    setInviteLoading(true)
    setInviteError('')
    try {
      await groupApi.invite(id, inviteEmails)
      setShowInvite(false)
      setInviteEmails([])
    } catch {
      setInviteError('초대 발송에 실패했어요.')
    } finally {
      setInviteLoading(false)
    }
  }

  const handleKick = async (targetUserId: number, name: string) => {
    if (!confirm(`${name}님을 강퇴할까요?`)) return
    try {
      await groupApi.kick(id, targetUserId)
      load()
    } catch {
      alert('강퇴에 실패했어요.')
    }
  }

  const handleTransferLeader = async (targetUserId: number, name: string) => {
    if (!confirm(`${name}님에게 그룹장을 위임할까요?`)) return
    try {
      await groupApi.transferLeader(id, targetUserId)
      load()
    } catch {
      alert('그룹장 위임에 실패했어요.')
    }
  }

  const handleLeave = async () => {
    if (!confirm('그룹에서 나갈까요?')) return
    try {
      await groupApi.leave(id)
      navigate('/groups', { replace: true })
    } catch (err: any) {
      if (err?.response?.status === 400) {
        alert('그룹장은 먼저 그룹장을 위임한 후 나갈 수 있어요.')
      } else {
        alert('그룹 나가기에 실패했어요.')
      }
    }
  }

  const handleDisband = async () => {
    if (!confirm('그룹을 해산할까요? 이 작업은 되돌릴 수 없어요.')) return
    try {
      await groupApi.disband(id)
      navigate('/groups', { replace: true })
    } catch {
      alert('그룹 해산에 실패했어요.')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: '#4AAFCC', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  if (error || !detail) {
    return (
      <div className="px-4 py-5">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-gray-500 mb-4">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          뒤로
        </button>
        <p className="text-sm text-gray-400">{error || '그룹을 찾을 수 없어요.'}</p>
      </div>
    )
  }

  return (
    <div className="px-4 py-5 flex flex-col gap-5 pb-20">
      {/* 헤더 */}
      <div className="flex items-center gap-2">
        <button onClick={() => navigate(-1)} className="p-1">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {editingName && isLeader && isActive ? (
          <div className="flex-1 flex gap-2">
            <input
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleChangeName() }}
              autoFocus
            />
            <button onClick={handleChangeName} disabled={nameLoading}
              className="px-3 py-2 rounded-xl text-white text-xs font-medium"
              style={{ background: '#4AAFCC' }}>
              저장
            </button>
            <button onClick={() => setEditingName(false)}
              className="px-3 py-2 rounded-xl text-gray-500 text-xs border border-gray-200">
              취소
            </button>
          </div>
        ) : (
          <div className="flex-1 flex items-center gap-2">
            <h1 className="text-lg font-bold text-gray-800">{detail.groupName}</h1>
            {detail.status === 'DISBANDED' && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-400">해산</span>
            )}
            {isLeader && isActive && (
              <button onClick={() => setEditingName(true)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="#AAAAAA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="#AAAAAA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>

      {/* 멤버 목록 */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-500">
            멤버 {detail.members.filter(m => m.status === 'ACTIVE').length}명
          </h2>
          {isLeader && isActive && (
            <button
              onClick={() => setShowInvite(true)}
              className="text-xs px-3 py-1.5 rounded-lg text-white font-medium"
              style={{ background: '#4AAFCC' }}
            >
              + 초대
            </button>
          )}
        </div>

        <div className="flex flex-col gap-2">
          {detail.members.filter(m => m.status === 'ACTIVE').map(member => (
            <div key={member.userId}
              className="bg-white rounded-2xl px-4 py-3 flex items-center gap-3 shadow-sm">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                style={{ background: member.role === 'LEADER' ? 'linear-gradient(135deg, #E85D2F, #FF7B52)' : 'linear-gradient(135deg, #4AAFCC, #72C9E0)' }}>
                {member.userName.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800">{member.userName}</p>
                {member.aliasName && (
                  <p className="text-xs text-gray-400">별칭: {member.aliasName}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-0.5 rounded-full"
                  style={{
                    background: member.role === 'LEADER' ? '#FFF3F0' : '#F0FAFD',
                    color: member.role === 'LEADER' ? '#E85D2F' : '#4AAFCC',
                  }}>
                  {member.role === 'LEADER' ? '그룹장' : '멤버'}
                </span>
                {isLeader && isActive && member.userId !== user?.id && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleTransferLeader(member.userId, member.userName)}
                      className="text-xs px-2 py-1 rounded-lg border border-gray-200 text-gray-500">
                      위임
                    </button>
                    <button
                      onClick={() => handleKick(member.userId, member.userName)}
                      className="text-xs px-2 py-1 rounded-lg border text-red-400"
                      style={{ borderColor: '#FFDDDD' }}>
                      강퇴
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 하단 액션 */}
      {isActive && (
        <section className="flex flex-col gap-2 pt-2">
          <button
            onClick={handleLeave}
            className="w-full py-3 rounded-2xl text-sm font-medium border border-gray-200 text-gray-600">
            그룹 나가기
          </button>
          {isLeader && (
            <button
              onClick={handleDisband}
              className="w-full py-3 rounded-2xl text-sm font-medium text-red-500"
              style={{ background: '#FFF5F5', border: '1px solid #FFDDDD' }}>
              그룹 해산
            </button>
          )}
        </section>
      )}

      {/* 초대 모달 */}
      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: 'rgba(0,0,0,0.4)' }}
          onClick={() => setShowInvite(false)}>
          <div
            className="w-full max-w-[480px] bg-white rounded-t-2xl flex flex-col"
            style={{ maxHeight: '80dvh' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="px-5 pt-5 pb-2 flex-shrink-0">
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
              <h2 className="text-base font-bold text-gray-800">멤버 초대</h2>
            </div>

            <div className="px-5 flex flex-col gap-3 overflow-y-auto flex-1 min-h-0">
              <div className="flex gap-2">
                <input
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none"
                  placeholder="이메일 입력 후 추가"
                  value={inviteInput}
                  onChange={e => setInviteInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addEmail() } }}
                />
                <button onClick={addEmail}
                  className="px-4 py-3 rounded-xl text-sm font-medium text-white"
                  style={{ background: '#4AAFCC' }}>
                  추가
                </button>
              </div>
              {inviteEmails.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {inviteEmails.map(email => (
                    <span key={email}
                      className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-full"
                      style={{ background: '#F0FAFD', color: '#4AAFCC' }}>
                      {email}
                      <button onClick={() => setInviteEmails(prev => prev.filter(e => e !== email))}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                          <path d="M18 6L6 18M6 6l12 12" stroke="#4AAFCC" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
              )}
              {inviteError && <p className="text-xs text-red-500">{inviteError}</p>}
            </div>

            <div className="px-5 pt-3 pb-8 flex-shrink-0">
              <button
                onClick={handleInvite}
                disabled={inviteLoading}
                className="w-full py-3 rounded-xl text-white font-semibold text-sm"
                style={{ background: inviteLoading ? '#CCCCCC' : '#4AAFCC' }}>
                {inviteLoading ? '초대 중...' : '초대 보내기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
