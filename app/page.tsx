'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardInput, CardCategory } from '@/lib/schema';
import { useAuth } from '@/hooks/useAuth';
import { useCards } from '@/hooks/useCards';
import { useAppLock } from '@/hooks/useAppLock';
import { useTheme } from '@/hooks/useTheme';
import { CardStack } from '@/components/CardStack';
import { ReceiveSheet } from '@/components/ReceiveSheet';
import { EditorSheet } from '@/components/EditorSheet';
import { SettingsSheet } from '@/components/SettingsSheet';
import { AppLockModal } from '@/components/AppLockModal';
import { SignUpPromptModal } from '@/components/SignUpPromptModal';
import {
  getCachedDefaultCard,
  getPreviewNumberFormat,
  setPreviewNumberFormat,
  PreviewNumberFormat,
} from '@/lib/cards';

export default function HomePage() {
  const router = useRouter();
  const { user, loading: authLoading, isGuest, isDemo } = useAuth();
  const { theme, setTheme } = useTheme();
  const {
    cards,
    loading: cardsLoading,
    defaultCard,
    saveCard,
    deleteCard,
    recordUse,
    importCards,
    isE2EEActive,
    isE2EEConfigured,
    isDecrypting,
    unlockE2EE,
    lockE2EE,
  } = useCards(user?.uid);

  // Redirect to /login if unauthenticated and not in guest or demo mode
  useEffect(() => {
    if (!authLoading && !user && !isGuest && !isDemo) {
      router.replace('/login');
    }
  }, [authLoading, user, isGuest, isDemo, router]);

  const {
    isLocked,
    hasPin,
    hasPasskey,
    lockTimeout,
    blurPrivacy,
    isBiometricSupported,
    lockoutSeconds,
    unlockWithPin,
    unlockWithBiometrics,
    updatePin,
    togglePasskey,
    updateLockTimeout,
    toggleBlurPrivacy,
    lockManually,
  } = useAppLock();

  const [receiveCard, setReceiveCard] = useState<Card | null>(null);
  const [editorCard, setEditorCard] = useState<Card | null>(null);
  const [editorCategory, setEditorCategory] = useState<CardCategory | undefined>(undefined);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSignUpPromptOpen, setIsSignUpPromptOpen] = useState(false);
  const [numberFormat, setNumberFormat] = useState<PreviewNumberFormat>('last4');
  const quickAccessHandledRef = useRef(false);

  // Initialize privacy preview number format from localStorage
  useEffect(() => {
    setNumberFormat(getPreviewNumberFormat());
  }, []);

  const handleUpdateNumberFormat = (format: PreviewNumberFormat) => {
    setNumberFormat(format);
    setPreviewNumberFormat(format);
  };

  // Quick Access Launch: If default card exists and no ?stack param, open receive view immediately (only when app is unlocked)
  useEffect(() => {
    if (quickAccessHandledRef.current || isLocked) return;

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const isStackParam = params.has('stack');

      if (!isStackParam) {
        // First try synchronous local storage cached default
        const cachedDef = getCachedDefaultCard();
        const targetCard = defaultCard || cachedDef;

        if (targetCard && !receiveCard) {
          setReceiveCard(targetCard);
          recordUse(targetCard.id);
          quickAccessHandledRef.current = true;
        }
      } else {
        quickAccessHandledRef.current = true;
      }
    }
  }, [defaultCard, receiveCard, recordUse, isLocked]);

  const handleOpenReceive = (card: Card) => {
    setReceiveCard(card);
    recordUse(card.id);
  };

  const handleCloseReceive = () => {
    setReceiveCard(null);
  };

  const handleEditFromReceive = (card: Card) => {
    if (isDemo) {
      setIsSignUpPromptOpen(true);
      return;
    }
    setReceiveCard(null);
    setEditorCategory(card.category || 'personal');
    setEditorCard(card);
    setIsEditorOpen(true);
  };

  const handleAddNewCard = (category?: CardCategory) => {
    if (isDemo) {
      setIsSignUpPromptOpen(true);
      return;
    }
    setEditorCategory(category);
    setEditorCard(null);
    setIsEditorOpen(true);
  };

  const handleCloseEditor = () => {
    setIsEditorOpen(false);
    setEditorCard(null);
    setEditorCategory(undefined);
  };

  const handleSaveCard = async (input: CardInput) => {
    if (isDemo) {
      setIsSignUpPromptOpen(true);
      return;
    }
    await saveCard(input);
  };

  const handleDeleteCard = async (cardId: string) => {
    if (isDemo) {
      setIsSignUpPromptOpen(true);
      return;
    }
    await deleteCard(cardId);
  };

  const handleImportCards = async (importedList: Card[], mode: 'merge' | 'replace') => {
    if (isDemo) {
      setIsSignUpPromptOpen(true);
      return;
    }
    await importCards(importedList, mode);
  };

  const isAnyOverlayActive = Boolean(receiveCard || isEditorOpen || isSettingsOpen || isLocked || isSignUpPromptOpen);

  if (authLoading || (!user && !isGuest && !isDemo)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg text-text">
        <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-bg">
      {/* Main Card Stack */}
      <CardStack
        cards={cards}
        numberFormat={numberFormat}
        hideAddButton={isAnyOverlayActive}
        isDemo={isDemo}
        onSignUpPrompt={() => setIsSignUpPromptOpen(true)}
        onOpenCard={handleOpenReceive}
        onAddCard={handleAddNewCard}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Receive View Sheet */}
      <ReceiveSheet
        card={receiveCard}
        isOpen={Boolean(receiveCard)}
        onClose={handleCloseReceive}
        onEdit={handleEditFromReceive}
      />

      {/* Add / Edit Card Sheet */}
      <EditorSheet
        card={editorCard}
        isOpen={isEditorOpen}
        initialCategory={editorCategory}
        onClose={handleCloseEditor}
        onSave={handleSaveCard}
        onDelete={handleDeleteCard}
      />

      {/* Settings & Account Sheet */}
      <SettingsSheet
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        cards={cards}
        onImportCards={handleImportCards}
        isE2EEActive={isE2EEActive}
        isE2EEConfigured={isE2EEConfigured}
        isDecrypting={isDecrypting}
        onUnlockE2EE={unlockE2EE}
        onLockE2EE={lockE2EE}
        hasPin={hasPin}
        hasPasskey={hasPasskey}
        lockTimeout={lockTimeout}
        blurPrivacy={blurPrivacy}
        isBiometricSupported={isBiometricSupported}
        onUpdatePin={updatePin}
        onTogglePasskey={togglePasskey}
        onUpdateLockTimeout={updateLockTimeout}
        onToggleBlurPrivacy={toggleBlurPrivacy}
        onLockManually={lockManually}
        numberFormat={numberFormat}
        onUpdateNumberFormat={handleUpdateNumberFormat}
        theme={theme}
        onUpdateTheme={setTheme}
      />

      {/* Sign Up Prompt Modal for Demo Mode */}
      <SignUpPromptModal
        isOpen={isSignUpPromptOpen}
        onClose={() => setIsSignUpPromptOpen(false)}
      />

      {/* App Lock Overlay Screen */}
      <AppLockModal
        isLocked={isLocked}
        hasPin={hasPin}
        hasPasskey={hasPasskey}
        lockoutSeconds={lockoutSeconds}
        onUnlockPin={unlockWithPin}
        onUnlockBiometrics={unlockWithBiometrics}
      />
    </div>
  );
}
