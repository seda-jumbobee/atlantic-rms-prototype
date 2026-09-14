"use client";

import { useSyncExternalStore } from "react";
import { VENDORS } from "@/lib/data/vendors";
import type { Vendor } from "@/lib/types";

/* ============================================================================
   Vendor edits made in this session.

   THERE IS NO VENDOR ENDPOINT. This store exists so the admin's edit workflow
   is real end to end — validate, save, see the change reflected everywhere the
   vendor appears — without pretending the change was written anywhere.

   Deliberately IN MEMORY, not localStorage. A vendor record belongs to the
   server; persisting an edit in the browser would make it look saved, survive
   a reload, and quietly diverge from what every other user sees. Losing the
   edit on reload is the honest behaviour for something that was never sent
   anywhere, and the UI says so at the point of saving.

   Shaped as an override layer keyed by id, so VENDORS is never mutated and
   swapping this for a real `PATCH /vendors/:id` means changing `save` alone.
   ========================================================================= */

export type VendorPatch = Partial<
  Pick<Vendor, "name" | "tier" | "services" | "baseLocation" | "rating" | "notes" | "contactEmail" | "contactPhone" | "ownsEquipment">
>;

const overrides = new Map<string, VendorPatch>();
const listeners = new Set<() => void>();

/** Bumped on every write so useSyncExternalStore sees a new snapshot. */
let version = 0;

function emit() {
  version += 1;
  for (const l of listeners) l();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

const getSnapshot = () => version;
// The server render has no edits, and must not read the mutable counter.
const getServerSnapshot = () => 0;

export type VendorSaveResult = { ok: true } | { ok: false; message: string };

/** The single seam a real endpoint would replace. */
export function saveVendor(id: string, patch: VendorPatch): VendorSaveResult {
  if (!VENDORS.some((v) => v.id === id)) {
    return { ok: false, message: "That vendor no longer exists." };
  }
  overrides.set(id, { ...overrides.get(id), ...patch });
  emit();
  return { ok: true };
}

function merge(v: Vendor): Vendor {
  const patch = overrides.get(v.id);
  return patch ? { ...v, ...patch } : v;
}

/** Every vendor, with this session's edits applied. */
export function useVendors(): Vendor[] {
  useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return VENDORS.map(merge);
}

export function useVendor(id: string): Vendor | undefined {
  useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const v = VENDORS.find((x) => x.id === id);
  return v ? merge(v) : undefined;
}

/** True once a vendor carries an unsaved-to-server edit, so the UI can say so. */
export function useIsEdited(id: string): boolean {
  useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return overrides.has(id);
}
