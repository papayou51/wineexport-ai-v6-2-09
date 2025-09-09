import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Keyboard, HelpCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  description: string;
  category: string;
}

const keyboardShortcuts: KeyboardShortcut[] = [
  // Navigation
  { key: 'h', ctrlKey: true, description: 'Aller à l\'accueil', category: 'Navigation' },
  { key: 'p', ctrlKey: true, description: 'Voir les projets', category: 'Navigation' },
  { key: 'n', ctrlKey: true, description: 'Nouveau projet', category: 'Navigation' },
  { key: 'r', ctrlKey: true, description: 'Voir les rapports', category: 'Navigation' },
  { key: 'd', ctrlKey: true, description: 'Tableau de bord', category: 'Navigation' },
  { key: 'Escape', description: 'Retour à la page précédente', category: 'Navigation' },
  
  // Actions
  { key: 's', ctrlKey: true, description: 'Sauvegarder', category: 'Actions' },
  { key: 'e', ctrlKey: true, description: 'Éditer', category: 'Actions' },
  { key: 'Delete', description: 'Supprimer l\'élément sélectionné', category: 'Actions' },
  
  // Interface
  { key: '?', shiftKey: true, description: 'Afficher cette aide', category: 'Interface' },
  { key: 't', ctrlKey: true, description: 'Basculer le thème', category: 'Interface' },
  { key: 'f', ctrlKey: true, description: 'Rechercher', category: 'Interface' },
];

const KeyboardShortcutsHelp: React.FC = () => {
  const [open, setOpen] = useState(false);

  const groupedShortcuts = keyboardShortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = [];
    }
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<string, KeyboardShortcut[]>);

  const formatShortcut = (shortcut: KeyboardShortcut) => {
    const keys = [];
    
    if (shortcut.ctrlKey) keys.push('Ctrl');
    if (shortcut.shiftKey) keys.push('Shift');
    if (shortcut.altKey) keys.push('Alt');
    
    keys.push(shortcut.key === ' ' ? 'Space' : shortcut.key);
    
    return keys.join(' + ');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm"
          className="gap-2"
          aria-label="Afficher les raccourcis clavier"
        >
          <HelpCircle className="h-4 w-4" />
          <span className="hidden sm:inline">Raccourcis</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Raccourcis Clavier
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {Object.entries(groupedShortcuts).map(([category, shortcuts]) => (
            <div key={category}>
              <h3 className="font-semibold text-lg mb-3 text-primary">
                {category}
              </h3>
              <div className="space-y-2">
                {shortcuts.map((shortcut, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm">{shortcut.description}</span>
                    <Badge variant="outline" className="font-mono text-xs">
                      {formatShortcut(shortcut)}
                    </Badge>
                  </div>
                ))}
              </div>
              {category !== Object.keys(groupedShortcuts)[Object.keys(groupedShortcuts).length - 1] && (
                <Separator className="mt-4" />
              )}
            </div>
          ))}
          
          <div className="text-xs text-muted-foreground mt-6 p-4 bg-muted/50 rounded-lg">
            <p className="font-medium mb-2">Notes :</p>
            <ul className="space-y-1">
              <li>• Les raccourcis ne fonctionnent pas dans les champs de saisie</li>
              <li>• Utilisez Tab pour naviguer entre les éléments</li>
              <li>• Appuyez sur Entrée pour activer les boutons sélectionnés</li>
              <li>• Utilisez les flèches pour naviguer dans les menus</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default KeyboardShortcutsHelp;