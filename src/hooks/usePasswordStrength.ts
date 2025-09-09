import { useState, useEffect } from 'react';

export interface PasswordStrengthResult {
  score: number; // 0-4 (très faible à très fort)
  label: string;
  color: string;
  suggestions: string[];
  isStrong: boolean;
}

export const usePasswordStrength = (password: string): PasswordStrengthResult => {
  const [strength, setStrength] = useState<PasswordStrengthResult>({
    score: 0,
    label: 'Très faible',
    color: 'text-destructive',
    suggestions: [],
    isStrong: false,
  });

  useEffect(() => {
    const calculateStrength = (pwd: string): PasswordStrengthResult => {
      if (!pwd) {
        return {
          score: 0,
          label: 'Très faible',
          color: 'text-destructive',
          suggestions: ['Entrez un mot de passe'],
          isStrong: false,
        };
      }

      let score = 0;
      const suggestions: string[] = [];

      // Length check
      if (pwd.length >= 8) score++;
      else suggestions.push('Au moins 8 caractères');

      if (pwd.length >= 12) score++;
      else if (pwd.length >= 8) suggestions.push('12 caractères ou plus pour plus de sécurité');

      // Character variety
      if (/[a-z]/.test(pwd)) score++;
      else suggestions.push('Au moins une lettre minuscule');

      if (/[A-Z]/.test(pwd)) score++;
      else suggestions.push('Au moins une lettre majuscule');

      if (/\d/.test(pwd)) score++;
      else suggestions.push('Au moins un chiffre');

      if (/[^a-zA-Z\d]/.test(pwd)) score++;
      else suggestions.push('Au moins un caractère spécial (!@#$%^&*)');

      // Common patterns check
      if (/(.)\1{2,}/.test(pwd)) {
        score -= 1;
        suggestions.push('Évitez les caractères répétés');
      }

      if (/123|abc|qwe|password|motdepasse/i.test(pwd)) {
        score -= 2;
        suggestions.push('Évitez les mots de passe communs');
      }

      // Normalize score
      score = Math.max(0, Math.min(4, score));

      const labels = ['Très faible', 'Faible', 'Moyen', 'Fort', 'Très fort'];
      const colors = [
        'text-destructive',
        'text-orange-500',
        'text-yellow-500',
        'text-green-500',
        'text-green-600'
      ];

      return {
        score,
        label: labels[score],
        color: colors[score],
        suggestions,
        isStrong: score >= 3,
      };
    };

    setStrength(calculateStrength(password));
  }, [password]);

  return strength;
};