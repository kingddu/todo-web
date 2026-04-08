import { useEffect, useRef, useState } from "react";
import dayjs from "dayjs";
import type { TodoEditLog } from "../../types";
import { todoApi } from "../../api/todo";

interface Props {
  todoId: number;
  todoTitle: string;
  onClose: () => void;
}

const DAY = ["일", "월", "화", "수", "목", "금", "토"];

function formatDateTime(dateStr: string) {
  const d = dayjs(dateStr);
  return `${d.year()}.${d.month() + 1}.${d.date()}.(${DAY[d.day()]}) ${d.format("HH:mm")}`;
}

export default function TodoEditLogModal({
  todoId,
  todoTitle,
  onClose,
}: Props) {
  const [logs, setLogs] = useState<TodoEditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const bodyRef = useRef<HTMLDivElement | null>(null);

  const [scrollUi, setScrollUi] = useState({
    hasOverflow: false,
    thumbTop: 0,
    thumbHeight: 40,
    showBottomFade: false,
  });

  const updateScrollUi = () => {
    const el = bodyRef.current;
    if (!el) return;

    const { scrollTop, scrollHeight, clientHeight } = el;
    const hasOverflow = scrollHeight > clientHeight + 2;

    if (!hasOverflow) {
      setScrollUi({
        hasOverflow: false,
        thumbTop: 0,
        thumbHeight: 40,
        showBottomFade: false,
      });
      return;
    }

    const maxScrollTop = scrollHeight - clientHeight;
    const trackHeight = Math.max(clientHeight - 24, 0);
    const thumbHeight = Math.max(
      32,
      (clientHeight / scrollHeight) * trackHeight,
    );
    const maxThumbTop = Math.max(trackHeight - thumbHeight, 0);
    const thumbTop =
      maxScrollTop > 0 ? (scrollTop / maxScrollTop) * maxThumbTop : 0;

    setScrollUi({
      hasOverflow: true,
      thumbTop,
      thumbHeight,
      showBottomFade: scrollTop < maxScrollTop - 4,
    });
  };

  useEffect(() => {
    setLoading(true);

    todoApi
      .getLogs(todoId)
      .then((res) => setLogs(res.data))
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }, [todoId]);

  useEffect(() => {
    if (loading) return;

    const frame = requestAnimationFrame(updateScrollUi);
    window.addEventListener("resize", updateScrollUi);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", updateScrollUi);
    };
  }, [loading, logs]);

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center"
      style={{
        paddingTop: "calc(env(safe-area-inset-top) + 12px)",
        paddingRight: "12px",
        paddingBottom: "calc(env(safe-area-inset-bottom) + 12px)",
        paddingLeft: "12px",
      }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-[520px] bg-white rounded-[28px] shadow-xl flex flex-col overflow-hidden"
        style={{
          height: "min(92dvh, 820px)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 핸들 */}
        <div className="flex justify-center pt-4 pb-2 shrink-0">
          <div className="w-10 h-1.5 rounded-full bg-gray-200" />
        </div>

        {/* 헤더 */}
        <div className="shrink-0 px-5 pt-1 pb-4 border-b border-gray-100 bg-white">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-[18px] font-bold text-gray-800">수정 이력</h3>
              <p className="text-sm text-gray-400 truncate mt-1">{todoTitle}</p>
            </div>

            <button
              onClick={onClose}
              className="w-9 h-9 flex items-center justify-center rounded-full active:bg-gray-100 flex-shrink-0"
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

        {/* 본문 */}
        <div className="relative flex-1 min-h-0 bg-white">
          {/* 오른쪽 스크롤 인디케이터 */}
          {scrollUi.hasOverflow && (
            <div className="pointer-events-none absolute right-2 top-4 bottom-4 z-20 w-[4px] rounded-full bg-gray-100">
              <div
                className="absolute left-0 w-full rounded-full transition-all duration-150"
                style={{
                  top: scrollUi.thumbTop,
                  height: scrollUi.thumbHeight,
                  background: "#F2B8A3",
                }}
              />
            </div>
          )}

          {/* 아래쪽 더보기 페이드 */}
          {scrollUi.showBottomFade && (
            <div className="pointer-events-none absolute left-0 right-0 bottom-0 z-10 h-12 bg-gradient-to-t from-white to-transparent" />
          )}

          <div
            ref={bodyRef}
            onScroll={updateScrollUi}
            className="h-full overflow-y-auto px-5 py-5 pr-7 overscroll-contain"
            style={{
              scrollbarGutter: "stable",
            }}
          >
            {loading ? (
              <div className="flex justify-center py-16">
                <div
                  className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
                  style={{
                    borderColor: "#E85D2F",
                    borderTopColor: "transparent",
                  }}
                />
              </div>
            ) : logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-2">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 20h9"
                    stroke="#D1D5DB"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                  <path
                    d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"
                    stroke="#D1D5DB"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <p className="text-sm text-gray-400">수정 이력이 없어요</p>
              </div>
            ) : (
              <div className="relative">
                {/* 타임라인 세로선 */}
                <div
                  className="absolute left-[15px] top-3 bottom-3 w-px"
                  style={{
                    background: "linear-gradient(to bottom, #E85D2F, #FFD0C2)",
                  }}
                />

                <div className="flex flex-col gap-5">
                  {logs.map((log, i) => (
                    <div key={log.logId} className="flex gap-4">
                      {/* 타임라인 점 */}
                      <div
                        className="flex-shrink-0 flex flex-col items-center"
                        style={{ width: 30 }}
                      >
                        <div
                          className="w-[14px] h-[14px] rounded-full border-2 border-white mt-1 flex-shrink-0"
                          style={{
                            background: i === 0 ? "#E85D2F" : "#FFCAB8",
                            boxShadow: i === 0 ? "0 0 0 3px #FFF3F0" : "none",
                          }}
                        />
                      </div>

                      {/* 카드 */}
                      <div className="flex-1 min-w-0 bg-gray-50 rounded-2xl px-4 py-3">
                        {/* 회차 + 시간 */}
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <span
                            className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white whitespace-nowrap"
                            style={{
                              background: i === 0 ? "#E85D2F" : "#FFCAB8",
                            }}
                          >
                            {logs.length - i}회 수정
                          </span>

                          <span className="text-[11px] text-gray-400 text-right leading-5 break-keep">
                            {formatDateTime(log.editedAt)}
                          </span>
                        </div>

                        {/* 수정자 */}
                        <p className="text-[12px] text-gray-500 mb-3 break-all">
                          {log.actorEmail}
                        </p>

                        {/* 변경 항목 */}
                        <div className="flex flex-col gap-3">
                          {log.changes.map((change, ci) => (
                            <div key={ci}>
                              <p
                                className="text-[11px] font-semibold mb-1.5"
                                style={{ color: "#E85D2F" }}
                              >
                                {change.label}
                              </p>

                              <div className="flex flex-col gap-1.5">
                                {/* 이전 */}
                                <div className="flex items-start gap-1.5">
                                  <span
                                    className="flex-shrink-0 text-[9px] font-bold px-1.5 py-[1px] rounded text-white mt-[2px]"
                                    style={{ background: "#D1D5DB" }}
                                  >
                                    이전
                                  </span>
                                  <span className="text-xs text-gray-400 line-through break-all leading-5">
                                    {change.before}
                                  </span>
                                </div>

                                {/* 화살표 */}
                                <div className="pl-[26px]">
                                  <svg
                                    width="12"
                                    height="10"
                                    viewBox="0 0 12 10"
                                    fill="none"
                                  >
                                    <path
                                      d="M6 0v8M2 5l4 4 4-4"
                                      stroke="#E85D2F"
                                      strokeWidth="1.5"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </svg>
                                </div>

                                {/* 수정 */}
                                <div className="flex items-start gap-1.5">
                                  <span
                                    className="flex-shrink-0 text-[9px] font-bold px-1.5 py-[1px] rounded text-white mt-[2px]"
                                    style={{ background: "#E85D2F" }}
                                  >
                                    수정
                                  </span>
                                  <span className="text-xs font-medium text-gray-800 break-all leading-5">
                                    {change.after}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="h-3" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
