import { useState } from "react";
import type { FormEvent, ChangeEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, User } from "lucide-react";
import { useAuthStore } from "../../stores/auth";
import { useI18n } from "../../i18n";
import { AuthLayout } from "../../components/layout/AuthLayout";
import { Input } from "../../components/ui/Input";
import { PasswordInput } from "../../components/ui/PasswordInput";
import { Button } from "../../components/ui/Button";
import { Alert } from "../../components/ui/Alert";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, isLoading, error, clearError } = useAuthStore();
  const { t } = useI18n();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await register(fullName, email, password);
      navigate("/dashboard");
    } catch {
      // error is set in store
    }
  };

  const onFieldChange = (setter: (v: string) => void) => (e: ChangeEvent<HTMLInputElement>) => {
    setter(e.target.value);
    if (error) clearError();
  };

  return (
    <AuthLayout>
      <h1 className="text-xl font-bold text-ink-900">{t.auth.register.title}</h1>
      <p className="mt-1 text-sm text-ink-500">{t.auth.register.subtitle}</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {error && <Alert variant="error">{error}</Alert>}

        <Input
          type="text"
          label={t.auth.register.fullName}
          icon={<User className="h-4 w-4" />}
          required
          minLength={2}
          maxLength={255}
          value={fullName}
          onChange={onFieldChange(setFullName)}
        />
        <Input
          type="email"
          label={t.auth.register.email}
          icon={<Mail className="h-4 w-4" />}
          required
          autoComplete="email"
          value={email}
          onChange={onFieldChange(setEmail)}
        />
        <PasswordInput
          label={t.auth.register.password}
          hint={t.auth.register.passwordHint}
          required
          minLength={8}
          autoComplete="new-password"
          value={password}
          onChange={onFieldChange(setPassword)}
        />

        <Button type="submit" size="lg" className="w-full" loading={isLoading}>
          {isLoading ? t.auth.register.submitLoading : t.auth.register.submit}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-500">
        {t.auth.register.haveAccount}{" "}
        <Link to="/login" className="font-medium text-saffron-700 hover:text-saffron-800">
          {t.auth.register.loginLink}
        </Link>
      </p>
    </AuthLayout>
  );
}
