import { cn } from "@/lib/utils";

export function AuthErrorMessage({
  message,
  shake,
}: {
  message: string;
  shake?: boolean;
}) {
  return (
    <div
      role="alert"
      className={cn("auth-status auth-status--error mb-4", shake && "auth-shake")}
    >
      {message}
    </div>
  );
}

export function AuthSuccessMessage({ message }: { message: string }) {
  return (
    <div role="status" className="auth-status auth-status--success mb-4">
      {message}
    </div>
  );
}

export function AuthInfoMessage({ message }: { message: string }) {
  return (
    <div className="auth-status auth-status--info mb-4">{message}</div>
  );
}
