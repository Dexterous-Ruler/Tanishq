import React, { useState } from 'react';
import { Globe, Check } from 'lucide-react';
import { useTranslation } from './useTranslation';
import { LanguageCode } from './types';
import { useUpdateSettings } from '@/hooks/useUser';
import { useQueryClient } from '@tanstack/react-query';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface LanguageSelectorProps {
  className?: string;
  variant?: 'default' | 'compact';
}

export function LanguageSelector({ className, variant = 'default' }: LanguageSelectorProps) {
  const { language, setLanguage, supportedLanguages } = useTranslation();
  const updateSettings = useUpdateSettings();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);

  const currentLanguage = supportedLanguages.find(lang => lang.code === language);
  
  const handleLanguageChange = async (value: string) => {
    console.log('[LanguageSelector] Language changed to:', value);
    const newLanguage = value as LanguageCode;
    setLanguage(newLanguage);
    
    // Save language to user settings
    try {
      await updateSettings.mutateAsync({ language: newLanguage });
      console.log(`[LanguageSelector] Language preference saved to user settings: ${newLanguage}`);
      
      // Invalidate all insight queries to force refetch with new language
      queryClient.invalidateQueries({ queryKey: ['health-insights'] });
      queryClient.invalidateQueries({ queryKey: ['document-insights'] });
      console.log(`[LanguageSelector] Invalidated insight queries to refetch with new language`);
    } catch (error) {
      // Silently fail if user is not logged in or settings update fails
      // Language is still saved to localStorage via setLanguage
      console.log(`[LanguageSelector] Could not save language to user settings (user may not be logged in)`);
      
      // Still invalidate queries even if settings update fails
      queryClient.invalidateQueries({ queryKey: ['health-insights'] });
      queryClient.invalidateQueries({ queryKey: ['document-insights'] });
    }
  };

  if (variant === 'compact') {
    return (
      <Select value={language} onValueChange={handleLanguageChange}>
        <SelectTrigger className={className}>
          <Globe className="w-4 h-4 mr-2" />
          <SelectValue>
            <span className="text-sm">{currentLanguage?.nativeName || currentLanguage?.name}</span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {supportedLanguages.map((lang) => (
            <SelectItem key={lang.code} value={lang.code}>
              <div className="flex items-center justify-between w-full">
                <span>{lang.nativeName}</span>
                {language === lang.code && <Check className="w-4 h-4 ml-2 text-primary" />}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <div className={className}>
      <Select value={language} onValueChange={handleLanguageChange}>
        <SelectTrigger className="w-full">
          <Globe className="w-4 h-4 mr-2" />
          <SelectValue>
            <div className="flex flex-col items-start">
              <span className="text-sm font-medium">{currentLanguage?.name}</span>
              <span className="text-xs text-muted-foreground">{currentLanguage?.nativeName}</span>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {supportedLanguages.map((lang) => (
            <SelectItem key={lang.code} value={lang.code}>
              <div className="flex items-center justify-between w-full">
                <div className="flex flex-col items-start">
                  <span className="font-medium">{lang.name}</span>
                  <span className="text-xs text-muted-foreground">{lang.nativeName}</span>
                </div>
                {language === lang.code && <Check className="w-4 h-4 ml-2 text-primary" />}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

