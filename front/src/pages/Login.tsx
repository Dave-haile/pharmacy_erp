import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const Login: React.FC = () => {
  const [email, setEmail] = useState("admin@pharmacy.com");
  const [password, setPassword] = useState("wsadqe@123");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await login(email, password);

      navigate("/dashboard");
    } catch (err: any) {
      console.error("Login Failed:", err);
      const status = err?.response?.status;
      if (status === 401) {
        setError(err?.response?.data?.error || "Incorrect email or password.");
      } else {
        setError("System authentication error. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-600/10 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-blue-600/10 blur-[80px] rounded-full translate-y-1/2 -translate-x-1/2"></div>

      <div className="w-full max-w-sm space-y-5 relative z-10">
        <div className="text-center space-y-1.5">
          <div className="inline-block p-3 bg-emerald-500 rounded-2xl shadow-xl shadow-emerald-500/20 mb-3">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.675.337a4 4 0 01-2.574.345l-2.387-.477a2 2 0 00-1.022.547l-1.113 1.113a2 2 0 00.586 3.414l5.051.754a4 4 0 001.49-.035l5.051-.754a2 2 0 00.586-3.414l-1.113-1.113z"
              />
            </svg>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
            PharmaFlow
          </h1>
          <p className="text-slate-400 text-sm">Enterprise Resource Planning Portal</p>
        </div>

        <form
          onSubmit={handleLogin}
          className="bg-slate-800/50 backdrop-blur-xl p-5 rounded-2xl border border-slate-700/50 shadow-2xl space-y-4"
        >
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-2 rounded-lg text-xs font-medium">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-widest">
                Email
              </label>
              <input
                type="email"
                required
                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-emerald-500 transition-all placeholder:text-slate-600"
                placeholder="admin_demo@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-widest">
                Password
              </label>
              <input
                type="password"
                required
                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-emerald-500 transition-all placeholder:text-slate-600"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold py-3 rounded-lg shadow-lg shadow-emerald-600/20 transition-all active:scale-[0.98] disabled:opacity-50 flex justify-center items-center"
          >
            {isLoading ? "Signing In..." : "Log In to Dashboard"}
          </button>

          <div className="text-center">
            <span className="text-slate-500 text-[10px] italic">
              Mock Environment Enabled
            </span>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
