#!/usr/bin/env node
/**
 * Generate VAPID keys for web push (run once, then set as env vars):
 *
 *   node scripts/ops/generate-vapid-keys.mjs
 *
 * Add to production .env:
 *   NEXT_PUBLIC_VAPID_PUBLIC_KEY=<publicKey>
 *   VAPID_PRIVATE_KEY=<privateKey>
 *   VAPID_SUBJECT=mailto:support@vibemusic.in
 */
import webpush from "web-push";

const keys = webpush.generateVAPIDKeys();
console.log("Add these to your production environment:\n");
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${keys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${keys.privateKey}`);
console.log("VAPID_SUBJECT=mailto:support@vibemusic.in");
