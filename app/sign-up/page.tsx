import { AuthForm } from "@/components/settle/auth-form";

export default function SignUpPage() {
  return <AuthForm mode="sign-up" redirectTarget="/dashboard" />;
}
