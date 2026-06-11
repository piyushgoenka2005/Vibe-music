"use client";

import { useEffect } from "react";
import { ROUTES } from "@/lib/routes";
import { useAuthStore } from "@/store/authStore";

function syncAuthHeader(isAuthenticated: boolean, displayName: string | null) {
  const loggedIn = document.querySelector(
    ".assets-site-header__nav-menu-account-logged-in"
  );
  const loggedOut = document.querySelector(
    ".assets-site-header__nav-menu-account-logged-out"
  );
  const accountLabel = document.querySelector(
    ".assets-site-header__menu-account-navlink"
  );
  const accountLink = document.querySelector<HTMLAnchorElement>(
    ".assets-site-header__menu-account"
  );

  loggedIn?.classList.toggle("removed", !isAuthenticated);
  loggedOut?.classList.toggle("removed", isAuthenticated);

  if (accountLabel) {
    const label =
      isAuthenticated && displayName
        ? displayName.split(" ")[0] || "Account"
        : "Account";
    if (accountLabel.textContent !== label) {
      accountLabel.textContent = label;
    }
  }

  if (accountLink) {
    accountLink.setAttribute(
      "href",
      isAuthenticated ? ROUTES.account : ROUTES.login
    );
  }

  const loginBtn = document.querySelector<HTMLAnchorElement>(
    ".assets-site-header__nav-menu-account-logged-out-login-button"
  );
  if (loginBtn) {
    loginBtn.setAttribute("href", ROUTES.login);
  }

  const signupLink = document.querySelector<HTMLAnchorElement>(
    ".assets-site-header__nav-menu-account-logged-out-login-signup"
  );
  if (signupLink) {
    signupLink.setAttribute("href", ROUTES.register);
  }
}

export default function NavbarAuth() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isInitialized = useAuthStore((s) => s.isInitialized);

  useEffect(() => {
    if (!isInitialized) return;

    const sync = () => syncAuthHeader(isAuthenticated, user?.name ?? null);
    sync();

    let observer: MutationObserver | null = null;
    let poll: number | null = null;

    function watchHeader(header: Element) {
      observer?.disconnect();
      observer = new MutationObserver(sync);
      observer.observe(header, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["class"],
      });
    }

    const header = document.getElementById("assets-header");
    if (header) {
      watchHeader(header);
    } else {
      poll = window.setInterval(() => {
        const el = document.getElementById("assets-header");
        if (el) {
          sync();
          watchHeader(el);
          if (poll !== null) {
            window.clearInterval(poll);
            poll = null;
          }
        }
      }, 400);
    }

    return () => {
      observer?.disconnect();
      if (poll !== null) window.clearInterval(poll);
    };
  }, [isAuthenticated, user?.name, isInitialized]);

  return null;
}
