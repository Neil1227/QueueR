'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardInput, CardCategory } from '@/lib/schema';
import { useAuth } from '@/hooks/useAuth';
import { useCards } from '@/hooks/useCards';
import { useAppLock } from '@/hooks/useAppLock';
import { useTheme } from '@/hooks/useTheme';
import { CardStack } from '@/components/CardStack';
import { CardStackSkeleton } from '@/components/CardStackSkeleton';
import { PullToRefresh } from '@/components/PullToRefresh';
import { ReceiveSheet } from '@/components/ReceiveSheet';
import { EditorSheet } from '@/components/EditorSheet';
import { SettingsSheet } from '@/components/SettingsSheet';
import { AppLockModal } from '@/components/AppLockModal';
import { PinSetupModal } from '@/components/PinSetupModal';
import { ForgotPinModal } from '@/components/ForgotPinModal';
import {
  getCachedDefaultCard,
  getPreviewNumberFormat,
  setPreviewNumberFormat,
  PreviewNumberFormat,
} from '@/lib/cards';

export default function HomePage() {
  const router = useRouter();
  const { user, isGuest, loading: authLoading, signOut } = useAuth();
  const { theme, setTheme } = useTheme();

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

  const [isForgotPinOpen, setIsForgotPinOpen] = useState(false);
  const [isResetPinOpen, setIsResetPinOpen] = useState(false);

  // Authentication gate: If not logged in at all, redirect to /login
  useEffect(() => {
    if (!authLoading && !user && !isGuest) {
      router.replace('/login');
    }
  }, [user, isGuest, authLoading, router]);

  // Session gate on reopen: If PIN is set and session is not active, enforce lock screen
  useEffect(() => {
    if (typeof window !== 'undefined' && hasPin) {
      const isSessionActive = sessionStorage.getItem('qr_wallet_session_active') === 'true';
      if (!isSessionActive) {
        lockManually();
      }
    }
  }, [hasPin, lockManually]);

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
    if (quickAccessHandledRef.current || isLocked || !hasPin) return;

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const isStackParam = params.has('stack');

      if (!isStackParam) {
        // First try synchronous local storage cached default
        const cachedDef = getCachedDefaultCard(user?.uid);
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
  }, [defaultCard, receiveCard, recordUse, isLocked, hasPin, user?.uid]);

  const handleUnlockPin = async (pin: string) => {
    const res = await unlockWithPin(pin);
    if (res.success && typeof window !== 'undefined') {
      sessionStorage.setItem('qr_wallet_session_active', 'true');
    }
    return res;
  };

  const handleUnlockBiometrics = async () => {
    const ok = await unlockWithBiometrics();
    if (ok && typeof window !== 'undefined') {
      sessionStorage.setItem('qr_wallet_session_active', 'true');
    }
    return ok;
  };

  const handleSaveInitialPin = async (newPin: string) => {
    await updatePin(newPin);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('qr_wallet_session_active', 'true');
    }
  };

  const handleSaveResetPin = async (newPin: string) => {
    await updatePin(newPin);
    setIsResetPinOpen(false);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('qr_wallet_session_active', 'true');
    }
  };

  const handleSignOut = async () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('qr_wallet_session_active');
      sessionStorage.removeItem('qr_wallet_e2ee_passphrase');
    }
    await signOut();
    router.replace('/login');
  };

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

  const isAnyOverlayActive = Boolean(
    receiveCard || isEditorOpen || isSettingsOpen || isLocked || !hasPin || isForgotPinOpen || isResetPinOpen
  );

  if (authLoading) {
    return <CardStackSkeleton />;
  }

  return (
    <div className="relative min-h-screen bg-bg">
      {/* Mobile Scroll-Down Pull To Refresh Container */}
      <PullToRefresh disabled={isAnyOverlayActive}>
        {/* Main Card Stack */}
        <CardStack
          cards={cards}
          loading={cardsLoading}
          numberFormat={numberFormat}
          hideAddButton={isAnyOverlayActive}
          onOpenCard={handleOpenReceive}
          onAddCard={handleAddNewCard}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
      </PullToRefresh>

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

      {/* App 4-Digit PIN Lock Overlay Screen (Every App Launch / Reopen) */}
      <AppLockModal
        isLocked={isLocked && hasPin}
        hasPin={hasPin}
        hasPasskey={hasPasskey}
        lockoutSeconds={lockoutSeconds}
        userEmail={user?.email}
        onUnlockPin={handleUnlockPin}
        onUnlockBiometrics={handleUnlockBiometrics}
        onForgotPin={() => setIsForgotPinOpen(true)}
        onSignOut={handleSignOut}
      />

      {/* Initial 4-Digit PIN Setup Modal (Upon Account Creation / Google Sign-in) */}
      {!hasPin && (user || isGuest) && (
        <PinSetupModal
          isOpen={!hasPin}
          userEmail={user?.email}
          title="Create 4-Digit Security PIN"
          onSavePin={handleSaveInitialPin}
        />
      )}

      {/* Forgot PIN Verification Modal */}
      <ForgotPinModal
        isOpen={isForgotPinOpen}
        userEmail={user?.email}
        onClose={() => setIsForgotPinOpen(false)}
        onVerifiedReset={() => {
          setIsForgotPinOpen(false);
          setIsResetPinOpen(true);
        }}
        onSignOut={handleSignOut}
      />

      {/* Reset PIN Modal (After Email/Google Verification) */}
      <PinSetupModal
        isOpen={isResetPinOpen}
        userEmail={user?.email}
        title="Reset 4-Digit Security PIN"
        onSavePin={handleSaveResetPin}
        onCancel={() => setIsResetPinOpen(false)}
      />
    </div>
  );
}
