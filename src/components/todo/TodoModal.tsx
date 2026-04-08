import { useState, useEffect, useRef } from "react";
import type {
  Todo,
  TodoType,
  TodoCreatePayload,
  TodoPatchPayload,
  MyGroupSummary,
} from "../../types";
import { todoApi } from "../../api/todo";
import { groupApi } from "../../api/group";
import { useAuth } from "../../contexts/AuthContext";
import TodoEditLogModal from "./TodoEditLogModal";
import { getEditLogVisible } from "../../pages/SettingsPage";

interface Props {
  date: string;
  todo?: Todo | null;
  onClose: () => void;
  onSave: (todo: Todo) => void;
}

export default function TodoModal({ date, todo, onClose, onSave }: Props) {
  const isEdit = !!todo;
  const { user } = useAuth();
  const [showLogModal, setShowLogModal] = useState(false);
  const editBadgeVisible =
    isEdit &&
    todo &&
    todo.editCount > 0 &&
    !!user &&
    getEditLogVisible(user.userId, todo.groupId ? "group" : "personal");

  const [title, setTitle] = useState(todo?.title ?? "");
  const [content, setContent] = useState(todo?.content ?? "");
  const [category, setCategory] = useState(todo?.category ?? "");
  const [type, setType] = useState<TodoType>(
    todo?.type === "DEADLINE" ? "RANGE" : (todo?.type ?? "DATE_ONLY"),
  );
  const [startDate, setStartDate] = useState(todo?.startDate ?? date);
  const [endDate, setEndDate] = useState(todo?.endDate ?? date);
  const [carryOver, setCarryOver] = useState(todo?.carryOver ?? false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 그룹 선택 (신규 todo만)
  const [groups, setGroups] = useState<MyGroupSummary[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<number | undefined>(
    undefined,
  );
  const [groupOpen, setGroupOpen] = useState(false);
  const groupDropdownRef = useRef<HTMLDivElement>(null);

  const pinnedGroupId = user?.userId
    ? Number(localStorage.getItem(`pinnedGroupId_${user.userId}`)) || undefined
    : undefined;

  useEffect(() => {
    if (!isEdit) {
      groupApi
        .getMyGroups()
        .then((res) => {
          const eligible = res.data.filter(
            (g) => g.status === "ACTIVE" && g.activeMemberCount >= 2,
          );
          // 고정 그룹 먼저, 나머지는 가나다 순
          eligible.sort((a, b) => {
            if (a.groupId === pinnedGroupId) return -1;
            if (b.groupId === pinnedGroupId) return 1;
            return (a.aliasName || a.groupName).localeCompare(
              b.aliasName || b.groupName,
              "ko",
            );
          });
          setGroups(eligible);
        })
        .catch(() => {});
    }
  }, [isEdit]);

  // 드롭다운 바깥 클릭 시 닫기
  useEffect(() => {
    if (!groupOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        groupDropdownRef.current &&
        !groupDropdownRef.current.contains(e.target as Node)
      ) {
        setGroupOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [groupOpen]);

  useEffect(() => {
    if (type === "DATE_ONLY") {
      setEndDate(startDate);
    }
  }, [type, startDate]);

  const selectedGroup = groups.find((g) => g.groupId === selectedGroupId);

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError("제목을 입력해주세요.");
      return;
    }
    if (startDate > endDate) {
      setError("시작일이 종료일보다 늦을 수 없어요.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      if (isEdit && todo) {
        const payload: TodoPatchPayload = {
          title: title.trim(),
          content: content.trim() || undefined,
          category: category.trim() || undefined,
          type,
          startDate,
          endDate,
          carryOver,
        };
        const res = await todoApi.patch(todo.id, payload);
        onSave(res.data);
      } else {
        const payload: TodoCreatePayload = {
          title: title.trim(),
          content: content.trim() || undefined,
          category: category.trim() || undefined,
          type,
          startDate,
          endDate,
          carryOver,
          groupId: selectedGroupId,
        };
        const res = await todoApi.create(payload);
        onSave(res.data);
      }
      onClose();
    } catch {
      setError("저장에 실패했어요. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    {showLogModal && todo && (
      <TodoEditLogModal
        todoId={todo.id}
        todoTitle={todo.title}
        onClose={() => setShowLogModal(false)}
      />
    )}
    <div className="fixed inset-0 z-50 bg-black/40" onClick={onClose}>
      <div
        className="absolute inset-x-4 mx-auto max-w-[480px] overflow-hidden rounded-2xl bg-white shadow-xl flex flex-col"
        style={{
          top: "clamp(120px, 16vh, 200px)",
          bottom: "clamp(80px, 10vh, 120px)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="px-5 pt-4 pb-3 flex-shrink-0 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-gray-800">
              {isEdit ? "Todo 수정" : "Todo 추가"}
            </h2>
            {editBadgeVisible && (
              <button
                type="button"
                onClick={() => setShowLogModal(true)}
                className="text-[10px] px-1.5 py-[2px] rounded-full active:opacity-60"
                style={{ background: '#FFF3F0', color: '#E85D2F' }}
              >
                수정됨{todo!.editCount > 1 ? ` ${todo!.editCount}` : ''}
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
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

        {/* 스크롤 영역 */}
        <div className="px-5 py-3 flex-1 min-h-0 overflow-y-auto flex flex-col gap-3">
          <input
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#E85D2F] transition-colors"
            placeholder="제목 *"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <textarea
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#E85D2F] transition-colors resize-none"
            placeholder="내용 (선택)"
            rows={2}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />

          <input
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#E85D2F] transition-colors"
            placeholder="카테고리 (선택)"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />

          {/* 그룹 선택 (신규 + 조건 충족 그룹 있을 때만) */}
          {!isEdit && groups.length > 0 && (
            <div ref={groupDropdownRef} className="relative">
              <button
                type="button"
                onClick={() => setGroupOpen((o) => !o)}
                className="w-full flex items-center justify-between border rounded-xl px-4 py-2.5 text-sm bg-white"
                style={{ borderColor: selectedGroupId ? "#4AAFCC" : "#E5E7EB" }}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{
                      background: selectedGroupId ? "#4AAFCC" : "#D1D5DB",
                    }}
                  />
                  <span
                    className="truncate"
                    style={{ color: selectedGroupId ? "#4AAFCC" : "#6B7280" }}
                  >
                    {selectedGroup
                      ? selectedGroup.aliasName || selectedGroup.groupName
                      : "개인 (그룹 선택 안 함)"}
                  </span>
                </div>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="flex-shrink-0 transition-transform"
                  style={{
                    transform: groupOpen ? "rotate(180deg)" : "rotate(0deg)",
                  }}
                >
                  <path
                    d="M6 9l6 6 6-6"
                    stroke={groupOpen ? "#E85D2F" : "#111827"}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              {groupOpen && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-100 rounded-xl shadow-lg z-20 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedGroupId(undefined);
                      setGroupOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left active:opacity-60"
                    style={{
                      background: !selectedGroupId ? "#F5F5F5" : "white",
                      borderBottom: "1px solid #F5F5F5",
                    }}
                  >
                    <span className="w-2 h-2 rounded-full bg-gray-300 flex-shrink-0" />
                    <span className="text-gray-600">
                      개인 (그룹 선택 안 함)
                    </span>
                  </button>
                  {groups.map((g, i) => (
                    <button
                      key={g.groupId}
                      type="button"
                      onClick={() => {
                        setSelectedGroupId(g.groupId);
                        setGroupOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left active:opacity-60"
                      style={{
                        background:
                          selectedGroupId === g.groupId ? "#F0FAFD" : "white",
                        borderBottom:
                          i < groups.length - 1 ? "1px solid #F5F5F5" : "none",
                      }}
                    >
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: "#4AAFCC" }}
                      />
                      <span
                        className="truncate"
                        style={{
                          color:
                            selectedGroupId === g.groupId
                              ? "#4AAFCC"
                              : "#1A1A1A",
                        }}
                      >
                        {g.aliasName || g.groupName}
                      </span>
                      {g.myRole === "LEADER" && (
                        <span
                          className="ml-auto flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded-full"
                          style={{ background: "#FFF3F0", color: "#E85D2F" }}
                        >
                          그룹장
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 타입 선택 */}
          <div className="flex gap-2">
            {(["DATE_ONLY", "RANGE"] as TodoType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all"
                style={{
                  background: type === t ? "#E85D2F" : "white",
                  color: type === t ? "white" : "#888",
                  borderColor: type === t ? "#E85D2F" : "#E5E5E5",
                }}
              >
                {t === "DATE_ONLY" ? "하루" : "기간"}
              </button>
            ))}
          </div>

          {/* 날짜 */}
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-xs text-gray-500 mb-1 block">
                {type === "RANGE" ? "시작일" : "날짜"}
              </label>
              <input
                type="date"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#E85D2F]"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            {(type === "RANGE" || type === "DEADLINE") && (
              <div className="flex-1">
                <label className="text-xs text-gray-500 mb-1 block">
                  {type === "DEADLINE" ? "마감일" : "종료일"}
                </label>
                <input
                  type="date"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#E85D2F]"
                  value={endDate}
                  min={startDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={carryOver}
                onChange={(e) => setCarryOver(e.target.checked)}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm text-gray-600">미완료 시 이월</span>
            </label>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        {/* 하단 버튼 */}
        <div className="px-5 pt-3 pb-4 flex-shrink-0 border-t border-gray-100 bg-white rounded-b-2xl">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-opacity active:opacity-80 disabled:cursor-not-allowed"
            style={{ background: loading ? "#CCCCCC" : "#E85D2F" }}
          >
            {loading ? "저장 중..." : isEdit ? "수정하기" : "추가하기"}
          </button>
        </div>
      </div>
    </div>
    </>
  );
}
