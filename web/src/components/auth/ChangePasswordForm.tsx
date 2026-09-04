import { useState } from "react";
import type { FormEvent } from "react";
import { useI18n } from "../../i18n";
import { useAuthStore } from "../../stores/auth";
import { PasswordInput } from "../ui/PasswordInput";
import { Button } from "../ui/Button";
import { Alert } from "../ui/Alert";

interface ChangePasswordFormProps {
  submitLabel: string;
  onSuccess?: () => void;
}

/**
 * Current + new + confirm password form, shared by the settings page and
 * the forced first-login password change — both call the same
 * /auth/change-password endpoint with the same validation.
 */
export function ChangePasswordForm({ submitLabel, onSuccess }: ChangePasswordFormProps) {
  const { t } = useI18n();
  const changePassword = useAuthStore((s) => s.changePassword);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (newPassword.length < 8) {
      setError(t.common.validation.passwordTooShort);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t.common.validation.passwordMismatch);
      return;
    }

    setSubmitting(true);
    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSuccess(true);
      onSuccess?.();
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      setError(status === 401 ? t.settings.currentPasswordIncorrect : t.common.errorGeneric);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <Alert variant="error">{error}</Alert>}
      {success && <Alert variant="success">{t.settings.passwordChanged}</Alert>}

      <PasswordInput
        label={t.settings.currentPasswordLabel}
        required
        autoComplete="current-password"
        value={currentPassword}
        onChange={(e) => setCurrentPassword(e.target.value)}
      />
      <PasswordInput
        label={t.settings.newPasswordLabel}
        required
        minLength={8}
        autoComplete="new-password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
      />
      <PasswordInput
        label={t.settings.confirmPasswordLabel}
        required
        autoComplete="new-password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
      />

      <div className="flex justify-end pt-1">
        <Button type="submit" loading={submitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
