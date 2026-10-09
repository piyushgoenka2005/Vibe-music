/**
 * Known noisy console output in local dev — browser extensions (contentscript.js)
 * and Next.js forward-logs (React DevTools / HMR). Not application bugs.
 */
export const DEV_CONSOLE_SUPPRESSED =
  /save-page|Extension context invalidated|chrome-extension:|ObjectMultiplex|app-init-liveness|background-liveness|orphaned data for stream|MaxListenersExceededWarning|React DevTools|react\.dev\/link\/react-devtools|\[HMR\] connected|\[Fast Refresh\]/i;

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

const PATCHED = Symbol("vibeDevConsoleFilter");

type ConsoleFn = (...args: unknown[]) => void;

function wrapConsoleMethod(original: ConsoleFn): ConsoleFn {
  const wrapped = (...args: unknown[]) => {
    if (isSuppressedDevConsoleMessage(formatConsoleArgs(args))) {
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

  const w = window as Window & {
    __REACT_DEVTOOLS_GLOBAL_HOOK__?: {
      isDisabled?: boolean;
      supportsFiber?: boolean;
      checkDCE?: boolean;
      inject?: (internals: unknown) => number;
    };
  };

  if (w.__REACT_DEVTOOLS_GLOBAL_HOOK__) return;

  w.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
    isDisabled: false,
    supportsFiber: true,
    checkDCE: true,
    inject() {
      return 0;
    },
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
  return `(function(){try{if(typeof window!=="undefined"&&!window.__REACT_DEVTOOLS_GLOBAL_HOOK__){window.__REACT_DEVTOOLS_GLOBAL_HOOK__={isDisabled:false,supportsFiber:true,checkDCE:true,inject:function(){return 0}}}var re=new RegExp(${pattern},"i");function fmt(args){var list=Array.prototype.slice.call(args);return list.map(function(v){if(typeof v==="string")return v;if(v&&v.message)return v.message;try{return JSON.stringify(v)}catch(e){return String(v)}}).join(" ")}function wrap(fn){return function(){if(re.test(fmt(arguments)))return;fn.apply(console,arguments)}}if(typeof console!=="undefined"){console.warn=wrap(console.warn.bind(console));console.error=wrap(console.error.bind(console));console.log=wrap(console.log.bind(console));console.info=wrap(console.info.bind(console));console.debug=wrap(console.debug.bind(console))}}catch(e){}})();`;
}
