import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Hash, Send, MessagesSquare, Ellipsis } from "lucide-react";
import { useI18n } from "../../i18n";
import { useAuthStore } from "../../stores/auth";
import { useOrganizationStore } from "../../stores/organization";
import { useProjectStore } from "../../stores/project";
import { toast } from "../../stores/toast";
import { formatTime } from "../../lib/formatters";
import { cn } from "../../lib/cn";
import { Badge, RoleBadge } from "../../components/ui/Badge";
import { Avatar } from "../../components/ui/Avatar";
import { Textarea } from "../../components/ui/Textarea";
import { IconButton } from "../../components/ui/IconButton";
import { Skeleton } from "../../components/ui/Skeleton";
import { Menu } from "../../components/ui/Menu";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { Button } from "../../components/ui/Button";
import { useWebSocket } from "../../hooks/use-websocket";
import { messagesApi } from "../../api/messages";
import { messageFromHistoryRow } from "../../types/chat";
import type { Message, ChatEvent } from "../../types/chat";

// Builds the WebSocket URL for a project's chat room. Mirrors how api/client.ts
// resolves the API origin, but swaps http(s) for ws(s) since the browser's
// native WebSocket API needs the ws:// scheme explicitly.
function buildWsUrl(path: string): string {
  const apiOrigin = import.meta.env.VITE_API_URL || window.location.origin;
  const wsOrigin = apiOrigin.replace(/^http/, "ws");
  return `${wsOrigin}${path}`;
}

export default function ChatPage() {
  const { t, locale } = useI18n();
  const currentUser = useAuthStore((s) => s.user);
  const currentOrg = useOrganizationStore((s) => s.currentOrg);
  const projects = useProjectStore((s) => s.projects);
  const projectsLoading = useProjectStore((s) => s.isLoading);
  const fetchProjects = useProjectStore((s) => s.fetchProjects);
  const members = useProjectStore((s) => s.members);
  const fetchMembers = useProjectStore((s) => s.fetchMembers);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [messagesByChannel, setMessagesByChannel] = useState<Record<string, Message[]>>({});
  const [historyLoading, setHistoryLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Message | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (currentOrg) fetchProjects(currentOrg.id).catch(() => toast.error(t.common.errorGeneric));
  }, [currentOrg, fetchProjects, t]);

  // Project membership drives the role tag shown next to each sender, and
  // (together with sender identity) who gets an edit/delete menu on a message.
  useEffect(() => {
    if (activeId) fetchMembers(activeId).catch(() => toast.error(t.common.errorGeneric));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  const roleByUserId = Object.fromEntries(members.map((m) => [m.user_id, m.role]));
  const myRole = currentUser ? roleByUserId[currentUser.id] : undefined;
  const canModerate = myRole === "owner" || myRole === "admin";

  const activeMessages = activeId ? (messagesByChannel[activeId] ?? []) : [];
  const activeProject = projects.find((p) => p.id === activeId);

  // Handles every event the server pushes over the socket for the active room:
  // new messages get appended, edits patch the matching message in place, and
  // deletes remove it from the list entirely.
  const handleEvent = (raw: unknown) => {
    const event = raw as ChatEvent;
    if (!activeId) return;

    if (event.type === "message.created") {
      setMessagesByChannel((prev) => ({
        ...prev,
        [activeId]: [...(prev[activeId] ?? []), event.payload],
      }));
    } else if (event.type === "message.updated") {
      setMessagesByChannel((prev) => ({
        ...prev,
        [activeId]: (prev[activeId] ?? []).map((m) => (m.id === event.payload.id ? event.payload : m)),
      }));
    } else if (event.type === "message.deleted") {
      setMessagesByChannel((prev) => ({
        ...prev,
        [activeId]: (prev[activeId] ?? []).filter((m) => m.id !== event.payload.id),
      }));
    }
  };

  const { connect, disconnect, send, status } = useWebSocket({
    url: activeId ? buildWsUrl(`/ws/projects/${activeId}/chat`) : "",
    onMessage: handleEvent,
  });

  // (Re)connects the socket whenever the active project changes, and tears
  // down the previous connection first so a stale room doesn't keep streaming.
  useEffect(() => {
    if (!activeId) return;
    connect();
    return () => disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  // Loads message history for a channel the first time it's opened.
  useEffect(() => {
    if (!activeId || messagesByChannel[activeId]) return;
    setHistoryLoading(true);
    messagesApi
      .listByProject(activeId)
      .then((rows) => {
        // Backend returns newest-first; the thread reads oldest-to-newest.
        const ordered = rows.map(messageFromHistoryRow).reverse();
        setMessagesByChannel((prev) => ({ ...prev, [activeId]: ordered }));
      })
      .catch(() => toast.error(t.common.errorGeneric))
      .finally(() => setHistoryLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ block: "end" });
  }, [activeMessages.length]);

  const handleSend = (e: FormEvent) => {
    e.preventDefault();
    if (!activeId || !draft.trim() || status !== "open") return;
    send({ body: draft.trim() });
    setDraft("");
  };

  const startEdit = (message: Message) => {
    setEditingId(message.id);
    setEditDraft(message.body);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditDraft("");
  };

  const saveEdit = async (messageId: string) => {
    const body = editDraft.trim();
    if (!body) return;
    try {
      await messagesApi.update(messageId, { body });
      // The updated message itself arrives back over the socket
      // (message.updated), so we only need to close the editor here.
      cancelEdit();
    } catch {
      toast.error(t.common.errorGeneric);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await messagesApi.delete(deleteTarget.id);
      // The removal itself arrives back over the socket (message.deleted).
    } catch {
      toast.error(t.common.errorGeneric);
    }
  };

  const statusTone =
    status === "open"
      ? "bg-green-100 text-green-700"
      : status === "connecting"
        ? "bg-saffron-100 text-saffron-700"
        : "bg-ink-100 text-ink-500";
  const statusLabel =
    status === "open" ? t.chat.connected : status === "connecting" ? t.chat.connecting : t.chat.offline;

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <h1 className="text-2xl font-bold text-ink-900">{t.chat.title}</h1>
        {activeId && (
          <Badge tone={statusTone} dotClassName={status === "open" ? "bg-green-500" : undefined}>
            {statusLabel}
          </Badge>
        )}
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
                {historyLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-10 w-2/3 rounded-md" />
                    <Skeleton className="h-10 w-1/2 rounded-md" />
                  </div>
                ) : (
                  activeMessages.map((message) => {
                    const isOwn = message.sender_id === currentUser?.id;
                    const role = roleByUserId[message.sender_id];
                    const canEdit = isOwn;
                    const canDelete = isOwn || canModerate;
                    const isEditing = editingId === message.id;

                    return (
                      <div key={message.id} className={cn("flex items-end gap-2.5", isOwn && "flex-row-reverse")}>
                        <Avatar name={message.sender_name} size="sm" className="mb-0.5 shrink-0" />

                        <div
                          className={cn(
                            "group relative max-w-[70%] rounded-2xl px-3.5 py-2.5 shadow-sm",
                            isOwn
                              ? "rounded-tl-md bg-saffron-500 text-white"
                              : "rounded-tr-md border border-paper-200 bg-white text-ink-800",
                          )}
                        >
                          {isEditing ? (
                            <div className="min-w-[220px]">
                              <Textarea
                                autoFocus
                                rows={2}
                                value={editDraft}
                                onChange={(e) => setEditDraft(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    saveEdit(message.id);
                                  } else if (e.key === "Escape") {
                                    cancelEdit();
                                  }
                                }}
                                className="bg-white text-ink-800"
                              />
                              <div className="mt-1.5 flex justify-end gap-2">
                                <Button size="sm" variant="secondary" onClick={cancelEdit}>
                                  {t.common.cancel}
                                </Button>
                                <Button size="sm" variant="primary" onClick={() => saveEdit(message.id)}>
                                  {t.common.save}
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="mb-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                                <span className={cn("text-xs font-semibold", isOwn ? "text-white" : "text-ink-800")}>
                                  {isOwn ? currentUser?.full_name : message.sender_name}
                                </span>
                                {role && (
                                  <RoleBadge
                                    role={role}
                                    className={isOwn ? "bg-white/20 text-white" : undefined}
                                  />
                                )}
                                <span className={cn("text-[11px]", isOwn ? "text-white/70" : "text-ink-400")}>
                                  {formatTime(message.created_at, locale)}
                                </span>
                              </div>

                              <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.body}</p>

                              {(canEdit || canDelete) && (
                                <div
                                  className={cn(
                                    "absolute top-1.5 opacity-0 transition-opacity group-hover:opacity-100",
                                    isOwn ? "left-1.5" : "right-1.5",
                                  )}
                                >
                                  <Menu
                                    align={isOwn ? "start" : "end"}
                                    trigger={
                                      <button
                                        aria-label={t.common.edit}
                                        className={cn(
                                          "inline-flex h-6 w-6 items-center justify-center rounded-full transition-colors",
                                          isOwn
                                            ? "text-white/80 hover:bg-white/20 hover:text-white"
                                            : "text-ink-400 hover:bg-paper-100 hover:text-ink-700",
                                        )}
                                      >
                                        <Ellipsis className="h-3.5 w-3.5" />
                                      </button>
                                    }
                                    items={[
                                      ...(canEdit
                                        ? [{ label: t.common.edit, onClick: () => startEdit(message) }]
                                        : []),
                                      ...(canDelete
                                        ? [
                                            {
                                              label: t.common.remove,
                                              danger: true,
                                              onClick: () => setDeleteTarget(message),
                                            },
                                          ]
                                        : []),
                                    ]}
                                  />
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={scrollRef} />
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
                  disabled={!draft.trim() || status !== "open"}
                />
              </form>
            </>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title={t.chat.deleteMessageTitle}
        description={t.chat.deleteMessageDescription}
      />
    </div>
  );
}
