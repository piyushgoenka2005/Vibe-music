"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Globe, X } from "lucide-react";
import { ACTIVE_CURRENCIES, ACTIVE_LOCALES, useCurrencyLocaleStore } from "./currencyLocaleStore";
import { useTranslation } from "@/lib/i18n";
import "./currencyLocale.css";

export interface CurrencyLocaleSelectorProps {
  variant?: "header" | "compact" | "mobile" | "inline";
  className?: string;
  onSelect?: () => void;
}

export default function CurrencyLocaleSelector({
  variant = "header",
  className = "",
  onSelect,
}: CurrencyLocaleSelectorProps) {
  const { currency, locale, isInitialized, init, setCurrency, setLocale } =
    useCurrencyLocaleStore();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isInitialized) {
      init();
    }
  }, [isInitialized, init]);

  // Close popover when clicking outside or pressing Escape
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const activeCurrencyItem =
    ACTIVE_CURRENCIES.find((c) => c.code === currency) || ACTIVE_CURRENCIES[0];
  const activeLocaleItem = ACTIVE_LOCALES.find((l) => l.code === locale) || ACTIVE_LOCALES[0];

  // Mobile layout
  if (variant === "mobile") {
    return (
      <div
        className={`vibe-currency-selector vibe-currency-selector--mobile ${className}`.trim()}
        role="region"
        aria-label="Currency and language settings"
      >
        <div className="vibe-currency-selector__mobile-box">
          <div className="vibe-currency-selector__mobile-header">
            <Globe size={15} className="vibe-currency-selector__trigger-icon" aria-hidden />
            <span>Region &amp; Language</span>
          </div>

          <div className="vibe-currency-selector__mobile-controls">
            <div className="vibe-currency-selector__mobile-field">
              <label
                htmlFor="vibe-mobile-currency-select"
                className="vibe-currency-selector__mobile-label"
              >
                Currency
              </label>
              <select
                id="vibe-mobile-currency-select"
                className="vibe-currency-selector__mobile-select"
                value={currency}
                onChange={(e) => {
                  setCurrency(e.target.value);
                  onSelect?.();
                }}
                aria-label="Select currency"
              >
                {ACTIVE_CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.code} ({c.symbol}) — {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="vibe-currency-selector__mobile-field">
              <label
                htmlFor="vibe-mobile-locale-select"
                className="vibe-currency-selector__mobile-label"
              >
                Language
              </label>
              <select
                id="vibe-mobile-locale-select"
                className="vibe-currency-selector__mobile-select"
                value={locale}
                onChange={(e) => {
                  setLocale(e.target.value);
                  onSelect?.();
                }}
                aria-label="Select language"
              >
                {ACTIVE_LOCALES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.flag} {l.shortLabel} — {l.nativeName}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Desktop header / compact layout
  return (
    <div
      ref={containerRef}
      className={`vibe-currency-selector vibe-currency-selector--header ${className}`.trim()}
      role="region"
      aria-label="Currency and language selector"
    >
      <button
        ref={triggerRef}
        type="button"
        className="vibe-currency-selector__trigger"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label={`Current currency: ${activeCurrencyItem.code}, language: ${activeLocaleItem.name}. Click to change.`}
      >
        <Globe size={13} className="vibe-currency-selector__trigger-icon" aria-hidden />
        <span>
          {activeCurrencyItem.symbol} {activeCurrencyItem.code}
        </span>
        <span className="vibe-currency-selector__trigger-sep" aria-hidden>
          ·
        </span>
        <span>{activeLocaleItem.shortLabel}</span>
        <ChevronDown size={12} className="vibe-currency-selector__trigger-chevron" aria-hidden />
      </button>

      {isOpen ? (
        <>
          <button
            type="button"
            className="vibe-currency-selector__backdrop"
            onClick={() => setIsOpen(false)}
            aria-label="Close currency and language selector"
            tabIndex={-1}
          />
          <div
            className="vibe-currency-selector__popover"
            role="dialog"
            aria-label="Select currency and language"
          >
            <div className="vibe-currency-selector__popover-header">
              <h3 className="vibe-currency-selector__popover-title">
                {t("currencyLocale.title", "Currency & Language")}
              </h3>
              <button
                type="button"
                className="vibe-currency-selector__popover-close"
                onClick={() => setIsOpen(false)}
                aria-label="Close"
              >
                <X size={15} aria-hidden />
              </button>
            </div>

            {/* Currency section */}
            <div className="vibe-currency-selector__section">
              <span className="vibe-currency-selector__section-label">
                {t("currencyLocale.selectCurrency", "Select Currency")}
              </span>
              <div className="vibe-currency-selector__grid vibe-currency-selector__grid--currency">
                {ACTIVE_CURRENCIES.map((c) => {
                  const isSelected = c.code === currency;
                  return (
                    <button
                      key={c.code}
                      type="button"
                      className={`vibe-currency-selector__option${
                        isSelected ? " vibe-currency-selector__option--active" : ""
                      }`}
                      onClick={() => {
                        setCurrency(c.code);
                        onSelect?.();
                      }}
                      aria-pressed={isSelected}
                    >
                      <span className="vibe-currency-selector__option-left">
                        <span className="vibe-currency-selector__option-flag" aria-hidden>
                          {c.flag}
                        </span>
                        <span className="vibe-currency-selector__option-code">
                          {c.symbol} {c.code}
                        </span>
                        <span className="vibe-currency-selector__option-name">({c.name})</span>
                      </span>
                      {isSelected ? (
                        <Check
                          size={14}
                          className="vibe-currency-selector__check-icon"
                          aria-hidden
                        />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Language / Locale section */}
            <div className="vibe-currency-selector__section">
              <span className="vibe-currency-selector__section-label">
                {t("currencyLocale.selectLanguage", "Select Language")}
              </span>
              <div className="vibe-currency-selector__grid">
                {ACTIVE_LOCALES.map((l) => {
                  const isSelected = l.code === locale;
                  return (
                    <button
                      key={l.code}
                      type="button"
                      className={`vibe-currency-selector__option${
                        isSelected ? " vibe-currency-selector__option--active" : ""
                      }`}
                      onClick={() => {
                        setLocale(l.code);
                        onSelect?.();
                      }}
                      aria-pressed={isSelected}
                    >
                      <span className="vibe-currency-selector__option-left">
                        <span className="vibe-currency-selector__option-flag" aria-hidden>
                          {l.flag}
                        </span>
                        <span className="vibe-currency-selector__option-code">{l.nativeName}</span>
                        <span className="vibe-currency-selector__option-name">({l.name})</span>
                      </span>
                      {isSelected ? (
                        <Check
                          size={14}
                          className="vibe-currency-selector__check-icon"
                          aria-hidden
                        />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>

            <p className="vibe-currency-selector__popover-footer">
              {t(
                "currencyLocale.rateDisclaimer",
                "Prices will be converted according to active exchange rates.",
              )}
            </p>
          </div>
        </>
      ) : null}
    </div>
  );
}
