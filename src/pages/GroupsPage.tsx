import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { groupApi } from "../api/group";
import { useInvitations } from "../contexts/InvitationContext";
import { useAuth } from "../contexts/AuthContext";
import type { MyGroupSummary } from "../types";

export default function GroupsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { invitations, refresh: refreshInvitations } = useInvitations();
  const [groups, setGroups] = useState<MyGroupSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [respondingId, setRespondingId] = useState<number | null>(null);

  // 고정 그룹
  const pinKey = user?.userId ? `pinnedGroupId_${user.userId}` : null;
  const [pinnedGroupId, setPinnedGroupId] = useState<number | undefined>(() => {
    if (!user?.userId) return undefined;
    const v = localStorage.getItem(`pinnedGroupId_${user.userId}`);
    return v ? Number(v) : undefined;
  });

  const handleTogglePin = (groupId: number) => {
    if (!pinKey) return;
    if (pinnedGroupId === groupId) {
      localStorage.removeItem(pinKey);
      setPinnedGroupId(undefined);
    } else {
      localStorage.setItem(pinKey, String(groupId));
      setPinnedGroupId(groupId);
    }
  };

  // 그룹 생성 모달
  const [showCreate, setShowCreate] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [inviteInput, setInviteInput] = useState("");
  const [inviteEmails, setInviteEmails] = useState<string[]>([]);
  const [createError, setCreateError] = useState("");
  const [creating, setCreating] = useState(false);

  const loadGroups = useCallback(() => {
    setLoading(true);
    groupApi
      .getMyGroups()
      .then((res) => setGroups(res.data))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  const addEmail = () => {
    const email = inviteInput.trim();
    if (!email || inviteEmails.includes(email)) {
      setInviteInput("");
      return;
    }
    setInviteEmails((prev) => [...prev, email]);
    setInviteInput("");
  };

  const handleCreate = async () => {
    if (!groupName.trim()) {
      setCreateError("그룹 이름을 입력해주세요.");
      return;
    }

    setCreating(true);
    setCreateError("");

    try {
      await groupApi.create({ groupName: groupName.trim(), description: groupDescription.trim() || undefined, inviteEmails });
      setShowCreate(false);
      setGroupName("");
      setGroupDescription("");
      setInviteEmails([]);
      loadGroups();
    } catch (err: any) {
      if (err?.response?.status === 409) {
        setCreateError("이미 같은 이름의 그룹이 있어요.");
      } else {
        setCreateError("그룹 생성에 실패했어요.");
      }
    } finally {
      setCreating(false);
    }
  };

  const handleAccept = async (invitationId: number) => {
    setRespondingId(invitationId);
    try {
      await groupApi.acceptInvitation(invitationId);
      refreshInvitations();
      loadGroups();
    } catch {
      alert("수락에 실패했어요. 초대가 만료되었을 수 있습니다.");
      refreshInvitations();
    } finally {
      setRespondingId(null);
    }
  };

  const handleReject = async (invitationId: number) => {
    setRespondingId(invitationId);
    try {
      await groupApi.rejectInvitation(invitationId);
      refreshInvitations();
    } catch {
      alert("거절에 실패했어요.");
    } finally {
      setRespondingId(null);
    }
  };

  const roleLabel = (role: string) => (role === "LEADER" ? "그룹장" : "멤버");

  const statusBadge = (status: string) =>
    status === "DISBANDED" ? (
      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-400">
        해산
      </span>
    ) : null;

  const sortedGroups = [...groups].sort((a, b) => {
    if (a.groupId === pinnedGroupId) return -1;
    if (b.groupId === pinnedGroupId) return 1;
    return (a.aliasName || a.groupName).localeCompare(
      b.aliasName || b.groupName,
      "ko",
    );
  });

  const hasInvitations = invitations.length > 0;
  const hasGroups = groups.length > 0;
  const showEmpty = !hasInvitations && !hasGroups;

  return (
    <div className="px-4 py-5 flex flex-col gap-4 pb-20">
      {/* 헤더 */}
      <div className="flex items-center gap-2">
        <button onClick={() => navigate(-1)} className="p-1">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M15 18l-6-6 6-6"
              stroke="#333"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <h1 className="text-lg font-bold text-gray-800 flex-1">그룹 관리</h1>

        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-white text-sm font-medium"
          style={{ background: "#E85D2F" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 5v14M5 12h14"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
          그룹 만들기
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div
            className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: "#4AAFCC", borderTopColor: "transparent" }}
          />
        </div>
      ) : (
        <>
          {/* 그룹 초대 섹션 */}
          {hasInvitations && (
            <div className="flex flex-col gap-3">
              <h2 className="text-sm font-semibold text-gray-500">
                받은 그룹 초대{" "}
                <span
                  className="ml-1 text-xs px-2 py-0.5 rounded-full text-white font-semibold"
                  style={{ background: "#E85D2F" }}
                >
                  {invitations.length}
                </span>
              </h2>

              {invitations.map((inv) => {
                const isResponding = respondingId === inv.invitationId;
                return (
                  <div
                    key={inv.invitationId}
                    className="bg-white rounded-2xl px-4 py-4 shadow-sm border-l-4 flex flex-col gap-3"
                    style={{ borderLeftColor: "#E85D2F" }}
                  >
                    {/* 그룹명 + 소개 + 초대자 */}
                    <div>
                      <p className="text-base font-bold text-gray-800">
                        {inv.groupName}
                      </p>
                      {inv.description && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          소개:{" "}
                          <span className="font-medium">{inv.description}</span>
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-0.5">
                        초대자:{" "}
                        <span className="font-medium text-gray-600">
                          {inv.invitedByUserName}
                        </span>
                        <span className="ml-1 text-gray-400">
                          {inv.invitedByUserEmail}
                        </span>
                      </p>
                    </div>

                    {/* 승낙 / 거절 버튼 */}
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => handleAccept(inv.invitationId)}
                        disabled={isResponding}
                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity active:opacity-80 disabled:opacity-50"
                        style={{ background: "#4AAFCC" }}
                      >
                        {isResponding ? "처리 중..." : "수락"}
                      </button>
                      <button
                        onClick={() => handleReject(inv.invitationId)}
                        disabled={isResponding}
                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-500 bg-gray-100 transition-opacity active:opacity-80 disabled:opacity-50"
                      >
                        {isResponding ? "처리 중..." : "거절"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 내 그룹 섹션 */}
          {hasGroups && (
            <div className="flex flex-col gap-3">
              {hasInvitations && (
                <h2 className="text-sm font-semibold text-gray-500">내 그룹</h2>
              )}
              {sortedGroups.map((g) => {
                const isPinned = g.groupId === pinnedGroupId;
                const iconColor =
                  g.status === "DISBANDED" ? "#AAAAAA" : "#4AAFCC";

                return (
                  <div
                    key={g.groupId}
                    className="bg-white rounded-2xl shadow-sm border-l-4 overflow-hidden cursor-pointer"
                    style={{
                      borderLeftColor: isPinned
                        ? "#E85D2F"
                        : g.status === "DISBANDED"
                          ? "#CCCCCC"
                          : "#4AAFCC",
                    }}
                    onClick={() => navigate(`/groups/${g.groupId}`)}
                  >
                    <div className="flex items-center gap-3 px-4 py-4">
                      {/* 프로필 */}
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{
                          background:
                            g.status === "DISBANDED" ? "#F5F5F5" : "#F0FAFD",
                        }}
                      >
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <path
                            d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"
                            stroke={iconColor}
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <circle
                            cx="9"
                            cy="7"
                            r="4"
                            stroke={iconColor}
                            strokeWidth="2"
                          />
                          <path
                            d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"
                            stroke={iconColor}
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>

                      {/* 텍스트 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-gray-800 truncate">
                            {g.aliasName || g.groupName}
                          </p>
                          {statusBadge(g.status)}
                        </div>

                        <p className="text-xs text-gray-400 mt-0.5 truncate">
                          {g.aliasName ? `원래 이름: ${g.groupName}` : ""}
                          {g.aliasName ? " · " : ""}
                          {roleLabel(g.myRole)}
                        </p>
                      </div>

                      {/* 오른쪽 액션: 핀 -> 화살표 */}
                      <div className="flex items-center flex-shrink-0 pr-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTogglePin(g.groupId);
                          }}
                          className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
                          style={{
                            background: isPinned ? "#FFF0EC" : "transparent",
                          }}
                          aria-label={isPinned ? "고정 해제" : "그룹 고정"}
                          title={isPinned ? "고정 해제" : "그룹 고정"}
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                          >
                            <line
                              x1="12"
                              y1="14"
                              x2="12"
                              y2="21"
                              stroke={isPinned ? "#E85D2F" : "#B8B8BD"}
                              strokeWidth="2"
                              strokeLinecap="round"
                            />
                            <line
                              x1="6"
                              y1="14"
                              x2="18"
                              y2="14"
                              stroke={isPinned ? "#E85D2F" : "#B8B8BD"}
                              strokeWidth="2"
                              strokeLinecap="round"
                            />
                            <path
                              d="M9 4h6v5l2.5 5H6.5L9 9z"
                              stroke={isPinned ? "#E85D2F" : "#B8B8BD"}
                              fill={isPinned ? "#FFF0EC" : "none"}
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>

                        <div className="w-6 h-10 ml-2 flex items-center justify-center pointer-events-none">
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                          >
                            <path
                              d="M9 18l6-6-6-6"
                              stroke="#AAAAAA"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 비어있을 때 */}
          {showEmpty && (
            <div className="flex flex-col items-center py-16 gap-3">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: "#F0FAFD" }}
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"
                    stroke="#4AAFCC"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle
                    cx="9"
                    cy="7"
                    r="4"
                    stroke="#4AAFCC"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"
                    stroke="#4AAFCC"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              <p className="text-sm text-gray-400">
                아직 참여 중인 그룹이 없어요
              </p>

              <button
                onClick={() => setShowCreate(true)}
                className="text-sm font-semibold"
                style={{ color: "#4AAFCC" }}
              >
                첫 그룹 만들기
              </button>
            </div>
          )}
        </>
      )}

      {/* 그룹 생성 모달 */}
      {showCreate && (
        <div
          className="fixed inset-0 z-50 bg-black/40"
          onClick={() => setShowCreate(false)}
        >
          <div
            className="absolute inset-x-4 mx-auto max-w-[480px] overflow-hidden rounded-2xl bg-white shadow-xl flex flex-col"
            style={{
              top: "clamp(170px, 24vh, 250px)",
              bottom: "clamp(110px, 14vh, 150px)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 pt-5 pb-3 flex-shrink-0 border-b border-gray-100 bg-white">
              <h2 className="text-xl font-bold text-gray-800">
                새 그룹 만들기
              </h2>
            </div>

            <div className="px-5 py-4 flex flex-col gap-4 overflow-y-auto flex-1 min-h-0">
              <input
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none transition-colors"
                style={{ outlineColor: "#4AAFCC" }}
                placeholder="그룹 이름 *"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
              />
              <div className="relative">
                <input
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-14 text-sm outline-none transition-colors"
                  style={{ outlineColor: "#4AAFCC" }}
                  placeholder="그룹 소개 (선택, 25자 이내)"
                  value={groupDescription}
                  maxLength={25}
                  onChange={(e) => setGroupDescription(e.target.value)}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-300 tabular-nums">
                  {groupDescription.length}/25
                </span>
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1.5 block">
                  초대할 멤버 이메일
                </label>

                <div className="flex gap-2">
                  <input
                    className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none transition-colors"
                    placeholder="이메일 입력 후 추가"
                    value={inviteInput}
                    onChange={(e) => setInviteInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addEmail();
                      }
                    }}
                  />

                  <button
                    onClick={addEmail}
                    className="px-4 py-3 rounded-xl text-sm font-medium text-white"
                    style={{ background: "#4AAFCC" }}
                  >
                    추가
                  </button>
                </div>

                {inviteEmails.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {inviteEmails.map((email) => (
                      <span
                        key={email}
                        className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-full"
                        style={{ background: "#F0FAFD", color: "#4AAFCC" }}
                      >
                        {email}
                        <button
                          onClick={() =>
                            setInviteEmails((prev) =>
                              prev.filter((e) => e !== email),
                            )
                          }
                        >
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                          >
                            <path
                              d="M18 6L6 18M6 6l12 12"
                              stroke="#4AAFCC"
                              strokeWidth="2"
                              strokeLinecap="round"
                            />
                          </svg>
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {createError && (
                <p className="text-sm text-red-500">{createError}</p>
              )}
            </div>

            <div className="px-5 pt-3 pb-5 flex-shrink-0 border-t border-gray-100 bg-white rounded-b-2xl">
              <button
                onClick={handleCreate}
                disabled={creating}
                className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-opacity active:opacity-80 disabled:cursor-not-allowed"
                style={{ background: creating ? "#CCCCCC" : "#4AAFCC" }}
              >
                {creating ? "생성 중..." : "그룹 만들기"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
