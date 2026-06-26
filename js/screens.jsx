const { useState, useEffect } = React;

const CHECKIN_QUESTIONS = [
  {
    id: "confusion",
    hint: "Trouble following conversation, disoriented, repeating questions",
  },
  {
    id: "hallucinations",
    hint: "New or worse since yesterday",
  },
  {
    id: "falls",
  },
  {
    id: "urine",
    hint: "Cloudy, strong smell, burning, or new incontinence",
  },
  {
    id: "fever",
  },
  {
    id: "eating",
  },
  {
    id: "mood",
    hint: "More withdrawn, low, or tearful than usual",
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
    "Jun 10 — Near-fall in bathroom, no injury\nMay 28 — Fall from bed, bruised left hip",
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

function RoleCard({ title, description, selected, onClick }) {
  return (
    <button
      type="button"
      className={`role-card ${selected ? "role-card--selected" : ""}`}
      onClick={onClick}
      aria-pressed={selected}
    >
      <span className="role-card__indicator" aria-hidden="true">
        {selected && <span className="role-card__indicator-dot" />}
      </span>
      <span className="role-card__content">
        <span className="role-card__title">{title}</span>
        <span className="role-card__description">{description}</span>
      </span>
    </button>
  );
}

function OnboardingWelcome({ onNext, onErMode, onPrivacy }) {
  return (
    <div className="screen welcome-screen">
      <div className="welcome-screen__main">
        <div className="welcome-screen__hero">
          <AppIcon name="logo" className="welcome-screen__logo" alt="ClearSignal" />
          <p className="welcome-screen__tagline">
            For caregivers and care teams supporting someone with Parkinson's —
            spot sudden changes early.
          </p>
        </div>
      </div>

      <div className="welcome-screen__footer">
        <div className="welcome-screen__actions">
          <Button block className="btn--welcome" onClick={onNext}>
            Get Started
          </Button>
          <button type="button" className="text-link" onClick={onErMode}>
            In a crisis right now? Access ER Mode.
          </button>
        </div>
        <p className="welcome-screen__disclaimer">
          Not a medical device. For logging and care coordination only.
        </p>
        <button type="button" className="text-link" onClick={onPrivacy}>
          Privacy &amp; your data
        </button>
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

// Role-neutral education shown before the get-started welcome. One card per
// step with progress dots; fully skippable.
const INTRO_CARDS = [
  {
    icon: "question",
    image: "icons/Dashboard.png",
    imageAlt: "ClearSignal home dashboard",
    title: "What ClearSignal helps you do",
    body: "ClearSignal helps you and your care circle notice sudden changes early, keep a simple record, and know what to do when something feels off.",
  },
  {
    icon: "check",
    image: "icons/Check-ins.png",
    imageAlt: "A daily check-in question",
    title: "A minute a day builds the bigger picture",
    body: "A few simple questions about confusion, falls, appetite, mood, and more. Done daily, they reveal your loved one's baseline, so a real change stands out instead of being missed.",
  },
  {
    icon: "alert",
    image: "icons/Hospital card 2.png",
    imageAlt: "The hospital card export",
    title: "When it's urgent, you're not alone",
    body: "If something changes suddenly, one tap logs it and texts the contacts you choose. ClearSignal also guides you on what to do next and keeps a hospital card ready.",
  },
];

function OnboardingIntro({ onDone, onSkip }) {
  const [step, setStep] = useState(0);
  const card = INTRO_CARDS[step];
  const isLast = step === INTRO_CARDS.length - 1;
  const isLogo = card.icon === "logo";

  const next = () => (isLast ? onDone() : setStep((s) => s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));

  return (
    <div className="screen intro-screen">
      <div className="intro-screen__top">
        <button type="button" className="text-link" onClick={onSkip}>
          Skip
        </button>
      </div>

      <div className="intro-screen__body">
        <div className="intro-card" key={step}>
          <AppIcon
            name={card.icon}
            className={isLogo ? "intro-card__logo" : "intro-card__icon"}
            alt={isLogo ? "ClearSignal" : ""}
          />
          <h1 className="intro-card__title">{card.title}</h1>
          <p className="intro-card__body">{card.body}</p>
          <img
            src={card.image}
            alt={card.imageAlt}
            className="intro-card__mockup"
          />
        </div>
      </div>

      <div className="intro-screen__footer">
        <ProgressDots total={INTRO_CARDS.length} current={step} />
        <div className="stack stack--tight">
          <Button block size="lg" onClick={next}>
            {isLast ? "Continue" : "Next"}
          </Button>
          {step > 0 && (
            <Button block variant="ghost" onClick={back}>
              Back
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function OnboardingRole({ role, setRole, onNext, onBack }) {
  return (
    <ScreenLayout
      title="Who are you setting this up for?"
      subtitle="Choose the option that fits you best."
      footer={
        <div className="stack stack--tight">
          <Button block size="lg" disabled={!role} onClick={onNext}>
            Continue
          </Button>
          <Button block variant="ghost" onClick={onBack}>
            Back
          </Button>
        </div>
      }
    >
      <div className="stack">
        <RoleCard
          title="I'm a caregiver or care staff"
          description="Log daily check-ins for a loved one, watch trends, and alert your care circle when something changes."
          selected={role === "caregiver"}
          onClick={() => setRole("caregiver")}
        />
        <RoleCard
          title="I'm living with Parkinson's"
          description="Track your own daily check-ins and send a quick alert when something feels off."
          selected={role === "patient"}
          onClick={() => setRole("patient")}
        />
      </div>
    </ScreenLayout>
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
    <ScreenLayout
      title="Quick setup"
      subtitle="Takes about a minute. Everything is editable later."
      footer={
        <div className="stack stack--tight">
          <Button
            block
            size="lg"
            disabled={!canFinish}
            onClick={handleFinish}
          >
            Finish setup
          </Button>
          <Button block variant="ghost" onClick={onBack}>
            Back
          </Button>
        </div>
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
    </ScreenLayout>
  );
}

function TimelineSummary({ entries, onViewAll, showLink = true }) {
  const display = entries.slice(0, 3);

  if (display.length === 0) {
    return (
      <p className="timeline-summary__empty">
        No recent entries yet. Complete a check-in to start tracking.
      </p>
    );
  }

  return (
    <div className="timeline-summary">
      {display.map((entry, i) => (
        <div key={i} className="timeline-summary__row">
          <span className="timeline-summary__date">
            {entry.month} {entry.day}
          </span>
          <span className="timeline-summary__title">{entry.title}</span>
          <Chip variant={entry.status}>
            {entry.status === "good"
              ? "Stable"
              : entry.status === "watch"
              ? "Watch"
              : entry.status === "partial"
              ? "Partial"
              : "Alert"}
          </Chip>
        </div>
      ))}
      {showLink && (
        <button type="button" className="timeline-summary__link" onClick={onViewAll}>
          View full timeline
        </button>
      )}
    </div>
  );
}

function StatusSummaryCard({
  patientName,
  lastCheckIn,
  timelineEntries,
  sampleData,
  onViewTimeline,
  onCheckIn,
  checkInActionLabel = "Log now",
}) {
  const checkedInToday = lastCheckIn?.date === new Date().toDateString();
  const displayEntries = getTimelineDisplayEntries(timelineEntries, sampleData);
  const summaryOutcome = normalizeOutcome(lastCheckIn);
  const summaryChip = outcomeChip(summaryOutcome);

  const body = (
    <>
      <div className="status-summary__header">
        <div>
          <div className="status-summary__label">Today&apos;s check-in</div>
          <div className="status-summary__value">
            {checkedInToday
              ? summaryOutcome === "flagged"
                ? "Done · some concerns"
                : summaryOutcome === "partial"
                ? "Done · partly logged"
                : "Done · no major concerns"
              : "Not completed yet"}
          </div>
        </div>
        {checkedInToday ? (
          <Chip variant={summaryChip.variant}>{summaryChip.label}</Chip>
        ) : (
          onCheckIn && (
            <button
              type="button"
              className="status-summary__cta"
              onClick={onCheckIn}
            >
              {checkInActionLabel}
            </button>
          )
        )}
      </div>
      <div className="status-summary__divider" />
      <div className="status-summary__label">Recent activity · {patientName}</div>
      <TimelineSummary
        entries={displayEntries}
        onViewAll={onViewTimeline}
        showLink={checkedInToday}
      />
      {!checkedInToday && (
        <button
          type="button"
          className="timeline-summary__link"
          onClick={onViewTimeline}
        >
          View timeline
        </button>
      )}
    </>
  );

  if (checkedInToday) {
    return (
      <button
        type="button"
        className="card card--interactive status-summary"
        onClick={onViewTimeline}
      >
        {body}
      </button>
    );
  }

  return <div className="card status-summary">{body}</div>;
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
  const checkedInToday = lastCheckIn?.date === new Date().toDateString();
  const homeOutcome = normalizeOutcome(lastCheckIn);
  const homeChip = outcomeChip(homeOutcome);

  const patientCheckInCard = checkedInToday ? (
    <div className="card card--with-icon">
      <AppIcon name="check" className="app-icon--sm" />
      <div
        className="card__body"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div>
          <div style={{ fontWeight: 600, color: "var(--text)" }}>
            Today&apos;s check-in done
          </div>
          <div style={{ fontSize: "var(--text-sm)", color: "var(--text-brand)" }}>
            {homeOutcome === "flagged"
              ? "Some concerns noted"
              : homeOutcome === "partial"
              ? "Some items not observed"
              : "No major concerns"}
          </div>
        </div>
        <Chip variant={homeChip.variant}>{homeChip.label}</Chip>
      </div>
    </div>
  ) : (
    <DashboardActionCard
      icon="check"
      title="Daily check-in"
      subtitle="About 60 seconds · 7 questions"
      actionLabel="Check in"
      onClick={onCheckIn}
      titleEmphasis
    />
  );

  const suddenChangeCard = (
    <DashboardActionCard
      icon="alert"
      title="Something changed suddenly"
      subtitle={getCopy(
        hasRecipients
          ? "home.suddenChange.subtitle"
          : "home.suddenChange.subtitle.none",
        copyCtx
      )}
      actionLabel="Log now"
      onClick={onSuddenChange}
      variant="danger"
      titleEmphasis
    />
  );

  const hospitalCard = (
    <DashboardActionCard
      icon="card"
      title="Hospital card"
      subtitle="Meds, neurologist, emergency notes — ready to export"
      actionLabel={role === "caregiver" ? "Edit and export" : "View and export"}
      onClick={onHospitalCard}
    />
  );

  const timelineCard = (
    <DashboardActionCard
      icon="trend"
      title="7-day timeline"
      subtitle="Spot patterns before your next visit"
      actionLabel="View"
      onClick={onViewTimeline}
    />
  );

  const timelineSecondary = (
    <DashboardActionCard
      icon="trend"
      title="7-day history"
      subtitle="Review past check-ins and alerts"
      actionLabel="View"
      onClick={onViewTimeline}
      secondary
    />
  );

  const caregiverTip = (
    <div className="tip-card">
      <AppIcon name="bulb" className="tip-card__icon" alt="" />
      <div className="tip-card__body">
        <div className="tip-card__title">Caregiver tip</div>
        <p className="tip-card__text">
          Sudden confusion or hallucinations often mean infection — not
          Parkinson&apos;s getting worse. Keep UTI test strips handy.
        </p>
      </div>
    </div>
  );

  return (
    <ScreenLayout
      title={getCopy("home.title", copyCtx)}
      subtitle={today}
    >
      <div className="stack">
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

        {role === "caregiver" ? (
          <>
            <StatusSummaryCard
              patientName={patientName}
              lastCheckIn={lastCheckIn}
              timelineEntries={timelineEntries}
              sampleData={sampleData}
              onViewTimeline={onViewTimeline}
              onCheckIn={onCheckIn}
              checkInActionLabel={getCopy("home.checkin.action", copyCtx)}
            />
            {suddenChangeCard}
            {timelineCard}
            {hospitalCard}
            {caregiverTip}
          </>
        ) : (
          <>
            {patientCheckInCard}
            {suddenChangeCard}
            {hospitalCard}
            <div className="divider" />
            {timelineSecondary}
          </>
        )}
      </div>
    </ScreenLayout>
  );
}

function CheckInFlow({ role, patientName, onComplete, onCancel }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const copyCtx = { role, patientName };

  const question = CHECKIN_QUESTIONS[step];
  const isLast = step === CHECKIN_QUESTIONS.length - 1;
  const questionLabel = getCopy(`checkin.question.${question.id}`, copyCtx);

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

  return (
    <ScreenLayout
      title="Daily check-in"
      subtitle={`Question ${step + 1} of ${CHECKIN_QUESTIONS.length}`}
      footer={
        <Button block variant="ghost" onClick={onCancel}>
          Save and exit
        </Button>
      }
    >
      <ProgressDots total={CHECKIN_QUESTIONS.length} current={step} />
      <div className="card" style={{ marginTop: 8 }}>
        <div
          style={{
            fontWeight: 700,
            fontSize: "var(--text-xl)",
            marginBottom: 8,
            textWrap: "pretty",
            color: "var(--text)",
          }}
        >
          {questionLabel}
        </div>
        {question.hint && (
          <p style={{ color: "var(--text-brand)", fontSize: "var(--text-sm)", marginBottom: 20 }}>
            {question.hint}
          </p>
        )}
        <ToggleRow
          value={answers[question.id]}
          onChange={setAnswer}
          options={[
            { value: "no", label: "No" },
            { value: "yes", label: "Yes" },
          ]}
        />
        <div className="checkin-skip">
          <button
            type="button"
            className={`checkin-skip__btn ${
              answers[question.id] === "na" ? "checkin-skip__btn--active" : ""
            }`}
            aria-pressed={answers[question.id] === "na"}
            onClick={() => setAnswer("na")}
          >
            Didn&apos;t see this
          </button>
          <p className="checkin-skip__hint">
            Use this if you couldn&apos;t observe it today — keeps the day from
            being marked all-clear.
          </p>
        </div>
      </div>
      <p
        style={{
          marginTop: 24,
          fontSize: "var(--text-xs)",
          color: "var(--text-subtle)",
          textAlign: "center",
        }}
      >
        {getCopy("checkin.footer", copyCtx)}
      </p>
    </ScreenLayout>
  );
}

function CheckInComplete({
  role,
  patientName,
  outcome = "clear",
  flaggedIds = [],
  onHome,
  onSuddenChange,
}) {
  const copyCtx = { role, patientName };
  // When the only flagged item is low mood, route to supportive guidance rather
  // than the infection-oriented sudden-change path.
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
  // Only flagged check-ins that include an acute item (e.g. a fall) actively
  // push escalation. Other flagged days are "logged, keep watching."
  const hasAcute =
    variant === "flagged" &&
    flaggedIds.some((id) => ACUTE_CHECKIN_IDS.includes(id));

  const circleClass =
    variant === "flagged" || variant === "mood"
      ? "status-circle--watch"
      : variant === "partial"
      ? "status-circle--partial"
      : "status-circle--good";
  const circleIcon =
    variant === "flagged" ? "note" : variant === "clear" ? "check" : "bulb";

  const subtitle = hasAcute
    ? getCopy("checkin.complete.subtitle.flagged.acute", copyCtx)
    : getCopy(`checkin.complete.subtitle.${variant}`, copyCtx);

  let footer;
  if (variant === "flagged" && hasAcute) {
    footer = (
      <div className="stack stack--tight">
        <Button block variant="primary" size="lg" onClick={onSuddenChange}>
          {getCopy("checkin.complete.alertCta", copyCtx)}
        </Button>
        <Button block size="lg" variant="ghost" onClick={onHome}>
          Back to home
        </Button>
      </div>
    );
  } else if (variant === "flagged") {
    footer = (
      <div className="stack stack--tight">
        <Button block size="lg" variant="primary" onClick={onHome}>
          Back to home
        </Button>
        <button
          type="button"
          className="text-link checkin-complete__escalate"
          onClick={onSuddenChange}
        >
          {getCopy("checkin.complete.alertCta", copyCtx)}
        </button>
      </div>
    );
  } else {
    footer = (
      <Button block size="lg" variant="primary" onClick={onHome}>
        Back to home
      </Button>
    );
  }

  return (
    <ScreenLayout
      title={getCopy(`checkin.complete.title.${variant}`, copyCtx)}
      subtitle={subtitle}
      footer={footer}
    >
      <div className="card" style={{ textAlign: "center", padding: "40px 24px" }}>
        <div className={`status-circle ${circleClass}`}>
          <AppIcon name={circleIcon} className="app-icon--sm" />
        </div>
        <p style={{ color: "var(--text-brand)", textWrap: "pretty" }}>
          {getCopy(`checkin.complete.body.${variant}`, copyCtx)}
        </p>
      </div>
    </ScreenLayout>
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

function SuddenChangeFlow({ role, patientName, hasRecipients, initialSymptoms = [], onSend, onCancel }) {
  const [symptoms, setSymptoms] = useState(initialSymptoms);
  const [note, setNote] = useState("");
  const copyCtx = { role, patientName };

  const toggle = (id) => {
    setSymptoms((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const options = [
    { id: "confusion", label: "Sudden confusion", severity: "watch" },
    { id: "hallucination", label: "New hallucinations", severity: "watch" },
    { id: "mobility", label: "Can't walk / much weaker", severity: "alert" },
    { id: "fall", label: "Fall or injury", severity: "alert" },
    { id: "fever", label: "Fever", severity: "watch" },
    { id: "other", label: "Other sudden change", severity: "watch" },
  ];

  const redIds = options.filter((o) => o.severity === "alert").map((o) => o.id);
  // Red wins over yellow; null until at least one symptom is picked.
  const severity =
    symptoms.length === 0
      ? null
      : symptoms.some((s) => redIds.includes(s))
      ? "alert"
      : "watch";

  return (
    <ScreenLayout
      title="Sudden change"
      subtitle={getCopy("suddenChange.subtitle", copyCtx)}
      footer={
        <div className="stack stack--tight">
          <Button
            block
            size="lg"
            variant="primary"
            disabled={symptoms.length === 0}
            onClick={() => onSend({ symptoms, note, severity })}
          >
            {getCopy(hasRecipients ? "suddenChange.cta" : "suddenChange.cta.none", copyCtx)}
          </Button>
          <Button block variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <p className="suddenchange-safety">
            Not monitored — call 911 in an emergency.
          </p>
        </div>
      }
    >
      <div className="suddenchange-lead">
        <AppIcon name="bulb" className="suddenchange-lead__icon" />
        <p className="suddenchange-lead__text">
          {getCopy("suddenChange.lead", copyCtx)}
        </p>
      </div>

      <p style={{ fontWeight: 600, marginBottom: 12, color: "var(--text)" }}>Select all that apply</p>
      <div className="stack stack--tight" style={{ marginBottom: 20 }}>
        {options.map((opt) => (
          <SelectOption
            key={opt.id}
            label={opt.label}
            selected={symptoms.includes(opt.id)}
            onClick={() => toggle(opt.id)}
          />
        ))}
      </div>

      {severity && (
        <div
          className={`triage-panel triage-panel--${severity}`}
          role="status"
          style={{ marginBottom: 20 }}
        >
          <div className="triage-panel__title">
            {getCopy(`triage.${severity}.title`, copyCtx)}
          </div>
          <ol className="triage-panel__steps">
            {TRIAGE_ACTION_STEPS[severity].map((step, i) => (
              <li key={i}>{step}</li>
            ))}
            <li>
              {getCopy(
                hasRecipients
                  ? "suddenChange.step.notify"
                  : "suddenChange.step.notify.none",
                copyCtx
              )}
            </li>
          </ol>
          {hasRecipients && (
            <p className="triage-panel__note">
              {getCopy("suddenChange.shareNote", copyCtx)}
            </p>
          )}
        </div>
      )}

      <Field label="Quick note (optional)">
        <textarea
          className="field__textarea"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. Much more confused since this morning"
        />
      </Field>
    </ScreenLayout>
  );
}

function formatNotifiedSentence(names) {
  if (names.length === 1) return `${names[0]} has been notified.`;
  if (names.length === 2) return `${names[0]} and ${names[1]} have been notified.`;
  return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]} have been notified.`;
}

function AlertSent({ role, patientName, recipientNames, severity, onHome, onOpenHospitalCard }) {
  const copyCtx = { role, patientName };
  const notified = recipientNames.length > 0;
  const steps = TRIAGE_STEPS[severity] || TRIAGE_STEPS.watch;
  const subtitle = notified
    ? formatNotifiedSentence(recipientNames)
    : getCopy("alertSent.none.subtitle", copyCtx);

  return (
    <ScreenLayout
      title={notified ? "Alert sent" : "Sudden change logged"}
      subtitle={subtitle}
      footer={<Button block size="lg" onClick={onHome}>Done</Button>}
    >
      <div className="stack">
        {severity === "alert" && (
          <div className="triage-panel triage-panel--alert" role="status">
            <div className="triage-panel__title">
              {getCopy("triage.alert.title", copyCtx)}
            </div>
            <p className="triage-panel__body">
              {getCopy("triage.alert.body", copyCtx)}
            </p>
          </div>
        )}

        <section className="alert-section">
          <h2 className="section-title">What happens next</h2>
          <div className={`card ${notified ? "" : "card--danger"}`}>
            <p style={{ textWrap: "pretty" }}>
              {getCopy(notified ? "alertSent.body" : "alertSent.none.body", copyCtx)}
            </p>
          </div>
        </section>

        <section className="alert-section">
          <h2 className="section-title">
            {severity === "alert" ? "What to do now" : "Next steps to consider"}
          </h2>
          <ol className="alert-steps">
            {steps.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </section>

        <section className="alert-section">
          <h2 className="section-title">Bring to the hospital</h2>
          <button
            type="button"
            className="card card--interactive alert-hospital"
            onClick={onOpenHospitalCard}
          >
            <h3 className="alert-hospital__title">Open hospital card</h3>
            <p className="alert-hospital__sub">Bring to the ER if you go</p>
          </button>
        </section>

        <p className="alert-safety">{getCopy("alertSent.safety", copyCtx)}</p>
      </div>
    </ScreenLayout>
  );
}

function TimelineScreen({ entries, sampleData, patientName }) {
  const displayEntries = getTimelineDisplayEntries(entries, sampleData);

  if (!sampleData && entries.length === 0) {
    return (
      <ScreenLayout title="Timeline" subtitle={`Last 7 days · ${patientName}`}>
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
    <ScreenLayout title="Timeline" subtitle={`Last 7 days · ${patientName}`}>
      {entries.length === 0 && sampleData && (
        <p style={{ marginBottom: 16 }}>
          <span className="placeholder-badge">Sample data</span>
        </p>
      )}
      <div className="stack" style={{ gap: 20 }}>
        {displayEntries.map((entry, i) => (
          <div key={i} className="timeline-item">
            <div className="timeline-item__date">
              <span>{entry.month}</span>
              <span className="timeline-item__day">{entry.day}</span>
            </div>
            <div className="card" style={{ padding: 16 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 8,
                  marginBottom: 4,
                }}
              >
                <span style={{ fontWeight: 600 }}>{entry.title}</span>
                <Chip variant={entry.status}>{entry.status === "good" ? "Stable" : entry.status === "watch" ? "Watch" : entry.status === "partial" ? "Partial" : "Alert"}</Chip>
              </div>
              <p style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>
                {entry.detail}
              </p>
            </div>
          </div>
        ))}
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
      subtitle="Editable · Export as PDF for ER visits"
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
      subtitle="PDF download would start here in the live app"
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
  OnboardingIntro,
  OnboardingWelcome,
  PrivacyScreen,
  OnboardingRole,
  OnboardingSetup,
  TimelineSummary,
  StatusSummaryCard,
  HomeScreen,
  CheckInFlow,
  CheckInComplete,
  SuddenChangeFlow,
  AlertSent,
  TimelineScreen,
  HospitalCardScreen,
  HospitalCardExport,
});
