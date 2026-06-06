"use client";

import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import {
  browserLocalPersistence,
  getAuth,
  setPersistence,
  type Auth,
} from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import {
  assertFirebaseClientConfig,
  firebasePublicConfig,
} from "@/lib/firebase/config";

let authPersistenceConfigured = false;

function getClientApp(): FirebaseApp {
  if (getApps().length > 0) {
    return getApp();
  }

  assertFirebaseClientConfig();
  return initializeApp(firebasePublicConfig);
}

export function getClientAuth(): Auth {
  const auth = getAuth(getClientApp());

  if (!authPersistenceConfigured && typeof window !== "undefined") {
    authPersistenceConfigured = true;
    void setPersistence(auth, browserLocalPersistence);
  }

  return auth;
}

export function getClientFirestore(): Firestore {
  return getFirestore(getClientApp());
}

export function getClientStorage(): FirebaseStorage {
  return getStorage(getClientApp());
}
