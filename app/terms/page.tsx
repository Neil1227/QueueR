import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import {
  ShieldAlert,
  ArrowLeft,
  CheckCircle2,
  Lock,
  Building2,
  AlertTriangle,
  Scale,
  Smartphone,
  HelpCircle,
  FileText,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Terms & Conditions – QueueR',
  description: 'Terms of Service, non-banking disclaimers, and user agreements for QueueR Payment QR Wallet.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-bg text-text select-none">
      {/* Top Sticky Navigation Bar */}
      <header className="sticky top-0 z-40 w-full bg-bg/95 dark:bg-bg/95 backdrop-blur-2xl border-b border-line/20 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] pt-[env(safe-area-inset-top,0px)] transition-colors">
        <div className="max-w-2xl mx-auto px-3.5 sm:px-5 py-2.5 sm:py-3.5 flex items-center justify-between gap-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-accent hover:opacity-80 active:scale-95 transition-all cursor-pointer whitespace-nowrap shrink-0"
          >
            <ArrowLeft className="w-4 h-4 shrink-0" />
            <span>Back<span className="hidden sm:inline"> to Wallet</span></span>
          </Link>

          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 shrink">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/QueueRLogo.png"
              alt="QueueR Logo"
              className="w-5 h-5 sm:w-6 sm:h-6 rounded-md sm:rounded-lg object-cover shadow-2xs shrink-0"
            />
            <span className="text-xs sm:text-sm font-bold tracking-tight text-text whitespace-nowrap truncate">
              QueueR Legal
            </span>
          </div>

          <Link
            href="/"
            className="px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full bg-surface text-text border border-line/40 text-[11px] sm:text-xs font-semibold hover:bg-surface/80 active:scale-95 transition-all shadow-2xs whitespace-nowrap shrink-0"
          >
            Done
          </Link>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-2xl mx-auto px-4 sm:px-5 py-5 sm:py-8 pb-[calc(48px+env(safe-area-inset-bottom,0px))] space-y-4 sm:space-y-6">
        {/* Header Hero */}
        <div className="text-center space-y-2 sm:space-y-3 pt-1 sm:pt-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/QueueRLogo.png"
            alt="QueueR"
            className="w-14 h-14 sm:w-18 sm:h-18 rounded-2xl sm:rounded-3xl object-cover shadow-[0_8px_30px_rgba(0,122,255,0.2)] mx-auto"
          />
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-text">
              Terms & Conditions
            </h1>
            <p className="text-[11px] sm:text-xs text-muted mt-1">
              Effective Date: October 2026 · Version 1.0
            </p>
          </div>
        </div>

        {/* Essential Notice / Non-Banking Disclaimer Banner */}
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-2 text-left">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold text-sm">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <span>Important Notice: Non-Banking Utility</span>
          </div>
          <p className="text-xs text-text/80 leading-relaxed">
            QueueR is an offline-first visual wallet utility designed solely for storing, organizing, and displaying user-provided QR codes and payment details. <strong>QueueR is not a bank, payment processor, or money transmitter.</strong> QueueR never holds funds, executes transactions, or processes monetary transfers. All financial transactions occur directly between third-party banking/e-wallet apps.
          </p>
        </div>

        {/* Section 1: Acceptance of Terms */}
        <section className="bg-surface rounded-3xl p-5 shadow-xs border border-line/30 space-y-2.5 text-left">
          <div className="flex items-center gap-2.5 text-text font-bold text-base">
            <div className="w-7 h-7 rounded-xl bg-accent/10 text-accent flex items-center justify-center text-xs font-black">
              1
            </div>
            <h2>Acceptance of Terms</h2>
          </div>
          <p className="text-xs text-muted leading-relaxed">
            By accessing, browsing, installing, or using the QueueR progressive web application (&quot;Service&quot;), you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions. If you do not agree to these terms, please discontinue using QueueR and uninstall the application from your device.
          </p>
        </section>

        {/* Section 2: Service Description & Role */}
        <section className="bg-surface rounded-3xl p-5 shadow-xs border border-line/30 space-y-2.5 text-left">
          <div className="flex items-center gap-2.5 text-text font-bold text-base">
            <div className="w-7 h-7 rounded-xl bg-accent/10 text-accent flex items-center justify-center text-xs font-black">
              2
            </div>
            <h2>Nature of the Service</h2>
          </div>
          <p className="text-xs text-muted leading-relaxed">
            QueueR acts as a personal digital cardholder for standard Philippine National QR (QR Ph) codes, bank account identifiers, and e-wallet QR codes. The Service allows users to:
          </p>
          <ul className="space-y-1.5 text-xs text-muted list-disc list-inside pl-1">
            <li>Store and organize recipient QR codes and account identifiers locally on their devices.</li>
            <li>Present QR codes on-screen in a high-contrast display for scanning by senders.</li>
            <li>Calculate split amounts (KKB) for group bills and share formatted payment request text.</li>
            <li>Backup encrypted card records to private cloud storage (when signed in).</li>
          </ul>
          <p className="text-xs text-muted leading-relaxed pt-1">
            QueueR does not facilitate wire transfers, charge handling fees on transactions, or act as an intermediary in any financial settlement.
          </p>
        </section>

        {/* Section 3: User Responsibility & Accuracy */}
        <section className="bg-surface rounded-3xl p-5 shadow-xs border border-line/30 space-y-2.5 text-left">
          <div className="flex items-center gap-2.5 text-text font-bold text-base">
            <div className="w-7 h-7 rounded-xl bg-accent/10 text-accent flex items-center justify-center text-xs font-black">
              3
            </div>
            <h2>User Responsibility & Accuracy of Details</h2>
          </div>
          <p className="text-xs text-muted leading-relaxed">
            You are exclusively responsible for the validity, completeness, and accuracy of any QR code images, account numbers, provider selections, and recipient names you enter or scan into QueueR.
          </p>
          <div className="p-3 rounded-2xl bg-bg border border-line/30 space-y-1.5 text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-text">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Sender & Recipient Verification</span>
            </div>
            <p className="text-muted leading-normal">
              Always verify the displayed account holder name and account number in your banking app before authorizing any payment. QueueR shall not be held liable for funds transferred to incorrect accounts as a result of typographical errors, corrupted QR images, or outdated credentials provided by the user.
            </p>
          </div>
        </section>

        {/* Section 4: Security, PIN & Encryption */}
        <section className="bg-surface rounded-3xl p-5 shadow-xs border border-line/30 space-y-2.5 text-left">
          <div className="flex items-center gap-2.5 text-text font-bold text-base">
            <div className="w-7 h-7 rounded-xl bg-accent/10 text-accent flex items-center justify-center text-xs font-black">
              4
            </div>
            <h2>Security, PIN & End-to-End Encryption</h2>
          </div>
          <p className="text-xs text-muted leading-relaxed">
            QueueR is designed with industry-standard client-side security:
          </p>
          <ul className="space-y-1.5 text-xs text-muted list-disc list-inside pl-1">
            <li>
              <strong>Client-Side Encryption (E2EE):</strong> When cloud sync is active, sensitive fields (account numbers, recipient names, and raw QR payloads) are encrypted using AES-GCM 256-bit encryption before transmission.
            </li>
            <li>
              <strong>Device PIN & Biometrics:</strong> You may configure a 4-digit security PIN or biometric passkey (WebAuthn/FaceID/TouchID) to restrict local access to the application.
            </li>
            <li>
              <strong>Vault Passphrase Recovery:</strong> If you configure an optional custom vault passphrase, you must remember it. Because encryption is performed client-side without a master backdoor, QueueR cannot recover cards if your custom passphrase is lost.
            </li>
          </ul>
        </section>

        {/* Section 5: Third-Party Trademarks & Bank Logos */}
        <section className="bg-surface rounded-3xl p-5 shadow-xs border border-line/30 space-y-2.5 text-left">
          <div className="flex items-center gap-2.5 text-text font-bold text-base">
            <div className="w-7 h-7 rounded-xl bg-accent/10 text-accent flex items-center justify-center text-xs font-black">
              5
            </div>
            <h2>Third-Party Trademarks & Institution Logos</h2>
          </div>
          <p className="text-xs text-muted leading-relaxed">
            All brand names, trademarks, registered marks, and institution logos (including but not limited to GCash, Maya, GoTyme, BPI, BDO, UnionBank, SeaBank, MariBank, and QR Ph) displayed in QueueR are the property of their respective owners.
          </p>
          <p className="text-xs text-muted leading-relaxed">
            Their display in QueueR is solely for nominative identification and user convenience to help users distinguish between their accounts. The use of these trademarks does not imply any affiliation, sponsorship, endorsement, or partnership between QueueR and any banking or financial institution.
          </p>
        </section>

        {/* Section 6: Prohibited Use */}
        <section className="bg-surface rounded-3xl p-5 shadow-xs border border-line/30 space-y-2.5 text-left">
          <div className="flex items-center gap-2.5 text-text font-bold text-base">
            <div className="w-7 h-7 rounded-xl bg-accent/10 text-accent flex items-center justify-center text-xs font-black">
              6
            </div>
            <h2>Prohibited Activities</h2>
          </div>
          <p className="text-xs text-muted leading-relaxed">
            You agree not to use QueueR for any unlawful purpose, including:
          </p>
          <ul className="space-y-1.5 text-xs text-muted list-disc list-inside pl-1">
            <li>Generating or presenting fraudulent, altered, or deceptive QR codes.</li>
            <li>Impersonating another person, merchant, or registered business entity.</li>
            <li>Facilitating transactions related to illegal goods, money laundering, or scams.</li>
            <li>Attempting to reverse-engineer, exploit, or inject malicious code into the application.</li>
          </ul>
        </section>

        {/* Section 7: Limitation of Liability */}
        <section className="bg-surface rounded-3xl p-5 shadow-xs border border-line/30 space-y-2.5 text-left">
          <div className="flex items-center gap-2.5 text-text font-bold text-base">
            <div className="w-7 h-7 rounded-xl bg-accent/10 text-accent flex items-center justify-center text-xs font-black">
              7
            </div>
            <h2>Limitation of Liability & Disclaimer of Warranties</h2>
          </div>
          <p className="text-xs text-muted leading-relaxed">
            QueueR is provided on an <strong>&quot;AS IS&quot;</strong> and <strong>&quot;AS AVAILABLE&quot;</strong> basis without warranties of any kind, whether express or implied.
          </p>
          <p className="text-xs text-muted leading-relaxed">
            To the maximum extent permitted by applicable law, in no event shall QueueR, its developers, contributors, or service hosts be liable for any direct, indirect, incidental, punitive, or consequential damages resulting from:
          </p>
          <ul className="space-y-1.5 text-xs text-muted list-disc list-inside pl-1">
            <li>Any financial loss resulting from transactions carried out between senders and recipients.</li>
            <li>Device loss, theft, unauthorized physical access, or forgotten security PINs.</li>
            <li>Downtime, cloud connectivity interruptions, or data loss resulting from browser storage clearing.</li>
            <li>Modifications, updates, or discontinued support for third-party bank QR Ph protocols.</li>
          </ul>
        </section>

        {/* Section 8: Offline Storage & Data Retention */}
        <section className="bg-surface rounded-3xl p-5 shadow-xs border border-line/30 space-y-2.5 text-left">
          <div className="flex items-center gap-2.5 text-text font-bold text-base">
            <div className="w-7 h-7 rounded-xl bg-accent/10 text-accent flex items-center justify-center text-xs font-black">
              8
            </div>
            <h2>Offline Storage & Data Ownership</h2>
          </div>
          <p className="text-xs text-muted leading-relaxed">
            You retain full ownership of all data you store in QueueR. When operating in Guest mode, your data is stored entirely within your local browser storage (IndexedDB / localStorage). Clearing your browser website data or cache will remove locally stored cards unless an exported encrypted JSON backup has been saved.
          </p>
        </section>

        {/* Section 9: Amendments */}
        <section className="bg-surface rounded-3xl p-5 shadow-xs border border-line/30 space-y-2.5 text-left">
          <div className="flex items-center gap-2.5 text-text font-bold text-base">
            <div className="w-7 h-7 rounded-xl bg-accent/10 text-accent flex items-center justify-center text-xs font-black">
              9
            </div>
            <h2>Changes to These Terms</h2>
          </div>
          <p className="text-xs text-muted leading-relaxed">
            We reserve the right to revise or update these Terms & Conditions from time to time. Any changes will be published directly within this page with an updated &quot;Effective Date&quot;. Continued use of QueueR after changes are posted constitutes acceptance of the amended terms.
          </p>
        </section>

        {/* Section 10: Inquiries & Support */}
        <section className="bg-surface rounded-3xl p-5 shadow-xs border border-line/30 space-y-2.5 text-left">
          <div className="flex items-center gap-2.5 text-text font-bold text-base">
            <div className="w-7 h-7 rounded-xl bg-accent/10 text-accent flex items-center justify-center text-xs font-black">
              10
            </div>
            <h2>Inquiries & Contact</h2>
          </div>
          <p className="text-xs text-muted leading-relaxed">
            If you have questions, feedback, or concerns regarding these Terms and Conditions or the QueueR application, please contact the developer via the official repository or support channels.
          </p>
        </section>

        {/* Bottom Back Button */}
        <div className="pt-4 text-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-accent text-white font-semibold text-sm shadow-md hover:bg-accent/90 active:scale-95 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to QueueR Wallet</span>
          </Link>
        </div>

        {/* Footer */}
        <footer className="text-center text-[11px] text-muted space-y-1 pt-6 border-t border-line/20">
          <p className="font-medium text-text">QueueR – Mobile-First Payment QR Wallet</p>
          <p className="opacity-75">All rights reserved · Non-Banking Visual QR Organizer</p>
        </footer>
      </main>
    </div>
  );
}
