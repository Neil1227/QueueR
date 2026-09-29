'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from './Toast';
import { PreviewNumberFormat } from '@/lib/cards';
import { Card } from '@/lib/schema';
import { LockTimeoutOption } from '@/lib/app-lock';
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
  const [showPinInput, setShowPinInput] = useState(false);

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

  const handleGoogleSignIn = async () => {
    setAuthLoading(true);
    try {
      await signInWithGoogle();
      showToast('Signed in with Google');
    } catch (err: any) {
      showToast(err?.message || 'Google sign-in failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setAuthLoading(true);
    try {
      if (authMode === 'signup') {
        await signUpWithEmail(email, password);
        showToast('Account created & signed in');
      } else {
        await signInWithEmail(email, password);
        showToast('Signed in successfully');
      }
      setEmail('');
      setPassword('');
    } catch (err: any) {
      showToast(err?.message || 'Authentication failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGuestSignIn = async () => {
    setAuthLoading(true);
    try {
      await signInGuest();
      showToast('Started guest session');
    } catch (err: any) {
      showToast(err?.message || 'Guest sign-in failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    showToast('Signed out');
  };

  const handleE2EESubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passphrase) return;
    const ok = await onUnlockE2EE(passphrase);
    if (ok) {
      showToast('E2EE unlocked & keys derived');
      setPassphrase('');
      setShowPassphraseInput(false);
    } else {
      showToast('Could not unlock E2EE');
    }
  };

  const handleSavePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length < 4 || newPin.length > 6) {
      showToast('PIN must be 4 to 6 digits');
      return;
    }
    await onUpdatePin(newPin);
    setNewPin('');
    setShowPinInput(false);
    showToast('App Lock PIN configured (PBKDF2 310,000 iter)');
  };

  const handleRemovePin = async () => {
    await onUpdatePin(null);
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
                  <span className="font-medium text-sm block">Passcode PIN (4-6 digits)</span>
                  <span className="text-xs text-muted">
                    {hasPin ? 'PIN is configured (PBKDF2 SHA-256)' : 'Not set'}
                  </span>
                </div>
                {hasPin ? (
                  <button
                    type="button"
                    onClick={handleRemovePin}
                    className="text-xs font-semibold text-red-500 hover:underline cursor-pointer"
                  >
                    Remove
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowPinInput(!showPinInput)}
                    className="text-xs font-semibold text-accent cursor-pointer"
                  >
                    Set PIN
                  </button>
                )}
              </div>

              {showPinInput && (
                <form onSubmit={handleSavePin} className="p-3 bg-bg rounded-xl space-y-2">
                  <input
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    placeholder="Enter 4-6 digit PIN"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-surface border border-line/50 rounded-xl px-3.5 py-2 text-sm text-text font-mono text-center tracking-widest outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 shadow-sm transition-all"
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 py-2 rounded-xl bg-accent text-white font-semibold text-xs shadow-sm cursor-pointer"
                    >
                      Save PIN
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowPinInput(false)}
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
                Forgot PIN? Re-authenticating with your Firebase account resets the local PIN without compromising security.
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
                    {isExporting ? 'Encrypting (PBKDF2 600k iter)...' : `Export ${cards.length} Cards`}
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
                  <h3 className="text-base font-semibold">End-to-End Encryption</h3>
                  {isE2EEActive && (
                    <span className="text-[11px] font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                      ACTIVE
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted">
                  Encrypt numbers and QR payloads on-device with WebCrypto AES-GCM
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-2 text-sm">
              {isE2EEActive ? (
                <div className="flex justify-between items-center bg-emerald-500/10 p-3 rounded-xl">
                  <span className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">
                    Vault is currently unlocked. New cards are encrypted before sync.
                  </span>
                  <button
                    type="button"
                    onClick={onLockE2EE}
                    className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 underline cursor-pointer"
                  >
                    Lock
                  </button>
                </div>
              ) : showPassphraseInput ? (
                <form onSubmit={handleE2EESubmit} className="space-y-2">
                  <input
                    type="password"
                    placeholder="Enter E2EE passphrase"
                    value={passphrase}
                    onChange={(e) => setPassphrase(e.target.value)}
                    className="w-full bg-bg border border-line/50 rounded-xl px-3.5 py-2.5 text-sm text-text outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 shadow-sm transition-all"
                  />
                  <p className="text-[11px] text-amber-600 dark:text-amber-400 leading-snug">
                    Important: We never store your passphrase. If lost, encrypted data is permanently unrecoverable.
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={isDecrypting}
                      className="flex-1 py-2.5 rounded-xl bg-accent text-white font-semibold text-xs shadow-sm hover:bg-accent/90 cursor-pointer"
                    >
                      {isDecrypting ? 'Deriving Key...' : 'Unlock / Enable E2EE'}
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
                <button
                  type="button"
                  onClick={() => setShowPassphraseInput(true)}
                  className="w-full py-3 px-4 rounded-xl bg-bg hover:bg-bg/80 border border-line text-text font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <Key className="w-4 h-4" />
                  <span>{isE2EEConfigured ? 'Unlock E2EE Vault' : 'Enable E2EE Protection'}</span>
                </button>
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
                <h3 className="text-base font-semibold">Account & Cloud Sync</h3>
                <p className="text-xs text-muted">
                  {user
                    ? user.email || (isGuest ? 'Guest User (Offline Local Storage)' : 'Signed in')
                    : 'Sign in to sync cards across devices'}
                </p>
              </div>
            </div>

            {user ? (
              <div className="pt-2 border-t border-line/20 flex justify-between items-center">
                <span className="text-sm font-medium text-text truncate max-w-[220px]">
                  {user.email || 'Guest Mode'}
                </span>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:bg-red-500/10 px-3 py-2 rounded-xl transition-all cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3 pt-2">
                {isConfigured && (
                  <button
                    type="button"
                    disabled={authLoading}
                    onClick={handleGoogleSignIn}
                    className="w-full py-3 px-4 rounded-xl bg-bg hover:bg-bg/80 border border-line text-text font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                  >
                    <span>Sign in with Google</span>
                  </button>
                )}

                {isConfigured && (
                  <form onSubmit={handleEmailAuth} className="space-y-2 pt-2">
                    <input
                      type="email"
                      required
                      placeholder="Email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-bg border border-line/50 rounded-xl px-3.5 py-2.5 text-sm text-text outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 shadow-sm transition-all"
                    />
                    <input
                      type="password"
                      required
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-bg border border-line/50 rounded-xl px-3.5 py-2.5 text-sm text-text outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 shadow-sm transition-all"
                    />
                    <div className="flex gap-2 pt-1">
                      <button
                        type="submit"
                        disabled={authLoading}
                        className="flex-1 py-2.5 rounded-xl bg-accent text-white font-semibold text-sm shadow-sm hover:bg-accent/90 cursor-pointer"
                      >
                        {authMode === 'signup' ? 'Create Account' : 'Sign In'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')}
                        className="px-3 py-2.5 text-xs text-muted font-medium hover:text-text cursor-pointer"
                      >
                        {authMode === 'signin' ? 'Need account?' : 'Have account?'}
                      </button>
                    </div>
                  </form>
                )}

                <button
                  type="button"
                  disabled={authLoading}
                  onClick={handleGuestSignIn}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-muted hover:text-text hover:bg-bg transition-all cursor-pointer"
                >
                  Continue as Guest (Local Offline)
                </button>
              </div>
            )}
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
