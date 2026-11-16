const { useState, useEffect } = React;

const CHECKIN_QUESTIONS = [
  {
    id: "confusion",
    examples: "Trouble following conversation, disoriented, repeating questions",
  },
  {
    id: "hallucinations",
    examples: "Seeing people or animals, or hearing voices that aren't there",
  },
  {
    id: "falls",
    examples: "Tripped, slipped, or needed help getting up",
  },
  {
    id: "urine",
    examples: "Cloudy, strong smell, burning, or new incontinence",
  },
  {
    id: "fever",
    examples: "Warm to the touch, chills, or looking flushed",
  },
  {
    id: "eating",
    examples: "Skipping meals, drinking less, or needing more coaxing",
  },
  {
    id: "mood",
    examples: "Tearful, quieter, or less interested than usual",
  },
];

// Check-in items urgent enough to actively prompt escalation on the completion
// screen (vs. just "logged, keep watching"). A fall is the clearest acute case.
const ACUTE_CHECKIN_IDS = ["falls"];

// Maps flagged daily check-in ids to matching sudden-change symptom option ids
// so escalation pre-selects what was just logged. Items without an equivalent
// sudden-change symptom (urine, eating, mood) are intentionally omitted.
const CHECKIN_TO_SUDDEN = {
  confusion: "confusion",
  hallucinations: "hallucination",
  falls: "fall",
  fever: "fever",
};

function getSuddenSymptomsFromCheckin(flaggedIds = []) {
  return flaggedIds
    .map((id) => CHECKIN_TO_SUDDEN[id])
    .filter(Boolean);
}

// Short labels for timeline detail and hospital-card incident suggestions.
const CHECKIN_SHORT_LABELS = {
  confusion: "Confusion",
  hallucinations: "Hallucinations",
  falls: "Falls",
  urine: "Urine changes",
  fever: "Fever",
  eating: "Eating less",
  mood: "Low mood",
};

// Decision guidance steps keyed by severity. "alert" = emergency (red),
// "watch" = act today (yellow). Shown on the AlertSent screen (post-send).
const TRIAGE_STEPS = {
  alert: [
    "Call 911 or go to the ER now",
    "Bring the hospital card",
    "Don't stop levodopa without neurologist approval",
  ],
  watch: [
    "Run a home UTI test",
    "Call PCP or neurologist today",
    "Go to the ER if symptoms get worse",
  ],
};

// The medical-action steps shown in the pre-send triage panel, before the
// "log & notify" step is appended. Kept short so the priority is unambiguous.
const TRIAGE_ACTION_STEPS = {
  alert: ["Call 911 or go to the ER now"],
  watch: ["Run a home UTI test", "Call the PCP or neurologist today"],
};

// Maps a check-in outcome to its status pill. "partial" is a neutral state used
// when nothing was flagged but some items were marked "Not observed", so the day
// is not misrepresented as fully clear.
function outcomeChip(outcome) {
  if (outcome === "flagged") return { variant: "watch", label: "Watch" };
  if (outcome === "partial") return { variant: "partial", label: "Partial" };
  return { variant: "good", label: "Stable" };
}

function normalizeOutcome(checkIn) {
  if (!checkIn) return "clear";
  return checkIn.outcome || (checkIn.flagged ? "flagged" : "clear");
}

const DEFAULT_HOSPITAL_CARD = {
  patientName: "Margaret Chen",
  diagnosis: "Parkinson's Disease",
  dob: "03/14/1948",
  neurologist: "Dr. Sarah Okonkwo — Movement Disorders",
  neurologistPhone: "(555) 014-2200",
  pcp: "Dr. James Reyes",
  pcpPhone: "(555) 014-8890",
  emergencyContact: "Anna Chen (daughter) — (555) 014-3321",
  medications: [
    "Carbidopa/Levodopa 25/100 — 1 tab at 7am, 12pm, 5pm, 9pm",
    "Rasagiline 1mg — once daily morning",
    "Do NOT hold levodopa without neurologist approval",
  ],
  allergies: "Penicillin",
  recentIncidents:
    "Nov 9 — Near-fall in bathroom, no injury\nOct 28 — Fall from bed, bruised left hip",
  notes:
    "Sudden confusion may indicate UTI — test at home and contact PCP. Hallucinations worsened by Ciprofloxacin.",
};

// Suggests incident lines from logged alerts and fall check-ins so caregivers
// don't have to re-type what the app already captured.
function getIncidentSuggestionsFromTimeline(entries) {
  return (entries || [])
    .filter(
      (e) =>
        e.type === "alert" ||
        (Array.isArray(e.flaggedIds) && e.flaggedIds.includes("falls"))
    )
    .map((e) => {
      const what =
        e.type === "alert"
          ? e.detail || "Sudden change reported"
          : "Fall / near-fall reported";
      return `${e.month} ${e.day} — ${what}`;
    });
}

function DashboardActionCard({
  icon,
  title,
  subtitle,
  actionLabel,
  onClick,
  variant = "default",
  titleEmphasis = false,
  secondary = false,
}) {
  return (
    <button
      type="button"
      className={`card card--interactive dashboard-card ${
        variant === "danger" ? "card--danger" : ""
      } ${secondary ? "dashboard-card--secondary" : ""}`}
      onClick={onClick}
    >
      <AppIcon name={icon} className="app-icon--sm" />
      <div className="dashboard-card__body">
        <div className="dashboard-card__text">
          <div
            className={`dashboard-card__title ${
              titleEmphasis ? "dashboard-card__title--emphasis" : ""
            } ${variant === "danger" ? "dashboard-card__title--danger" : ""}`}
          >
            {title}
          </div>
          <div className="dashboard-card__subtitle">{subtitle}</div>
        </div>
        <span
          className={`dashboard-card__action ${
            variant === "danger" ? "dashboard-card__action--danger" : ""
          }`}
        >
          {actionLabel}
        </span>
      </div>
    </button>
  );
}

function RoleCard({ icon, iconSelected, title, description, selected, onClick }) {
  return (
    <button
      type="button"
      className={`role-card ${selected ? "role-card--selected" : ""}`}
      onClick={onClick}
      aria-pressed={selected}
    >
      <AppIcon
        name={selected ? iconSelected || icon : icon}
        className="role-card__icon"
        alt=""
      />
      <span className="role-card__content">
        <span className="role-card__title">{title}</span>
        <span className="role-card__description">{description}</span>
      </span>
      <span
        className={`role-card__mark${selected ? " role-card__mark--on" : ""}`}
        aria-hidden="true"
      >
        {selected && (
          <AppIcon name="checkWhite" className="role-card__mark-icon" alt="" />
        )}
      </span>
    </button>
  );
}

function OnboardingChrome({ onBack, title, children, footer }) {
  return (
    <div className="screen ob-screen">
      <header className="ob-top">
        <button
          type="button"
          className="ob-back"
          onClick={onBack}
          aria-label="Back"
        >
          <AppIcon name="chevronLeft" className="ob-back__icon" alt="" />
        </button>
      </header>
      <div className="screen__scroll ob-screen__scroll">
        {title && (
          <h1 className="ob-question" tabIndex={-1}>
            {title}
          </h1>
        )}
        {children}
      </div>
      {footer && <div className="sticky-footer">{footer}</div>}
    </div>
  );
}

function OnboardingWelcome({ onNext, onErMode, onPrivacy }) {
  const values = [
    { icon: "checkDark", label: "Daily 60-second check-in" },
    { icon: "alertDark", label: "One-tap alerts" },
    { icon: "idDark", label: "Hospital card" },
  ];

  return (
    <div className="screen welcome-screen">
      <div className="welcome-screen__main">
        <div className="welcome-screen__hero">
          <AppIcon
            name="logo"
            className="welcome-screen__logo"
            alt="ClearSignal"
          />
          <h1 className="welcome-screen__headline">
            Notice sudden changes early.
          </h1>
          <p className="welcome-screen__support">
            For people caring for someone with Parkinson's.
          </p>
        </div>

        <ul className="welcome-values" aria-label="What ClearSignal helps with">
          {values.map((item) => (
            <li key={item.label} className="welcome-values__item">
              <AppIcon
                name={item.icon}
                className="welcome-values__icon"
                alt=""
              />
              <span className="welcome-values__label">{item.label}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="welcome-screen__footer">
        <div className="welcome-screen__actions">
          <Button
            block
            size="lg"
            className="btn--welcome"
            onClick={onNext}
          >
            Get started
          </Button>
          <button
            type="button"
            className="btn btn--outline btn--block welcome-er"
            onClick={onErMode}
          >
            <AppIcon name="firstAid" className="welcome-er__icon" alt="" />
            In a crisis? Open ER mode
          </button>
        </div>
        <p className="welcome-screen__disclaimer">
          Not a medical device. For logging and care coordination only.{" "}
          <button
            type="button"
            className="welcome-screen__privacy"
            onClick={onPrivacy}
          >
            Privacy and your data
          </button>
        </p>
      </div>
    </div>
  );
}

// Plain-language trust layer reached from the welcome screen. Content is
// role-neutral (shown before role selection) and kept honest to a prototype.
const PRIVACY_SECTIONS = [
  {
    title: "This is a prototype",
    body: "This demo stores nothing. Your entries live only in this browser session and clear when you reload — nothing is sent anywhere.",
  },
  {
    title: "What the real app would store",
    body: "Daily check-ins, sudden-change logs, and your hospital card — encrypted and tied to your account.",
  },
  {
    title: "Who can see it",
    body: "Only the care circle you choose. Alerts go solely to the contacts you add in setup — no one else.",
  },
  {
    title: "What we'd never do",
    body: "We'd never sell your data or share it for advertising.",
  },
  {
    title: "Not a medical device",
    body: "ClearSignal isn't a monitored service or a medical device. In an emergency, always call 911.",
  },
  {
    title: "HIPAA & certification",
    body: "Real HIPAA compliance is an infrastructure and legal effort, not just an app screen. This prototype doesn't claim any privacy certification yet — it shows how the real product would handle your data.",
  },
];

function PrivacyScreen({ onBack }) {
  return (
    <ScreenLayout
      title="Your data & privacy"
      subtitle="How ClearSignal handles your information, in plain language."
      scrollClass="screen__scroll--fade"
      footer={
        <Button block size="lg" onClick={onBack}>
          Back
        </Button>
      }
    >
      <div className="stack">
        {PRIVACY_SECTIONS.map((section, i) => (
          <div key={i} className="card">
            <h2 className="section-title" style={{ marginBottom: 4 }}>
              {section.title}
            </h2>
            <p
              style={{
                fontSize: "var(--text-sm)",
                color: "var(--text-brand)",
                textWrap: "pretty",
              }}
            >
              {section.body}
            </p>
          </div>
        ))}
      </div>
    </ScreenLayout>
  );
}

// Brief splash shown on launch — mirrors the get-started welcome's brand, then
// auto-advances to the educational walkthrough. Tap/Enter skips the wait.
function OnboardingSplash({ onContinue }) {
  useEffect(() => {
    const timer = setTimeout(onContinue, 1800);
    return () => clearTimeout(timer);
  }, [onContinue]);

  return (
    <div
      className="screen splash-screen"
      role="button"
      tabIndex={0}
      aria-label="Continue"
      onClick={onContinue}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onContinue();
        }
      }}
    >
      <div className="splash-screen__hero">
        <AppIcon name="logo" className="splash-screen__logo" alt="ClearSignal" />
      </div>
      <img
        src="icons/Tulip.png"
        alt=""
        aria-hidden="true"
        className="splash-screen__art"
      />
    </div>
  );
}

function OnboardingRole({ role, setRole, onNext, onBack }) {
  return (
    <OnboardingChrome
      onBack={onBack}
      title="Which describes you?"
      footer={
        <Button block size="lg" disabled={!role} onClick={onNext}>
          Continue
        </Button>
      }
    >
      <div className="stack ob-role-options">
        <RoleCard
          icon="heartHandshakeMuted"
          iconSelected="heartHandshake"
          title="I care for someone with Parkinson's"
          description="Family member, friend, or care staff"
          selected={role === "caregiver"}
          onClick={() => setRole("caregiver")}
        />
        <RoleCard
          icon="user"
          iconSelected="userActive"
          title="I'm living with Parkinson's"
          description="Track how you feel and alert your people"
          selected={role === "patient"}
          onClick={() => setRole("patient")}
        />
      </div>
    </OnboardingChrome>
  );
}

function OnboardingSetup({ data, setData, role, onNext, onBack }) {
  const [contactTouched, setContactTouched] = useState(false);
  const [monitorTouched, setMonitorTouched] = useState(false);
  const contactId = "caregiver-contact-input";
  const contactErrorId = "caregiver-contact-error";
  const monitorId = "monitor-contact-input";
  const monitorErrorId = "monitor-contact-error";

  const contactValidation = validateCaregiverContact(data.caregiverContact);
  const monitorValidation = validateCaregiverContact(data.monitorContact || "");
  const showContactError = contactTouched && !contactValidation.valid;
  const showMonitorError = monitorTouched && !monitorValidation.valid;
  const contactInputMode = getCaregiverContactInputMode(data.caregiverContact);
  const monitorInputMode = getCaregiverContactInputMode(data.monitorContact || "");

  const canFinish =
    data.patientName.trim() &&
    (role !== "patient" ||
      (data.caregiverContact.trim() && contactValidation.valid)) &&
    (role !== "caregiver" || monitorValidation.valid);

  const handleContactChange = (e) => {
    setData({
      ...data,
      caregiverContact: formatCaregiverContactInput(e.target.value),
    });
  };

  const handleMonitorChange = (e) => {
    setData({
      ...data,
      monitorContact: formatCaregiverContactInput(e.target.value),
    });
  };

  const handleFinish = () => {
    if (role === "patient") {
      setContactTouched(true);
      if (!data.caregiverContact.trim() || !contactValidation.valid) return;
    }
    if (role === "caregiver") {
      setMonitorTouched(true);
      if (!monitorValidation.valid) return;
    }
    onNext();
  };

  return (
    <OnboardingChrome
      onBack={onBack}
      title="Quick setup"
      footer={
        <Button
          block
          size="lg"
          disabled={!canFinish}
          onClick={handleFinish}
        >
          Finish setup
        </Button>
      }
    >
      <div className="form-section">
        {role === "caregiver" && (
          <h2 className="form-section__title">About your loved one</h2>
        )}
        <Field
          label="Person with Parkinson's"
          hint={
            role === "caregiver"
              ? "You'll log check-ins when you're with your loved one."
              : "First name is fine"
          }
        >
          <input
            id="patient-name-input"
            className="field__input"
            value={data.patientName}
            onChange={(e) =>
              setData({ ...data, patientName: e.target.value })
            }
            placeholder="e.g. Mom, Dad, Margaret"
          />
        </Field>
      </div>

      {role === "patient" && (
        <div className="form-section">
          <Field
            label="Caregiver contact"
            hint="Gets sudden-change alerts via text or email"
            error={showContactError ? contactValidation.error : ""}
            errorId={contactErrorId}
          >
            <input
              id={contactId}
              className={`field__input ${showContactError ? "field__input--error" : ""}`}
              type={contactInputMode === "email" ? "email" : "tel"}
              inputMode={contactInputMode}
              autoComplete={contactInputMode === "email" ? "email" : "tel"}
              value={data.caregiverContact}
              onChange={handleContactChange}
              onBlur={() => setContactTouched(true)}
              placeholder="(555) 555-5555 or email"
            />
          </Field>
        </div>
      )}

      {role === "caregiver" && (
        <>
          <div className="form-section">
            <h2 className="form-section__title">About you</h2>
            <Field label="Your name" hint="Shown on alerts you send">
              <input
                className="field__input"
                value={data.caregiverName}
                onChange={(e) =>
                  setData({ ...data, caregiverName: e.target.value })
                }
                placeholder="Your name"
              />
            </Field>
          </div>
          <div className="form-section">
            <h2 className="form-section__title">Care circle (optional)</h2>
            <Field
              label="Also notify"
              hint="e.g. adult child — gets sudden-change alerts via text or email"
              error={showMonitorError ? monitorValidation.error : ""}
              errorId={monitorErrorId}
            >
              <input
                id={monitorId}
                className={`field__input ${showMonitorError ? "field__input--error" : ""}`}
                type={monitorInputMode === "email" ? "email" : "tel"}
                inputMode={monitorInputMode}
                autoComplete={monitorInputMode === "email" ? "email" : "tel"}
                value={data.monitorContact || ""}
                onChange={handleMonitorChange}
                onBlur={() => setMonitorTouched(true)}
                placeholder="(555) 555-5555 or email"
              />
            </Field>
            {(data.monitorContact || "").trim() && (
              <Field label="Their name" hint="Shown on alert confirmations">
                <input
                  className="field__input"
                  value={data.monitorName || ""}
                  onChange={(e) =>
                    setData({ ...data, monitorName: e.target.value })
                  }
                  placeholder="e.g. Alex"
                />
              </Field>
            )}
          </div>
        </>
      )}

      <div className="form-section">
        <Field
          label="Daily reminder time"
          hint="A nudge to complete the daily check-in. Editable anytime."
        >
          <input
            className="field__input"
            type="time"
            value={data.reminderTime}
            onChange={(e) =>
              setData({ ...data, reminderTime: e.target.value })
            }
          />
        </Field>
      </div>
    </OnboardingChrome>
  );
}

function getDayKey(date) {
  return date.toDateString();
}

// Builds the last-7-days strip for the home status card.
// status: "stable" | "concern" | "alert" | "missed" | "empty"
function buildWeekStrip(timelineEntries = [], lastCheckIn, sampleData) {
  const today = new Date();
  today.setHours(12, 0, 0, 0);

  // Index real check-ins / alerts by day key
  const byDay = {};
  (timelineEntries || []).forEach((e) => {
    if (!e) return;
    // Reconstruct a date from month+day in the current/near year
    const monthIndex = [
      "Jan","Feb","Mar","Apr","May","Jun",
      "Jul","Aug","Sep","Oct","Nov","Dec",
    ].indexOf(e.month);
    if (monthIndex < 0 || !e.day) return;
    const d = new Date(today.getFullYear(), monthIndex, e.day, 12);
    // If more than ~6 months ahead, it's probably last year
    if (d.getTime() - today.getTime() > 1000 * 60 * 60 * 24 * 180) {
      d.setFullYear(d.getFullYear() - 1);
    }
    const key = getDayKey(d);
    const rank =
      e.status === "alert"
        ? 3
        : e.status === "watch"
        ? 2
        : e.status === "good" || e.status === "partial"
        ? 1
        : 0;
    const prev = byDay[key];
    if (!prev || rank > prev.rank) {
      byDay[key] = {
        rank,
        status:
          e.status === "alert"
            ? "alert"
            : e.status === "watch"
            ? "concern"
            : "stable",
      };
    }
  });

  if (lastCheckIn?.date) {
    const key = lastCheckIn.date;
    const outcome = normalizeOutcome(lastCheckIn);
    const rank = outcome === "flagged" ? 2 : 1;
    const status = outcome === "flagged" ? "concern" : "stable";
    const prev = byDay[key];
    // Don't downgrade a same-day alert already on the timeline
    if (!prev || rank > prev.rank) {
      byDay[key] = { rank, status };
    }
  }

  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = getDayKey(d);
    const isToday = i === 0;
    let status = byDay[key]?.status || null;

    // Demo strip when sample data is on and timeline history is empty.
    // Keep today's real check-in status; fill sparse past days to match the mock.
    const hasTimelineHistory = (timelineEntries || []).length > 0;
    if (!status) {
      if (sampleData && !hasTimelineHistory && !isToday) {
        // Match the mock: W T F(concern) S S(missed) M T(today)
        const demo = ["stable", "stable", "stable", "missed", "stable", "concern", "concern"];
        status = demo[6 - i];
      } else {
        // Past days with no entry = missed; today empty until checked in
        status = isToday ? "empty" : "missed";
      }
    }

    days.push({
      key,
      label: d.toLocaleDateString("en-US", { weekday: "narrow" }),
      status,
      isToday,
    });
  }
  return days;
}

function HomeStatusCard({
  lastCheckIn,
  timelineEntries,
  sampleData,
  onViewTimeline,
  onCheckIn,
}) {
  const checkedInToday = lastCheckIn?.date === new Date().toDateString();
  const outcome = normalizeOutcome(lastCheckIn);
  const week = buildWeekStrip(timelineEntries, lastCheckIn, sampleData);

  let tone = "neutral";
  let title = "No check-in yet";
  let detail = "A one-minute check-in keeps the baseline current.";
  if (checkedInToday) {
    if (outcome === "flagged") {
      tone = "concern";
      title = "Concerns today";
      detail = lastCheckIn?.time
        ? `Check-in done at ${lastCheckIn.time} · some concerns noted`
        : "Check-in done · some concerns noted";
    } else if (outcome === "partial") {
      tone = "partial";
      title = "Partly logged today";
      detail = lastCheckIn?.time
        ? `Check-in done at ${lastCheckIn.time} · some items skipped`
        : "Check-in done · some items skipped";
    } else {
      tone = "stable";
      title = "Stable today";
      detail = lastCheckIn?.time
        ? `Check-in done at ${lastCheckIn.time} · no new concerns`
        : "Check-in done · no new concerns";
    }
  }

  return (
    <section className={`home-status home-status--${tone}`}>
      <div className="home-status__header">
        {tone === "stable" && (
          <AppIcon name="circleCheck" className="home-status__icon" />
        )}
        {tone === "concern" && (
          <AppIcon name="alertTriangleAmber" className="home-status__icon" />
        )}
        <h2 className="home-status__title">{title}</h2>
      </div>
      <p className="home-status__detail">{detail}</p>

      {!checkedInToday && onCheckIn && (
        <button type="button" className="home-status__cta" onClick={onCheckIn}>
          Start check-in
        </button>
      )}

      <div className="week-strip" role="list" aria-label="Last 7 days">
        {week.map((day) => {
          const statusLabel =
            day.status === "alert"
              ? "alert"
              : day.status === "concern"
              ? "watch"
              : day.status === "good" || day.status === "stable"
              ? "stable"
              : day.status === "missed"
              ? "missed check-in"
              : day.status === "empty"
              ? "no check-in yet"
              : day.status;
          return (
            <div
              key={day.key}
              className="week-strip__day"
              role="listitem"
              title={day.key}
            >
              <span className="week-strip__label">{day.label}</span>
              <span
                className={`week-strip__dot week-strip__dot--${day.status}${
                  day.isToday ? " week-strip__dot--today" : ""
                }`}
                aria-label={`${day.label}: ${statusLabel}${
                  day.isToday ? ", today" : ""
                }`}
              >
                {day.status === "stable" && (
                  <AppIcon
                    name="weekCheck"
                    className="week-strip__glyph"
                    alt=""
                  />
                )}
                {day.status === "concern" && (
                  <span className="week-strip__pip" aria-hidden="true" />
                )}
                {day.status === "alert" && (
                  <AppIcon
                    name="weekAlert"
                    className="week-strip__glyph"
                    alt=""
                  />
                )}
              </span>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        className="home-status__link"
        onClick={onViewTimeline}
      >
        View timeline
        <AppIcon name="chevronRightLink" className="home-status__link-icon" />
      </button>
    </section>
  );
}

function HomeActionRow({
  icon,
  title,
  subtitle,
  onClick,
  variant = "default",
}) {
  return (
    <button
      type="button"
      className={`home-row home-row--${variant}`}
      onClick={onClick}
    >
      <AppIcon
        name={
          variant === "danger" || variant === "danger-loud"
            ? "alertDanger"
            : icon
        }
        className="home-row__icon"
      />
      <span className="home-row__text">
        <span className="home-row__title">{title}</span>
        {subtitle && <span className="home-row__sub">{subtitle}</span>}
      </span>
      <AppIcon
        name={
          variant === "danger" || variant === "danger-loud"
            ? "chevronRightDanger"
            : "chevronRight"
        }
        className="home-row__chevron"
      />
    </button>
  );
}

function HomeScreen({
  role,
  patientName,
  hasRecipients,
  lastCheckIn,
  timelineEntries,
  sampleData,
  monitorAlertBanner,
  onDismissMonitorBanner,
  onCheckIn,
  onSuddenChange,
  onHospitalCard,
  onViewTimeline,
}) {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const copyCtx = { role, patientName };
  const homeOutcome = normalizeOutcome(lastCheckIn);
  const checkedInToday = lastCheckIn?.date === new Date().toDateString();
  // Loud sudden-change treatment only when today's check-in flagged concerns
  const suddenLoud = checkedInToday && homeOutcome === "flagged";

  return (
    <ScreenLayout
      title={getCopy("home.title", copyCtx)}
      subtitle={today}
      titleClassName="home-title"
      subtitleClassName="home-date"
    >
      <div className="home stack">
        {monitorAlertBanner && (
          <div className="monitor-alert-banner" role="status">
            <div>
              <div className="monitor-alert-banner__title">Sudden change logged</div>
              <div className="monitor-alert-banner__body">
                High-priority alert sent to your device. Review the timeline for
                details.
              </div>
            </div>
            <button
              type="button"
              className="monitor-alert-banner__dismiss"
              onClick={onDismissMonitorBanner}
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        )}

        <HomeStatusCard
          lastCheckIn={lastCheckIn}
          timelineEntries={timelineEntries}
          sampleData={sampleData}
          onViewTimeline={onViewTimeline}
          onCheckIn={onCheckIn}
        />

        <HomeActionRow
          icon="alert"
          title="Something changed suddenly"
          subtitle={
            suddenLoud
              ? getCopy(
                  hasRecipients
                    ? "home.suddenChange.subtitle"
                    : "home.suddenChange.subtitle.none",
                  copyCtx
                )
              : null
          }
          onClick={onSuddenChange}
          variant="danger"
        />

        <HomeActionRow
          icon="idDark"
          title="Hospital card"
          subtitle="Updated Nov 2 · ready to export"
          onClick={onHospitalCard}
        />

        {role === "caregiver" && (
          <div className="tip-card">
            <AppIcon name="bulb" className="tip-card__icon" alt="" />
            <div className="tip-card__body">
              <div className="tip-card__title">Caregiver tip</div>
              <p className="tip-card__text">{getCopy("home.tip", copyCtx)}</p>
            </div>
          </div>
        )}
      </div>
    </ScreenLayout>
  );
}

function CheckInFlow({
  role,
  patientName,
  initialAnswers = {},
  onComplete,
  onCancel,
}) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState(() => ({ ...initialAnswers }));
  const copyCtx = { role, patientName };

  const total = CHECKIN_QUESTIONS.length;
  const question = CHECKIN_QUESTIONS[step];
  const isLast = step === total - 1;
  const questionLabel = getCopy(`checkin.question.${question.id}`, copyCtx);
  const progressPct = ((step + 1) / total) * 100;

  const setAnswer = (value) => {
    const next = { ...answers, [question.id]: value };
    setAnswers(next);
    if (isLast) {
      const flaggedIds = Object.keys(next).filter((id) => next[id] === "yes");
      const flagged = flaggedIds.length > 0;
      const hasUnobserved = Object.values(next).some((v) => v === "na");
      const outcome = flagged ? "flagged" : hasUnobserved ? "partial" : "clear";
      onComplete({ answers: next, flagged, flaggedIds, outcome });
    } else {
      setStep(step + 1);
    }
  };

  const goBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const options = [
    { value: "no", label: "No" },
    { value: "yes", label: "Yes" },
    {
      value: "na",
      label: getCopy("checkin.answer.na", copyCtx),
      icon: "eyeOff",
    },
  ];

  return (
    <ScreenLayout
      footer={
        <button type="button" className="checkin-exit" onClick={onCancel}>
          {getCopy("checkin.exit", copyCtx)}
        </button>
      }
    >
      <div className="checkin">
        <header className="checkin-top">
          <div className="checkin-top__leading">
            {step > 0 ? (
              <button
                type="button"
                className="checkin-back"
                onClick={goBack}
                aria-label="Previous question"
              >
                <AppIcon name="chevronLeft" className="checkin-back__icon" alt="" />
              </button>
            ) : (
              <span className="checkin-back checkin-back--spacer" aria-hidden="true" />
            )}
            <p className="checkin-top__context">
              {getCopy("checkin.header", copyCtx)}
            </p>
          </div>
          <p className="checkin-top__count" aria-hidden="true">
            {step + 1} of {total}
          </p>
        </header>

        <div
          className="checkin-progress"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={total}
          aria-valuenow={step + 1}
          aria-label={`Question ${step + 1} of ${total}`}
        >
          <div
            className="checkin-progress__fill"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <h1 className="checkin-question">{questionLabel}</h1>
        {question.examples && (
          <p className="checkin-examples">{question.examples}</p>
        )}
        <p className="checkin-baseline">
          {getCopy("checkin.baseline", copyCtx)}
        </p>

        <div className="checkin-options" role="group" aria-label="Answer">
          {options.map((opt) => {
            const selected = answers[question.id] === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                className={`checkin-option ${
                  selected ? "checkin-option--selected" : ""
                }`}
                aria-pressed={selected}
                onClick={() => setAnswer(opt.value)}
              >
                {opt.icon && (
                  <AppIcon name={opt.icon} className="checkin-option__icon" />
                )}
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </ScreenLayout>
  );
}

function formatRecipientNames(names = []) {
  if (!names.length) return "";
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
}

function buildCheckInRecap(answers = {}) {
  const items = [];
  Object.keys(answers).forEach((id) => {
    const label = CHECKIN_SHORT_LABELS[id];
    if (!label) return;
    if (answers[id] === "yes") {
      items.push({ id, label, tone: "concern" });
    } else if (answers[id] === "na") {
      items.push({
        id,
        label: `${label}: didn't see today`,
        tone: "unseen",
      });
    }
  });
  return items;
}

function CheckInComplete({
  role,
  patientName,
  outcome = "clear",
  flaggedIds = [],
  answers = {},
  hasRecipients = false,
  recipientNames = [],
  onHome,
  onSuddenChange,
  onEdit,
}) {
  const isCaregiver = role === "caregiver";
  const name = patientName || (isCaregiver ? "your loved one" : "");
  const namesLabel = formatRecipientNames(recipientNames);
  const moodOnly =
    outcome === "flagged" &&
    flaggedIds.length > 0 &&
    flaggedIds.every((id) => id === "mood");
  const variant = moodOnly
    ? "mood"
    : outcome === "flagged"
    ? "flagged"
    : outcome === "partial"
    ? "partial"
    : "clear";

  const concernCount = flaggedIds.length;
  const recap = buildCheckInRecap(answers);

  let title;
  if (variant === "flagged") {
    if (concernCount === 1) {
      title = isCaregiver
        ? `1 concern noted for ${name} today`
        : "1 concern noted today";
    } else {
      title = isCaregiver
        ? `${concernCount} concerns noted for ${name} today`
        : `${concernCount} concerns noted today`;
    }
  } else if (variant === "partial") {
    title = isCaregiver
      ? `Partly logged for ${name}`
      : "Check-in saved — partly logged";
  } else if (variant === "mood") {
    title = isCaregiver
      ? `Noted ${name}'s mood`
      : "Thanks — noted how you're feeling";
  } else {
    title = isCaregiver ? `All clear for ${name} today` : "All clear for today";
  }

  const chip =
    variant === "flagged" || variant === "mood"
      ? { label: "Watch", tone: "watch" }
      : variant === "partial"
      ? { label: "Partial", tone: "partial" }
      : { label: "Stable", tone: "stable" };

  const showEscalate = variant === "flagged" || variant === "mood";
  const escalateSub = hasRecipients
    ? `Report a sudden change to alert ${namesLabel}`
    : "Report a sudden change";
  const notePrefix = isCaregiver
    ? `Saved to ${name}'s timeline.`
    : "Saved to your timeline.";

  return (
    <div className="screen cc-screen">
      <div className="screen__scroll cc-scroll">
        <div className="cc-confirm">
          <AppIcon name="circleCheck" className="cc-confirm__icon" alt="" />
          <span>Check-in saved</span>
        </div>

        <h1 className="cc-title">{title}</h1>

        <div className={`cc-chip cc-chip--${chip.tone}`}>
          {chip.tone === "watch" && (
            <span className="cc-chip__bang" aria-hidden="true">
              !
            </span>
          )}
          {chip.tone === "stable" && (
            <span className="cc-chip__check" aria-hidden="true">
              ✓
            </span>
          )}
          {chip.label}
        </div>

        {recap.length > 0 && (
          <div className="cc-recap">
            <ul className="cc-recap__list">
              {recap.map((item) => (
                <li
                  key={item.id}
                  className={`cc-recap__item cc-recap__item--${item.tone}`}
                >
                  <span className="cc-recap__dot" aria-hidden="true" />
                  <span className="cc-recap__label">{item.label}</span>
                </li>
              ))}
            </ul>
            {onEdit && (
              <button type="button" className="cc-edit" onClick={onEdit}>
                Edit answers
              </button>
            )}
          </div>
        )}

        {variant !== "clear" && (
          <p className="cc-note">
            <AppIcon name="info" className="cc-note__icon" alt="" />
            <span>
              {notePrefix}{" "}
              <strong>No one has been alerted.</strong>
            </span>
          </p>
        )}

        {showEscalate && (
          <button
            type="button"
            className="home-row home-row--danger cc-escalate"
            onClick={onSuddenChange}
          >
            <AppIcon name="alertDanger" className="home-row__icon" alt="" />
            <span className="home-row__text">
              <span className="home-row__title">Getting worse fast?</span>
              <span className="home-row__sub cc-escalate__sub">{escalateSub}</span>
            </span>
            <AppIcon
              name="chevronRightDanger"
              className="home-row__chevron"
              alt=""
            />
          </button>
        )}
      </div>

      <div className="sticky-footer">
        <Button block size="lg" variant="outline" onClick={onHome}>
          Done
        </Button>
      </div>
    </div>
  );
}

function SelectOption({ label, selected, onClick }) {
  return (
    <button
      type="button"
      className={`select-option ${selected ? "select-option--selected" : ""}`}
      aria-pressed={selected}
      onClick={onClick}
    >
      <span className="select-option__indicator" aria-hidden="true">
        {selected && <span className="select-option__indicator-check" />}
      </span>
      <span className="select-option__label">{label}</span>
    </button>
  );
}


function SuddenChangeFlow({
  role,
  patientName,
  hasRecipients,
  recipientNames = [],
  initialSymptoms = [],
  onSend,
  onCancel,
}) {
  const [symptoms, setSymptoms] = useState(initialSymptoms);
  const [note, setNote] = useState("");
  const [noteOpen, setNoteOpen] = useState(false);
  const namesLabel = formatRecipientNames(recipientNames);
  const copyCtx = { role, patientName, names: namesLabel };

  const toggle = (id) => {
    setSymptoms((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  // Clinical triggers are illustrative for the prototype; a real product would
  // define alert symptoms with clinicians.
  const options = [
    { id: "confusion", label: "Sudden confusion", severity: "watch" },
    { id: "hallucination", label: "New hallucinations", severity: "watch" },
    { id: "mobility", label: "Can't walk or much weaker", severity: "alert" },
    { id: "fall", label: "Fall or injury", severity: "alert" },
    { id: "fever", label: "Fever", severity: "watch" },
    { id: "other", label: "Something else", severity: "watch" },
  ];

  const redIds = options.filter((o) => o.severity === "alert").map((o) => o.id);
  const isEmergency = symptoms.some((s) => redIds.includes(s));
  const severity =
    symptoms.length === 0 ? null : isEmergency ? "alert" : "watch";

  const ctaLabel = hasRecipients
    ? getCopy("suddenChange.cta", copyCtx)
    : getCopy("suddenChange.cta.none", copyCtx);

  const logButton = (
    <Button
      block
      size="lg"
      variant={isEmergency ? "secondary" : "primary"}
      className={isEmergency ? "sc-log-secondary" : ""}
      disabled={symptoms.length === 0}
      onClick={() => onSend({ symptoms, note, severity: severity || "watch" })}
    >
      {ctaLabel}
    </Button>
  );

  return (
    <div className="screen sc-screen">
      <header className="sc-header">
        <div className="sc-header__text">
          <h1 className="sc-title">{getCopy("suddenChange.title", copyCtx)}</h1>
          <p className="sc-support">{getCopy("suddenChange.support", copyCtx)}</p>
        </div>
        <button
          type="button"
          className="sc-close"
          onClick={onCancel}
          aria-label="Close"
        >
          <AppIcon name="close" className="sc-close__icon" alt="" />
        </button>
      </header>

      <div className="screen__scroll sc-scroll">
        <div className="sc-list" role="group" aria-label="Symptoms">
          {options.map((opt, i) => {
            const selected = symptoms.includes(opt.id);
            return (
              <button
                key={opt.id}
                type="button"
                className={`sc-row${selected ? " sc-row--selected" : ""}${
                  i === options.length - 1 ? " sc-row--last" : ""
                }`}
                onClick={() => toggle(opt.id)}
                aria-pressed={selected}
              >
                <span
                  className={`sc-check${selected ? " sc-check--on" : ""}`}
                  aria-hidden="true"
                >
                  {selected && (
                    <AppIcon
                      name="checkWhite"
                      className="sc-check__icon"
                      alt=""
                    />
                  )}
                </span>
                <span className="sc-row__label">{opt.label}</span>
              </button>
            );
          })}
        </div>

        {!noteOpen ? (
          <button
            type="button"
            className="sc-add-note"
            onClick={() => setNoteOpen(true)}
          >
            <AppIcon name="plus" className="sc-add-note__icon" alt="" />
            {getCopy("suddenChange.addNote", copyCtx)}
          </button>
        ) : (
          <label className="sc-note">
            <span className="visually-hidden">
              {getCopy("suddenChange.addNote", copyCtx)}
            </span>
            <textarea
              className="sc-note__input"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={getCopy("suddenChange.notePlaceholder", copyCtx)}
              rows={3}
              autoFocus
            />
          </label>
        )}
      </div>

      <div className="sticky-footer sc-footer">
        {isEmergency && (
          <div className="sc-emergency" role="alert">
            <div className="sc-emergency__header">
              <AppIcon
                name="alertTriangle"
                className="sc-emergency__icon"
                alt=""
              />
              <div>
                <div className="sc-emergency__title">
                  {getCopy("triage.alert.title", copyCtx)}
                </div>
                <p className="sc-emergency__body">
                  {getCopy("suddenChange.emergency.body", copyCtx)}
                </p>
              </div>
            </div>
            <a
              className="btn btn--danger btn--block btn--lg sc-emergency__cta"
              href="tel:911"
            >
              <AppIcon name="phone" className="sc-emergency__phone" alt="" />
              {getCopy("alertSent.call911", copyCtx)}
            </a>
          </div>
        )}

        {logButton}

        <p className="sc-disclaimer">
          {getCopy("suddenChange.disclaimer", copyCtx)}
        </p>
      </div>
    </div>
  );
}


function AlertSent({ role, patientName, recipientNames, severity, onHome, onOpenHospitalCard }) {
  const copyCtx = { role, patientName };
  const notified = recipientNames.length > 0;
  const isEmergency = severity === "alert";
  const namesLabel = notified ? formatRecipientNames(recipientNames) : "";
  const confirmTitle = notified
    ? getCopy("alertSent.confirm.title", { ...copyCtx, names: namesLabel })
    : getCopy("alertSent.none.confirm.title", copyCtx);
  const confirmBody = notified
    ? getCopy("alertSent.confirm.body", copyCtx)
    : getCopy("alertSent.none.confirm.body", copyCtx);

  return (
    <ScreenLayout
      footer={
        <button type="button" className="alert-done" onClick={onHome}>
          Done
        </button>
      }
    >
      <div className="alert-sent">
        <h1 className="visually-hidden">
          {isEmergency ? "Emergency next steps" : "Alert sent"}
        </h1>

        {/* 1. What to do right now */}
        {isEmergency ? (
          <section className="alert-emergency" aria-labelledby="alert-emergency-title">
            <div className="alert-emergency__header">
              <AppIcon name="alertTriangle" className="alert-emergency__icon" />
              <div>
                <h2 id="alert-emergency-title" className="alert-emergency__title">
                  {getCopy("alertSent.emergency.title", copyCtx)}
                </h2>
                <p className="alert-emergency__body">
                  {getCopy("alertSent.emergency.body", copyCtx)}
                </p>
              </div>
            </div>
            <a className="btn btn--danger btn--block btn--lg alert-emergency__cta" href="tel:911">
              <AppIcon name="phone" className="alert-emergency__cta-icon" />
              {getCopy("alertSent.call911", copyCtx)}
            </a>
          </section>
        ) : (
          <section className="alert-watch" aria-labelledby="alert-watch-title" role="status">
            <h2 id="alert-watch-title" className="alert-watch__title">
              {getCopy("alertSent.watch.title", copyCtx)}
            </h2>
            <p className="alert-watch__body">
              {getCopy("alertSent.watch.body", copyCtx)}
            </p>
          </section>
        )}

        {/* 2. What to bring / remember */}
        <section className="alert-before" aria-labelledby="alert-before-title">
          <h2 id="alert-before-title" className="form-section__title">
            {getCopy("alertSent.beforeGo", copyCtx)}
          </h2>
          <div className="alert-rows">
            <button
              type="button"
              className="alert-row alert-row--action"
              onClick={onOpenHospitalCard}
            >
              <AppIcon name="id" className="alert-row__icon" />
              <span className="alert-row__text">
                <span className="alert-row__title">
                  {getCopy("alertSent.hospitalCard.title", copyCtx)}
                </span>
                <span className="alert-row__sub">
                  {getCopy("alertSent.hospitalCard.sub", copyCtx)}
                </span>
              </span>
              <AppIcon name="chevronRight" className="alert-row__chevron" />
            </button>
            <div className="alert-row">
              <AppIcon name="pill" className="alert-row__icon" />
              <span className="alert-row__text">
                <span className="alert-row__title">
                  {getCopy("alertSent.levodopa.title", copyCtx)}
                </span>
                <span className="alert-row__sub">
                  {getCopy("alertSent.levodopa.sub", copyCtx)}
                </span>
              </span>
            </div>
          </div>
        </section>

        {/* 3. What already happened — quiet confirmation */}
        <section
          className={`alert-confirm ${notified ? "" : "alert-confirm--muted"}`}
          aria-label={confirmTitle}
        >
          <div className="alert-confirm__line">
            {notified && (
              <span className="alert-confirm__badge" aria-hidden="true">
                <AppIcon name="circleCheck" className="alert-confirm__check" />
              </span>
            )}
            <p className="alert-confirm__title">{confirmTitle}</p>
          </div>
          <p className="alert-confirm__body">{confirmBody}</p>
        </section>
      </div>
    </ScreenLayout>
  );
}

function timelineNodeStatus(entry) {
  if (!entry) return "missed";
  if (entry.type === "missed" || entry.status === "missed") return "missed";
  if (entry.status === "alert") return "alert";
  if (entry.status === "watch" || entry.status === "flagged") return "watch";
  if (entry.status === "partial") return "partial";
  return "good";
}

function formatTimelineMeta(entry) {
  const parts = [];
  if (entry.month && entry.day != null) {
    parts.push(`${entry.month} ${entry.day}`);
  }
  if (entry.time) parts.push(entry.time);
  return parts.join(" · ");
}

function TimelineSymptomChips({ chips }) {
  if (!chips || !chips.length) return null;
  return (
    <div className="tl-chips" role="list">
      {chips.map((chip, i) => (
        <span
          key={`${chip.label}-${i}`}
          role="listitem"
          className={`tl-chip tl-chip--${chip.tone || "neutral"}`}
        >
          {chip.label}
        </span>
      ))}
    </div>
  );
}

function TimelineEntryRow({ entry, isLast }) {
  const node = timelineNodeStatus(entry);
  const isAlert = node === "alert";
  const isMissed = node === "missed";
  const meta = formatTimelineMeta(entry);
  const outcome = entry.outcome || (
    Array.isArray(entry.notified) && entry.notified.length
      ? `Alert sent to ${entry.notified.join(", ")}`
      : null
  );

  return (
    <article
      className={`tl-entry tl-entry--${node}${isLast ? " tl-entry--last" : ""}`}
    >
      <div className="tl-entry__rail" aria-hidden="true">
        <span className={`tl-entry__node tl-entry__node--${node}`} />
      </div>
      <div className="tl-entry__body">
        {(meta || outcome) && (
          <div className="tl-entry__meta">
            {meta && <span className="tl-entry__when">{meta}</span>}
            {outcome && (
              <span className="tl-entry__outcome">{outcome}</span>
            )}
          </div>
        )}
        <h2
          className={`tl-entry__title${
            isAlert ? " tl-entry__title--alert" : ""
          }${isMissed ? " tl-entry__title--missed" : ""}`}
        >
          {entry.title}
        </h2>
        <TimelineSymptomChips chips={entry.chips} />
      </div>
    </article>
  );
}

function TimelineScreen({ entries, sampleData, patientName }) {
  const displayEntries = getTimelineDisplayEntries(entries, sampleData);
  const usingSample = sampleData && entries.length === 0;
  const pattern = getTimelinePatternSummary(entries, sampleData);
  const rangeLabel = getTimelineRangeLabel(displayEntries, {
    sampleWeek: usingSample,
  });
  const weekTitle = patientName ? `${patientName}'s week` : "This week";

  const handleShare = () => {
    const summary =
      pattern ||
      displayEntries
        .slice(0, 4)
        .map((e) => `${e.month} ${e.day}: ${e.title}`)
        .join("\n");
    const payload = {
      title: weekTitle,
      text: summary,
    };
    if (navigator.share) {
      navigator.share(payload).catch(() => {});
    } else if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(`${weekTitle}\n${summary}`).catch(() => {});
    }
  };

  const shareButton = (
    <button type="button" className="tl-share" onClick={handleShare}>
      <AppIcon name="share" className="tl-share__icon" alt="" />
      Share
    </button>
  );

  if (!sampleData && entries.length === 0) {
    return (
      <ScreenLayout
        title={weekTitle}
        subtitle="Last 7 days"
        titleClassName="timeline-title"
        subtitleClassName="timeline-range"
        headerAction={shareButton}
      >
        <div className="empty-state">
          <div className="empty-state__title">No entries yet</div>
          <p style={{ textWrap: "pretty" }}>
            Complete a daily check-in to start building a timeline you can share
            with doctors.
          </p>
        </div>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout
      title={weekTitle}
      subtitle={rangeLabel}
      titleClassName="timeline-title"
      subtitleClassName="timeline-range"
      headerAction={shareButton}
    >
      <div className="timeline">
        {pattern && (
          <div className="tl-pattern" role="status">
            <AppIcon name="trendingUp" className="tl-pattern__icon" alt="" />
            <p className="tl-pattern__text">{pattern}</p>
          </div>
        )}

        {usingSample && (
          <p className="tl-sample-note">
            <span className="placeholder-badge">Sample data</span>
          </p>
        )}

        <div className="tl-list">
          {displayEntries.map((entry, i) => (
            <TimelineEntryRow
              key={`${entry.month}-${entry.day}-${entry.type}-${i}`}
              entry={entry}
              isLast={i === displayEntries.length - 1}
            />
          ))}
        </div>
      </div>
    </ScreenLayout>
  );
}

function HospitalCardScreen({ card, setCard, timelineEntries = [], onExport, onBack }) {
  const suggestions = getIncidentSuggestionsFromTimeline(timelineEntries);

  const addSuggestionsFromTimeline = () => {
    const existing = (card.recentIncidents || "")
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    const merged = [...existing];
    suggestions.forEach((s) => {
      if (!merged.includes(s)) merged.push(s);
    });
    setCard({ ...card, recentIncidents: merged.join("\n") });
  };

  return (
    <ScreenLayout
      title="Hospital card"
      scrollClass="screen__scroll--fade"
      footer={
        <div className="stack stack--tight">
          <Button block size="lg" onClick={onExport}>
            Preview PDF export
          </Button>
          <Button block variant="ghost" onClick={onBack}>
            Back
          </Button>
        </div>
      }
    >
      <div className="form-section">
        <h2 className="form-section__title">Patient</h2>
        <Field label="Diagnosis" hint="Shown first for ER staff">
          <input
            className="field__input"
            value={card.diagnosis || ""}
            onChange={(e) => setCard({ ...card, diagnosis: e.target.value })}
          />
        </Field>
        <Field label="Patient name">
          <input
            className="field__input"
            value={card.patientName}
            onChange={(e) => setCard({ ...card, patientName: e.target.value })}
          />
        </Field>
        <Field label="Date of birth">
          <input
            className="field__input"
            value={card.dob || ""}
            onChange={(e) => setCard({ ...card, dob: e.target.value })}
          />
        </Field>
      </div>

      <div className="form-section">
        <h2 className="form-section__title">Care team & contacts</h2>
        <Field label="Movement disorder neurologist">
          <input
            className="field__input"
            value={card.neurologist}
            onChange={(e) => setCard({ ...card, neurologist: e.target.value })}
          />
        </Field>
        <Field label="Neurologist phone">
          <input
            className="field__input"
            value={card.neurologistPhone}
            onChange={(e) =>
              setCard({ ...card, neurologistPhone: e.target.value })
            }
          />
        </Field>
        <Field label="Primary care provider (PCP)">
          <input
            className="field__input"
            value={card.pcp || ""}
            onChange={(e) => setCard({ ...card, pcp: e.target.value })}
          />
        </Field>
        <Field label="PCP phone">
          <input
            className="field__input"
            value={card.pcpPhone || ""}
            onChange={(e) => setCard({ ...card, pcpPhone: e.target.value })}
          />
        </Field>
        <Field label="Emergency contact" hint="Who ER staff should call">
          <input
            className="field__input"
            value={card.emergencyContact || ""}
            onChange={(e) =>
              setCard({ ...card, emergencyContact: e.target.value })
            }
          />
        </Field>
      </div>

      <div className="form-section">
        <h2 className="form-section__title">Medications & allergies</h2>
        <Field label="Medications" hint="Include timing — critical for PD">
          <textarea
            className="field__textarea"
            value={card.medications.join("\n")}
            onChange={(e) =>
              setCard({ ...card, medications: e.target.value.split("\n") })
            }
            rows={5}
          />
        </Field>
        <Field label="Allergies">
          <input
            className="field__input"
            value={card.allergies}
            onChange={(e) => setCard({ ...card, allergies: e.target.value })}
          />
        </Field>
      </div>

      <div className="form-section">
        <h2 className="form-section__title">Recent falls / incidents</h2>
        <Field label="Date + what happened" hint="Last 30 days">
          <textarea
            className="field__textarea"
            value={card.recentIncidents || ""}
            onChange={(e) =>
              setCard({ ...card, recentIncidents: e.target.value })
            }
            rows={3}
          />
        </Field>
        {suggestions.length > 0 && (
          <button
            type="button"
            className="text-link"
            style={{ marginTop: "calc(-1 * var(--space-3))" }}
            onClick={addSuggestionsFromTimeline}
          >
            Add {suggestions.length} from timeline
          </button>
        )}
      </div>

      <div className="form-section">
        <h2 className="form-section__title">Notes for hospital staff</h2>
        <Field label="Emergency notes">
          <textarea
            className="field__textarea"
            value={card.notes}
            onChange={(e) => setCard({ ...card, notes: e.target.value })}
            rows={3}
          />
        </Field>
      </div>
    </ScreenLayout>
  );
}

function HospitalCardExport({ card, onBack, onDone }) {
  return (
    <ScreenLayout
      title="Export preview"
      footer={
        <div className="stack stack--tight">
          <Button block size="lg" onClick={onDone}>
            Download PDF
          </Button>
          <Button block variant="ghost" onClick={onBack}>
            Edit card
          </Button>
        </div>
      }
    >
      <div className="pdf-preview">
        <div className="pdf-preview__header">
          <div className="pdf-preview__title">Parkinson's Hospital Safety Card</div>
          <div style={{ fontSize: 12, color: "#5a6b73", marginTop: 4 }}>
            ClearSignal · {new Date().toLocaleDateString()}
          </div>
        </div>

        <div className="pdf-preview__section">
          <div className="pdf-preview__section-title">Patient</div>
          <div>
            <strong>{card.patientName}</strong> — {card.diagnosis}
          </div>
          {card.dob && <div>DOB: {card.dob}</div>}
        </div>

        <div className="pdf-preview__section">
          <div className="pdf-preview__section-title">Movement disorder specialist</div>
          <div>{card.neurologist}</div>
          <div>{card.neurologistPhone}</div>
        </div>

        {(card.pcp || card.pcpPhone) && (
          <div className="pdf-preview__section">
            <div className="pdf-preview__section-title">Primary care provider</div>
            {card.pcp && <div>{card.pcp}</div>}
            {card.pcpPhone && <div>{card.pcpPhone}</div>}
          </div>
        )}

        {card.emergencyContact && (
          <div className="pdf-preview__section">
            <div className="pdf-preview__section-title">Emergency contact</div>
            <div>{card.emergencyContact}</div>
          </div>
        )}

        <div className="pdf-preview__section">
          <div className="pdf-preview__section-title">Medications</div>
          {card.medications.map((med, i) => (
            <div key={i} style={{ marginBottom: 4 }}>
              {med}
            </div>
          ))}
        </div>

        <div className="pdf-preview__section">
          <div className="pdf-preview__section-title">Allergies</div>
          <div>{card.allergies}</div>
        </div>

        {card.recentIncidents && card.recentIncidents.trim() && (
          <div className="pdf-preview__section">
            <div className="pdf-preview__section-title">
              Recent falls / incidents
            </div>
            {card.recentIncidents
              .split("\n")
              .filter((line) => line.trim())
              .map((line, i) => (
                <div key={i} style={{ marginBottom: 4 }}>
                  {line}
                </div>
              ))}
          </div>
        )}

        <div className="pdf-preview__section">
          <div className="pdf-preview__section-title">Notes for hospital staff</div>
          <div>{card.notes}</div>
        </div>

        <div className="pdf-preview__warning">
          <strong>Important:</strong> Do not hold carbidopa/levodopa without
          neurologist approval. Sudden worsening may indicate infection (UTI).
        </div>
      </div>
    </ScreenLayout>
  );
}

Object.assign(window, {
  CHECKIN_QUESTIONS,
  CHECKIN_SHORT_LABELS,
  TRIAGE_STEPS,
  DEFAULT_HOSPITAL_CARD,
  getIncidentSuggestionsFromTimeline,
  getSuddenSymptomsFromCheckin,
  OnboardingSplash,
  OnboardingWelcome,
  PrivacyScreen,
  OnboardingChrome,
  OnboardingRole,
  OnboardingSetup,
  HomeStatusCard,
  HomeActionRow,
  HomeScreen,
  CheckInFlow,
  CheckInComplete,
  SuddenChangeFlow,
  AlertSent,
  TimelineScreen,
  HospitalCardScreen,
  HospitalCardExport,
});
