import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail } from "lucide-react";
import { useAuthStore } from "../../stores/auth";
import { useI18n } from "../../i18n";
import { AuthLayout } from "../../components/layout/AuthLayout";
import { Input } from "../../components/ui/Input";
import { PasswordInput } from "../../components/ui/PasswordInput";
import { Button } from "../../components/ui/Button";
import { Alert } from "../../components/ui/Alert";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading, error, clearError } = useAuthStore();
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch {
      // error is set in store
    }
  };

  return (
    <AuthLayout>
      <h1 className="text-xl font-bold text-ink-900">{t.auth.login.title}</h1>
      <p className="mt-1 text-sm text-ink-500">{t.auth.login.subtitle}</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {error && <Alert variant="error">{error}</Alert>}

        <Input
          type="email"
          label={t.auth.login.email}
          icon={<Mail className="h-4 w-4" />}
          required
          autoComplete="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (error) clearError();
          }}
        />
        <PasswordInput
          label={t.auth.login.password}
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (error) clearError();
          }}
        />

        <Button type="submit" size="lg" className="w-full" loading={isLoading}>
          {isLoading ? t.auth.login.submitLoading : t.auth.login.submit}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-500">
        {t.auth.login.noAccount}{" "}
        <Link to="/register" className="font-medium text-saffron-700 hover:text-saffron-800">
          {t.auth.login.registerLink}
        </Link>
      </p>
    </AuthLayout>
  );
}
