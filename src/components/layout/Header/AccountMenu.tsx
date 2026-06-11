"use client";

import { useEffect } from "react";
import MarkupBlock from "./MarkupBlock";
import { ACCOUNT_MENU_MARKUP } from "./generated/markup";
import { ROUTES } from "@/lib/routes";
import { useAuthStore } from "@/store/authStore";

function syncAccountMenu(isAuthenticated: boolean, displayName: string | null) {
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
    accountLink.href = isAuthenticated ? ROUTES.account : ROUTES.login;
  }

  const loginBtn = document.querySelector<HTMLAnchorElement>(
    ".assets-site-header__nav-menu-account-logged-out-login-button"
  );
  if (loginBtn) loginBtn.href = ROUTES.login;

  const signupLink = document.querySelector<HTMLAnchorElement>(
    ".assets-site-header__nav-menu-account-logged-out-login-signup"
  );
  if (signupLink) signupLink.href = ROUTES.register;
}

export default function AccountMenu() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isInitialized = useAuthStore((s) => s.isInitialized);

  useEffect(() => {
    if (!isInitialized) return;
    syncAccountMenu(isAuthenticated, user?.name ?? null);
  }, [isAuthenticated, user?.name, isInitialized]);

  return <MarkupBlock html={ACCOUNT_MENU_MARKUP} />;
}
