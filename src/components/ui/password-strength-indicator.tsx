import { usePasswordStrength, PasswordStrengthResult } from '@/hooks/usePasswordStrength';
import { Check, X, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PasswordStrengthIndicatorProps {
  password: string;
  className?: string;
}

export const PasswordStrengthIndicator = ({ password, className }: PasswordStrengthIndicatorProps) => {
  const strength = usePasswordStrength(password);

  if (!password) return null;

  return (
    <div className={cn("space-y-3", className)}>
      {/* Strength bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Force du mot de passe</span>
          <span className={cn("font-medium", strength.color)}>
            {strength.label}
          </span>
        </div>
        <div className="flex space-x-1">
          {[...Array(4)].map((_, index) => (
            <div
              key={index}
              className={cn(
                "h-2 flex-1 rounded-full transition-colors",
                index < strength.score
                  ? strength.score <= 1 
                    ? "bg-destructive" 
                    : strength.score <= 2 
                    ? "bg-orange-500" 
                    : strength.score <= 3 
                    ? "bg-yellow-500" 
                    : "bg-green-500"
                  : "bg-muted"
              )}
            />
          ))}
        </div>
      </div>

      {/* Suggestions */}
      {strength.suggestions.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Améliorations suggérées :
          </p>
          <ul className="space-y-1">
            {strength.suggestions.slice(0, 3).map((suggestion, index) => (
              <li key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                <X className="h-3 w-3 text-destructive flex-shrink-0" />
                {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Success message */}
      {strength.isStrong && (
        <div className="text-sm text-green-600 flex items-center gap-2">
          <Check className="h-4 w-4" />
          Votre mot de passe est suffisamment fort !
        </div>
      )}
    </div>
  );
};