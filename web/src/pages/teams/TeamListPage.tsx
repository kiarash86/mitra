import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Users, Plus } from "lucide-react";
import { useI18n } from "../../i18n";
import { useOrganizationStore } from "../../stores/organization";
import { useTeamStore } from "../../stores/team";
import { formatDate } from "../../lib/formatters";
import { PageHeader } from "../../components/ui/PageHeader";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Modal } from "../../components/ui/Modal";
import { Alert } from "../../components/ui/Alert";
import { EmptyState } from "../../components/ui/EmptyState";
import { Skeleton } from "../../components/ui/Skeleton";

export default function TeamListPage() {
  const { t, locale } = useI18n();
  const navigate = useNavigate();
  const currentOrg = useOrganizationStore((s) => s.currentOrg);
  const teams = useTeamStore((s) => s.teams);
  const isLoading = useTeamStore((s) => s.isLoading);
  const fetchTeams = useTeamStore((s) => s.fetchTeams);
  const createTeam = useTeamStore((s) => s.createTeam);

  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (currentOrg) fetchTeams(currentOrg.id).catch(() => {});
  }, [currentOrg, fetchTeams]);

  if (!currentOrg) {
    return (
      <EmptyState
        icon={<Users className="h-6 w-6" />}
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
      const team = await createTeam(currentOrg.id, name.trim());
      setModalOpen(false);
      setName("");
      navigate(`/teams/${team.id}`);
    } catch {
      setError(t.common.errorGeneric);
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title={t.teams.listTitle}
        description={t.teams.listSubtitle}
        actions={
          <Button icon={<Plus className="h-4 w-4" />} onClick={() => setModalOpen(true)}>
            {t.teams.createButton}
          </Button>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-lg" />
          ))}
        </div>
      ) : teams.length === 0 ? (
        <EmptyState
          icon={<Users className="h-6 w-6" />}
          title={t.teams.emptyTitle}
          description={t.teams.emptyDescription}
          action={<Button onClick={() => setModalOpen(true)}>{t.teams.createButton}</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => (
            <Link key={team.id} to={`/teams/${team.id}`}>
              <Card interactive>
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-progress-100 text-progress-600">
                  <Users className="h-5 w-5" />
                </div>
                <h3 className="truncate font-semibold text-ink-900">{team.name}</h3>
                <p className="mt-1 text-xs text-ink-400">
                  {t.teams.createdLabel}: {formatDate(team.created_at, locale)}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={t.teams.createModalTitle} size="sm">
        <form onSubmit={handleCreate} className="space-y-4">
          {error && <Alert variant="error">{error}</Alert>}
          <Input
            label={t.teams.nameLabel}
            required
            minLength={2}
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
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
