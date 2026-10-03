'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card } from '@/lib/schema';
import { fgFor, getCardGradient } from '@/lib/colors';
import { maskedNumber, PreviewNumberFormat } from '@/lib/cards';
import { drawQR } from '@/lib/qr';
import { useWakeLock } from '@/hooks/useWakeLock';
import { useToast } from './Toast';
import { isBlurPrivacyEnabled } from '@/lib/app-lock';
import { generateShareCanvas, shareOrDownloadImage, downloadCanvasAsPNG } from '@/lib/image-share';
import { BankLogo } from './BankLogo';
import { AmountModal } from './AmountModal';
import { KkbModal } from './KkbModal';
import { embedAmountInQRPh, isEMVCoPayload, parseQRPh } from '@/lib/qr-ph';
import {
  Sun,
  X,
  Share2,
  Copy,
  Image as ImageIcon,
  Sparkles,
  Download,
  Eye,
  EyeOff,
  AlertTriangle,
  Banknote,
  Users,
  Receipt,
} from 'lucide-react';

const HIDE_BRIGHTNESS_HINT_KEY = 'qr_wallet_hide_brightness_hint_v1';
const SCAN_MODE_KEY = 'qr_wallet_scan_mode_v1';

interface ReceiveSheetProps {
  card: Card | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (card: Card) => void;
}

export function ReceiveSheet({ card, isOpen, onClose, onEdit }: ReceiveSheetProps) {
  const [revealed, setRevealed] = useState(false);
  const [scanMode, setScanMode] = useState(false);
  const [showBrightnessHint, setShowBrightnessHint] = useState(false);
  const [blurPrivacy, setBlurPrivacy] = useState(false);
  const [qrUnblurred, setQrUnblurred] = useState(false);

  // Amount Embedding & KKB State
  const [requestedAmount, setRequestedAmount] = useState<number | null>(null);
  const [requestedNote, setRequestedNote] = useState<string | null>(null);
  const [isAmountModalOpen, setIsAmountModalOpen] = useState(false);
  const [isKkbModalOpen, setIsKkbModalOpen] = useState(false);

  // Share Image Modal State
  const [isShareImageModalOpen, setIsShareImageModalOpen] = useState(false);
  const [shareImageNumberFormat, setShareImageNumberFormat] = useState<PreviewNumberFormat>('last4');
  const [shareFooterText, setShareFooterText] = useState('Scan to pay');
  const [sharePreviewUrl, setSharePreviewUrl] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [showFullNumberWarning, setShowFullNumberWarning] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { acquire: acquireWakeLock, release: releaseWakeLock } = useWakeLock();
  const { showToast } = useToast();

  const isQRPh = Boolean(card?.payload && isEMVCoPayload(card.payload));

  // Compute payload with embedded amount if requested
  const effectivePayload = React.useMemo(() => {
    if (!card?.payload) return null;
    if (requestedAmount && requestedAmount > 0 && isQRPh) {
      return embedAmountInQRPh(card.payload, requestedAmount, requestedNote || undefined);
    }
    return card.payload;
  }, [card?.payload, requestedAmount, requestedNote, isQRPh]);

  // Load preferences
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hideHint = localStorage.getItem(HIDE_BRIGHTNESS_HINT_KEY) === 'true';
    const savedScanMode = localStorage.getItem(SCAN_MODE_KEY) === 'true';
    setScanMode(savedScanMode);
    setBlurPrivacy(isBlurPrivacyEnabled());

    if (isOpen && card) {
      setRevealed(false);
      setQrUnblurred(false);
      acquireWakeLock();

      // Check if original payload already contains a pre-set amount
      if (card.payload && isEMVCoPayload(card.payload)) {
        const parsed = parseQRPh(card.payload);
        setRequestedAmount(parsed.amount || null);
        setRequestedNote(parsed.note || null);
      } else {
        setRequestedAmount(null);
        setRequestedNote(null);
      }

      if (!hideHint) {
        setShowBrightnessHint(true);
        const timer = setTimeout(() => {
          setShowBrightnessHint(false);
        }, 4000);
        return () => clearTimeout(timer);
      }
    } else {
      releaseWakeLock();
      setShowBrightnessHint(false);
      setIsShareImageModalOpen(false);
      setIsAmountModalOpen(false);
    }
  }, [isOpen, card, acquireWakeLock, releaseWakeLock]);

  // Re-draw QR on canvas when card or payload changes
  useEffect(() => {
    if (isOpen && effectivePayload && canvasRef.current) {
      drawQR(canvasRef.current, effectivePayload, 720);
    }
  }, [isOpen, effectivePayload, scanMode]);

  const handleToggleScanMode = () => {
    const next = !scanMode;
    setScanMode(next);
    localStorage.setItem(SCAN_MODE_KEY, next ? 'true' : 'false');
    showToast(next ? 'Scan mode enabled (high contrast)' : 'Scan mode disabled');
  };

  const handleDismissBrightnessHint = (neverAgain = false) => {
    setShowBrightnessHint(false);
    if (neverAgain) {
      localStorage.setItem(HIDE_BRIGHTNESS_HINT_KEY, 'true');
      showToast("Brightness hint won't be shown again");
    }
  };

  const handleCopyNumber = useCallback(async () => {
    if (!card?.number) return;
    try {
      await navigator.clipboard.writeText(card.number);
      showToast('Number copied');
    } catch {
      showToast("Couldn't copy number");
    }
  }, [card, showToast]);

  const handleShareDetails = useCallback(async () => {
    if (!card) return;
    const parts = [card.provider, card.holder, card.number];
    if (requestedAmount && requestedAmount > 0) {
      const amtStr = `Amount: ₱${requestedAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
      const noteStr = requestedNote ? ` (${requestedNote})` : '';
      parts.unshift(`${amtStr}${noteStr}`);
    }
    const text = parts.filter(Boolean).join('\n');

    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({
          title: card.provider,
          text,
        });
      } else {
        await navigator.clipboard.writeText(text);
        showToast('Details copied to clipboard');
      }
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        showToast("Sharing isn't available here");
      }
    }
  }, [card, requestedAmount, requestedNote, showToast]);

  // Generate Image Preview
  const handleOpenShareImageModal = async () => {
    if (!card) return;
    setIsGeneratingImage(true);
    setIsShareImageModalOpen(true);
    try {
      const shareCanvas = await generateShareCanvas(card, {
        numberFormat: shareImageNumberFormat,
        footerText: shareFooterText,
        requestedAmount,
        requestedNote,
      });
      setSharePreviewUrl(shareCanvas.toDataURL('image/png'));
    } catch (err) {
      console.error('Failed to generate preview image:', err);
      showToast("Couldn't generate image preview");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleFormatChangeInShareModal = async (format: PreviewNumberFormat) => {
    if (format === 'full') {
      setShowFullNumberWarning(true);
    } else {
      setShowFullNumberWarning(false);
    }
    setShareImageNumberFormat(format);
    if (card) {
      setIsGeneratingImage(true);
      try {
        const shareCanvas = await generateShareCanvas(card, {
          numberFormat: format,
          footerText: shareFooterText,
          requestedAmount,
          requestedNote,
        });
        setSharePreviewUrl(shareCanvas.toDataURL('image/png'));
      } finally {
        setIsGeneratingImage(false);
      }
    }
  };

  const handleFooterTextChange = async (text: string) => {
    setShareFooterText(text);
    if (card) {
      const shareCanvas = await generateShareCanvas(card, {
        numberFormat: shareImageNumberFormat,
        footerText: text,
        requestedAmount,
        requestedNote,
      });
      setSharePreviewUrl(shareCanvas.toDataURL('image/png'));
    }
  };

  const handleExecuteShareImage = async () => {
    if (!card) return;
    try {
      const shareCanvas = await generateShareCanvas(card, {
        numberFormat: shareImageNumberFormat,
        footerText: shareFooterText,
        requestedAmount,
        requestedNote,
      });
      const result = await shareOrDownloadImage(shareCanvas, card.provider);
      if (result.downloaded) {
        showToast('Image downloaded');
      } else if (result.shared) {
        showToast('Image shared');
      }
      setIsShareImageModalOpen(false);
    } catch {
      showToast('Sharing failed');
    }
  };

  const handleExecuteDownloadImage = async () => {
    if (!card) return;
    try {
      const shareCanvas = await generateShareCanvas(card, {
        numberFormat: shareImageNumberFormat,
        footerText: shareFooterText,
        requestedAmount,
        requestedNote,
      });
      downloadCanvasAsPNG(shareCanvas, `${card.provider.toLowerCase()}-qr.png`);
      showToast('Image saved');
      setIsShareImageModalOpen(false);
    } catch {
      showToast('Download failed');
    }
  };

  if (!isOpen || !card) return null;

  const fg = scanMode ? '#1D1D1F' : fgFor(card.color);
  const backgroundStyle = scanMode
    ? '#FFFFFF'
    : getCardGradient(card.color);
  const masked = maskedNumber(card);
  const displayText = revealed ? card.number : masked;

  const isQrBlurred = blurPrivacy && !qrUnblurred;
  const isNumberBlurred = blurPrivacy && !revealed;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Receive payment for ${card.provider}`}
      style={{
        background: backgroundStyle,
        color: fg,
      }}
      className="fixed inset-0 z-40 flex flex-col items-center text-center overflow-y-auto pt-[calc(18px+env(safe-area-inset-top,0px))] px-3 pb-[calc(24px+env(safe-area-inset-bottom,0px))] animate-slide-up transition-colors duration-300"
    >
      {/* Brightness Notification Banner */}
      {showBrightnessHint && (
        <div className="w-full max-w-md mb-3.5 p-3 rounded-2xl bg-black/60 text-white backdrop-blur-xl flex items-center justify-between shadow-lg text-left text-xs sm:text-sm animate-fade-in border border-white/10 z-50">
          <div className="flex items-center gap-2.5 min-w-0 pr-2">
            <Sun className="w-5 h-5 text-amber-300 shrink-0 animate-pulse" />
            <span className="leading-snug">Turn up your screen brightness for easier scanning.</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => handleDismissBrightnessHint(true)}
              className="text-[11px] px-2 py-1 rounded-md bg-white/15 hover:bg-white/25 active:scale-95 text-white/90"
            >
              Don&apos;t show
            </button>
            <button
              type="button"
              onClick={() => handleDismissBrightnessHint(false)}
              aria-label="Dismiss banner"
              className="p-1 rounded-md hover:bg-white/20 text-white/75"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Top Bar Controls */}
      <div className="w-full max-w-md flex justify-between items-center min-h-[40px] mb-2 sm:mb-2.5">
        <button
          type="button"
          onClick={onClose}
          style={{
            color: fg,
            backgroundColor: fg === '#1D1D1F' ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.22)',
            border: fg === '#1D1D1F' ? '1px solid rgba(0, 0, 0, 0.14)' : '1px solid rgba(255, 255, 255, 0.22)',
          }}
          className="px-4 py-2 rounded-full font-semibold text-base backdrop-blur-md transition-all active:scale-95 shadow-sm cursor-pointer hover:brightness-95"
        >
          Done
        </button>

        <div className="flex items-center gap-2.5">
          {/* Scan Mode High Contrast Toggle */}
          <button
            type="button"
            onClick={handleToggleScanMode}
            title={scanMode ? 'Standard View' : 'Scan Mode (High Contrast)'}
            aria-label="Toggle Scan Mode"
            aria-pressed={scanMode}
            style={
              scanMode
                ? undefined
                : {
                  color: fg,
                  backgroundColor: fg === '#1D1D1F' ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.22)',
                  border: fg === '#1D1D1F' ? '1px solid rgba(0, 0, 0, 0.14)' : '1px solid rgba(255, 255, 255, 0.22)',
                }
            }
            className={`px-3.5 py-2 rounded-full font-medium text-sm backdrop-blur-md flex items-center gap-1.5 transition-all active:scale-95 shadow-sm cursor-pointer ${scanMode
              ? 'bg-[#1D1D1F] text-white border border-transparent'
              : 'hover:brightness-95'
              }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Scan Mode</span>
          </button>

          <button
            type="button"
            onClick={() => onEdit(card)}
            style={{
              color: fg,
              backgroundColor: fg === '#1D1D1F' ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.22)',
              border: fg === '#1D1D1F' ? '1px solid rgba(0, 0, 0, 0.14)' : '1px solid rgba(255, 255, 255, 0.22)',
            }}
            className="px-4 py-2 rounded-full font-semibold text-base backdrop-blur-md transition-all active:scale-95 shadow-sm cursor-pointer hover:brightness-95"
          >
            Edit
          </button>
        </div>
      </div>

      {/* QR Box */}
      <div
        onClick={() => setQrUnblurred(true)}
        className={`relative bg-white rounded-qrbox p-5 mt-4 mb-5 sm:mt-6 sm:mb-6 shadow-qr aspect-square flex items-center justify-center overflow-hidden transition-all duration-300 border border-black/10 ${scanMode ? 'w-[min(90vw,360px)] ring-4 ring-black/10' : 'w-[min(84vw,340px)]'
          }`}
      >
        {card.payload ? (
          <canvas
            ref={canvasRef}
            className={`w-full h-full object-contain [image-rendering:pixelated] transition-all duration-300 ${isQrBlurred ? 'blur-lg select-none pointer-events-none' : ''
              }`}
          />
        ) : card.imgB64 ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={card.imgB64}
            alt={`${card.provider} QR Code`}
            className={`w-full h-full object-contain [image-rendering:pixelated] transition-all duration-300 ${isQrBlurred ? 'blur-lg select-none pointer-events-none' : ''
              }`}
          />
        ) : card.payloadEnc ? (
          <div className="flex flex-col items-center justify-center text-center p-4">
            <div className="w-6 h-6 border-2 border-[#1D1D1F] border-t-transparent rounded-full animate-spin mb-2" />
            <div className="text-gray-500 text-xs font-medium">Decrypting QR code...</div>
          </div>
        ) : (
          <div className="text-gray-500 text-sm font-medium">No QR Available</div>
        )}

        {isQrBlurred && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 backdrop-blur-sm cursor-pointer">
            <Eye className="w-8 h-8 text-[#1D1D1F] mb-1" />
            <span className="text-xs font-semibold text-[#1D1D1F]">Tap to reveal QR</span>
          </div>
        )}
      </div>

      {/* Amount Request & KKB Split Pills */}
      <div className="mt-0 mb-4 flex items-center justify-center">
        {requestedAmount && requestedAmount > 0 ? (
          <div
            style={{
              color: fg,
              backgroundColor: fg === '#1D1D1F' ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.22)',
              border: fg === '#1D1D1F' ? '1px solid rgba(0, 0, 0, 0.14)' : '1px solid rgba(255, 255, 255, 0.3)',
            }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full backdrop-blur-md shadow-sm animate-fade-in text-sm font-semibold"
          >
            {requestedNote?.includes('pax') || requestedNote?.includes('KKB') ? (
              <Users className="w-4 h-4 shrink-0" />
            ) : (
              <Banknote className="w-4 h-4 shrink-0" />
            )}
            <span className="tabular-nums font-bold">
              ₱{requestedAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
            </span>
            {requestedNote && (
              <span className="opacity-80 font-normal truncate max-w-[120px]">
                · {requestedNote}
              </span>
            )}
            <button
              type="button"
              onClick={() => {
                if (requestedNote?.includes('pax') || requestedNote?.includes('KKB')) {
                  setIsKkbModalOpen(true);
                } else {
                  setIsAmountModalOpen(true);
                }
              }}
              aria-label="Edit requested amount or KKB split"
              title="Edit amount"
              className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/15 transition-colors cursor-pointer ml-0.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                setRequestedAmount(null);
                setRequestedNote(null);
                showToast('Amount cleared');
              }}
              aria-label="Clear requested amount"
              title="Clear amount"
              className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/15 transition-colors cursor-pointer text-red-500 hover:text-red-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
            <button
              type="button"
              onClick={() => setIsAmountModalOpen(true)}
              style={{
                color: fg,
                backgroundColor: fg === '#1D1D1F' ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.16)',
                border: fg === '#1D1D1F' ? '1px dashed rgba(0, 0, 0, 0.2)' : '1px dashed rgba(255, 255, 255, 0.35)',
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full backdrop-blur-md shadow-sm hover:brightness-95 active:scale-95 transition-all text-xs sm:text-sm font-medium cursor-pointer"
            >
              <Banknote className="w-3.5 h-3.5 shrink-0" />
              <span>Request Amount</span>
            </button>

            <button
              type="button"
              onClick={() => setIsKkbModalOpen(true)}
              style={{
                color: fg,
                backgroundColor: fg === '#1D1D1F' ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.16)',
                border: fg === '#1D1D1F' ? '1px dashed rgba(0, 0, 0, 0.2)' : '1px dashed rgba(255, 255, 255, 0.35)',
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full backdrop-blur-md shadow-sm hover:brightness-95 active:scale-95 transition-all text-xs sm:text-sm font-medium cursor-pointer"
            >
              <Users className="w-3.5 h-3.5 shrink-0" />
              <span>Split Bill (KKB)</span>
            </button>
          </div>
        )}
      </div>

      {/* Provider & Holder */}
      <div className="flex items-center justify-center gap-2.5 max-w-[90vw] drop-shadow-sm">
        <BankLogo
          provider={card.provider}
          color={card.color}
          size={32}
        />
        <h2
          style={{ color: fg }}
          className="text-2xl sm:text-3xl font-bold tracking-tight m-0 truncate"
        >
          {card.provider}
          {card.label ? <span className="opacity-85 font-medium"> · {card.label}</span> : null}
        </h2>
      </div>
      {card.holder && (
        <p
          style={{ color: fg }}
          className="mt-1 text-lg font-medium opacity-90 max-w-[90vw] truncate drop-shadow-sm"
        >
          {card.holder}
        </p>
      )}

      {/* Account Number (Tap to reveal/hide) */}
      {card.number && (
        <>
          <button
            type="button"
            onClick={() => setRevealed(!revealed)}
            aria-label={revealed ? 'Hide account number' : 'Reveal full account number'}
            style={{
              color: fg,
              backgroundColor: fg === '#1D1D1F' ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.14)',
              border: fg === '#1D1D1F' ? '1px solid rgba(0, 0, 0, 0.1)' : '1px solid rgba(255, 255, 255, 0.2)',
            }}
            className={`mt-3.5 mb-1 px-4 py-2 rounded-xl text-xl sm:text-2xl font-mono font-semibold tracking-wide tabular-nums active:scale-98 transition-all backdrop-blur-sm cursor-pointer ${isNumberBlurred ? 'blur-sm select-none' : ''
              }`}
          >
            {displayText}
          </button>
          <p style={{ color: fg }} className="text-xs opacity-80 m-0 mb-4 font-medium">
            Tap number to show or hide
          </p>
        </>
      )}

      {/* Action Buttons Row: Copy, Share, Share Image */}
      <div className={`grid ${card.number ? 'grid-cols-3' : 'grid-cols-2'} gap-1.5 sm:gap-2 w-full max-w-[340px] mt-auto pt-2 sm:pt-3`}>
        {card.number ? (
          <button
            type="button"
            onClick={handleCopyNumber}
            className="py-2 sm:py-2.5 px-2 rounded-xl sm:rounded-2xl bg-white text-[#1D1D1F] font-semibold text-xs sm:text-sm shadow-sm border border-black/10 hover:bg-white/95 active:scale-95 transition-all flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer truncate"
          >
            <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="truncate">Copy</span>
          </button>
        ) : null}

        <button
          type="button"
          onClick={handleShareDetails}
          style={{
            color: fg,
            backgroundColor: fg === '#1D1D1F' ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.22)',
            border: fg === '#1D1D1F' ? '1px solid rgba(0, 0, 0, 0.14)' : '1px solid rgba(255, 255, 255, 0.22)',
          }}
          className="py-2 sm:py-2.5 px-2 rounded-xl sm:rounded-2xl backdrop-blur-md font-semibold text-xs sm:text-sm shadow-sm active:scale-95 transition-all flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer hover:brightness-95 truncate"
        >
          <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
          <span className="truncate">Share</span>
        </button>

        <button
          type="button"
          onClick={handleOpenShareImageModal}
          className="py-2 sm:py-2.5 px-2 rounded-xl sm:rounded-2xl bg-white text-[#1D1D1F] font-semibold text-xs sm:text-sm shadow-sm border border-black/10 hover:bg-white/95 active:scale-95 transition-all flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer truncate"
        >
          <ImageIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
          <span className="truncate">Share Image</span>
        </button>
      </div>

      {/* Share Image Preview & Customization Modal */}
      {isShareImageModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Share Image Preview"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 overflow-y-auto animate-fade-in"
        >
          <div className="relative w-full max-w-sm rounded-[24px] bg-surface text-text border border-line/30 p-5 shadow-2xl space-y-4 my-auto">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold">Share as Image</h3>
              <button
                type="button"
                onClick={() => setIsShareImageModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-bg text-muted cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Image Preview Canvas Display */}
            <div className="relative aspect-[4/5] w-full rounded-2xl overflow-hidden bg-bg border border-line/30 flex items-center justify-center shadow-inner">
              {isGeneratingImage ? (
                <div className="text-sm font-medium text-muted animate-pulse">Rendering 1080x1350 image...</div>
              ) : sharePreviewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={sharePreviewUrl}
                  alt="QR Share Preview"
                  className="w-full h-full object-contain"
                />
              ) : null}
            </div>

            {/* Customization Options */}
            <div className="space-y-3 text-left">
              <div>
                <label className="block text-xs font-semibold text-muted mb-1.5">Number Display</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['last4', 'hidden', 'full'] as PreviewNumberFormat[]).map((fmt) => (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => handleFormatChangeInShareModal(fmt)}
                      className={`py-1.5 px-2 rounded-xl text-xs font-semibold capitalize border transition-all cursor-pointer ${shareImageNumberFormat === fmt
                        ? 'bg-accent text-white border-accent shadow-sm'
                        : 'bg-bg text-text border-line/30 hover:border-line'
                        }`}
                    >
                      {fmt === 'last4' ? 'Last 4' : fmt}
                    </button>
                  ))}
                </div>
              </div>

              {showFullNumberWarning && (
                <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>Be careful when sharing your full account number publicly.</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-muted mb-1">Footer Text</label>
                <input
                  type="text"
                  maxLength={30}
                  value={shareFooterText}
                  onChange={(e) => handleFooterTextChange(e.target.value)}
                  placeholder="Scan to pay"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-bg border border-line/40 text-xs font-medium text-text outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 shadow-sm transition-all"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={handleExecuteDownloadImage}
                className="flex-1 py-3 px-3 rounded-xl bg-bg hover:bg-bg/80 border border-line/30 font-semibold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Save Image</span>
              </button>
              <button
                type="button"
                onClick={handleExecuteShareImage}
                className="flex-1 py-3 px-3 rounded-xl bg-accent hover:bg-accent/90 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>Share</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Amount Request Modal */}
      <AmountModal
        isOpen={isAmountModalOpen}
        currentAmount={requestedAmount}
        currentNote={requestedNote}
        onClose={() => setIsAmountModalOpen(false)}
        onApply={(amt, note) => {
          setRequestedAmount(amt);
          setRequestedNote(note || null);
          showToast(`₱${amt.toLocaleString('en-PH', { minimumFractionDigits: 2 })} embedded in QR`);
        }}
        onClear={() => {
          setRequestedAmount(null);
          setRequestedNote(null);
          showToast('Amount cleared from QR');
        }}
      />

      {/* KKB Bill Splitter Modal */}
      <KkbModal
        isOpen={isKkbModalOpen}
        card={card}
        initialAmount={requestedAmount}
        onClose={() => setIsKkbModalOpen(false)}
        onApplyToQR={(amt, note) => {
          setRequestedAmount(amt);
          setRequestedNote(note);
        }}
      />
    </div>
  );
}
