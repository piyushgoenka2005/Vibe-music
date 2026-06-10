"use client";

import { useState } from "react";
import { MapPin, Plus } from "lucide-react";
import {
  useAccountProfileStore,
  type SavedAddress,
} from "@/store/accountProfileStore";
import AccountEmptyState from "./AccountEmptyState";
import { ROUTES } from "@/lib/routes";

const EMPTY_FORM = {
  label: "Home",
  name: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "India",
};

export default function AccountAddresses() {
  const addresses = useAccountProfileStore((s) => s.addresses);
  const addAddress = useAccountProfileStore((s) => s.addAddress);
  const removeAddress = useAccountProfileStore((s) => s.removeAddress);
  const setDefaultAddress = useAccountProfileStore((s) => s.setDefaultAddress);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  function handleAdd(event: React.FormEvent) {
    event.preventDefault();
    addAddress({
      ...form,
      isDefault: addresses.length === 0,
    });
    setForm(EMPTY_FORM);
    setShowForm(false);
  }

  function formatAddress(addr: SavedAddress): string {
    const parts = [
      addr.name,
      addr.line1,
      addr.line2,
      `${addr.city}, ${addr.state} ${addr.postalCode}`,
      addr.country,
    ].filter(Boolean);
    return parts.join("\n");
  }

  return (
    <div>
      <h2 className="acct__section-title">Addresses</h2>
      <p className="acct__section-sub">
        Manage shipping and billing addresses for faster checkout.
      </p>

      <div className="acct__toolbar">
        <button
          type="button"
          className="acct__btn acct__btn--primary"
          onClick={() => setShowForm((v) => !v)}
        >
          <Plus size={16} />
          Add Address
        </button>
      </div>

      {showForm ? (
        <div className="acct__card" style={{ marginBottom: 20 }}>
          <div className="acct__card-header">
            <h3 className="acct__card-title">New Address</h3>
          </div>
          <div className="acct__card-body">
            <form onSubmit={handleAdd}>
              <div className="acct__form-grid">
                <div className="acct__field">
                  <label className="acct__label">Label</label>
                  <select
                    className="acct__select"
                    value={form.label}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, label: e.target.value }))
                    }
                  >
                    <option>Home</option>
                    <option>Work</option>
                    <option>Studio</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="acct__field">
                  <label className="acct__label">Full Name</label>
                  <input
                    className="acct__input"
                    value={form.name}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, name: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="acct__field acct__field--full">
                  <label className="acct__label">Address Line 1</label>
                  <input
                    className="acct__input"
                    value={form.line1}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, line1: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="acct__field acct__field--full">
                  <label className="acct__label">Address Line 2</label>
                  <input
                    className="acct__input"
                    value={form.line2}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, line2: e.target.value }))
                    }
                  />
                </div>
                <div className="acct__field">
                  <label className="acct__label">City</label>
                  <input
                    className="acct__input"
                    value={form.city}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, city: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="acct__field">
                  <label className="acct__label">State</label>
                  <input
                    className="acct__input"
                    value={form.state}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, state: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="acct__field">
                  <label className="acct__label">Postal Code</label>
                  <input
                    className="acct__input"
                    value={form.postalCode}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, postalCode: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="acct__field">
                  <label className="acct__label">Country</label>
                  <input
                    className="acct__input"
                    value={form.country}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, country: e.target.value }))
                    }
                    required
                  />
                </div>
              </div>
              <div style={{ marginTop: 20, display: "flex", gap: 12 }}>
                <button type="submit" className="acct__btn acct__btn--primary">
                  Save Address
                </button>
                <button
                  type="button"
                  className="acct__btn acct__btn--secondary"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {addresses.length === 0 ? (
        <div className="acct__card">
          <AccountEmptyState
            icon={MapPin}
            title="No Saved Addresses"
            description="Add a shipping address to speed up checkout and order delivery."
            actionLabel="Browse Products"
            actionHref={ROUTES.search}
          />
        </div>
      ) : (
        <div className="acct__address-grid">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className={`acct__address-card${addr.isDefault ? " acct__address-card--default" : ""}`}
            >
              <p className="acct__address-label">
                {addr.label}
                {addr.isDefault ? " · Default" : ""}
              </p>
              <p className="acct__address-text" style={{ whiteSpace: "pre-line" }}>
                {formatAddress(addr)}
              </p>
              <div className="acct__address-actions">
                {!addr.isDefault ? (
                  <button
                    type="button"
                    className="acct__btn acct__btn--secondary acct__btn--sm"
                    onClick={() => setDefaultAddress(addr.id)}
                  >
                    Set Default
                  </button>
                ) : null}
                <button
                  type="button"
                  className="acct__btn acct__btn--danger acct__btn--sm"
                  onClick={() => removeAddress(addr.id)}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
