import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FolderKanban, Plus } from "lucide-react";
import { useI18n } from "../../i18n";
import { useAuthStore } from "../../stores/auth";
import { useOrganizationStore } from "../../stores/organization";
import { useProjectStore } from "../../stores/project";
import { toast } from "../../stores/toast";
import { canManageOrg } from "../../lib/permissions";
import { PageHeader } from "../../components/ui/PageHeader";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Textarea } from "../../components/ui/Textarea";
import { Modal } from "../../components/ui/Modal";
import { Alert } from "../../components/ui/Alert";
import { EmptyState } from "../../components/ui/EmptyState";
import { Skeleton } from "../../components/ui/Skeleton";

export default function ProjectListPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.user);
  const currentOrg = useOrganizationStore((s) => s.currentOrg);
  const members = useOrganizationStore((s) => s.members);
  const fetchOrgMembers = useOrganizationStore((s) => s.fetchMembers);
  const projects = useProjectStore((s) => s.projects);
  const isLoading = useProjectStore((s) => s.isLoading);
  const fetchProjects = useProjectStore((s) => s.fetchProjects);
  const createProject = useProjectStore((s) => s.createProject);

  const myRole = members.find((m) => m.user_id === currentUser?.id)?.role;
  const canManage = canManageOrg(myRole);

  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (currentOrg) {
      fetchProjects(currentOrg.id).catch(() => toast.error(t.common.errorGeneric));
      fetchOrgMembers(currentOrg.id).catch(() => toast.error(t.common.errorGeneric));
    }
  }, [currentOrg, fetchProjects, fetchOrgMembers, t]);

  if (!currentOrg) {
    return (
      <EmptyState
        icon={<FolderKanban className="h-6 w-6" />}
        title={t.dashboard.noOrgTitle}
        description={t.dashboard.noOrgDescription}
        action={
          <Link to="/organizations">
            <Button>{t.dashboard.noOrgCta}</Button>
          </Link>
        }
      />
    );
  }

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const project = await createProject(currentOrg.id, name.trim(), description.trim() || undefined);
      setModalOpen(false);
      setName("");
      setDescription("");
      navigate(`/projects/${project.id}`);
    } catch {
      setError(t.common.errorGeneric);
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title={t.projects.listTitle}
        description={t.projects.listSubtitle}
        actions={
          canManage ? (
            <Button icon={<Plus className="h-4 w-4" />} onClick={() => setModalOpen(true)}>
              {t.projects.createButton}
            </Button>
          ) : undefined
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          icon={<FolderKanban className="h-6 w-6" />}
          title={t.projects.emptyTitle}
          description={t.projects.emptyDescription}
          action={canManage ? <Button onClick={() => setModalOpen(true)}>{t.projects.createButton}</Button> : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link key={project.id} to={`/projects/${project.id}`}>
              <Card interactive className="h-full">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-saffron-100 text-saffron-700">
                  <FolderKanban className="h-5 w-5" />
                </div>
                <h3 className="truncate font-semibold text-ink-900">{project.name}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-ink-500">
                  {project.description || t.projects.noDescription}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={t.projects.createModalTitle}
        size="sm"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          {error && <Alert variant="error">{error}</Alert>}
          <Input
            label={t.projects.nameLabel}
            required
            minLength={2}
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Textarea
            label={t.projects.descriptionLabel}
            hint={t.common.optional}
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              {t.common.cancel}
            </Button>
            <Button type="submit" loading={submitting}>
              {t.common.create}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
