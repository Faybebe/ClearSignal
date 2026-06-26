const { useState, useEffect, useRef } = React;

const ICONS = {
  logo: "icons/ClearSignal.svg",
  home: "icons/home.svg",
  check: "icons/check.svg",
  trend: "icons/trend.svg",
  alert: "icons/alert.svg",
  card: "icons/card.svg",
  bulb: "icons/bulb.svg",
  note: "icons/Note.svg",
  question: "icons/question mark.svg",
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
    <div
      className="progress-dots"
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={total}
      aria-valuenow={current + 1}
      aria-valuetext={`Step ${current + 1} of ${total}`}
    >
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`progress-dots__dot ${
            i === current ? "progress-dots__dot--active" : ""
          }`}
          aria-hidden="true"
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
            : opt.value === "na"
            ? "toggle-btn--selected-na"
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

function Field({ label, hint, footnote, footnoteId, error, errorId, children }) {
  const reactId = React.useId();
  const inputId = `field-${reactId}`;
  const hintId = hint ? `${inputId}-hint` : null;
  const resolvedErrorId = error ? errorId || `${inputId}-error` : null;
  const resolvedFootnoteId = footnote ? footnoteId || `${inputId}-footnote` : null;

  const describedBy =
    [hintId, resolvedErrorId, resolvedFootnoteId].filter(Boolean).join(" ") || undefined;

  // Wire the label, description, and error state to the actual form control
  // so screen readers announce them together (WCAG 1.3.1, 3.3.2, 4.1.2).
  const control = React.isValidElement(children)
    ? React.cloneElement(children, {
        id: children.props.id || inputId,
        "aria-describedby":
          [children.props["aria-describedby"], describedBy].filter(Boolean).join(" ") ||
          undefined,
        "aria-invalid": error ? true : children.props["aria-invalid"],
      })
    : children;

  const controlId = React.isValidElement(children)
    ? children.props.id || inputId
    : undefined;

  return (
    <div className="field">
      <label className="field__label" htmlFor={controlId}>
        {label}
      </label>
      {control}
      {hint && (
        <span className="field__hint" id={hintId}>
          {hint}
        </span>
      )}
      {error && (
        <span className="field__error" id={resolvedErrorId} role="alert">
          {error}
        </span>
      )}
      {footnote && (
        <span className="field__footnote" id={resolvedFootnoteId}>
          {footnote}
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
  const headingRef = useRef(null);

  // Move focus to the screen heading on navigation so keyboard and screen-reader
  // users are oriented to the new screen instead of being stranded (WCAG 2.4.3).
  useEffect(() => {
    if (headingRef.current) {
      headingRef.current.focus({ preventScroll: true });
    }
  }, [title]);

  return (
    <div className="screen">
      {(title || subtitle) && (
        <header className="screen__header">
          {title && (
            <h1 className={titleClasses} tabIndex={-1} ref={headingRef}>
              {title}
            </h1>
          )}
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
        <label className="tweaks-panel__label" htmlFor="tweaks-screen">
          Jump to screen
        </label>
        <select
          id="tweaks-screen"
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
        <label className="tweaks-panel__label" htmlFor="tweaks-role">
          Role
        </label>
        <select
          id="tweaks-role"
          value={config.role}
          onChange={(e) => onChange({ ...config, role: e.target.value })}
        >
          <option value="patient">Patient / family</option>
          <option value="caregiver">Caregiver</option>
        </select>
      </div>

      <div className="tweaks-panel__group">
        <label className="tweaks-panel__label" htmlFor="tweaks-style">
          Visual style
        </label>
        <select
          id="tweaks-style"
          value={config.style}
          onChange={(e) => onChange({ ...config, style: e.target.value })}
        >
          <option value="calm">Calm (default)</option>
          <option value="high-contrast">High contrast</option>
        </select>
      </div>

      <div className="tweaks-panel__group tweaks-panel__row">
        <label className="tweaks-panel__label" htmlFor="tweaks-dark" style={{ margin: 0 }}>
          Dark mode
        </label>
        <input
          id="tweaks-dark"
          type="checkbox"
          checked={config.darkMode}
          onChange={(e) =>
            onChange({ ...config, darkMode: e.target.checked })
          }
        />
      </div>

      <div className="tweaks-panel__group tweaks-panel__row">
        <label className="tweaks-panel__label" htmlFor="tweaks-frame" style={{ margin: 0 }}>
          Phone frame
        </label>
        <input
          id="tweaks-frame"
          type="checkbox"
          checked={config.framed}
          onChange={(e) =>
            onChange({ ...config, framed: e.target.checked })
          }
        />
      </div>

      <div className="tweaks-panel__group tweaks-panel__row">
        <label className="tweaks-panel__label" htmlFor="tweaks-sample" style={{ margin: 0 }}>
          Sample timeline data
        </label>
        <input
          id="tweaks-sample"
          type="checkbox"
          checked={config.sampleData}
          onChange={(e) =>
            onChange({ ...config, sampleData: e.target.checked })
          }
        />
      </div>

      <div className="tweaks-panel__group tweaks-panel__row">
        <label className="tweaks-panel__label" htmlFor="tweaks-monitor" style={{ margin: 0 }}>
          Simulate monitor alert
        </label>
        <input
          id="tweaks-monitor"
          type="checkbox"
          checked={config.simulateMonitorAlert}
          onChange={(e) =>
            onChange({ ...config, simulateMonitorAlert: e.target.checked })
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
