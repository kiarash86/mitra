import { Link } from "react-router-dom";
import { useI18n } from "../../i18n";
import { useOrganizationStore } from "../../stores/organization";
import { formatDate, formatNumber } from "../../lib/formatters";
import { PageHeader } from "../../components/ui/PageHeader";
import { RouteTabs } from "../../components/ui/RouteTabs";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Skeleton } from "../../components/ui/Skeleton";

export default function OrganizationSettingsPage() {
  const { t, locale } = useI18n();
  const currentOrg = useOrganizationStore((s) => s.currentOrg);
  const members = useOrganizationStore((s) => s.members);

  // The organization is fetched once, automatically, by AppShell (there's
  // no self-serve creation anymore — see ORG_SLUG in lib/constants.ts) —
  // this page just waits for that to land.
  if (!currentOrg) {
    return (
      <div>
        <Skeleton className="mb-6 h-8 w-48" />
        <Skeleton className="h-64 max-w-xl" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title={currentOrg.name} />
      <RouteTabs
        tabs={[
          { label: t.organizations.tabOverview, to: "/organizations", end: true },
          { label: t.organizations.tabMembers, to: "/organizations/members" },
        ]}
      />
      <Card className="max-w-xl">
        <dl className="divide-y divide-paper-100">
          <Row label={t.organizations.overviewNameLabel} value={currentOrg.name} />
          <Row label={t.organizations.overviewSlugLabel} value={currentOrg.slug} dir="ltr" />
          <Row
            label={t.organizations.overviewCreatedLabel}
            value={formatDate(currentOrg.created_at, locale)}
          />
          <Row label={t.organizations.overviewMembersLabel} value={formatNumber(members.length, locale)} />
        </dl>
        <Link to="/organizations/members">
          <Button variant="secondary" className="mt-5">
            {t.organizations.viewMembersCta}
          </Button>
        </Link>
      </Card>
    </div>
  );
}

function Row({ label, value, dir }: { label: string; value: string; dir?: "ltr" | "rtl" }) {
  return (
    <div className="flex items-center justify-between py-3 text-sm">
      <dt className="text-ink-500">{label}</dt>
      <dd className="font-medium text-ink-800" dir={dir}>
        {value}
      </dd>
    </div>
  );
}
