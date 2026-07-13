"use client";

import Link from "next/link";
import { ArrowLeft, Mail, Phone } from "lucide-react";
import { BRAND } from "@/lib/brand";
import { formatOrderIdDisplay } from "@/lib/orderId";
import { ROUTES, productPath } from "@/lib/routes";
import { formatCurrency, formatCurrencyPrecise } from "@/utils/currency";
import { isInvoiceAvailable, withInvoiceReturnTo } from "@/features/invoice/utils/invoice-utils";
import { getInvoiceDownloadAction } from "@/features/invoice/utils/invoice-actions";
import { useOrderDetail } from "@/hooks/useOrderDetail";
import ShipmentTimeline from "@/components/tracking/ShipmentTimeline";
import {
  formatOrderDate,
  formatPaymentLabel,
  formatPaymentMethod,
  formatShippingAddress,
  formatTimelineDate,
  statusBadgeClass,
} from "@/components/account/orderDisplay";
import { buildOrderTimeline } from "@/components/account/orderTimeline";
import ReturnRequestForm from "@/components/account/ReturnRequestForm";
import type { InvoiceUrls } from "@/features/invoice/types";
import type { CatalogProduct } from "@/types/catalog";
import type { Order } from "@/types/order";
import type { PublicShipmentTracking } from "@/types/shipment";

export interface AccountOrderDetailProps {
  order: Order;
  shipment: PublicShipmentTracking | null;
  invoiceUrls: InvoiceUrls | null;
  products: Array<
    Pick<CatalogProduct, "id" | "slug" | "image" | "images" | "imageColor">
  >;
}

function productImage(
  product: Pick<CatalogProduct, "image" | "images" | "imageColor"> | undefined
): { src?: string; color: string } {
  const src = product?.images?.[0] ?? product?.image;
  return {
    src: src || undefined,
    color: product?.imageColor ?? "#e8eefd",
  };
}

function OrderTimelineSection({
  order,
  shipment,
}: {
  order: Order;
  shipment: PublicShipmentTracking | null;
}) {
  const steps = buildOrderTimeline(order, shipment);

  return (
    <section className="acct__card acct__card--spaced" aria-label="Order timeline">
      <div className="acct__card-header">
        <h3 className="acct__card-title">Order timeline</h3>
      </div>
      <div className="acct__card-body">
        <ol className="acct__timeline">
          {steps.map((step, index) => (
            <li
              key={step.id}
              className={`acct__timeline-item acct__timeline-item--${step.state}${
                index === 0 ? " acct__timeline-item--first" : ""
              }`}
            >
              <div className="acct__timeline-marker" aria-hidden />
              <div className="acct__timeline-content">
                <p className="acct__timeline-label">{step.label}</p>
                <p className="acct__timeline-meta">
                  {step.state === "upcoming"
                    ? "Pending"
                    : formatTimelineDate(step.occurredAt)}
                </p>
                {step.description ? (
                  <p className="acct__timeline-description">{step.description}</p>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export default function AccountOrderDetail({
  order: initialOrder,
  shipment: initialShipment,
  invoiceUrls: initialInvoiceUrls,
  products,
}: AccountOrderDetailProps) {
  const { data } = useOrderDetail(initialOrder.id, {
    order: initialOrder,
    invoiceUrls: initialInvoiceUrls,
    shipment: initialShipment,
  });

  const order = data?.order ?? initialOrder;
  const invoiceUrls = data?.invoiceUrls ?? initialInvoiceUrls;
  const shipment = data?.shipment ?? initialShipment;
  const invoiceDownload = getInvoiceDownloadAction(invoiceUrls);

  const productById = new Map(products.map((product) => [product.id, product]));
  const resolvedTrackingNumber = shipment?.trackingNumber ?? "Not assigned yet";
  const canShowInvoice = isInvoiceAvailable(order);
  const invoiceViewUrl = invoiceUrls?.html
    ? withInvoiceReturnTo(invoiceUrls.html, ROUTES.accountOrder(order.id))
    : undefined;
  const trackHref = order.trackingToken
    ? `${ROUTES.trackOrder}?orderId=${encodeURIComponent(order.id)}&trackingToken=${encodeURIComponent(order.trackingToken)}`
    : ROUTES.trackOrder;
  const supportMailto = `mailto:${BRAND.email}?subject=${encodeURIComponent(
    `Order support — ${formatOrderIdDisplay(order.id)}`
  )}`;

  return (
    <div className="acct__order-detail">
      <div className="acct__order-detail-top">
        <Link href={ROUTES.accountOrders} className="acct__back-link">
          <ArrowLeft size={16} aria-hidden />
          Back to orders
        </Link>

        <div className="acct__order-detail-heading">
          <div>
            <h2 className="acct__section-title">
              Order {formatOrderIdDisplay(order.id)}
            </h2>
            <p className="acct__section-sub acct__order-detail-sub">
              Placed on {formatOrderDate(order.createdAt)}
            </p>
          </div>
          <span className={statusBadgeClass(order.status)}>{order.status}</span>
        </div>
      </div>

      <div className="acct__order-detail-actions">
        {canShowInvoice && invoiceDownload ? (
          <a
            href={invoiceDownload.href}
            className="acct__btn acct__btn--primary"
            target="_blank"
            rel="noopener noreferrer"
          >
            {invoiceDownload.label}
          </a>
        ) : (
          <span className="acct__btn acct__btn--secondary acct__btn--disabled">
            Print invoice
          </span>
        )}
        {canShowInvoice && invoiceViewUrl ? (
          <a
            href={invoiceViewUrl}
            className="acct__btn acct__btn--secondary"
          >
            View invoice
          </a>
        ) : null}
        <Link href={trackHref} className="acct__btn acct__btn--secondary">
          Track Order
        </Link>
        <Link href={ROUTES.home} className="acct__btn acct__btn--secondary">
          Continue Shopping
        </Link>
        <a href={supportMailto} className="acct__btn acct__btn--secondary">
          Contact Support
        </a>
      </div>

      <div className="acct__order-detail-grid">
        <section className="acct__card">
          <div className="acct__card-header">
            <h3 className="acct__card-title">Order summary</h3>
          </div>
          <div className="acct__card-body">
            <dl className="acct__detail-kv">
              <div>
                <dt>Order number</dt>
                <dd>{formatOrderIdDisplay(order.id)}</dd>
              </div>
              <div>
                <dt>Order status</dt>
                <dd className="acct__detail-kv-capitalize">{order.status}</dd>
              </div>
              <div>
                <dt>Payment status</dt>
                <dd>{formatPaymentLabel(order.paymentStatus)}</dd>
              </div>
              <div>
                <dt>Payment method</dt>
                <dd>{formatPaymentMethod(order.paymentMethod)}</dd>
              </div>
              <div>
                <dt>Order date</dt>
                <dd>{formatOrderDate(order.createdAt)}</dd>
              </div>
              <div>
                <dt>Invoice number</dt>
                <dd>{order.invoice?.invoiceNumber ?? "—"}</dd>
              </div>
              <div>
                <dt>Tracking number</dt>
                <dd className="acct__detail-kv-mono">{resolvedTrackingNumber}</dd>
              </div>
            </dl>
          </div>
        </section>

        <section className="acct__card">
          <div className="acct__card-header">
            <h3 className="acct__card-title">Delivery details</h3>
          </div>
          <div className="acct__card-body acct__address-stack">
            <div>
              <p className="acct__address-label">Shipping address</p>
              <p className="acct__address-text acct__address-text--pre">
                {formatShippingAddress(order.shippingAddress)}
              </p>
            </div>
            <div>
              <p className="acct__address-label">Billing address</p>
              <p className="acct__address-text acct__address-text--pre">
                {formatShippingAddress(order.shippingAddress)}
              </p>
              <p className="acct__muted acct__address-note">
                Billing address matches your shipping address.
              </p>
            </div>
          </div>
        </section>
      </div>

      <OrderTimelineSection order={order} shipment={shipment} />

      <ReturnRequestForm order={order} />

      <section className="acct__card acct__card--spaced">
        <div className="acct__card-header">
          <h3 className="acct__card-title">Items ordered</h3>
          <span className="acct__muted">
            {order.items.length} item{order.items.length === 1 ? "" : "s"}
          </span>
        </div>
        <div className="acct__order-items">
          {order.items.map((item, index) => {
            const product = productById.get(item.productId);
            const image = productImage(product);
            const lineTotal = item.price * item.quantity;
            const productHref = product?.slug ? productPath(product.slug) : undefined;

            return (
              <article
                key={`${item.productId}-${item.variantId ?? index}`}
                className="acct__order-item"
              >
                <div className="acct__order-item-thumb">
                  {image.src ? (
                    <img src={image.src} alt="" />
                  ) : (
                    <div
                      className="acct__order-item-swatch"
                      style={{ backgroundColor: image.color }}
                    />
                  )}
                </div>
                <div className="acct__order-item-info">
                  {productHref ? (
                    <Link href={productHref} className="acct__order-item-name">
                      {item.name}
                    </Link>
                  ) : (
                    <p className="acct__order-item-name">{item.name}</p>
                  )}
                  {item.variantLabel ? (
                    <p className="acct__order-item-variant">{item.variantLabel}</p>
                  ) : null}
                  <p className="acct__order-item-qty">Qty: {item.quantity}</p>
                </div>
                <div className="acct__order-item-pricing">
                  <p className="acct__order-item-unit">
                    {formatCurrency(item.price)} each
                  </p>
                  <p className="acct__order-item-total">
                    {formatCurrency(lineTotal)}
                  </p>
                </div>
              </article>
            );
          })}
        </div>

        <div className="acct__order-totals">
          <div className="acct__order-totals-row">
            <span>Subtotal</span>
            <strong>{formatCurrencyPrecise(order.subtotal)}</strong>
          </div>
          {order.couponCode ? (
            <div className="acct__order-totals-row acct__order-totals-row--discount">
              <span>
                Coupon ({order.couponCode})
              </span>
              <strong>-{formatCurrencyPrecise(order.couponDiscount)}</strong>
            </div>
          ) : null}
          <div className="acct__order-totals-row">
            <span>Shipping</span>
            <strong>
              {order.shippingCharge > 0
                ? formatCurrencyPrecise(order.shippingCharge)
                : "Free"}
            </strong>
          </div>
          <div className="acct__order-totals-row">
            <span>GST</span>
            <strong>{formatCurrencyPrecise(order.totalGst)}</strong>
          </div>
          {order.platformFee > 0 ? (
            <div className="acct__order-totals-row">
              <span>Platform fee</span>
              <strong>{formatCurrencyPrecise(order.platformFee)}</strong>
            </div>
          ) : null}
          <div className="acct__order-totals-row acct__order-totals-row--grand">
            <span>Grand total</span>
            <strong>{formatCurrencyPrecise(order.total)}</strong>
          </div>
        </div>
      </section>

      <section className="acct__card acct__card--spaced">
        <div className="acct__card-header">
          <h3 className="acct__card-title">Shipment tracking</h3>
          {canShowInvoice && invoiceViewUrl ? (
            <a
              href={invoiceViewUrl}
              className="acct__card-link"
            >
              View invoice
            </a>
          ) : null}
        </div>
        <div className="acct__card-body">
          {shipment ? (
            <ShipmentTimeline shipment={shipment} />
          ) : (
            <div className="acct__tracking-empty">
              <p>
                Shipment details are not available yet. Tracking will appear here
                once your order has been packed and handed to the carrier.
              </p>
              {resolvedTrackingNumber !== "Not assigned yet" ? (
                <p className="acct__detail-kv-mono">
                  Tracking number: {resolvedTrackingNumber}
                </p>
              ) : null}
            </div>
          )}
        </div>
      </section>

      <section className="acct__card acct__support-card">
        <div className="acct__card-body acct__support-body">
          <div>
            <h3 className="acct__card-title">Need help with this order?</h3>
            <p className="acct__muted">
              Our gear advisors can help with delivery, returns, and product
              questions.
            </p>
          </div>
          <div className="acct__support-links">
            <a href={supportMailto} className="acct__support-link">
              <Mail size={16} aria-hidden />
              {BRAND.email}
            </a>
            {BRAND.phoneTel ? (
              <a href={`tel:${BRAND.phoneTel}`} className="acct__support-link">
                <Phone size={16} aria-hidden />
                {BRAND.phoneDisplay}
              </a>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
