import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PasswordStrengthIndicatorProps {
  password: string;
}

const requirements = [
  { label: "At least 8 characters", test: (pw: string) => pw.length >= 8 },
  { label: "One uppercase letter", test: (pw: string) => /[A-Z]/.test(pw) },
  { label: "One lowercase letter", test: (pw: string) => /[a-z]/.test(pw) },
  { label: "One number", test: (pw: string) => /\d/.test(pw) },
  { label: "One special character (!@#$...)", test: (pw: string) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pw) },
];

export function getPasswordStrength(password: string) {
  return requirements.every((r) => r.test(password));
}

export function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  if (!password) return null;

  const passed = requirements.filter((r) => r.test(password)).length;
  const ratio = passed / requirements.length;

  return (
    <div className="space-y-2 mt-2">
      {/* Strength bar */}
      <div className="flex gap-1">
        {[...Array(requirements.length)].map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors duration-300",
              i < passed
                ? ratio <= 0.4
                  ? "bg-destructive"
                  : ratio <= 0.8
                  ? "bg-yellow-500"
                  : "bg-emerald-500"
                : "bg-muted"
            )}
          />
        ))}
      </div>
      <p className="text-[10px] font-medium text-muted-foreground">
        {ratio <= 0.4 ? "Weak" : ratio <= 0.8 ? "Fair" : "Strong"}
      </p>
      {/* Requirement checklist */}
      <ul className="space-y-1">
        {requirements.map((req) => {
          const met = req.test(password);
          return (
            <li key={req.label} className="flex items-center gap-1.5 text-[11px]">
              {met ? (
                <Check className="h-3 w-3 text-emerald-500" />
              ) : (
                <X className="h-3 w-3 text-muted-foreground" />
              )}
              <span className={cn(met ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground")}>
                {req.label}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
