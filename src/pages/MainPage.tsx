import { useState, useEffect, useCallback, useRef } from "react";
import dayjs from "dayjs";
import { useLocation } from "react-router-dom";
import WeekView from "../components/calendar/WeekView";
import MonthView from "../components/calendar/MonthView";
import TodoItem from "../components/todo/TodoItem";
import TodoModal from "../components/todo/TodoModal";
import { useAuth } from "../contexts/AuthContext";
import type { Todo } from "../types";
import { todoApi } from "../api/todo";

interface Props {
  initialDate?: dayjs.Dayjs;
}

export default function MainPage({ initialDate }: Props) {
  const { user } = useAuth();
  const location = useLocation();
  const [viewMode, setViewMode] = useState<"week" | "month" | "search">("week");
  const [selectedDate, setSelectedDate] = useState(initialDate ?? dayjs());
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Todo | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Todo[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const dateKey = selectedDate.format("YYYY-MM-DD");

  const pinnedGroupId = user?.userId
    ? Number(localStorage.getItem(`pinnedGroupId_${user.userId}`)) || undefined
    : undefined;

  const fetchTodos = useCallback(async (date: dayjs.Dayjs) => {
    setLoading(true);
    try {
      const res = await todoApi.getByRange(
        date.format("YYYY-MM-DD"),
        date.format("YYYY-MM-DD"),
      );
      setTodos(res.data);
    } catch {
      setTodos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTodos(selectedDate);
  }, [selectedDate, fetchTodos]);

  // 오늘 탭 재클릭 시 오늘 날짜로 리셋
  useEffect(() => {
    const resetTs = (location.state as { resetTs?: number } | null)?.resetTs;
    if (!resetTs) return;
    const today = dayjs();
    setSelectedDate(today);
    setViewMode((prev) => (prev === "search" ? "week" : prev));
    fetchTodos(today);
  }, [(location.state as { resetTs?: number } | null)?.resetTs]);

  // 검색 모드 진입 시 자동 포커스
  useEffect(() => {
    if (viewMode === "search") {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setSearchQuery("");
      setSearchResults([]);
    }
  }, [viewMode]);

  // 실시간 검색 (200ms debounce)
  useEffect(() => {
    if (viewMode !== "search") return;
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await todoApi.search(searchQuery.trim());
        setSearchResults(res.data);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery, viewMode]);

  const handleDateSelect = (date: dayjs.Dayjs) => {
    setSelectedDate(date);
  };

  const handleUpdate = (updated: Todo) => {
    setTodos((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  };

  const handleDelete = (id: number) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  };

  const handleSave = (saved: Todo) => {
    setTodos((prev) => {
      const exists = prev.find((t) => t.id === saved.id);
      return exists
        ? prev.map((t) => (t.id === saved.id ? saved : t))
        : [...prev, saved];
    });
    setShowModal(false);
    setEditTarget(null);
  };

  const openCreate = () => {
    setEditTarget(null);
    setShowModal(true);
  };
  const openEdit = (todo: Todo) => {
    setEditTarget(todo);
    setShowModal(true);
  };

  const isToday = selectedDate.isSame(dayjs(), "day");
  const isPast = selectedDate.isBefore(dayjs(), "day");

  return (
    <div className="flex flex-col min-h-full">
      {/* 주간/월간/검색 토글 */}
      <div className="flex items-center gap-1 px-4 py-2 bg-white border-b border-gray-100">
        {(["week", "month"] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className="px-4 py-1.5 rounded-full text-xs font-semibold transition-all"
            style={{
              background: viewMode === mode ? "#E85D2F" : "#F5F5F5",
              color: viewMode === mode ? "white" : "#888",
            }}
          >
            {mode === "week" ? "주간" : "월간"}
          </button>
        ))}
        <button
          onClick={() => setViewMode(viewMode === "search" ? "week" : "search")}
          className="ml-auto w-8 h-8 rounded-full flex items-center justify-center transition-all flex-shrink-0"
          style={{
            background: viewMode === "search" ? "#E85D2F" : "#F5F5F5",
          }}
          aria-label="검색"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="7" stroke={viewMode === "search" ? "white" : "#888"} strokeWidth="2.2" />
            <path d="M16.5 16.5L21 21" stroke={viewMode === "search" ? "white" : "#888"} strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* 검색 입력창 */}
      {viewMode === "search" && (
        <div className="px-4 py-3 bg-white border-b border-gray-100">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="15" height="15" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="7" stroke="#9CA3AF" strokeWidth="2.2" />
              <path d="M16.5 16.5L21 21" stroke="#9CA3AF" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
            <input
              ref={searchInputRef}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#E85D2F] transition-colors"
              placeholder="제목, 내용, 카테고리 검색"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="#9CA3AF" strokeWidth="2.2" strokeLinecap="round" />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}

      {/* 캘린더 (검색 모드가 아닐 때만) */}
      {viewMode === "week" && (
        <WeekView selectedDate={selectedDate} onSelect={handleDateSelect} />
      )}
      {viewMode === "month" && (
        <MonthView selectedDate={selectedDate} onSelect={handleDateSelect} />
      )}

      {/* 검색 결과 */}
      {viewMode === "search" && (
        <div className="flex-1 px-4 pt-3 flex flex-col gap-2 pb-4">
          {searchLoading ? (
            <div className="flex items-center justify-center py-12">
              <div
                className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: "#E85D2F", borderTopColor: "transparent" }}
              />
            </div>
          ) : !searchQuery.trim() ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="7" stroke="#D1D5DB" strokeWidth="1.8" />
                <path d="M16.5 16.5L21 21" stroke="#D1D5DB" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              <p className="text-sm text-gray-400">검색어를 입력해주세요</p>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2">
              <p className="text-sm text-gray-400">검색 결과가 없어요</p>
            </div>
          ) : (
            (() => {
              const personalResults = searchResults.filter((t) => !t.groupId);
              const groupResults = searchResults.filter((t) => !!t.groupId);
              const hasGroup = groupResults.length > 0;
              return (
                <>
                  <div className="px-1 pb-1">
                    <span className="text-xs text-gray-400">{searchResults.length}개의 결과</span>
                  </div>
                  {personalResults.map((todo) => (
                    <TodoItem
                      key={todo.id}
                      todo={todo}
                      showDate
                      onUpdate={(updated) =>
                        setSearchResults((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
                      }
                      onDelete={(id) =>
                        setSearchResults((prev) => prev.filter((t) => t.id !== id))
                      }
                      onEdit={openEdit}
                    />
                  ))}
                  {hasGroup && (
                    <>
                      <div className="flex items-center gap-2 pt-2 pb-1">
                        <div className="flex-1 h-px bg-gray-100" />
                        <span
                          className="text-xs font-medium px-2 py-0.5 rounded-full text-white"
                          style={{ background: "#4AAFCC" }}
                        >
                          그룹
                        </span>
                        <div className="flex-1 h-px bg-gray-100" />
                      </div>
                      {groupResults.map((todo) => (
                        <TodoItem
                          key={todo.id}
                          todo={todo}
                          showDate
                          onUpdate={(updated) =>
                            setSearchResults((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
                          }
                          onDelete={(id) =>
                            setSearchResults((prev) => prev.filter((t) => t.id !== id))
                          }
                          onEdit={openEdit}
                        />
                      ))}
                    </>
                  )}
                </>
              );
            })()
          )}
        </div>
      )}

      {/* 날짜 헤더 (검색 모드 아닐 때만) */}
      {viewMode !== "search" && (
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <div>
          <span className="text-base font-bold text-gray-800">
            {selectedDate.format("M월 D일 (dd)")}
          </span>
          {isToday && (
            <span
              className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full text-white"
              style={{ background: "#E85D2F" }}
            >
              오늘
            </span>
          )}
          {isPast && !isToday && (
            <span className="ml-2 text-xs text-gray-400">과거</span>
          )}
        </div>
        <span className="text-xs text-gray-400">{todos.length}개</span>
      </div>
      )}

      {/* Todo 리스트 (검색 모드 아닐 때만) */}
      {viewMode !== "search" && (
      <div className="flex-1 px-4 flex flex-col gap-2 pb-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div
              className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: "#E85D2F", borderTopColor: "transparent" }}
            />
          </div>
        ) : todos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <span className="text-3xl">📋</span>
            <p className="text-sm text-gray-400">이 날의 할 일이 없어요</p>
          </div>
        ) : (
          (() => {
            // 개인: 미완료 우선 → 생성순(id asc)
            const personalTodos = todos
              .filter((t) => !t.groupId)
              .sort((a, b) => {
                if (a.completed !== b.completed) return a.completed ? 1 : -1;
                return a.id - b.id;
              });
            // 그룹: 미완료 우선 → 고정 그룹 우선 → 생성순(id asc)
            const groupTodos = todos
              .filter((t) => !!t.groupId)
              .sort((a, b) => {
                if (a.completed !== b.completed) return a.completed ? 1 : -1;
                const aPinned = pinnedGroupId !== undefined && a.groupId === pinnedGroupId ? 0 : 1;
                const bPinned = pinnedGroupId !== undefined && b.groupId === pinnedGroupId ? 0 : 1;
                if (aPinned !== bPinned) return aPinned - bPinned;
                return a.id - b.id;
              });
            const hasGroup = groupTodos.length > 0;
            return (
              <>
                {personalTodos.map((todo) => (
                  <TodoItem
                    key={todo.id}
                    todo={todo}
                    onUpdate={handleUpdate}
                    onDelete={handleDelete}
                    onEdit={openEdit}
                  />
                ))}
                {hasGroup && (
                  <>
                    <div className="flex items-center gap-2 pt-2 pb-1">
                      <div className="flex-1 h-px bg-gray-100" />
                      <span
                        className="text-xs font-medium px-2 py-0.5 rounded-full text-white"
                        style={{ background: "#4AAFCC" }}
                      >
                        그룹
                      </span>
                      <div className="flex-1 h-px bg-gray-100" />
                    </div>
                    {groupTodos.map((todo) => (
                      <TodoItem
                        key={todo.id}
                        todo={todo}
                        onUpdate={handleUpdate}
                        onDelete={handleDelete}
                        onEdit={openEdit}
                      />
                    ))}
                  </>
                )}
              </>
            );
          })()
        )}
      </div>
      )}

      {/* 추가 버튼 (검색 모드 아닐 때만) */}
      {viewMode !== "search" && <div
        className="fixed left-1/2 -translate-x-1/2 w-full max-w-[480px] px-5 z-20 pointer-events-none"
        style={{
          bottom: "calc(80px + 12px + env(safe-area-inset-bottom))",
        }}
      >
        <div className="flex justify-end">
          <button
            onClick={openCreate}
            className="pointer-events-auto w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-transform active:scale-90"
            style={{ background: "linear-gradient(135deg, #E85D2F, #FF7B52)" }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 5v14M5 12h14"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </div>}

      {/* 모달 */}
      {showModal && (
        <TodoModal
          date={dateKey}
          todo={editTarget}
          onClose={() => {
            setShowModal(false);
            setEditTarget(null);
          }}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
