"use client";

interface AdminNoticeProps {
  tone?: "info" | "warning" | "danger" | "success";
  title?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export default function AdminNotice({ tone = "info", title, children, actions }: AdminNoticeProps) {
  return (
    <div className={`admin-notice admin-notice--${tone}`} role="status">
      <div className="admin-notice__body">
        {title ? <strong className="admin-notice__title">{title}</strong> : null}
        <div className="admin-notice__text">{children}</div>
      </div>
      {actions ? <div className="admin-notice__actions">{actions}</div> : null}
    </div>
  );
}
