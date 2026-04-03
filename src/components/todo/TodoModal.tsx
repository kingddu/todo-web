import { useState, useEffect } from "react";
import type {
  Todo,
  TodoType,
  TodoCreatePayload,
  TodoPatchPayload,
} from "../../types";
import { todoApi } from "../../api/todo";

interface Props {
  date: string;
  todo?: Todo | null;
  onClose: () => void;
  onSave: (todo: Todo) => void;
}

export default function TodoModal({ date, todo, onClose, onSave }: Props) {
  const isEdit = !!todo;

  const [title, setTitle] = useState(todo?.title ?? "");
  const [content, setContent] = useState(todo?.content ?? "");
  const [category, setCategory] = useState(todo?.category ?? "");
  const [type, setType] = useState<TodoType>(todo?.type ?? "DATE_ONLY");
  const [startDate, setStartDate] = useState(todo?.startDate ?? date);
  const [endDate, setEndDate] = useState(todo?.endDate ?? date);
  const [carryOver, setCarryOver] = useState(todo?.carryOver ?? false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (type === "DATE_ONLY") {
      setEndDate(startDate);
    }
  }, [type, startDate]);

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
          carryOver: type === "DEADLINE" ? carryOver : false,
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
          carryOver: type === "DEADLINE" ? carryOver : false,
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
    <div className="fixed inset-0 z-50 bg-black/40" onClick={onClose}>
      <div
        className="absolute inset-x-4 mx-auto max-w-[480px] overflow-hidden rounded-2xl bg-white shadow-xl flex flex-col"
        style={{
          top: "clamp(170px, 24vh, 250px)",
          bottom: "clamp(110px, 14vh, 150px)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 핸들 + 헤더 */}
        <div className="px-5 pt-5 pb-3 flex-shrink-0 border-b border-gray-100">
          <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4 sm:hidden" />
          <h2 className="text-xl font-bold text-gray-800">
            {isEdit ? "Todo 수정" : "Todo 추가"}
          </h2>
        </div>

        {/* 스크롤 영역 */}
        <div className="px-5 py-4 flex-1 min-h-0 overflow-y-auto flex flex-col gap-4 pb-2">
          <input
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#E85D2F] transition-colors"
            placeholder="제목 *"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <textarea
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#E85D2F] transition-colors resize-none"
            placeholder="내용 (선택)"
            rows={3}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />

          <input
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#E85D2F] transition-colors"
            placeholder="카테고리 (선택)"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />

          <div className="flex gap-2">
            {(["DATE_ONLY", "RANGE", "DEADLINE"] as TodoType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className="flex-1 py-3 rounded-xl text-sm font-medium border transition-all"
                style={{
                  background: type === t ? "#E85D2F" : "white",
                  color: type === t ? "white" : "#888",
                  borderColor: type === t ? "#E85D2F" : "#E5E5E5",
                }}
              >
                {t === "DATE_ONLY" ? "하루" : t === "RANGE" ? "기간" : "마감일"}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-xs text-gray-500 mb-1 block">
                {type === "RANGE" ? "시작일" : "날짜"}
              </label>
              <input
                type="date"
                className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm outline-none focus:border-[#E85D2F]"
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
                  className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm outline-none focus:border-[#E85D2F]"
                  value={endDate}
                  min={startDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            )}
          </div>

          {type === "DEADLINE" && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={carryOver}
                onChange={(e) => setCarryOver(e.target.checked)}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm text-gray-600">미완료 시 이월</span>
            </label>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        {/* 하단 버튼 */}
        <div className="px-5 pt-3 pb-5 sm:pb-5 flex-shrink-0 border-t border-gray-100 bg-white rounded-b-2xl">
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
  );
}
