import {
  installDevConsoleNoiseFilter,
  installReactDevToolsStub,
  scheduleDevConsoleNoiseFilterRefresh,
} from "@/lib/dev/devConsoleNoise";

try {
  installReactDevToolsStub();
  scheduleDevConsoleNoiseFilterRefresh();
} catch {
  /* instrumentation must not break the app */
}
