import { useState } from "react";
import dayjs from "dayjs";
import type { Todo } from "../../types";
import { todoApi } from "../../api/todo";
import TodoEditLogModal from "./TodoEditLogModal";
import { useAuth } from "../../contexts/AuthContext";
import { getEditLogVisible } from "../../pages/SettingsPage";

interface Props {
  todo: Todo;
  onUpdate: (todo: Todo) => void;
  onDelete: (id: number) => void;
  onEdit: (todo: Todo) => void;
  showDate?: boolean;
}

const DAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"];

function formatDateLabel(todo: Todo): string {
  const start = dayjs(todo.startDate);
  const base = `${start.year()}.${start.month() + 1}.${start.date()}.(${DAY_NAMES[start.day()]})`;
  if (todo.startDate === todo.endDate) return base;
  const end = dayjs(todo.endDate);
  return `${base} ~ ${end.month() + 1}.${end.date()}.(${DAY_NAMES[end.day()]})`;
}

export default function TodoItem({
  todo,
  onUpdate,
  onDelete,
  onEdit,
  showDate,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const borderColor = todo.groupId ? "#4AAFCC" : "#E85D2F";
  const { user } = useAuth();
  const editBadgeVisible =
    todo.editCount > 0 &&
    !!user &&
    getEditLogVisible(user.userId, todo.groupId ? "group" : "personal");

  const handleToggle = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = todo.completed
        ? await todoApi.uncomplete(todo.id)
        : await todoApi.complete(todo.id);
      onUpdate(res.data);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("삭제할까요?")) return;
    setLoading(true);
    try {
      await todoApi.delete(todo.id);
      onDelete(todo.id);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="flex items-start gap-3 px-4 py-3 bg-white rounded-xl shadow-sm border border-gray-50"
      style={{ borderLeftWidth: 3, borderLeftColor: borderColor }}
    >
      {/* 체크박스 */}
      <button
        onClick={handleToggle}
        disabled={loading}
        className="mt-[2px] flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all active:scale-90"
        style={{
          borderColor: todo.completed ? borderColor : "#CCCCCC",
          background: todo.completed ? borderColor : "transparent",
        }}
      >
        {todo.completed && (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path
              d="M1.5 5l2.5 2.5 4.5-4.5"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>

      {/* 내용 */}
      <div className="flex-1 min-w-0" onClick={() => onEdit(todo)}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1 flex items-center gap-2 flex-wrap">
            <p
              className="text-sm font-medium leading-5 break-words"
              style={{
                color: todo.completed ? "#BBBBBB" : "#1A1A1A",
                textDecoration: todo.completed ? "line-through" : "none",
              }}
            >
              {todo.title}
            </p>

            {editBadgeVisible && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowLogModal(true);
                }}
                className="shrink-0 text-[10px] px-2 py-[2px] rounded-full active:opacity-60 whitespace-nowrap"
                style={{ background: "#FFF3F0", color: "#E85D2F" }}
              >
                수정됨
              </button>
            )}
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete();
            }}
            disabled={loading}
            className="shrink-0 w-7 h-7 -mt-1 flex items-center justify-center rounded-full hover:bg-gray-100 active:opacity-60 transition-opacity"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <polyline
                points="3 6 5 6 21 6"
                stroke="#CCCCCC"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"
                stroke="#CCCCCC"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M10 11v6M14 11v6"
                stroke="#CCCCCC"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"
                stroke="#CCCCCC"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {todo.groupName && (
            <span
              className="text-[10px] px-2 py-[2px] rounded-full text-white"
              style={{
                background: todo.groupDisbanded ? "#AAAAAA" : "#4AAFCC",
              }}
            >
              {todo.groupDisbanded
                ? `(해산) ${todo.groupName}`
                : todo.groupName}
            </span>
          )}
          {showDate && (
            <span className="text-[10px] text-gray-400 mt-0.5 w-full">
              {formatDateLabel(todo)}
            </span>
          )}
        </div>
      </div>

      {showLogModal && (
        <TodoEditLogModal
          todoId={todo.id}
          todoTitle={todo.title}
          onClose={() => setShowLogModal(false)}
        />
      )}
    </div>
  );
}
