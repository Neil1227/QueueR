'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from './Toast';
import { PreviewNumberFormat } from '@/lib/cards';
import { Card } from '@/lib/schema';
import { LockTimeoutOption, verifyPin } from '@/lib/app-lock';
import {
  evaluatePassphraseStrength,
  createEncryptedBackup,
  restoreEncryptedBackup,
  mergeCards,
  generateBackupFilename,
  getLastBackupDate,
  isBackupReminderDue,
} from '@/lib/backup';
import {
  Lock,
  Shield,
  Key,
  User,
  LogOut,
  Eye,
  Fingerprint,
  Download,
  Upload,
  AlertTriangle,
  Clock,
  CheckCircle2,
  FileArchive,
  Sun,
  Moon,
  Monitor,
} from 'lucide-react';
import { ThemeMode } from '@/lib/theme';
import { GoogleIcon } from './GoogleIcon';

interface SettingsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  cards: Card[];
  onImportCards: (newCards: Card[], mode: 'merge' | 'replace') => Promise<void>;
  isE2EEActive: boolean;
  isE2EEConfigured: boolean;
  isDecrypting: boolean;
  onUnlockE2EE: (passphrase: string) => Promise<boolean>;
  onLockE2EE: () => void;
  hasPin: boolean;
  hasPasskey: boolean;
  lockTimeout: LockTimeoutOption;
  blurPrivacy: boolean;
  isBiometricSupported: boolean;
  onUpdatePin: (pin: string | null) => Promise<void>;
  onTogglePasskey: (enable: boolean) => Promise<boolean>;
  onUpdateLockTimeout: (timeout: LockTimeoutOption) => void;
  onToggleBlurPrivacy: (enable: boolean) => void;
  onLockManually: () => void;
  numberFormat: PreviewNumberFormat;
  onUpdateNumberFormat: (format: PreviewNumberFormat) => void;
  theme?: ThemeMode;
  onUpdateTheme?: (theme: ThemeMode) => void;
}

export function SettingsSheet({
  isOpen,
  onClose,
  cards,
  onImportCards,
  isE2EEActive,
  isE2EEConfigured,
  isDecrypting,
  onUnlockE2EE,
  onLockE2EE,
  hasPin,
  hasPasskey,
  lockTimeout,
  blurPrivacy,
  isBiometricSupported,
  onUpdatePin,
  onTogglePasskey,
  onUpdateLockTimeout,
  onToggleBlurPrivacy,
  onLockManually,
  numberFormat,
  onUpdateNumberFormat,
  theme = 'system',
  onUpdateTheme,
}: SettingsSheetProps) {
  const { user, isGuest, isConfigured, signInWithGoogle, signInWithEmail, signUpWithEmail, signInGuest, signOut } = useAuth();
  const { showToast } = useToast();

  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // E2EE state
  const [passphrase, setPassphrase] = useState('');
  const [showPassphraseInput, setShowPassphraseInput] = useState(false);

  // App Lock PIN state
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');
  const [showPinInput, setShowPinInput] = useState(false);
  const [showChangePin, setShowChangePin] = useState(false);
  const [currentPinInput, setCurrentPinInput] = useState('');
  const [changeNewPinInput, setChangeNewPinInput] = useState('');
  const [confirmChangePinInput, setConfirmChangePinInput] = useState('');
  const [pinFormError, setPinFormError] = useState<string | null>(null);
  const [isPinSubmitting, setIsPinSubmitting] = useState(false);

  // Backup Export State
  const [exportPassphrase, setExportPassphrase] = useState('');
  const [showExportSection, setShowExportSection] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [lastBackupDate, setLastBackupDateState] = useState<number | null>(null);
  const [backupReminderDue, setBackupReminderDue] = useState(false);

  // Backup Import State
  const [importFileContent, setImportFileContent] = useState<string | null>(null);
  const [importFileName, setImportFileName] = useState<string>('');
  const [importPassphrase, setImportPassphrase] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importedCardsSummary, setImportedCardsSummary] = useState<Card[] | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  // Load last backup timestamp on open
  useEffect(() => {
    if (isOpen) {
      const last = getLastBackupDate();
      setLastBackupDateState(last);
      setBackupReminderDue(isBackupReminderDue());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSignOut = async () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('qr_wallet_session_active');
      sessionStorage.removeItem('qr_wallet_e2ee_passphrase');
    }
    await signOut();
    showToast('Signed out');
    onClose();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };

  const handleE2EESubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passphrase) return;
    const ok = await onUnlockE2EE(passphrase);
    if (ok) {
      showToast('Vault security unlocked');
      setPassphrase('');
      setShowPassphraseInput(false);
    } else {
      showToast('Could not unlock vault');
    }
  };

  const handleSavePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinFormError(null);
    if (newPin.length !== 4) {
      setPinFormError('PIN must be exactly 4 digits');
      return;
    }
    if (confirmNewPin.length !== 4) {
      setPinFormError('Please confirm your 4-digit PIN');
      return;
    }
    if (newPin !== confirmNewPin) {
      setPinFormError('PINs do not match. Please try again.');
      return;
    }

    setIsPinSubmitting(true);
    try {
      await onUpdatePin(newPin);
      setNewPin('');
      setConfirmNewPin('');
      setShowPinInput(false);
      showToast('4-digit Security PIN saved');
    } catch (err: any) {
      setPinFormError(err?.message || 'Failed to save PIN');
    } finally {
      setIsPinSubmitting(false);
    }
  };

  const handleChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinFormError(null);
    if (currentPinInput.length !== 4) {
      setPinFormError('Please enter your 4-digit current PIN');
      return;
    }
    if (changeNewPinInput.length !== 4) {
      setPinFormError('New PIN must be exactly 4 digits');
      return;
    }
    if (confirmChangePinInput.length !== 4) {
      setPinFormError('Please confirm your new 4-digit PIN');
      return;
    }
    if (changeNewPinInput !== confirmChangePinInput) {
      setPinFormError('New PINs do not match. Please try again.');
      return;
    }

    setIsPinSubmitting(true);
    try {
      const verifyRes = await verifyPin(currentPinInput);
      if (!verifyRes.success) {
        if (verifyRes.isLockedOut) {
          setPinFormError(`Too many attempts. Locked out for ${verifyRes.remainingLockoutSeconds}s.`);
        } else {
          setPinFormError('Current PIN is incorrect');
        }
        setIsPinSubmitting(false);
        return;
      }

      await onUpdatePin(changeNewPinInput);
      setCurrentPinInput('');
      setChangeNewPinInput('');
      setConfirmChangePinInput('');
      setShowChangePin(false);
      showToast('Security PIN updated successfully');
    } catch (err: any) {
      setPinFormError(err?.message || 'Failed to change PIN');
    } finally {
      setIsPinSubmitting(false);
    }
  };

  const handleRemovePin = async () => {
    await onUpdatePin(null);
    setShowPinInput(false);
    setShowChangePin(false);
    showToast('PIN removed');
  };

  const handlePasskeyToggle = async () => {
    const nextState = !hasPasskey;
    const ok = await onTogglePasskey(nextState);
    if (ok) {
      showToast(nextState ? 'Biometrics / Passkey enabled' : 'Passkey removed');
    } else {
      showToast('Biometric registration failed or cancelled');
    }
  };

  // Export Backup
  const handleExportBackup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (exportPassphrase.length < 10) {
      showToast('Passphrase must be at least 10 characters');
      return;
    }

    setIsExporting(true);
    try {
      const backupJson = await createEncryptedBackup(cards, exportPassphrase);
      const filename = generateBackupFilename();

      const blob = new Blob([backupJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      const now = Date.now();
      setLastBackupDateState(now);
      setBackupReminderDue(false);
      setExportPassphrase('');
      setShowExportSection(false);
      showToast(`Exported ${cards.length} cards to ${filename}`);
    } catch (err: any) {
      showToast(err?.message || 'Failed to export backup');
    } finally {
      setIsExporting(false);
    }
  };

  // Import File Selected
  const handleFilePicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setImportFileContent(text);
      setImportPassphrase('');
      setImportError(null);
      setImportedCardsSummary(null);
      setShowImportModal(true);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Decrypt Backup File
  const handleDecryptImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFileContent || !importPassphrase) return;

    setIsImporting(true);
    setImportError(null);
    try {
      const decryptedCards = await restoreEncryptedBackup(importFileContent, importPassphrase);
      if (decryptedCards.length === 0) {
        setImportError('No valid cards found in this backup file.');
      } else {
        setImportedCardsSummary(decryptedCards);
      }
    } catch (err: any) {
      setImportError(err?.message || 'Incorrect passphrase or damaged file.');
    } finally {
      setIsImporting(false);
    }
  };

  // Complete Import (Merge or Replace)
  const handleApplyImport = async (mode: 'merge' | 'replace') => {
    if (!importedCardsSummary) return;

    try {
      if (mode === 'replace') {
        if (!window.confirm(`Replace all ${cards.length} current cards with ${importedCardsSummary.length} cards from backup?`)) {
          return;
        }
      }

      await onImportCards(importedCardsSummary, mode);
      setShowImportModal(false);
      setImportFileContent(null);
      setImportedCardsSummary(null);
      showToast(mode === 'merge' ? 'Cards merged successfully' : 'Cards replaced successfully');
    } catch (err: any) {
      showToast(err?.message || 'Failed to apply imported cards');
    }
  };

  const strength = evaluatePassphraseStrength(exportPassphrase);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Settings"
      className="fixed inset-0 z-40 bg-bg text-text overflow-y-auto pt-[calc(6px+env(safe-area-inset-top,0px))] px-5 pb-[calc(24px+env(safe-area-inset-bottom,0px))] animate-slide-up flex flex-col"
    >
      <div className="w-full max-w-lg mx-auto flex-1 flex flex-col">
        {/* Top bar */}
        <div className="flex justify-between items-center min-h-[36px] py-1 mb-0.5">
          <span className="font-semibold text-lg">Settings</span>
          <button
            type="button"
            onClick={onClose}
            className="text-accent font-semibold text-base py-1 px-1 active:opacity-70 cursor-pointer"
          >
            Done
          </button>
        </div>

        <div className="mt-4 space-y-6 flex-1 pb-10">
          {/* Appearance / Theme Section */}
          <section className="bg-surface rounded-2xl p-5 shadow-sm border border-line/30">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-purple-500/10 text-purple-500 flex items-center justify-center font-bold">
                {theme === 'dark' ? (
                  <Moon className="w-5 h-5" />
                ) : theme === 'light' ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Monitor className="w-5 h-5" />
                )}
              </div>
              <div>
                <h3 className="text-base font-semibold">Appearance</h3>
                <p className="text-xs text-muted">Customize color mode and theme</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2">
              {[
                { id: 'system', label: 'System', icon: Monitor },
                { id: 'light', label: 'Light', icon: Sun },
                { id: 'dark', label: 'Dark', icon: Moon },
              ].map((opt) => {
                const Icon = opt.icon;
                const isSelected = theme === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      if (onUpdateTheme) {
                        onUpdateTheme(opt.id as ThemeMode);
                      }
                      showToast(`Theme: ${opt.label}`);
                    }}
                    className={`py-2.5 px-2 rounded-xl text-xs font-semibold flex flex-col items-center gap-1.5 transition-all border cursor-pointer ${
                      isSelected
                        ? 'bg-accent text-white border-accent shadow-sm'
                        : 'bg-bg text-text/80 border-line hover:border-accent/40 active:scale-95'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Privacy Section: Number on Preview Strips */}
          <section className="bg-surface rounded-2xl p-5 shadow-sm border border-line/30">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold">
                <Eye className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold">Number on Preview Strips</h3>
                <p className="text-xs text-muted">Choose how account numbers appear on stacked cards</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2">
              {[
                { id: 'last4', label: 'Last 4 digits' },
                { id: 'hidden', label: 'Hidden' },
                { id: 'full', label: 'Full number' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    onUpdateNumberFormat(opt.id as PreviewNumberFormat);
                    showToast(`Preview strips: ${opt.label}`);
                  }}
                  className={`py-2.5 px-2 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
                    numberFormat === opt.id
                      ? 'bg-accent text-white border-accent shadow-sm'
                      : 'bg-bg text-text/80 border-line hover:border-accent/40 active:scale-95'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </section>

          {/* App Lock & Biometrics Section */}
          <section className="bg-surface rounded-2xl p-5 shadow-sm border border-line/30">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold">App Lock</h3>
                  <p className="text-xs text-muted">Protect wallet with PIN and biometrics</p>
                </div>
              </div>
              {(hasPin || hasPasskey) && (
                <button
                  type="button"
                  onClick={onLockManually}
                  className="px-3 py-1.5 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 font-semibold text-xs active:scale-95 transition-all cursor-pointer"
                >
                  Lock Now
                </button>
              )}
            </div>

            <div className="space-y-3 pt-2 text-sm">
              {/* PIN row */}
              <div className="flex justify-between items-center p-3 bg-bg rounded-xl">
                <div>
                  <span className="font-medium text-sm block">4-Digit Security PIN</span>
                  <span className="text-xs text-muted">
                    {hasPin ? 'Protected & Active' : 'Not configured'}
                  </span>
                </div>
                {hasPin ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowChangePin(!showChangePin);
                        setShowPinInput(false);
                        setPinFormError(null);
                        setCurrentPinInput('');
                        setChangeNewPinInput('');
                        setConfirmChangePinInput('');
                      }}
                      className="text-xs font-semibold text-accent hover:underline cursor-pointer"
                    >
                      {showChangePin ? 'Cancel' : 'Change PIN'}
                    </button>
                    <span className="text-muted/40">•</span>
                    <button
                      type="button"
                      onClick={handleRemovePin}
                      className="text-xs font-semibold text-red-500 hover:underline cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setShowPinInput(!showPinInput);
                      setShowChangePin(false);
                      setPinFormError(null);
                      setNewPin('');
                      setConfirmNewPin('');
                    }}
                    className="text-xs font-semibold text-accent cursor-pointer"
                  >
                    {showPinInput ? 'Cancel' : 'Set PIN'}
                  </button>
                )}
              </div>

              {/* Set PIN Form */}
              {showPinInput && !hasPin && (
                <form onSubmit={handleSavePin} className="p-3.5 bg-bg rounded-xl space-y-3 border border-line/40 animate-fade-in">
                  <div className="text-xs font-semibold text-text">Set 4-Digit Security PIN</div>
                  {pinFormError && (
                    <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs">
                      {pinFormError}
                    </div>
                  )}
                  <div className="space-y-2">
                    <div>
                      <label className="text-[11px] font-medium text-muted block mb-1">Enter 4-Digit PIN</label>
                      <input
                        type="password"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={4}
                        placeholder="••••"
                        value={newPin}
                        onChange={(e) => {
                          setPinFormError(null);
                          setNewPin(e.target.value.replace(/\D/g, ''));
                        }}
                        className="w-full bg-surface border border-line/50 rounded-xl px-3.5 py-2 text-sm text-text font-mono text-center tracking-widest outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 shadow-sm transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-muted block mb-1">Confirm 4-Digit PIN</label>
                      <input
                        type="password"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={4}
                        placeholder="••••"
                        value={confirmNewPin}
                        onChange={(e) => {
                          setPinFormError(null);
                          setConfirmNewPin(e.target.value.replace(/\D/g, ''));
                        }}
                        className="w-full bg-surface border border-line/50 rounded-xl px-3.5 py-2 text-sm text-text font-mono text-center tracking-widest outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 shadow-sm transition-all"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      type="submit"
                      disabled={isPinSubmitting || newPin.length !== 4 || confirmNewPin.length !== 4}
                      className="flex-1 py-2 rounded-xl bg-accent text-white font-semibold text-xs shadow-sm cursor-pointer disabled:opacity-50"
                    >
                      {isPinSubmitting ? 'Saving...' : 'Save PIN'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowPinInput(false);
                        setPinFormError(null);
                      }}
                      className="px-3 py-2 text-xs text-muted cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {/* Change PIN Form */}
              {showChangePin && hasPin && (
                <form onSubmit={handleChangePin} className="p-3.5 bg-bg rounded-xl space-y-3 border border-line/40 animate-fade-in">
                  <div className="text-xs font-semibold text-text">Change 4-Digit Security PIN</div>
                  {pinFormError && (
                    <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs">
                      {pinFormError}
                    </div>
                  )}
                  <div className="space-y-2">
                    <div>
                      <label className="text-[11px] font-medium text-muted block mb-1">Current PIN</label>
                      <input
                        type="password"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={4}
                        placeholder="Current 4-digit PIN"
                        value={currentPinInput}
                        onChange={(e) => {
                          setPinFormError(null);
                          setCurrentPinInput(e.target.value.replace(/\D/g, ''));
                        }}
                        className="w-full bg-surface border border-line/50 rounded-xl px-3.5 py-2 text-sm text-text font-mono text-center tracking-widest outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 shadow-sm transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-muted block mb-1">New 4-Digit PIN</label>
                      <input
                        type="password"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={4}
                        placeholder="New 4-digit PIN"
                        value={changeNewPinInput}
                        onChange={(e) => {
                          setPinFormError(null);
                          setChangeNewPinInput(e.target.value.replace(/\D/g, ''));
                        }}
                        className="w-full bg-surface border border-line/50 rounded-xl px-3.5 py-2 text-sm text-text font-mono text-center tracking-widest outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 shadow-sm transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-muted block mb-1">Confirm New 4-Digit PIN</label>
                      <input
                        type="password"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={4}
                        placeholder="Confirm new PIN"
                        value={confirmChangePinInput}
                        onChange={(e) => {
                          setPinFormError(null);
                          setConfirmChangePinInput(e.target.value.replace(/\D/g, ''));
                        }}
                        className="w-full bg-surface border border-line/50 rounded-xl px-3.5 py-2 text-sm text-text font-mono text-center tracking-widest outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 shadow-sm transition-all"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      type="submit"
                      disabled={
                        isPinSubmitting ||
                        currentPinInput.length !== 4 ||
                        changeNewPinInput.length !== 4 ||
                        confirmChangePinInput.length !== 4
                      }
                      className="flex-1 py-2 rounded-xl bg-accent text-white font-semibold text-xs shadow-sm cursor-pointer disabled:opacity-50"
                    >
                      {isPinSubmitting ? 'Updating...' : 'Update PIN'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowChangePin(false);
                        setPinFormError(null);
                      }}
                      className="px-3 py-2 text-xs text-muted cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {/* WebAuthn Passkey Biometrics */}
              {isBiometricSupported && (
                <div className="flex justify-between items-center p-3 bg-bg rounded-xl">
                  <div className="flex items-center gap-2">
                    <Fingerprint className="w-4 h-4 text-muted" />
                    <div>
                      <span className="font-medium text-sm block">Biometrics / Passkey</span>
                      <span className="text-xs text-muted">Face ID, Touch ID, Fingerprint</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={hasPasskey}
                    onChange={handlePasskeyToggle}
                    aria-label="Toggle Biometric Passkey"
                    className="w-5 h-5 accent-accent rounded cursor-pointer"
                  />
                </div>
              )}

              {/* Auto Lock Timeout Options */}
              {(hasPin || hasPasskey) && (
                <div className="p-3 bg-bg rounded-xl space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted" />
                    <span className="font-medium text-sm block">Auto-Lock in Background</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5 pt-1">
                    {[
                      { val: 0, label: 'Immediate' },
                      { val: 30, label: '30s' },
                      { val: 60, label: '1m' },
                      { val: 300, label: '5m' },
                    ].map((t) => (
                      <button
                        key={t.val}
                        type="button"
                        onClick={() => {
                          onUpdateLockTimeout(t.val as LockTimeoutOption);
                          showToast(`Auto-lock set to ${t.label}`);
                        }}
                        className={`py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                          lockTimeout === t.val
                            ? 'bg-accent text-white border-accent'
                            : 'bg-surface text-muted border-line/40 hover:text-text'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Blur Privacy Option */}
              <div className="flex justify-between items-center p-3 bg-bg rounded-xl">
                <div>
                  <span className="font-medium text-sm block">Blur Numbers & QR</span>
                  <span className="text-xs text-muted">Blur payment codes until explicitly tapped</span>
                </div>
                <input
                  type="checkbox"
                  checked={blurPrivacy}
                  onChange={(e) => {
                    onToggleBlurPrivacy(e.target.checked);
                    showToast(e.target.checked ? 'Blur privacy enabled' : 'Blur privacy disabled');
                  }}
                  aria-label="Toggle Blur Privacy"
                  className="w-5 h-5 accent-accent rounded cursor-pointer"
                />
              </div>

              {/* Forgot PIN Note */}
              <p className="text-[11px] text-muted leading-relaxed pt-1">
                Forgot PIN? Re-authenticating with your account resets the local PIN without compromising security.
              </p>
            </div>
          </section>

          {/* Encrypted Backup & Restore Section */}
          <section className="bg-surface rounded-2xl p-5 shadow-sm border border-line/30">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
                  <FileArchive className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold">Backup & Restore</h3>
                    {backupReminderDue && (
                      <span className="text-[10px] font-bold bg-amber-500/20 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full">
                        Backup Due
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted">
                    {lastBackupDate
                      ? `Last backup: ${new Date(lastBackupDate).toLocaleDateString()}`
                      : 'No backup created yet'}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              {/* Export Button & Form */}
              {!showExportSection ? (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowExportSection(true)}
                    className="flex-1 py-3 px-3 rounded-xl bg-bg hover:bg-bg/80 border border-line text-text font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-accent" />
                    <span>Export Backup (.qrw)</span>
                  </button>

                  <label className="flex-1 py-3 px-3 rounded-xl bg-bg hover:bg-bg/80 border border-line text-text font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer">
                    <Upload className="w-4 h-4 text-emerald-500" />
                    <span>Import Backup</span>
                    <input
                      type="file"
                      accept=".qrw,.json"
                      onChange={handleFilePicked}
                      className="hidden"
                    />
                  </label>
                </div>
              ) : (
                <form onSubmit={handleExportBackup} className="p-4 bg-bg rounded-2xl space-y-3 border border-line/30 animate-fade-in">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted">Export Encrypted Backup</span>
                    <button
                      type="button"
                      onClick={() => setShowExportSection(false)}
                      className="text-xs text-muted hover:text-text cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-muted mb-1">
                      Backup Passphrase (min 10 characters)
                    </label>
                    <input
                      type="password"
                      required
                      minLength={10}
                      placeholder="Choose a strong passphrase"
                      value={exportPassphrase}
                      onChange={(e) => setExportPassphrase(e.target.value)}
                      className="w-full bg-surface border border-line/50 rounded-xl px-3.5 py-2 text-sm text-text outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 shadow-sm transition-all"
                    />
                  </div>

                  {/* Password Strength Meter */}
                  {exportPassphrase.length > 0 && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-semibold">
                        <span className="text-muted">Strength</span>
                        <span style={{ color: strength.color }}>{strength.label}</span>
                      </div>
                      <div className="h-1.5 w-full bg-surface rounded-full overflow-hidden flex gap-0.5">
                        {[1, 2, 3, 4].map((step) => (
                          <div
                            key={step}
                            className="h-full flex-1 rounded-full transition-all duration-300"
                            style={{
                              background:
                                step <= strength.score ? strength.color : 'rgba(150, 150, 150, 0.2)',
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-[11px] leading-snug flex items-start gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>Important: A lost passphrase means the backup file cannot be recovered.</span>
                  </div>

                  <button
                    type="submit"
                    disabled={isExporting || exportPassphrase.length < 10}
                    className="w-full py-2.5 rounded-xl bg-accent text-white font-semibold text-xs shadow-sm hover:bg-accent/90 disabled:opacity-50 cursor-pointer"
                  >
                    {isExporting ? 'Encrypting backup...' : `Export ${cards.length} Cards`}
                  </button>
                </form>
              )}
            </div>
          </section>

          {/* End-to-End Encryption Section */}
          <section className="bg-surface rounded-2xl p-5 shadow-sm border border-line/30">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
                <Shield className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold">Vault Protection</h3>
                  <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 rounded-full">
                    Protected
                  </span>
                </div>
                <p className="text-xs text-muted">
                  All card names, account numbers, and QR codes are automatically encrypted before cloud sync.
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-2 text-sm">
              {showPassphraseInput ? (
                <form onSubmit={handleE2EESubmit} className="space-y-2">
                  <input
                    type="password"
                    placeholder="Enter custom vault passphrase"
                    value={passphrase}
                    onChange={(e) => setPassphrase(e.target.value)}
                    className="w-full bg-bg border border-line/50 rounded-xl px-3.5 py-2.5 text-sm text-text outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 shadow-sm transition-all"
                  />
                  <p className="text-[11px] text-muted leading-snug">
                    Optional: Adding a custom passphrase adds an extra security layer on top of your account protection.
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={isDecrypting}
                      className="flex-1 py-2.5 rounded-xl bg-accent text-white font-semibold text-xs shadow-sm hover:bg-accent/90 cursor-pointer"
                    >
                      {isDecrypting ? 'Securing...' : 'Apply Custom Passphrase'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowPassphraseInput(false)}
                      className="px-3 py-2.5 text-xs text-muted cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex items-center justify-between p-3 bg-bg rounded-xl">
                  <span className="text-xs text-muted">Custom Vault Passphrase</span>
                  <button
                    type="button"
                    onClick={() => setShowPassphraseInput(true)}
                    className="text-xs font-semibold text-accent hover:underline cursor-pointer"
                  >
                    Configure
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* Account Section */}
          <section className="bg-surface rounded-2xl p-5 shadow-sm border border-line/30">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-accent/10 text-accent flex items-center justify-center font-bold">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold">Account & Session</h3>
                <p className="text-xs text-muted">
                  {user && !isGuest
                    ? user.email || 'Signed in with Google'
                    : 'Using local Guest mode'}
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-line/20 space-y-3">
              {/* User Profile Summary */}
              <div className="p-3.5 bg-bg rounded-2xl border border-line/30 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {user?.photoURL ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'Profile'}
                      className="w-11 h-11 rounded-full object-cover border border-white/40 shadow-xs shrink-0"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 text-white font-bold text-base flex items-center justify-center shadow-xs shrink-0">
                      {(user?.displayName || user?.email || (isGuest ? 'G' : 'U')).charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 truncate">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-sm text-text truncate">
                        {user?.displayName || (isGuest ? 'Guest Session' : 'Account Active')}
                      </span>
                      <span className="inline-flex items-center gap-1 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
                        <span>{isGuest ? 'Offline Mode' : 'Cloud Synced'}</span>
                      </span>
                    </div>
                    <span className="text-xs text-muted truncate block">
                      {user?.email || (isGuest ? 'Local storage only' : 'Connected')}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSignOut}
                  className="flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:bg-red-500/10 px-3 py-2 rounded-xl transition-all cursor-pointer shrink-0"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{isGuest ? 'Exit Session' : 'Sign Out'}</span>
                </button>
              </div>

              <div className="pt-1">
                <Link
                  href="/login"
                  onClick={onClose}
                  className="w-full py-2.5 px-3 rounded-xl bg-bg hover:bg-bg/80 border border-line text-center text-xs font-semibold text-accent flex items-center justify-center gap-1.5 transition-all"
                >
                  <span>Switch Account or Re-authenticate</span>
                  <span>→</span>
                </Link>
              </div>
            </div>
          </section>

          {/* About / Info */}
          <div className="text-center text-xs text-muted pt-4 space-y-1">
            <p className="font-semibold text-text">QueueR v1.0.0</p>
            <p>Mobile-first Unified Bank & E-Wallet Payment QR Cards</p>
            <p className="text-[11px] opacity-75">Cloudflare Pages + Firebase Offline Persistence</p>
          </div>
        </div>
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Import Backup"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 overflow-y-auto animate-fade-in"
        >
          <div className="relative w-full max-w-sm rounded-[24px] bg-surface text-text border border-line/30 p-5 shadow-2xl space-y-4 my-auto">
            <h3 className="text-lg font-bold">Restore Encrypted Backup</h3>
            <p className="text-xs text-muted">File: {importFileName}</p>

            {!importedCardsSummary ? (
              <form onSubmit={handleDecryptImport} className="space-y-3 text-left">
                <div>
                  <label className="block text-xs font-semibold text-muted mb-1">Backup Passphrase</label>
                  <input
                    type="password"
                    required
                    placeholder="Enter passphrase used during export"
                    value={importPassphrase}
                    onChange={(e) => setImportPassphrase(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-bg border border-line/40 text-sm text-text outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 shadow-sm transition-all"
                  />
                </div>

                {importError && (
                  <div className="p-2.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-medium">
                    {importError}
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowImportModal(false);
                      setImportFileContent(null);
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-bg border border-line/30 text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isImporting || !importPassphrase}
                    className="flex-1 py-2.5 rounded-xl bg-accent text-white text-xs font-semibold shadow-md hover:bg-accent/90 disabled:opacity-50 cursor-pointer"
                  >
                    {isImporting ? 'Decrypting...' : 'Decrypt Backup'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4 text-left">
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <span>
                    Successfully decrypted <b>{importedCardsSummary.length} cards</b>.
                  </span>
                </div>

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => handleApplyImport('merge')}
                    className="w-full py-3 px-4 rounded-xl bg-accent text-white font-semibold text-xs shadow-md hover:bg-accent/90 active:scale-98 transition-all flex flex-col items-center cursor-pointer"
                  >
                    <span>Merge Cards (Recommended)</span>
                    <span className="text-[10px] opacity-85 font-normal">Keep existing cards, add new, skip duplicates</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApplyImport('replace')}
                    className="w-full py-2.5 px-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 font-semibold text-xs active:scale-98 transition-all cursor-pointer"
                  >
                    Replace All Cards
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowImportModal(false)}
                    className="w-full py-2 text-center text-xs text-muted hover:text-text cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
