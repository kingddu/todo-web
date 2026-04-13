import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { groupApi } from "../api/group";
import { useAuth } from "../contexts/AuthContext";
import type { GroupDetail } from "../types";

function validateEmail(email: string): string | null {
  if (!/^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,63}$/.test(email))
    return "올바른 이메일 형식이 아니에요. (예: example@gmail.com)";
  if (/\.\./.test(email)) return "이메일에 점(.)이 연속으로 올 수 없어요.";
  const domain = email.split("@")[1];
  if (domain.startsWith(".") || domain.endsWith(".") || domain.startsWith("-"))
    return "도메인 형식이 올바르지 않아요.";
  return null;
}

export default function GroupDetailPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [detail, setDetail] = useState<GroupDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 그룹명(alias) 편집
  const [editingAlias, setEditingAlias] = useState(false);
  const [newAlias, setNewAlias] = useState("");
  const [aliasLoading, setAliasLoading] = useState(false);
  const [aliasError, setAliasError] = useState("");

  // 그룹 소개 편집
  const [editingDesc, setEditingDesc] = useState(false);
  const [newDesc, setNewDesc] = useState("");
  const [descLoading, setDescLoading] = useState(false);
  const [descError, setDescError] = useState("");

  // 멤버 필터
  const [filter, setFilter] = useState<"all" | "members" | "pending">("all");

  // 초대
  const [showInvite, setShowInvite] = useState(false);
  const [inviteInput, setInviteInput] = useState("");
  const [inviteEmails, setInviteEmails] = useState<string[]>([]);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [addEmailError, setAddEmailError] = useState("");

  const id = Number(groupId);

  const load = () => {
    setLoading(true);
    groupApi
      .getDetail(id)
      .then((res) => {
        setDetail(res.data);
        const myMember = res.data.members.find(
          (m) => m.userId === user?.userId,
        );
        setNewAlias(myMember?.aliasName ?? "");
      })
      .catch(() => setError("그룹 정보를 불러올 수 없어요."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [id]);

  const isLeader = detail?.leaderUserId === user?.userId;
  const isActive = detail?.groupStatus === "ACTIVE";

  // 내 alias 또는 원래 그룹명
  const displayName = (() => {
    if (!detail) return "";
    const myMember = detail.members.find((m) => m.userId === user?.userId);
    return myMember?.aliasName || detail.groupName;
  })();

  const handleChangeAlias = async () => {
    if (
      !newAlias.trim() &&
      !window.confirm(
        "그룹명을 비워두면 원래 그룹명으로 표시됩니다. 계속할까요?",
      )
    )
      return;
    setAliasLoading(true);
    setAliasError("");
    try {
      await groupApi.changeAlias(id, newAlias.trim());
      setEditingAlias(false);
      load();
    } catch (err: any) {
      if (err?.response?.status === 400) {
        setAliasError("이미 설정한 그룹명입니다. 다시 입력해주세요.");
      } else {
        setAliasError("그룹명 변경에 실패했어요.");
      }
    } finally {
      setAliasLoading(false);
    }
  };

  const addEmail = () => {
    const email = inviteInput.trim();
    setAddEmailError("");
    if (!email) return;
    const err = validateEmail(email);
    if (err) {
      setAddEmailError(err);
      return;
    }
    if (!inviteEmails.includes(email)) {
      setInviteEmails((prev) => [...prev, email]);
    }
    setInviteInput("");
  };

  const handleInvite = async () => {
    if (inviteEmails.length === 0) {
      setInviteError("초대할 이메일을 입력해주세요.");
      return;
    }
    setInviteLoading(true);
    setInviteError("");
    try {
      await groupApi.invite(id, inviteEmails);
      setShowInvite(false);
      setInviteEmails([]);
      load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setInviteError(msg ?? "초대 발송에 실패했어요.");
    } finally {
      setInviteLoading(false);
    }
  };

  const handleKick = async (targetUserId: number, name: string) => {
    if (!confirm(`${name}님을 강퇴할까요?`)) return;
    try {
      await groupApi.kick(id, targetUserId);
      load();
    } catch {
      alert("강퇴에 실패했어요.");
    }
  };

  const handleTransferLeader = async (targetUserId: number) => {
    try {
      await groupApi.transferLeader(id, targetUserId);
      load();
    } catch {
      alert("그룹장 위임에 실패했어요.");
    }
  };

  const handleLeave = async () => {
    if (isLeader) {
      alert(
        "그룹원에게 그룹장을 위임하고 나가셔야 합니다. 그룹장을 위임해주세요.",
      );
      return;
    }
    if (!confirm("그룹에서 나갈까요?")) return;
    try {
      await groupApi.leave(id);
      navigate("/groups", { replace: true });
    } catch {
      alert("그룹 나가기에 실패했어요.");
    }
  };

  const handleChangeDescription = async () => {
    setDescLoading(true);
    setDescError("");
    try {
      await groupApi.changeDescription(id, newDesc.trim());
      setEditingDesc(false);
      load();
    } catch {
      setDescError("소개 변경에 실패했어요.");
    } finally {
      setDescLoading(false);
    }
  };

  const handleCancelInvitation = async (invitationId: number) => {
    if (!confirm("이 초대를 취소할까요?")) return;
    try {
      await groupApi.cancelInvitation(id, invitationId);
      load();
    } catch {
      alert("초대 취소에 실패했어요.");
    }
  };

  const handleDisband = async () => {
    if (!confirm("그룹을 해산할까요? 이 작업은 되돌릴 수 없어요.")) return;
    try {
      await groupApi.disband(id);
      navigate("/groups", { replace: true });
    } catch {
      alert("그룹 해산에 실패했어요.");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div
          className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: "#4AAFCC", borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="px-4 py-5">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-sm text-gray-500 mb-4"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M15 18l-6-6 6-6"
              stroke="#555"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          뒤로
        </button>
        <p className="text-sm text-gray-400">
          {error || "그룹을 찾을 수 없어요."}
        </p>
      </div>
    );
  }

  // 그룹장 → 멤버(joinedAt 빠른 순, 백엔드 정렬 유지) → 대기중(createdAt 빠른 순, 백엔드 정렬 유지)
  type DisplayItem =
    | { kind: "member"; data: (typeof detail.members)[0] }
    | { kind: "pending"; data: (typeof detail.pendingInvitations)[0] };

  const leaderItems: DisplayItem[] = detail.members
    .filter((m) => m.role === "LEADER")
    .map((m) => ({ kind: "member" as const, data: m }));
  const memberItems: DisplayItem[] = detail.members
    .filter((m) => m.role !== "LEADER")
    .map((m) => ({ kind: "member" as const, data: m }));
  const pendingItems: DisplayItem[] = detail.pendingInvitations.map((p) => ({
    kind: "pending" as const,
    data: p,
  }));

  const allItems: DisplayItem[] = [
    ...leaderItems,
    ...memberItems,
    ...pendingItems,
  ];
  const displayItems =
    filter === "members"
      ? [...leaderItems, ...memberItems]
      : filter === "pending"
        ? pendingItems
        : allItems;

  return (
    <div className="px-4 py-5 flex flex-col gap-5 pb-20">
      {/* 헤더 */}
      <div className="flex gap-2">
        <button onClick={() => navigate(-1)} className="p-1 mt-0.5 shrink-0">
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

        <div className="flex-1 min-w-0">
          {editingAlias && isActive ? (
            <div className="flex flex-col gap-1">
              <div className="flex gap-2">
                <input
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none"
                  placeholder={detail.groupName}
                  value={newAlias}
                  maxLength={100}
                  onChange={(e) => {
                    setNewAlias(e.target.value);
                    setAliasError("");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleChangeAlias();
                  }}
                  autoFocus
                />
                <button
                  onClick={handleChangeAlias}
                  disabled={aliasLoading}
                  className="px-3 py-2 rounded-xl text-white text-xs font-medium"
                  style={{ background: "#4AAFCC" }}
                >
                  저장
                </button>
                <button
                  onClick={() => {
                    setEditingAlias(false);
                    setAliasError("");
                  }}
                  className="px-3 py-2 rounded-xl text-gray-500 text-xs border border-gray-200"
                >
                  취소
                </button>
              </div>
              {aliasError && (
                <p className="text-xs text-red-500 px-1">{aliasError}</p>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-gray-800">{displayName}</h1>
              {detail.groupStatus === "DISBANDED" && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-400">
                  해산
                </span>
              )}
              {isActive && (
                <button onClick={() => setEditingAlias(true)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"
                      stroke="#AAAAAA"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
                      stroke="#AAAAAA"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              )}
            </div>
          )}

          {editingDesc ? (
            <div className="flex flex-col gap-1 mt-2">
              <div className="flex gap-2">
                <input
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none"
                  placeholder="그룹 소개를 입력하세요 (최대 25자)"
                  maxLength={25}
                  value={newDesc}
                  onChange={(e) => {
                    setNewDesc(e.target.value);
                    setDescError("");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleChangeDescription();
                    if (e.key === "Escape") {
                      setEditingDesc(false);
                      setDescError("");
                    }
                  }}
                  autoFocus
                />
                <button
                  onClick={handleChangeDescription}
                  disabled={descLoading}
                  className="px-3 py-2 rounded-xl text-white text-xs font-medium"
                  style={{ background: "#4AAFCC" }}
                >
                  저장
                </button>
                <button
                  onClick={() => {
                    setEditingDesc(false);
                    setDescError("");
                  }}
                  className="px-3 py-2 rounded-xl text-gray-500 text-xs border border-gray-200"
                >
                  취소
                </button>
              </div>
              <div className="flex items-center justify-between px-1">
                {descError ? (
                  <p className="text-xs text-red-500">{descError}</p>
                ) : (
                  <span />
                )}
                <span className="text-xs text-gray-400">
                  {newDesc.length}/25
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 mt-2">
              {detail.description ? (
                <p className="text-sm text-gray-500">{detail.description}</p>
              ) : (
                isLeader &&
                isActive && (
                  <p className="text-sm text-gray-400 italic">소개 없음</p>
                )
              )}
              {isLeader && isActive && (
                <button
                  onClick={() => {
                    setNewDesc(detail.description ?? "");
                    setEditingDesc(true);
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"
                      stroke="#CCCCCC"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
                      stroke="#CCCCCC"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 그룹 소개 */}

      {/* 멤버 목록 */}
      <section>
        <div className="flex flex-col gap-2 mb-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-500">
              멤버 {detail.members.length}명
              {detail.pendingInvitations.length > 0 && (
                <span className="font-normal text-gray-400">
                  {" "}
                  · 대기중 {detail.pendingInvitations.length}명
                </span>
              )}
            </h2>
            {isLeader && detail?.groupStatus !== "DISBANDED" && (
              <button
                onClick={() => setShowInvite(true)}
                className="text-xs px-3 py-1.5 rounded-lg text-white font-medium"
                style={{ background: "#4AAFCC" }}
              >
                + 초대
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2 self-start">
            {(
              [
                { key: "all", label: "전체" },
                { key: "members", label: "멤버" },
                {
                  key: "pending",
                  label: `대기중${detail.pendingInvitations.length > 0 ? ` ${detail.pendingInvitations.length}` : ""}`,
                },
              ] as const
            ).map((item) => {
              const active = filter === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setFilter(item.key)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium transition-all active:scale-[0.98]"
                  style={{
                    background: active ? "#4AAFCC" : "#F3F4F6",
                    color: active ? "white" : "#6B7280",
                    border: active ? "1px solid #4AAFCC" : "1px solid #E5E7EB",
                    boxShadow: active
                      ? "0 2px 6px rgba(74, 175, 204, 0.15)"
                      : "none",
                  }}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {displayItems.map((item) => {
            if (item.kind === "pending") {
              const p = item.data;
              return (
                <div
                  key={`pending-${p.invitationId}`}
                  className="bg-white rounded-2xl px-4 py-3 flex items-center gap-3 shadow-sm"
                >
                  {p.profileImageUrl ? (
                    <img
                      src={p.profileImageUrl}
                      className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                      alt={p.userName}
                    />
                  ) : (
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                      style={{
                        background: "linear-gradient(135deg, #D1D5DB, #9CA3AF)",
                      }}
                    >
                      {p.userName.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-500">
                      {p.userName}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "#BBBBBB" }}>
                      {p.email}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: "#F3F4F6", color: "#9CA3AF" }}
                    >
                      대기중
                    </span>

                    {isLeader && isActive && (
                      <>
                        <div
                          className="w-px h-3.5 rounded-full"
                          style={{ background: "#9CA3AF" }}
                          aria-hidden="true"
                        />
                        <button
                          onClick={() => handleCancelInvitation(p.invitationId)}
                          className="text-xs px-2 py-1 rounded-lg border text-red-400"
                          style={{ borderColor: "#FFDDDD" }}
                        >
                          취소
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            }

            const member = item.data;
            const isMe = member.userId === user?.userId;
            return (
              <div
                key={member.userId}
                className="bg-white rounded-2xl px-4 py-3 flex items-center gap-3 shadow-sm"
              >
                {member.profileImageUrl ? (
                  <img
                    src={member.profileImageUrl}
                    className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                    alt={member.userName}
                  />
                ) : (
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                    style={{
                      background:
                        member.role === "LEADER"
                          ? "linear-gradient(135deg, #E85D2F, #FF7B52)"
                          : "linear-gradient(135deg, #4AAFCC, #72C9E0)",
                    }}
                  >
                    {member.userName.charAt(0)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-medium text-gray-800">
                      {member.userName}
                    </p>
                    {isMe && (
                      <span className="text-xs text-gray-400">(본인)</span>
                    )}
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: "#888888" }}>
                    {member.userEmail}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{
                      background:
                        member.role === "LEADER" ? "#FFF3F0" : "#F0FAFD",
                      color: member.role === "LEADER" ? "#E85D2F" : "#4AAFCC",
                    }}
                  >
                    {member.role === "LEADER" ? "그룹장" : "멤버"}
                  </span>

                  {isLeader && isActive && !isMe && (
                    <>
                      <div
                        className="w-px h-3.5 rounded-full"
                        style={{ background: "#9CA3AF" }}
                        aria-hidden="true"
                      />
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleTransferLeader(member.userId)}
                          className="text-xs px-2 py-1 rounded-lg border border-gray-200 text-gray-500"
                        >
                          위임
                        </button>
                        <button
                          onClick={() =>
                            handleKick(member.userId, member.userName)
                          }
                          className="text-xs px-2 py-1 rounded-lg border text-red-400"
                          style={{ borderColor: "#FFDDDD" }}
                        >
                          강퇴
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 하단 액션 */}
      {isActive && (
        <section className="flex flex-col gap-2 pt-2">
          <button
            onClick={handleLeave}
            className="w-full py-3 rounded-2xl text-sm font-medium border border-gray-200 text-gray-600"
          >
            그룹 나가기
          </button>
          {isLeader && (
            <button
              onClick={handleDisband}
              className="w-full py-3 rounded-2xl text-sm font-medium text-red-500"
              style={{ background: "#FFF5F5", border: "1px solid #FFDDDD" }}
            >
              그룹 해산
            </button>
          )}
        </section>
      )}

      {/* 초대 모달 */}
      {showInvite && (
        <div
          className="fixed inset-0 z-[120] bg-black/40"
          onClick={() => setShowInvite(false)}
        >
          <div
            className="flex h-full items-end justify-center px-3 sm:px-4"
            style={{
              paddingBottom:
                "max(calc(env(safe-area-inset-bottom, 0px) + 120px), 16dvh)",
            }}
          >
            <div
              className="w-full max-w-[480px] bg-white rounded-[28px] shadow-2xl flex flex-col"
              style={{
                height: "clamp(280px, 32dvh, 360px)",
                maxHeight: "40dvh",
                paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)",
                transform: "translateY(clamp(-210px, -22dvh, -150px))",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-5 pt-4 pb-3 flex-shrink-0">
                <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />

                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-gray-800">
                    멤버 초대
                  </h2>

                  <button
                    type="button"
                    onClick={() => setShowInvite(false)}
                    className="w-9 h-9 -mr-1 rounded-full flex items-center justify-center transition-colors active:bg-gray-100"
                    aria-label="닫기"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M18 6L6 18M6 6l12 12"
                        stroke="#9CA3AF"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="px-5 pb-3 flex-1 min-h-0 overflow-y-auto overscroll-contain">
                <div className="flex items-center gap-2">
                  <input
                    className="flex-1 min-w-0 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none"
                    placeholder="이메일 입력 후 추가"
                    value={inviteInput}
                    maxLength={100}
                    onChange={(e) => {
                      setInviteInput(e.target.value);
                      setAddEmailError("");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addEmail();
                      }
                    }}
                  />
                  <button
                    onClick={addEmail}
                    className="shrink-0 min-w-[72px] px-4 py-3 rounded-xl text-sm font-medium text-white"
                    style={{ background: "#4AAFCC" }}
                  >
                    추가
                  </button>
                </div>
                {addEmailError && (
                  <p className="mt-1.5 text-xs text-red-500">{addEmailError}</p>
                )}

                {inviteEmails.length > 0 && (
                  <div className="mt-3 flex max-h-28 flex-wrap gap-2 overflow-y-auto">
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

                {inviteError && (
                  <p className="mt-2 text-xs text-red-500">{inviteError}</p>
                )}
              </div>

              <div className="px-5 pt-2 flex-shrink-0">
                <button
                  onClick={handleInvite}
                  disabled={inviteLoading}
                  className="w-full py-3 rounded-xl text-white font-semibold text-sm"
                  style={{ background: inviteLoading ? "#CCCCCC" : "#4AAFCC" }}
                >
                  {inviteLoading ? "초대 중..." : "초대 보내기"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
