import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from "@/hooks/use-toast";

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  action: () => void;
  description: string;
  scope?: string;
}

interface UseKeyboardShortcutsOptions {
  enabled?: boolean;
  showToasts?: boolean;
}

export const useKeyboardShortcuts = (
  shortcuts: KeyboardShortcut[],
  options: UseKeyboardShortcutsOptions = {}
) => {
  const { enabled = true, showToasts = false } = options;
  const { toast } = useToast();

  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    // Ignore if user is typing in an input or textarea
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return;
    }

    const matchingShortcut = shortcuts.find(shortcut => 
      shortcut.key.toLowerCase() === event.key.toLowerCase() &&
      !!shortcut.ctrlKey === event.ctrlKey &&
      !!shortcut.shiftKey === event.shiftKey &&
      !!shortcut.altKey === event.altKey
    );

    if (matchingShortcut) {
      event.preventDefault();
      matchingShortcut.action();
      
      if (showToasts) {
        toast({
          title: "Raccourci activé",
          description: matchingShortcut.description,
          duration: 1500,
        });
      }
    }
  }, [shortcuts, enabled, showToasts, toast]);

  useEffect(() => {
    if (enabled) {
      document.addEventListener('keydown', handleKeyPress);
      return () => document.removeEventListener('keydown', handleKeyPress);
    }
  }, [handleKeyPress, enabled]);

  return { shortcuts };
};

// Common shortcuts for the application
export const useGlobalKeyboardShortcuts = () => {
  const navigate = useNavigate();
  
  const globalShortcuts: KeyboardShortcut[] = [
    {
      key: 'h',
      ctrlKey: true,
      action: () => navigate('/'),
      description: 'Aller à l\'accueil'
    },
    {
      key: 'p',
      ctrlKey: true,
      action: () => navigate('/projects'),
      description: 'Voir les projets'
    },
    {
      key: 'n',
      ctrlKey: true,
      action: () => navigate('/projects/new'),
      description: 'Nouveau projet'
    },
    {
      key: 'r',
      ctrlKey: true,
      action: () => navigate('/reports'),
      description: 'Voir les rapports'
    },
    {
      key: 'd',
      ctrlKey: true,
      action: () => navigate('/dashboard'),
      description: 'Tableau de bord'
    },
    {
      key: '?',
      shiftKey: true,
      action: () => {
        // Show keyboard shortcuts help modal
        console.log('Keyboard shortcuts help');
      },
      description: 'Afficher l\'aide des raccourcis'
    }
  ];

  useKeyboardShortcuts(globalShortcuts, { enabled: true });
};

// Hook for page-specific shortcuts
export const usePageShortcuts = (pageShortcuts: KeyboardShortcut[]) => {
  const navigate = useNavigate();
  
  // Combine page shortcuts with common navigation shortcuts
  const commonShortcuts: KeyboardShortcut[] = [
    {
      key: 'Escape',
      action: () => navigate(-1),
      description: 'Retour à la page précédente'
    }
  ];

  const allShortcuts = [...pageShortcuts, ...commonShortcuts];
  useKeyboardShortcuts(allShortcuts, { enabled: true });
};