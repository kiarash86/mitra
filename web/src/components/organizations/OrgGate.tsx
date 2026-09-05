import { Building2 } from "lucide-react";
import { useI18n } from "../../i18n";
import { useOrganizationStore } from "../../stores/organization";
import { toast } from "../../stores/toast";
import { ORG_SLUG } from "../../lib/constants";
import { EmptyState } from "../ui/EmptyState";
import { Button } from "../ui/Button";
import { Skeleton } from "../ui/Skeleton";

/**
 * Shown by any page that needs currentOrg while it's still missing.
 * There's no create-organization flow anymore — AppShell fetches the one
 * organization by ORG_SLUG as soon as the authenticated shell mounts — so
 * this is either a brief loading moment or, if that fetch failed, a way to
 * retry it. It's never "go create one", since that action doesn't exist.
 */
export function OrgGate() {
  const { t } = useI18n();
  const isLoading = useOrganizationStore((s) => s.isLoading);
  const fetchBySlug = useOrganizationStore((s) => s.fetchBySlug);

  if (isLoading) {
    return (
      <div>
        <Skeleton className="mb-6 h-8 w-48" />
        <Skeleton className="h-40" />
      </div>
    );
  }

  return (
    <EmptyState
      icon={<Building2 className="h-6 w-6" />}
      title={t.dashboard.noOrgTitle}
      description={t.dashboard.noOrgDescription}
      action={
        <Button
          onClick={() => fetchBySlug(ORG_SLUG).catch(() => toast.error(t.common.errorGeneric))}
        >
          {t.common.retry}
        </Button>
      }
    />
  );
}
