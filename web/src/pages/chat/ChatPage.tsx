import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Hash, Send, MessagesSquare } from "lucide-react";
import { useI18n } from "../../i18n";
import { useAuthStore } from "../../stores/auth";
import { useOrganizationStore } from "../../stores/organization";
import { useProjectStore } from "../../stores/project";
import { formatTime } from "../../lib/formatters";
import { cn } from "../../lib/cn";
import { Badge } from "../../components/ui/Badge";
import { Avatar } from "../../components/ui/Avatar";
import { Textarea } from "../../components/ui/Textarea";
import { IconButton } from "../../components/ui/IconButton";
import { Skeleton } from "../../components/ui/Skeleton";

interface LocalMessage {
  id: string;
  body: string;
  senderName: string;
  sentAt: string;
}

// No chat backend exists yet (see MITRA.md roadmap — chat is a later phase).
// This page renders the real interaction design against real project names
// as "channels", with an in-memory, per-session message list: nothing here
// is persisted or sent to a server. useWebSocket (hooks/use-websocket.ts) is
// ready to wire in once a live chat endpoint exists.
export default function ChatPage() {
  const { t, locale } = useI18n();
  const currentUser = useAuthStore((s) => s.user);
  const currentOrg = useOrganizationStore((s) => s.currentOrg);
  const projects = useProjectStore((s) => s.projects);
  const projectsLoading = useProjectStore((s) => s.isLoading);
  const fetchProjects = useProjectStore((s) => s.fetchProjects);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [messagesByChannel, setMessagesByChannel] = useState<Record<string, LocalMessage[]>>({});

  useEffect(() => {
    if (currentOrg) fetchProjects(currentOrg.id).catch(() => {});
  }, [currentOrg, fetchProjects]);

  const activeMessages = activeId ? (messagesByChannel[activeId] ?? []) : [];
  const activeProject = projects.find((p) => p.id === activeId);

  const handleSend = (e: FormEvent) => {
    e.preventDefault();
    if (!activeId || !draft.trim()) return;
    const message: LocalMessage = {
      id: `${Date.now()}`,
      body: draft.trim(),
      senderName: currentUser?.full_name ?? "?",
      sentAt: new Date().toISOString(),
    };
    setMessagesByChannel((prev) => ({ ...prev, [activeId]: [...(prev[activeId] ?? []), message] }));
    setDraft("");
  };

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <h1 className="text-2xl font-bold text-ink-900">{t.chat.title}</h1>
        <Badge tone="bg-saffron-100 text-saffron-700">{t.chat.previewBadge}</Badge>
      </div>

      <div className="flex h-[75vh] overflow-hidden rounded-lg border border-paper-200 bg-white shadow-soft">
        <div className="w-64 shrink-0 overflow-y-auto border-e border-paper-200 p-3">
          <p className="px-2 py-2 text-xs font-semibold text-ink-400">{t.chat.channelsTitle}</p>
          {projectsLoading ? (
            <div className="space-y-2 px-2">
              <Skeleton className="h-8 w-full rounded-md" />
              <Skeleton className="h-8 w-full rounded-md" />
            </div>
          ) : (
            <nav className="space-y-0.5">
              {projects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => setActiveId(project.id)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-start text-sm transition-colors duration-150",
                    activeId === project.id
                      ? "bg-saffron-50 font-medium text-saffron-800"
                      : "text-ink-600 hover:bg-paper-100",
                  )}
                >
                  <Hash className="h-3.5 w-3.5 shrink-0 text-ink-400" />
                  <span className="truncate">{project.name}</span>
                </button>
              ))}
            </nav>
          )}
        </div>

        <div className="flex flex-1 flex-col">
          {!activeProject ? (
            <div className="flex flex-1 flex-col items-center justify-center text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-paper-100 text-ink-400">
                <MessagesSquare className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-semibold text-ink-800">{t.chat.emptyThreadTitle}</h3>
              <p className="mt-1.5 max-w-xs text-sm text-ink-500">{t.chat.emptyThreadDescription}</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 border-b border-paper-200 px-5 py-3.5">
                <Hash className="h-4 w-4 text-ink-400" />
                <h2 className="text-sm font-semibold text-ink-800">{activeProject.name}</h2>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
                {activeMessages.map((message) => (
                  <div key={message.id} className="flex gap-3">
                    <Avatar name={message.senderName} size="sm" />
                    <div className="min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm font-medium text-ink-800">{message.senderName}</span>
                        <span className="text-xs text-ink-400">{formatTime(message.sentAt, locale)}</span>
                      </div>
                      <p className="mt-0.5 whitespace-pre-wrap text-sm text-ink-600">{message.body}</p>
                    </div>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSend} className="flex items-end gap-2 border-t border-paper-200 p-3">
                <div className="flex-1">
                  <Textarea
                    placeholder={t.chat.composerPlaceholder}
                    rows={1}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend(e);
                      }
                    }}
                  />
                </div>
                <IconButton
                  type="submit"
                  label={t.chat.send}
                  icon={<Send className="h-4 w-4" />}
                  variant="solid"
                  disabled={!draft.trim()}
                />
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
