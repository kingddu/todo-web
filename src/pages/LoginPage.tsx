import { useState, FormEvent, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function LoginPage() {
  const { login, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // 이미 로그인 상태면 홈으로
  useEffect(() => {
    if (!authLoading && user) {
      navigate("/today", { replace: true });
    }
  }, [user, authLoading, navigate]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (authLoading) return
    setError("");
    setLoading(true);
    try {
      await login(email.trim(), password);
      navigate("/today", { replace: true });
    } catch {
      setError("이메일 또는 비밀번호를 확인해주세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="app-shell min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: "linear-gradient(160deg, #FFF3F0 0%, #FAFAFA 50%)" }}
    >
      {/* 로고 */}
      <div className="mb-10 text-center">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-md"
          style={{ background: "linear-gradient(135deg, #E85D2F, #FF7B52)" }}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <path
              d="M9 11l3 3L22 4"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-800">TodoKing</h1>
        <p className="text-sm text-gray-400 mt-1">
          채워 나가는 DAY, 풍성해지는 LIFE☘️
        </p>
      </div>

      {/* 폼 */}
      <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3">
        <input
          type="email"
          placeholder="이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="username"
          className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-4 text-sm outline-none focus:border-[#E85D2F] transition-colors shadow-sm"
          required
        />
        <input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-4 text-sm outline-none focus:border-[#E85D2F] transition-colors shadow-sm"
          required
        />

        {error && <p className="text-xs text-red-500 text-center">{error}</p>}

        <button
          type="submit"
          disabled={loading || authLoading}
          className="w-full py-4 rounded-2xl text-white font-bold text-sm mt-1 transition-opacity active:opacity-80 shadow-md"
          style={{
            background: loading || authLoading
              ? "#CCCCCC"
              : "linear-gradient(135deg, #E85D2F, #FF7B52)",
          }}
        >
          {loading ? "로그인 중..." : "로그인"}
        </button>
      </form>

      <p className="mt-6 text-sm text-gray-400">
        계정이 없으신가요?{" "}
        <Link
          to="/signup"
          className="font-semibold"
          style={{ color: "#E85D2F" }}
        >
          회원가입
        </Link>
      </p>
    </div>
  );
}
