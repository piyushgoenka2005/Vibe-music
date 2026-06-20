import { STOREFRONT_THEME_STORAGE_KEY } from "@/lib/storefrontTheme";

/** Inline script for layout — prevents theme flash before React hydrates. */
export const STOREFRONT_THEME_BOOT_SCRIPT = `(function(){try{var valid={light:1,dark:1,dim:1};var raw=localStorage.getItem("${STOREFRONT_THEME_STORAGE_KEY}");if(!raw)return;var parsed=JSON.parse(raw);var theme=parsed&&parsed.state&&parsed.state.theme;if(!valid[theme])theme="light";document.documentElement.setAttribute("data-storefront-theme",theme);document.documentElement.style.colorScheme=theme==="light"?"light":"dark";}catch(e){}})();`;
