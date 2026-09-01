import { useState } from "react";
import type { FormEvent } from "react";
import { LogOut } from "lucide-react";
import { useI18n } from "../../i18n";
import { useAuthStore } from "../../stores/auth";
import { PageHeader } from "../../components/ui/PageHeader";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Alert } from "../../components/ui/Alert";
import { Avatar } from "../../components/ui/Avatar";

export default function ProfilePage() {
  const { t } = useI18n();
  const user = useAuthStore((s) => s.user);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const logout = useAuthStore((s) => s.logout);

  const [fullName, setFullName] = useState(user?.full_name ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSaved(false);
    setSubmitting(true);
    try {
      await updateProfile(fullName.trim());
      setSaved(true);
    } catch {
      setError(t.common.errorGeneric);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader title={t.settings.title} description={t.settings.subtitle} />

      <Card>
        <div className="mb-5 flex items-center gap-4">
          <Avatar name={user?.full_name ?? "?"} size="lg" />
          <div>
            <p className="font-semibold text-ink-900">{user?.full_name}</p>
            <p className="text-sm text-ink-500" dir="ltr">
              {user?.email}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <Alert variant="error">{error}</Alert>}
          {saved && <Alert variant="success">{t.settings.saved}</Alert>}

          <Input
            label={t.settings.fullNameLabel}
            required
            minLength={2}
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value);
              setSaved(false);
            }}
          />
          <Input label={t.settings.emailLabel} value={user?.email ?? ""} dir="ltr" disabled readOnly />

          <div className="flex justify-end pt-2">
            <Button type="submit" loading={submitting}>
              {t.settings.saveButton}
            </Button>
          </div>
        </form>
      </Card>

      <Card className="mt-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-ink-800">{t.settings.accountSection}</p>
          <p className="mt-0.5 text-xs text-ink-400" dir="ltr">
            ID: {user?.id}
          </p>
        </div>
        <Button variant="secondary" icon={<LogOut className="h-4 w-4" />} onClick={() => logout()}>
          {t.settings.logoutButton}
        </Button>
      </Card>
    </div>
  );
}
