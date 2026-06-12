const { useState, useEffect } = React;

const ICONS = {
  logo: "icons/ClearSignal.svg",
  home: "icons/home.svg",
  check: "icons/check.svg",
  trend: "icons/trend.svg",
  alert: "icons/alert.svg",
  card: "icons/card.svg",
};

function AppIcon({ name, className = "app-icon", alt = "", ...rest }) {
  const src = ICONS[name];
  if (!src) return null;
  return (
    <img
      src={src}
      className={className}
      alt={alt}
      aria-hidden={!alt}
      {...rest}
    />
  );
}

function FeatureCard({ icon, label, className = "" }) {
  return (
    <div className={`feature-card ${className}`}>
      <AppIcon name={icon} className="feature-card__icon" />
      <p className="feature-card__label">{label}</p>
    </div>
  );
}

function NavIcon({ name, active }) {
  return (
    <AppIcon
      name={name}
      className="bottom-nav__icon"
      alt=""
      style={{ opacity: active ? 1 : 0.55 }}
    />
  );
}

function Button({
  children,
  variant = "primary",
  size,
  block,
  disabled,
  onClick,
  type = "button",
  className = "",
}) {
  const classes = [
    "btn",
    `btn--${variant}`,
    block ? "btn--block" : "",
    size === "lg" ? "btn--lg" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function Chip({ variant = "good", children }) {
  return <span className={`chip chip--${variant}`}>{children}</span>;
}

function ProgressDots({ total, current }) {
  return (
    <div className="progress-dots" role="tablist" aria-label="Progress">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`progress-dots__dot ${
            i === current ? "progress-dots__dot--active" : ""
          }`}
          role="tab"
          aria-selected={i === current}
        />
      ))}
    </div>
  );
}

function ToggleRow({ value, onChange, options }) {
  return (
    <div className="toggle-row" role="group">
      {options.map((opt) => {
        const selected = value === opt.value;
        const selectedClass = selected
          ? opt.value === "yes" || opt.value === "same"
            ? "toggle-btn--selected-yes"
            : opt.value === "worse"
            ? "toggle-btn--selected-worse"
            : "toggle-btn--selected-no"
          : "";
        return (
          <button
            key={opt.value}
            type="button"
            className={`toggle-btn ${selectedClass}`}
            aria-pressed={selected}
            onClick={() => onChange(opt.value)}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function Field({ label, hint, error, errorId, children }) {
  return (
    <div className="field">
      <label className="field__label">{label}</label>
      {hint && <span className="field__hint">{hint}</span>}
      {children}
      {error && (
        <span className="field__error" id={errorId} role="alert">
          {error}
        </span>
      )}
    </div>
  );
}

function BottomNav({ items, active, onChange }) {
  return (
    <nav className="bottom-nav" aria-label="Main">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className={`bottom-nav__item ${
            active === item.id ? "bottom-nav__item--active" : ""
          }`}
          onClick={() => onChange(item.id)}
          aria-current={active === item.id ? "page" : undefined}
        >
          <NavIcon name={item.icon} active={active === item.id} />
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}

function ScreenLayout({
  title,
  titleClassName = "",
  subtitle,
  children,
  footer,
  showNav,
  nav,
  scrollClass = "",
}) {
  const titleClasses = ["screen__title", titleClassName].filter(Boolean).join(" ");

  return (
    <div className="screen">
      {(title || subtitle) && (
        <header className="screen__header">
          {title && <h1 className={titleClasses}>{title}</h1>}
          {subtitle && <p className="screen__subtitle">{subtitle}</p>}
        </header>
      )}
      <div
        className={`screen__scroll ${showNav ? "screen__scroll--with-nav" : ""} ${scrollClass}`}
      >
        {children}
      </div>
      {footer && <div className="sticky-footer">{footer}</div>}
      {showNav && nav}
    </div>
  );
}

function TweaksPanel({ open, config, onChange, onJump, screens }) {
  if (!open) return null;

  return (
    <div className="tweaks-panel" role="dialog" aria-label="Prototype tweaks">
      <div className="tweaks-panel__title">Tweaks</div>

      <div className="tweaks-panel__group">
        <label className="tweaks-panel__label">Jump to screen</label>
        <select
          value={config.screen}
          onChange={(e) => onJump(e.target.value)}
        >
          {screens.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <div className="tweaks-panel__group">
        <label className="tweaks-panel__label">Role</label>
        <select
          value={config.role}
          onChange={(e) => onChange({ ...config, role: e.target.value })}
        >
          <option value="patient">Patient / family</option>
          <option value="caregiver">Caregiver</option>
        </select>
      </div>

      <div className="tweaks-panel__group">
        <label className="tweaks-panel__label">Visual style</label>
        <select
          value={config.style}
          onChange={(e) => onChange({ ...config, style: e.target.value })}
        >
          <option value="calm">Calm (default)</option>
          <option value="high-contrast">High contrast</option>
        </select>
      </div>

      <div className="tweaks-panel__group tweaks-panel__row">
        <span className="tweaks-panel__label" style={{ margin: 0 }}>
          Dark mode
        </span>
        <input
          type="checkbox"
          checked={config.darkMode}
          onChange={(e) =>
            onChange({ ...config, darkMode: e.target.checked })
          }
        />
      </div>

      <div className="tweaks-panel__group tweaks-panel__row">
        <span className="tweaks-panel__label" style={{ margin: 0 }}>
          Phone frame
        </span>
        <input
          type="checkbox"
          checked={config.framed}
          onChange={(e) =>
            onChange({ ...config, framed: e.target.checked })
          }
        />
      </div>

      <div className="tweaks-panel__group tweaks-panel__row">
        <span className="tweaks-panel__label" style={{ margin: 0 }}>
          Sample timeline data
        </span>
        <input
          type="checkbox"
          checked={config.sampleData}
          onChange={(e) =>
            onChange({ ...config, sampleData: e.target.checked })
          }
        />
      </div>
    </div>
  );
}

Object.assign(window, {
  ICONS,
  AppIcon,
  FeatureCard,
  NavIcon,
  Button,
  Chip,
  ProgressDots,
  ToggleRow,
  Field,
  BottomNav,
  ScreenLayout,
  TweaksPanel,
});
