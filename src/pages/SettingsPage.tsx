import { useState, useRef, useEffect } from "react";
import { useFont } from "../contexts/FontContext";
import { useNavigate } from "react-router-dom";
import { useInvitations } from "../contexts/InvitationContext";

export default function SettingsPage() {
  const { fontId, setFontId, fonts } = useFont();
  const navigate = useNavigate();
  const { count } = useInvitations();
  const [open, setOpen] = useState(false);
  const [dropdownMaxHeight, setDropdownMaxHeight] = useState(260);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const selectedFont = fonts.find((f) => f.id === fontId)!;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (!open) return;

    const updateDropdownHeight = () => {
      if (!triggerRef.current) return;

      const rect = triggerRef.current.getBoundingClientRect();
      const bottomReservedSpace = 96;
      const dropdownTopGap = 8;
      const availableHeight =
        window.innerHeight - rect.bottom - bottomReservedSpace - dropdownTopGap;
      const safeHeight = Math.max(120, Math.min(availableHeight, 320));

      setDropdownMaxHeight(safeHeight);
    };

    updateDropdownHeight();
    window.addEventListener("resize", updateDropdownHeight);
    window.addEventListener("scroll", updateDropdownHeight, true);

    return () => {
      window.removeEventListener("resize", updateDropdownHeight);
      window.removeEventListener("scroll", updateDropdownHeight, true);
    };
  }, [open]);

  return (
    <div className="px-4 py-6 pb-24 flex flex-col gap-6">
      <h1 className="text-lg font-bold text-gray-800">관리</h1>

      <section>
        <h2 className="text-sm font-semibold text-gray-500 mb-3">그룹</h2>
        <button
          onClick={() => navigate("/groups")}
          className="w-full flex items-center gap-3 px-4 py-4 bg-white rounded-2xl border border-gray-100 shadow-sm active:opacity-70 transition-opacity"
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "#F0FAFD" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"
                stroke="#4AAFCC"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="9" cy="7" r="4" stroke="#4AAFCC" strokeWidth="2" />
              <path
                d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"
                stroke="#4AAFCC"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <div className="flex-1 text-left">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-gray-800">그룹 관리</p>
              {count > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full text-white font-semibold"
                  style={{ background: '#E85D2F' }}>
                  새로운 그룹초대 {count}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              내 그룹 목록 확인 및 생성
            </p>
          </div>

          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M9 18l6-6-6-6"
              stroke="#AAAAAA"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-gray-500 mb-3">글씨체</h2>

        <div className="bg-white rounded-2xl px-4 py-4 border border-gray-100 shadow-sm mb-3">
          <p className="text-xs text-gray-400 mb-2">미리보기</p>
          <p
            style={{
              fontFamily: selectedFont.family,
              fontSize: 18,
              color: "#1A1A1A",
            }}
          >
            오늘도 할 일을 완료해요 ✓
          </p>
        </div>

        <div ref={dropdownRef} className="relative">
          <button
            ref={triggerRef}
            onClick={() => setOpen((o) => !o)}
            className="w-full flex items-center justify-between bg-white border border-gray-200 rounded-2xl px-4 py-3.5 shadow-sm"
          >
            <span
              style={{
                fontFamily: selectedFont.family,
                fontSize: 14,
                color: "#1A1A1A",
              }}
            >
              {selectedFont.label}
            </span>

            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              className="transition-transform flex-shrink-0"
              style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
            >
              <path
                d="M6 9l6 6 6-6"
                stroke="#AAAAAA"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {open && (
            <div
              className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-100 rounded-2xl shadow-lg z-20 overflow-hidden"
              style={{ maxHeight: `${dropdownMaxHeight}px` }}
            >
              <div
                className="overflow-y-scroll"
                style={{
                  maxHeight: `${dropdownMaxHeight}px`,
                  scrollbarWidth: "thin",
                  scrollbarColor: "#D1D5DB transparent",
                }}
              >
                {fonts.map((font, i) => (
                  <button
                    key={font.id}
                    onClick={() => {
                      setFontId(font.id);
                      setOpen(false);
                    }}
                    className="w-full text-left px-4 py-3 transition-colors active:opacity-60"
                    style={{
                      borderBottom:
                        i < fonts.length - 1 ? "1px solid #F5F5F5" : "none",
                      background: fontId === font.id ? "#FFF3F0" : "white",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: font.family,
                        fontSize: 14,
                        color: fontId === font.id ? "#E85D2F" : "#1A1A1A",
                      }}
                    >
                      {font.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <style>{`
        div::-webkit-scrollbar {
          width: 8px;
        }

        div::-webkit-scrollbar-track {
          background: transparent;
        }

        div::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 9999px;
        }

        div::-webkit-scrollbar-thumb:hover {
          background: #bfc5cc;
        }
      `}</style>
    </div>
  );
}
