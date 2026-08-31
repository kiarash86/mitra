import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { useI18n } from "../../i18n";
import { useOrganizationStore } from "../../stores/organization";
import { validateSlug } from "../../lib/validators";
import { formatDate, formatNumber } from "../../lib/formatters";
import { PageHeader } from "../../components/ui/PageHeader";
import { RouteTabs } from "../../components/ui/RouteTabs";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Alert } from "../../components/ui/Alert";

function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function OrganizationSettingsPage() {
  const { t, locale } = useI18n();
  const currentOrg = useOrganizationStore((s) => s.currentOrg);
  const members = useOrganizationStore((s) => s.members);
  const fetchMembers = useOrganizationStore((s) => s.fetchMembers);
  const createOrganization = useOrganizationStore((s) => s.createOrganization);

  const [name, setName] = useState("");
  const [manualSlug, setManualSlug] = useState<string | null>(null);
  const slug = manualSlug ?? slugify(name);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (currentOrg) fetchMembers(currentOrg.id).catch(() => {});
  }, [currentOrg, fetchMembers]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!validateSlug(slug)) {
      setError(t.common.validation.invalidSlug);
      return;
    }
    setSubmitting(true);
    try {
      await createOrganization(name.trim(), slug);
    } catch {
      setError(t.common.errorGeneric);
    } finally {
      setSubmitting(false);
    }
  };

  if (!currentOrg) {
    return (
      <div className="mx-auto max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-bold text-ink-900">{t.organizations.createTitle}</h1>
          <p className="mt-1 text-sm text-ink-500">{t.organizations.createDescription}</p>
        </div>
        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <Alert variant="error">{error}</Alert>}
            <Input
              label={t.organizations.nameLabel}
              required
              minLength={2}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Input
              label={t.organizations.slugLabel}
              hint={t.organizations.slugHint}
              required
              dir="ltr"
              value={slug}
              onChange={(e) => {
                setManualSlug(e.target.value);
              }}
            />
            <Button type="submit" size="lg" className="w-full" loading={submitting}>
              {t.organizations.submit}
            </Button>
          </form>
        </Card>
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
