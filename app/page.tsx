'use client';

import React, { useState, useEffect, useRef } from 'react';
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
import {
  getCachedDefaultCard,
  getPreviewNumberFormat,
  setPreviewNumberFormat,
  PreviewNumberFormat,
} from '@/lib/cards';

export default function HomePage() {
  const { user } = useAuth();
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
    setReceiveCard(null);
    setEditorCategory(card.category || 'personal');
    setEditorCard(card);
    setIsEditorOpen(true);
  };

  const handleAddNewCard = (category?: CardCategory) => {
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
    await saveCard(input);
  };

  const handleDeleteCard = async (cardId: string) => {
    await deleteCard(cardId);
  };

  const handleImportCards = async (importedList: Card[], mode: 'merge' | 'replace') => {
    await importCards(importedList, mode);
  };

  const isAnyOverlayActive = Boolean(receiveCard || isEditorOpen || isSettingsOpen || isLocked);

  return (
    <div className="relative min-h-screen bg-bg overflow-x-hidden transition-colors selection:bg-accent/20">
      {/* Minimalist Ambient Glow Meshes */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-blue-500/10 dark:bg-blue-400/10 blur-[100px] transform-gpu" />
        <div className="absolute top-1/3 -left-32 w-80 h-80 rounded-full bg-indigo-500/8 dark:bg-indigo-400/8 blur-[110px] transform-gpu" />
        <div className="absolute -bottom-24 right-1/4 w-88 h-88 rounded-full bg-sky-450/8 dark:bg-sky-500/8 blur-[100px] transform-gpu" />
      </div>

      {/* Tactile Dot Grid Overlay */}
      <div className="fixed inset-0 bg-dot-grid pointer-events-none z-0" aria-hidden="true" />

      {/* Main App Content */}
      <div className="relative z-10">
        {/* Main Card Stack */}
        <CardStack
          cards={cards}
          numberFormat={numberFormat}
          hideAddButton={isAnyOverlayActive}
          onOpenCard={handleOpenReceive}
          onAddCard={handleAddNewCard}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
      </div>

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
        onOpenSettings={() => setIsSettingsOpen(true)}
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
