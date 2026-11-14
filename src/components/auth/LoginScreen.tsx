"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  PlayCircle,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Sun,
  Moon,
} from "lucide-react";
import { AuthUser } from "@/types/crm";

interface LoginScreenProps {
  onAuthenticated: (user: AuthUser) => void;
  theme: "dark" | "light";
  toggleTheme: () => void;
}

export function LoginScreen({
  onAuthenticated,
  theme,
  toggleTheme,
}: LoginScreenProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loadingMode, setLoadingMode] = useState<"master" | "demo" | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  const handleMasterLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError("Informe seu usuário e senha.");
      return;
    }

    setError(null);
    setLoadingMode("master");

    try {
      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "master",
          username: username.trim(),
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || "Credenciais inválidas.");
        setLoadingMode(null);
        return;
      }

      onAuthenticated(data.user);
    } catch {
      setError("Falha de conexão com o servidor. Tente novamente.");
      setLoadingMode(null);
    }
  };

  const handleDemoLogin = async () => {
    setError(null);
    setLoadingMode("demo");

    try {
      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "demo" }),
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        onAuthenticated(data.user);
      } else {
        setError("Não foi possível iniciar o modo DEMO.");
        setLoadingMode(null);
      }
    } catch {
      setError("Falha de conexão com o servidor.");
      setLoadingMode(null);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 bg-[#f8f9fa] dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 overflow-hidden">
      {/* Subtle Ambient Background Glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[720px] h-[420px] rounded-full bg-indigo-500/15 dark:bg-indigo-500/10 blur-[120px]" />
        <div className="absolute -bottom-40 right-1/4 w-[520px] h-[360px] rounded-full bg-violet-500/10 dark:bg-violet-500/10 blur-[120px]" />
      </div>

      {/* Theme Toggle Top Right */}
      <button
        onClick={toggleTheme}
        title={
          theme === "dark" ? "Mudar para modo claro" : "Mudar para modo escuro"
        }
        className="fixed top-5 right-5 z-20 w-10 h-10 rounded-xl flex items-center justify-center border border-zinc-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
      >
        {theme === "dark" ? (
          <Sun className="w-4 h-4 text-amber-400" />
        ) : (
          <Moon className="w-4 h-4 text-zinc-700" />
        )}
      </button>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Brand Logo */}
        <div className="flex flex-col items-center text-center mb-7">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 mb-3">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              Nexus CRM
            </h1>
            <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              PRO
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Revenue Intelligence &amp; Evolution API Hub
          </p>
        </div>

        {/* Glassmorphism Login Card */}
        <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/85 dark:bg-zinc-900/80 backdrop-blur-2xl p-6 sm:p-7 shadow-xl">
          <div className="mb-5">
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              Acessar Workspace
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Entre com sua conta Master para ambiente real ou explore o DEMO.
            </p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-center gap-2.5 text-xs text-rose-600 dark:text-rose-400"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          <form onSubmit={handleMasterLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Usuário Master
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Admin07"
                  autoComplete="username"
                  className="w-full rounded-xl pl-10 pr-3.5 py-2.5 text-xs bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Senha
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full rounded-xl pl-10 pr-10 py-2.5 text-xs bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-indigo-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loadingMode !== null}
              className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 px-4 text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-md shadow-indigo-500/20 transition-all disabled:opacity-60"
            >
              {loadingMode === "master" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Entrar na Conta Master</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-200 dark:border-zinc-800" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase">
              <span className="px-2.5 bg-white dark:bg-zinc-900 text-zinc-400 font-medium">
                ou ambiente de demonstração
              </span>
            </div>
          </div>

          {/* DEMO Access Button */}
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={loadingMode !== null}
            className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/90 dark:bg-zinc-950/70 hover:border-indigo-500/40 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/70 transition-all text-left disabled:opacity-60"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white text-[10px] font-bold">
                LA
              </div>
              <div>
                <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                  Lucas Andrade (DEMO)
                </p>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                  Visualizar pipeline com dados fictícios
                </p>
              </div>
            </div>
            {loadingMode === "demo" ? (
              <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
            ) : (
              <PlayCircle className="w-4 h-4 text-indigo-500 shrink-0" />
            )}
          </button>
        </div>

        <p className="text-center text-[11px] text-zinc-400 dark:text-zinc-500 mt-5">
          Nexus CRM • Ambiente seguro com sessão criptografada
        </p>
      </motion.div>
    </div>
  );
}
