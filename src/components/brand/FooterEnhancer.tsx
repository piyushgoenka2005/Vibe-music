"use client";

import { useEffect } from "react";
import { useToastStore } from "@/store/toastStore";
import { SOCIAL_LINKS } from "@/lib/brand";

const SECTION = '[data-sweetwater-section="footer"]';

export default function FooterEnhancer() {
  const show = useToastStore((s) => s.show);

  useEffect(() => {
    function patchLinks(section: Element) {
      const socialMap: Array<[string, string]> = [
        ["facebook.com", SOCIAL_LINKS.facebook],
        ["youtube.com", SOCIAL_LINKS.youtube],
        ["instagram.com", SOCIAL_LINKS.instagram],
        ["twitter.com", SOCIAL_LINKS.x],
        ["x.com", SOCIAL_LINKS.x],
        ["tiktok.com", SOCIAL_LINKS.tiktok],
      ];

      section.querySelectorAll<HTMLAnchorElement>("a[href]").forEach((anchor) => {
        const href = anchor.getAttribute("href") ?? "";
        for (const [needle, url] of socialMap) {
          if (href.includes(needle) || anchor.textContent?.includes(needle)) {
            anchor.href = url;
            anchor.target = "_blank";
            anchor.rel = "noopener noreferrer";
          }
        }
      });

      section.querySelectorAll<HTMLElement>(".assets-site-footer__app-links, .assets-site-footer__social").forEach((block) => {
        block.querySelectorAll("*").forEach((node) => {
          if (
            node.childNodes.length === 1 &&
            node.textContent?.startsWith("http") &&
            node.textContent.includes(".") &&
            !(node instanceof HTMLAnchorElement)
          ) {
            const url = node.textContent.trim();
            const link = document.createElement("a");
            link.href = url.includes("apple.com") ? "#" : url.includes("google.com") ? "#" : url;
            link.textContent = url;
            link.className = "assets-site-footer__external-link";
            node.replaceWith(link);
          }
        });
      });
    }

    function wireNewsletter(section: Element) {
      const form = section.querySelector<HTMLFormElement>(
        "form[action*='newsletter'], form.assets-site-footer__newsletter, .assets-site-footer__newsletter form"
      );
      if (!form || form.dataset.vibeWired === "true") return;
      form.dataset.vibeWired = "true";

      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const input = form.querySelector<HTMLInputElement>("input[type='email'], input[name='email']");
        const email = input?.value.trim();
        if (!email) {
          show("Please enter a valid email address", "error");
          return;
        }

        try {
          const response = await fetch("/api/newsletter", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
          });
          const data = (await response.json()) as { message?: string; error?: string };
          if (!response.ok) {
            show(data.error ?? "Subscription failed", "error");
            return;
          }
          show(data.message ?? "Thanks for subscribing!");
          if (input) input.value = "";
        } catch {
          show("Subscription failed. Please try again.", "error");
        }
      });
    }

    function patchAll() {
      document.querySelectorAll(SECTION).forEach((section) => {
        patchLinks(section);
        wireNewsletter(section);
      });
    }

    patchAll();
    let patching = false;
    const observer = new MutationObserver(() => {
      if (patching) return;
      patching = true;
      window.requestAnimationFrame(() => {
        patchAll();
        patching = false;
      });
    });
    document.querySelectorAll(SECTION).forEach((section) => {
      observer.observe(section, { childList: true, subtree: true });
    });
    return () => observer.disconnect();
  }, [show]);

  return null;
}
