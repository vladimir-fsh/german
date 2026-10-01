"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, CalendarCheck, ClipboardList, Home, ListChecks, Mic, RotateCcw, Settings, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useProgress } from "@/lib/useProgress";
const navItems = [
  { href: "/", label: "Обзор", icon: Home }, { href: "/lesson", label: "Занятие", icon: CalendarCheck },
  { href: "/skills", label: "Навыки", icon: ListChecks }, { href: "/vocabulary", label: "Слова", icon: BookOpen },
  { href: "/review", label: "Повтор", icon: RotateCcw }, { href: "/speaking", label: "Диалог", icon: Mic },
  { href: "/exam", label: "Экзамен", icon: ClipboardList }, { href: "/settings", label: "Настройки", icon: Settings },
];
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname(); const { storageError, blocked, retrySave } = useProgress();
  return <div className="min-h-screen bg-paper text-ink"><header className="border-b border-ink/10 bg-white"><div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-4 sm:px-6"><Link href="/" className="flex shrink-0 items-center gap-2"><Sparkles className="text-lake" size={22} /><span><span className="block font-semibold">Deutsch B1</span><span className="block text-xs text-ink/60">для русскоязычного ученика</span></span></Link><nav aria-label="Разделы" className="hidden flex-1 justify-end gap-1 md:flex">{navItems.map(({ href, label, icon: Icon }) => <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined} aria-label={label} className={cn("flex items-center gap-1 rounded-md p-2 text-sm", pathname === href ? "bg-ink text-white" : "text-ink/65 hover:bg-ink/5")}><Icon size={16} /><span className="hidden xl:inline">{label}</span></Link>)}</nav></div></header><main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">{storageError && <div role="alert" className="mb-5 space-y-3 rounded-md border border-amber/30 bg-amber/10 p-4"><p>{storageError}</p><div className="flex flex-wrap gap-3"><Link href="/settings" className="button-secondary">Сохранить копию / восстановить</Link>{!blocked && <button className="button-secondary" onClick={retrySave}>Повторить сохранение</button>}</div></div>}{children}</main><nav aria-label="Разделы" className="fixed inset-x-0 bottom-0 z-30 border-t border-ink/10 bg-white md:hidden"><div className="flex overflow-x-auto">{navItems.map(({ href, label, icon: Icon }) => <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined} className={cn("flex min-h-16 min-w-[76px] flex-col items-center justify-center gap-1 text-xs", pathname === href ? "text-lake" : "text-ink/60")}><Icon size={18} />{label}</Link>)}</div></nav></div>;
}
