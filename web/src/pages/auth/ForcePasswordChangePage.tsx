import { useNavigate } from "react-router-dom";
import { useI18n } from "../../i18n";
import { AuthLayout } from "../../components/layout/AuthLayout";
import { ChangePasswordForm } from "../../components/auth/ChangePasswordForm";

export default function ForcePasswordChangePage() {
  const { t } = useI18n();
  const navigate = useNavigate();

  return (
    <AuthLayout>
      <h1 className="text-xl font-bold text-ink-900">{t.forcePasswordChange.title}</h1>
      <p className="mt-1 text-sm text-ink-500">{t.forcePasswordChange.description}</p>
      <div className="mt-6">
        <ChangePasswordForm
          submitLabel={t.forcePasswordChange.submit}
          onSuccess={() => navigate("/dashboard", { replace: true })}
        />
      </div>
    </AuthLayout>
  );
}
