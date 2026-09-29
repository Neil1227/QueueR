'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardInput } from '@/lib/schema';
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
    setEditorCard(card);
    setIsEditorOpen(true);
  };

  const handleAddNewCard = () => {
    setEditorCard(null);
    setIsEditorOpen(true);
  };

  const handleCloseEditor = () => {
    setIsEditorOpen(false);
    setEditorCard(null);
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
    <div className="relative min-h-screen bg-bg">
      {/* Main Card Stack */}
      <CardStack
        cards={cards}
        numberFormat={numberFormat}
        hideAddButton={isAnyOverlayActive}
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
