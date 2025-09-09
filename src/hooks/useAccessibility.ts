import { useEffect, useCallback, useState } from 'react';

interface AccessibilityConfig {
  enableKeyboardNavigation?: boolean;
  enableFocusManagement?: boolean;
  enableSkipLinks?: boolean;
  announceChanges?: boolean;
}

export const useAccessibility = (config: AccessibilityConfig = {}) => {
  const {
    enableKeyboardNavigation = true,
    enableFocusManagement = true,
    announceChanges = true
  } = config;

  const [focusedElement, setFocusedElement] = useState<HTMLElement | null>(null);

  // Announce changes to screen readers
  const announceToScreenReader = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!announceChanges) return;

    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }, [announceChanges]);

  // Focus management utilities
  const trapFocus = useCallback((container: HTMLElement) => {
    if (!enableFocusManagement) return;

    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    };

    container.addEventListener('keydown', handleTabKey);
    
    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }, [enableFocusManagement]);

  const restoreFocus = useCallback((element?: HTMLElement) => {
    if (!enableFocusManagement) return;
    
    const targetElement = element || focusedElement;
    if (targetElement && document.contains(targetElement)) {
      targetElement.focus();
    }
  }, [enableFocusManagement, focusedElement]);

  const saveFocus = useCallback(() => {
    if (!enableFocusManagement) return;
    
    setFocusedElement(document.activeElement as HTMLElement);
  }, [enableFocusManagement]);

  // Keyboard navigation utilities
  const handleArrowNavigation = useCallback((
    e: KeyboardEvent,
    items: HTMLElement[],
    currentIndex: number,
    onIndexChange: (index: number) => void
  ) => {
    if (!enableKeyboardNavigation) return;

    let newIndex = currentIndex;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        newIndex = (currentIndex + 1) % items.length;
        break;
      case 'ArrowUp':
        e.preventDefault();
        newIndex = currentIndex === 0 ? items.length - 1 : currentIndex - 1;
        break;
      case 'Home':
        e.preventDefault();
        newIndex = 0;
        break;
      case 'End':
        e.preventDefault();
        newIndex = items.length - 1;
        break;
      default:
        return;
    }

    onIndexChange(newIndex);
    items[newIndex]?.focus();
  }, [enableKeyboardNavigation]);

  // Skip link functionality
  const createSkipLink = useCallback((targetId: string, text: string = 'Aller au contenu principal') => {
    const skipLink = document.createElement('a');
    skipLink.href = `#${targetId}`;
    skipLink.textContent = text;
    skipLink.className = 'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:rounded';
    
    skipLink.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.getElementById(targetId);
      if (target) {
        target.focus();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });

    return skipLink;
  }, []);

  // Add ARIA attributes helper
  const addAriaAttributes = useCallback((
    element: HTMLElement,
    attributes: Record<string, string>
  ) => {
    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(key.startsWith('aria-') ? key : `aria-${key}`, value);
    });
  }, []);

  // Manage expanded states for collapsible content
  const manageExpanded = useCallback((
    trigger: HTMLElement,
    target: HTMLElement,
    isExpanded: boolean
  ) => {
    trigger.setAttribute('aria-expanded', isExpanded.toString());
    target.setAttribute('aria-hidden', (!isExpanded).toString());
    
    if (isExpanded) {
      target.style.display = '';
    } else {
      target.style.display = 'none';
    }
  }, []);

  useEffect(() => {
    // Set up global keyboard handlers
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        announceToScreenReader('Action annulée');
      }
    };

    if (enableKeyboardNavigation) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [enableKeyboardNavigation, announceToScreenReader]);

  return {
    announceToScreenReader,
    trapFocus,
    restoreFocus,
    saveFocus,
    handleArrowNavigation,
    createSkipLink,
    addAriaAttributes,
    manageExpanded
  };
};

// Specialized hook for form accessibility
export const useFormAccessibility = () => {
  const { announceToScreenReader } = useAccessibility();

  const announceFormError = useCallback((fieldName: string, error: string) => {
    announceToScreenReader(`Erreur dans le champ ${fieldName}: ${error}`, 'assertive');
  }, [announceToScreenReader]);

  const announceFormSuccess = useCallback((message: string = 'Formulaire soumis avec succès') => {
    announceToScreenReader(message, 'polite');
  }, [announceToScreenReader]);

  const setFieldError = useCallback((fieldElement: HTMLElement, errorMessage: string) => {
    const errorId = `${fieldElement.id}-error`;
    let errorElement = document.getElementById(errorId);
    
    if (!errorElement) {
      errorElement = document.createElement('div');
      errorElement.id = errorId;
      errorElement.className = 'text-destructive text-sm mt-1';
      fieldElement.parentNode?.appendChild(errorElement);
    }
    
    errorElement.textContent = errorMessage;
    fieldElement.setAttribute('aria-describedby', errorId);
    fieldElement.setAttribute('aria-invalid', 'true');
    
    announceFormError(fieldElement.getAttribute('name') || 'field', errorMessage);
  }, [announceFormError]);

  const clearFieldError = useCallback((fieldElement: HTMLElement) => {
    const errorId = `${fieldElement.id}-error`;
    const errorElement = document.getElementById(errorId);
    
    if (errorElement) {
      errorElement.remove();
    }
    
    fieldElement.removeAttribute('aria-describedby');
    fieldElement.removeAttribute('aria-invalid');
  }, []);

  return {
    announceFormError,
    announceFormSuccess,
    setFieldError,
    clearFieldError
  };
};