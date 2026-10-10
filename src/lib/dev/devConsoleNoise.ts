import { EXTENSION_CONSOLE_NOISE_PATTERN } from "@/lib/client/extensionConsoleNoise";

/**
 * Known noisy console output in local dev — browser extensions (contentscript.js)
 * and Next.js forward-logs (React DevTools / HMR). Not application bugs.
 */
const DEV_TOOLING_NOISE =
  /React DevTools|react\.dev\/link\/react-devtools|\[HMR\] connected|\[Fast Refresh\]|was preloaded using link preload but not used|Encountered a script tag while rendering React component/i;

export const DEV_CONSOLE_SUPPRESSED = new RegExp(
  `${EXTENSION_CONSOLE_NOISE_PATTERN.source}|${DEV_TOOLING_NOISE.source}`,
  "i",
);

export function formatConsoleArgs(args: unknown[]): string {
  return args
    .map((value) => {
      if (typeof value === "string") return value;
      if (value instanceof Error) return value.message;
      try {
        return JSON.stringify(value);
      } catch {
        return String(value);
      }
    })
    .join(" ");
}

export function isSuppressedDevConsoleMessage(text: string): boolean {
  return DEV_CONSOLE_SUPPRESSED.test(text);
}

export function isSuppressedDevConsoleArgs(args: unknown[]): boolean {
  for (const value of args) {
    if (typeof value === "string" && DEV_CONSOLE_SUPPRESSED.test(value)) return true;
    if (value instanceof Error && DEV_CONSOLE_SUPPRESSED.test(value.message)) return true;
  }
  return DEV_CONSOLE_SUPPRESSED.test(formatConsoleArgs(args));
}

const PATCHED = Symbol("vibeDevConsoleFilter");

type ConsoleFn = (...args: unknown[]) => void;

function wrapConsoleMethod(original: ConsoleFn): ConsoleFn {
  const wrapped = (...args: unknown[]) => {
    if (isSuppressedDevConsoleArgs(args)) {
      return;
    }
    original(...args);
  };
  Object.defineProperty(wrapped, PATCHED, { value: true });
  return wrapped;
}

/**
 * Prevents react-dom from printing the “Download React DevTools” banner when no
 * extension is present (see react-dom-client.development.js injectInternals).
 */
export function installReactDevToolsStub(): void {
  if (typeof window === "undefined") return;
  if (process.env.NODE_ENV !== "development") return;

  const w = window as Window & { __REACT_DEVTOOLS_GLOBAL_HOOK__?: unknown };
  if (w.__REACT_DEVTOOLS_GLOBAL_HOOK__) return;

  // React Refresh wraps this hook and iterates `renderers`; without it the dev
  // client crashes before hydration (nothing on the page becomes interactive).
  w.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
    isDisabled: false,
    supportsFiber: true,
    checkDCE() {},
    renderers: new Map(),
    inject() {
      return 0;
    },
    onScheduleFiberRoot() {},
    onCommitFiberRoot() {},
    onCommitFiberUnmount() {},
    onPostCommitFiberRoot() {},
  };
}

/** Patches console in development. Re-call after Next.js forward-logs wraps console. */
export function installDevConsoleNoiseFilter(): void {
  if (typeof window === "undefined") return;
  if (process.env.NODE_ENV !== "development") return;

  const methods = ["warn", "error", "log", "info", "debug"] as const;

  for (const method of methods) {
    const current = console[method];
    if (typeof current !== "function") continue;
    if (Object.getOwnPropertyDescriptor(current, PATCHED)?.value === true) continue;

    const bound = (current as ConsoleFn).bind(console);
    console[method] = wrapConsoleMethod(bound) as (typeof console)[typeof method];
  }
}

export function scheduleDevConsoleNoiseFilterRefresh(): void {
  if (typeof window === "undefined") return;
  if (process.env.NODE_ENV !== "development") return;

  const run = () => installDevConsoleNoiseFilter();
  run();
  requestAnimationFrame(run);
  window.setTimeout(run, 0);
  window.setTimeout(run, 250);
}

/** Earliest possible setup — inline in root layout `<head>` before React / extensions. */
export function buildDevConsoleFilterInlineScript(): string {
  const pattern = JSON.stringify(DEV_CONSOLE_SUPPRESSED.source);
  return `(function(){try{if(typeof window!=="undefined"&&!window.__REACT_DEVTOOLS_GLOBAL_HOOK__){window.__REACT_DEVTOOLS_GLOBAL_HOOK__={isDisabled:false,supportsFiber:true,checkDCE:function(){},renderers:new Map(),inject:function(){return 0},onScheduleFiberRoot:function(){},onCommitFiberRoot:function(){},onCommitFiberUnmount:function(){},onPostCommitFiberRoot:function(){}}}var re=new RegExp(${pattern},"i");function suppressed(args){var list=Array.prototype.slice.call(args);for(var i=0;i<list.length;i++){var v=list[i];if(typeof v==="string"&&re.test(v))return true;if(v&&v.message&&re.test(v.message))return true}var joined=list.map(function(v){if(typeof v==="string")return v;if(v&&v.message)return v.message;try{return JSON.stringify(v)}catch(e){return String(v)}}).join(" ");return re.test(joined)}function wrap(fn){return function(){if(suppressed(arguments))return;fn.apply(console,arguments)}}function patch(){if(typeof console==="undefined")return;["warn","error","log","info","debug"].forEach(function(m){var cur=console[m];if(typeof cur!=="function")return;console[m]=wrap(cur.bind(console))})}patch();var n=0;var t=window.setInterval(function(){patch();n+=1;if(n>=24)window.clearInterval(t)},250)}catch(e){}})();`;
}
