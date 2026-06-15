"use client";

import { useState } from "react";
import { MapPin, Pencil, Plus } from "lucide-react";
import { formatAddressLines, getAddressDisplayLabel } from "@/lib/address/addressMappers";
import type { AddressInputValues } from "@/lib/validations/address";
import { useAddresses } from "@/hooks/useAddresses";
import AccountEmptyState from "./AccountEmptyState";
import { ROUTES } from "@/lib/routes";

const EMPTY_FORM: AddressInputValues = {
  label: "Home",
  fullName: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "India",
};

const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Puducherry",
] as const;

function AddressForm({
  form,
  setForm,
  onSubmit,
  onCancel,
  submitLabel,
  isSubmitting,
}: {
  form: AddressInputValues;
  setForm: React.Dispatch<React.SetStateAction<AddressInputValues>>;
  onSubmit: (event: React.FormEvent) => void;
  onCancel: () => void;
  submitLabel: string;
  isSubmitting: boolean;
}) {
  return (
    <form onSubmit={onSubmit}>
      <div className="acct__form-grid">
        <div className="acct__field">
          <label className="acct__label">Label</label>
          <select
            className="acct__select"
            value={form.label ?? "Home"}
            onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
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
            value={form.fullName}
            onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
            required
          />
        </div>
        <div className="acct__field">
          <label className="acct__label">Phone</label>
          <input
            className="acct__input"
            type="tel"
            pattern="[0-9]{10}"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            required
          />
        </div>
        <div className="acct__field acct__field--full">
          <label className="acct__label">Address Line 1</label>
          <input
            className="acct__input"
            value={form.addressLine1}
            onChange={(e) =>
              setForm((f) => ({ ...f, addressLine1: e.target.value }))
            }
            required
          />
        </div>
        <div className="acct__field acct__field--full">
          <label className="acct__label">Address Line 2</label>
          <input
            className="acct__input"
            value={form.addressLine2 ?? ""}
            onChange={(e) =>
              setForm((f) => ({ ...f, addressLine2: e.target.value }))
            }
          />
        </div>
        <div className="acct__field">
          <label className="acct__label">City</label>
          <input
            className="acct__input"
            value={form.city}
            onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
            required
          />
        </div>
        <div className="acct__field">
          <label className="acct__label">State</label>
          <select
            className="acct__select"
            value={form.state}
            onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
            required
          >
            {INDIAN_STATES.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
        </div>
        <div className="acct__field">
          <label className="acct__label">Postal Code</label>
          <input
            className="acct__input"
            pattern="[0-9]{6}"
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
            onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
            required
          />
        </div>
      </div>
      <div className="acct__form-actions">
        <button
          type="submit"
          className="acct__btn acct__btn--primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Saving…" : submitLabel}
        </button>
        <button
          type="button"
          className="acct__btn acct__btn--secondary"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function AccountAddresses() {
  const {
    addresses,
    isLoading,
    isError,
    createAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    isCreating,
    isUpdating,
    isDeleting,
  } = useAddresses();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AddressInputValues>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(false);
    setFormError(null);
  }

  function startEdit(address: (typeof addresses)[number]) {
    setEditingId(address.id);
    setShowForm(false);
    setForm({
      label: address.label ?? "Home",
      fullName: address.fullName,
      phone: address.phone,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 ?? "",
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
    });
    setFormError(null);
  }

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);
    try {
      await createAddress({
        ...form,
        isDefault: addresses.length === 0,
      });
      resetForm();
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Unable to save address"
      );
    }
  }

  async function handleUpdate(event: React.FormEvent) {
    event.preventDefault();
    if (!editingId) return;
    setFormError(null);
    try {
      await updateAddress({ addressId: editingId, input: form });
      resetForm();
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Unable to update address"
      );
    }
  }

  async function handleDelete(addressId: string) {
    if (!window.confirm("Remove this address?")) return;
    try {
      await deleteAddress(addressId);
      if (editingId === addressId) resetForm();
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Unable to delete address"
      );
    }
  }

  return (
    <div>
      <h2 className="acct__section-title">Addresses</h2>
      <p className="acct__section-sub">
        Manage shipping addresses synced to your account for faster checkout.
      </p>

      <div className="acct__toolbar">
        <button
          type="button"
          className="acct__btn acct__btn--primary"
          onClick={() => {
            setShowForm((v) => !v);
            setEditingId(null);
            setForm(EMPTY_FORM);
            setFormError(null);
          }}
        >
          <Plus size={16} />
          Add Address
        </button>
      </div>

      {formError ? (
        <p className="acct__error" role="alert">
          {formError}
        </p>
      ) : null}

      {showForm ? (
        <div className="acct__card acct__card--spaced">
          <div className="acct__card-header">
            <h3 className="acct__card-title">New Address</h3>
          </div>
          <div className="acct__card-body">
            <AddressForm
              form={form}
              setForm={setForm}
              onSubmit={handleCreate}
              onCancel={resetForm}
              submitLabel="Save Address"
              isSubmitting={isCreating}
            />
          </div>
        </div>
      ) : null}

      {editingId ? (
        <div className="acct__card acct__card--spaced">
          <div className="acct__card-header">
            <h3 className="acct__card-title">Edit Address</h3>
          </div>
          <div className="acct__card-body">
            <AddressForm
              form={form}
              setForm={setForm}
              onSubmit={handleUpdate}
              onCancel={resetForm}
              submitLabel="Update Address"
              isSubmitting={isUpdating}
            />
          </div>
        </div>
      ) : null}

      {isLoading ? (
        <p className="acct__muted">Loading addresses…</p>
      ) : isError ? (
        <p className="acct__error" role="alert">
          Unable to load addresses. Please refresh and try again.
        </p>
      ) : addresses.length === 0 ? (
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
                {getAddressDisplayLabel(addr)}
                {addr.isDefault ? " · Default" : ""}
              </p>
              <p className="acct__address-text" style={{ whiteSpace: "pre-line" }}>
                {formatAddressLines(addr)}
              </p>
              <div className="acct__address-actions">
                <button
                  type="button"
                  className="acct__btn acct__btn--secondary acct__btn--sm"
                  onClick={() => startEdit(addr)}
                >
                  <Pencil size={14} />
                  Edit
                </button>
                {!addr.isDefault ? (
                  <button
                    type="button"
                    className="acct__btn acct__btn--secondary acct__btn--sm"
                    onClick={() => void setDefaultAddress(addr.id)}
                    disabled={isUpdating}
                  >
                    Set Default
                  </button>
                ) : null}
                <button
                  type="button"
                  className="acct__btn acct__btn--danger acct__btn--sm"
                  onClick={() => void handleDelete(addr.id)}
                  disabled={isDeleting}
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
