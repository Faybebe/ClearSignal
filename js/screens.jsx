const { useState } = React;

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
];

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
  notes:
    "Sudden confusion may indicate UTI — test at home and contact PCP. Hallucinations worsened by Ciprofloxacin.",
};

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

function OnboardingWelcome({ onNext, onErMode }) {
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

        <div className="welcome-screen__features">
          <div className="welcome-screen__row">
            <FeatureCard
              icon="check"
              label="Daily 60-second check-ins"
              className="feature-card--tall"
            />
            <FeatureCard
              icon="alert"
              label="One-tap alerts for sudden change"
              className="feature-card--tall"
            />
          </div>
          <FeatureCard
            icon="card"
            label="Hospital card with meds and neurologist info"
            className="feature-card--wide"
          />
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
      subtitle="About 60 seconds · 6 questions"
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
      const values = Object.values(next);
      const flagged = values.some((v) => v === "yes");
      const hasUnobserved = values.some((v) => v === "na");
      const outcome = flagged ? "flagged" : hasUnobserved ? "partial" : "clear";
      onComplete({ answers: next, flagged, outcome });
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
            { value: "na", label: "Not observed" },
          ]}
        />
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

function CheckInComplete({ role, patientName, outcome = "clear", onHome, onSuddenChange }) {
  const copyCtx = { role, patientName };
  const flagged = outcome === "flagged";
  const partial = outcome === "partial";
  const variant = flagged ? "flagged" : partial ? "partial" : "clear";

  const circleClass = flagged
    ? "status-circle--watch"
    : partial
    ? "status-circle--partial"
    : "status-circle--good";
  const circleIcon = flagged ? "alert" : partial ? "bulb" : "check";

  return (
    <ScreenLayout
      title={getCopy(`checkin.complete.title.${variant}`, copyCtx)}
      subtitle={getCopy(`checkin.complete.subtitle.${variant}`, copyCtx)}
      footer={
        <div className="stack stack--tight">
          {flagged && (
            <Button block variant="danger" size="lg" onClick={onSuddenChange}>
              {getCopy("checkin.complete.alertCta", copyCtx)}
            </Button>
          )}
          <Button block size="lg" variant={flagged ? "secondary" : "primary"} onClick={onHome}>
            Back to home
          </Button>
        </div>
      }
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

function SuddenChangeFlow({ role, patientName, hasRecipients, onSend, onCancel }) {
  const [symptoms, setSymptoms] = useState([]);
  const [note, setNote] = useState("");
  const copyCtx = { role, patientName };

  const toggle = (id) => {
    setSymptoms((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const options = [
    { id: "confusion", label: "Sudden confusion" },
    { id: "hallucination", label: "New hallucinations" },
    { id: "mobility", label: "Can't walk / much weaker" },
    { id: "fall", label: "Fall or injury" },
    { id: "fever", label: "Fever" },
    { id: "other", label: "Other sudden change" },
  ];

  return (
    <ScreenLayout
      title="Sudden change"
      subtitle={getCopy("suddenChange.subtitle", copyCtx)}
      footer={
        <div className="stack stack--tight">
          <Button
            block
            size="lg"
            variant="danger"
            disabled={symptoms.length === 0}
            onClick={() => onSend({ symptoms, note })}
          >
            {getCopy(hasRecipients ? "suddenChange.cta" : "suddenChange.cta.none", copyCtx)}
          </Button>
          <Button block variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      }
    >
      <div className="card card--danger" style={{ marginBottom: 16 }}>
        <p style={{ fontSize: "var(--text-sm)", textWrap: "pretty" }}>
          <strong>When in doubt, seek care.</strong> Sudden changes in
          Parkinson's are often caused by infection, dehydration, or medication
          issues — not normal progression.
        </p>
      </div>

      <div className="info-note" style={{ marginBottom: 20 }}>
        <AppIcon name="bulb" className="info-note__icon" />
        <p className="info-note__text">
          {getCopy(hasRecipients ? "suddenChange.who" : "suddenChange.who.none", copyCtx)}
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

function AlertSent({ role, patientName, recipientNames, onHome, onOpenHospitalCard }) {
  const copyCtx = { role, patientName };
  const notified = recipientNames.length > 0;
  const notifiedList = recipientNames.join(", ");

  return (
    <ScreenLayout
      title={notified ? "Alert sent" : "Sudden change logged"}
      subtitle={getCopy(notified ? "alertSent.subtitle" : "alertSent.none.subtitle", copyCtx)}
      footer={<Button block size="lg" onClick={onHome}>Done</Button>}
    >
      <div className="stack">
        <div className={`card ${notified ? "" : "card--danger"}`}>
          <p style={{ textWrap: "pretty", marginBottom: 12 }}>
            {getCopy(notified ? "alertSent.body" : "alertSent.none.body", copyCtx)}
          </p>
          {notified && (
            <p
              style={{
                fontSize: "var(--text-sm)",
                fontWeight: 600,
                color: "var(--text)",
                marginBottom: 8,
              }}
            >
              Notified: {notifiedList}
            </p>
          )}
          {notified && (
            <p
              style={{
                fontSize: "var(--text-sm)",
                color: "var(--text-muted)",
                textWrap: "pretty",
                marginBottom: 12,
              }}
            >
              {getCopy("alertSent.response", copyCtx)}
            </p>
          )}
          <p style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>
            {notified ? "Next steps they may take:" : "Next steps to consider:"}
          </p>
          <ul
            style={{
              marginTop: 8,
              paddingLeft: 20,
              fontSize: "var(--text-sm)",
              color: "var(--text-muted)",
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            <li>Run a home UTI test</li>
            <li>Call PCP or neurologist</li>
            <li>Go to ER if severe</li>
          </ul>
        </div>
        <p
          style={{
            fontSize: "var(--text-sm)",
            color: "var(--text-muted)",
            textWrap: "pretty",
          }}
        >
          {getCopy("alertSent.safety", copyCtx)}
        </p>
        <button
          type="button"
          className="card card--interactive"
          style={{ textAlign: "left", width: "100%" }}
          onClick={onOpenHospitalCard}
        >
          <div style={{ fontWeight: 600 }}>Open hospital card</div>
          <div style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>
            Bring to ER if you go
          </div>
        </button>
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

function HospitalCardScreen({ card, setCard, onExport, onBack }) {
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
      <Field label="Emergency notes">
        <textarea
          className="field__textarea"
          value={card.notes}
          onChange={(e) => setCard({ ...card, notes: e.target.value })}
          rows={3}
        />
      </Field>
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
  DEFAULT_HOSPITAL_CARD,
  OnboardingWelcome,
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
