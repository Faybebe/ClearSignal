const { useState } = React;

const CHECKIN_QUESTIONS = [
  {
    id: "confusion",
    label: "More confused than usual?",
    hint: "Trouble following conversation, disoriented, repeating questions",
  },
  {
    id: "hallucinations",
    label: "Seeing or hearing things that aren't there?",
    hint: "New or worse since yesterday",
  },
  {
    id: "falls",
    label: "Any falls or near-falls?",
  },
  {
    id: "urine",
    label: "Urine changes?",
    hint: "Cloudy, strong smell, burning, or new incontinence",
  },
  {
    id: "fever",
    label: "Fever or feeling unwell?",
  },
  {
    id: "eating",
    label: "Eating or drinking much less?",
  },
];

const DEFAULT_HOSPITAL_CARD = {
  patientName: "Margaret Chen",
  diagnosis: "Parkinson's Disease",
  neurologist: "Dr. Sarah Okonkwo — Movement Disorders",
  neurologistPhone: "(555) 014-2200",
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
}) {
  return (
    <button
      type="button"
      className={`card card--interactive dashboard-card ${
        variant === "danger" ? "card--danger" : ""
      }`}
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
            Because Parkinson's doesn't change overnight. Notice sudden changes
            early.
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
      subtitle="You can invite a caregiver later."
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
          title="I'm living with Parkinson's"
          description="I'll do check-ins myself, or with help from family."
          selected={role === "patient"}
          onClick={() => setRole("patient")}
        />
        <RoleCard
          title="I'm a caregiver"
          description="I'll monitor check-ins and get alerts for sudden changes."
          selected={role === "caregiver"}
          onClick={() => setRole("caregiver")}
        />
      </div>
    </ScreenLayout>
  );
}

function OnboardingSetup({ data, setData, role, onNext, onBack }) {
  const [contactTouched, setContactTouched] = useState(false);
  const contactId = "caregiver-contact-input";
  const contactErrorId = "caregiver-contact-error";

  const contactValidation = validateCaregiverContact(data.caregiverContact);
  const showContactError = contactTouched && !contactValidation.valid;
  const contactInputMode = getCaregiverContactInputMode(data.caregiverContact);

  const canFinish =
    data.patientName.trim() &&
    (role !== "patient" || contactValidation.valid);

  const handleContactChange = (e) => {
    setData({
      ...data,
      caregiverContact: formatCaregiverContactInput(e.target.value),
    });
  };

  const handleFinish = () => {
    if (role === "patient") {
      setContactTouched(true);
      if (!contactValidation.valid) return;
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
      <Field label="Person with Parkinson's" hint="First name is fine">
        <input
          className="field__input"
          value={data.patientName}
          onChange={(e) =>
            setData({ ...data, patientName: e.target.value })
          }
          placeholder="e.g. Mom, Dad, Margaret"
        />
      </Field>

      {role === "patient" && (
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
            aria-invalid={showContactError}
            aria-describedby={
              showContactError
                ? contactErrorId
                : undefined
            }
          />
        </Field>
      )}

      {role === "caregiver" && (
        <Field label="Your name" hint="Shown on alerts you receive">
          <input
            className="field__input"
            value={data.caregiverName}
            onChange={(e) =>
              setData({ ...data, caregiverName: e.target.value })
            }
            placeholder="Your name"
          />
        </Field>
      )}

      <Field label="Daily reminder time">
        <input
          className="field__input"
          type="time"
          value={data.reminderTime}
          onChange={(e) =>
            setData({ ...data, reminderTime: e.target.value })
          }
        />
      </Field>
    </ScreenLayout>
  );
}

function HomeScreen({
  role,
  patientName,
  lastCheckIn,
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

  const checkedInToday = lastCheckIn?.date === new Date().toDateString();

  return (
    <ScreenLayout
      title={role === "caregiver" ? `${patientName}'s status` : `Good morning`}
      subtitle={today}
    >
      <div className="stack">
        {checkedInToday ? (
          <div className="card card--with-icon">
            <AppIcon name="check" className="app-icon--sm" />
            <div className="card__body" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              <div>
                <div style={{ fontWeight: 600, color: "var(--text)" }}>Today's check-in done</div>
                <div style={{ fontSize: "var(--text-sm)", color: "var(--text-brand)" }}>
                  {lastCheckIn.flagged ? "Some concerns noted" : "No major concerns"}
                </div>
              </div>
              <Chip variant={lastCheckIn.flagged ? "watch" : "good"}>
                {lastCheckIn.flagged ? "Watch" : "Stable"}
              </Chip>
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
        )}

        <DashboardActionCard
          icon="alert"
          title="Something changed suddenly"
          subtitle="Alert caregiver · Log what you're seeing"
          actionLabel="Log now"
          onClick={onSuddenChange}
          variant="danger"
          titleEmphasis
        />

        <div className="divider" />

        <DashboardActionCard
          icon="card"
          title="Hospital card"
          subtitle="Meds, neurologist, emergency notes — ready to export"
          actionLabel="View and export"
          onClick={onHospitalCard}
        />

        <DashboardActionCard
          icon="trend"
          title="7-day timeline"
          subtitle="Spot patterns before your next visit"
          actionLabel="View"
          onClick={onViewTimeline}
        />

        {role === "caregiver" && (
          <div className="card card--alert">
            <div style={{ fontWeight: 600, marginBottom: 4, color: "var(--text)" }}>Caregiver tip</div>
            <p style={{ fontSize: "var(--text-sm)", color: "var(--text-brand)", textWrap: "pretty" }}>
              Sudden confusion or hallucinations often mean infection — not
              Parkinson's getting worse. Keep UTI test strips handy.
            </p>
          </div>
        )}
      </div>
    </ScreenLayout>
  );
}

function CheckInFlow({ onComplete, onCancel }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});

  const question = CHECKIN_QUESTIONS[step];
  const isLast = step === CHECKIN_QUESTIONS.length - 1;

  const setAnswer = (value) => {
    const next = { ...answers, [question.id]: value };
    setAnswers(next);
    if (isLast) {
      const flagged = Object.values(next).some((v) => v === "yes");
      onComplete({ answers: next, flagged });
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
          {question.label}
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
      </div>
      <p
        style={{
          marginTop: 24,
          fontSize: "var(--text-xs)",
          color: "var(--text-subtle)",
          textAlign: "center",
        }}
      >
        Compare to their usual baseline — not perfect days.
      </p>
    </ScreenLayout>
  );
}

function CheckInComplete({ flagged, onHome, onSuddenChange }) {
  return (
    <ScreenLayout
      title={flagged ? "Thanks — we noted some concerns" : "All clear for today"}
      subtitle={
        flagged
          ? "Consider a UTI test if confusion or urine changes were yes."
          : "Check-in saved. Same time tomorrow."
      }
      footer={
        <div className="stack stack--tight">
          {flagged && (
            <Button block variant="danger" size="lg" onClick={onSuddenChange}>
              Alert caregiver now
            </Button>
          )}
          <Button block size="lg" variant={flagged ? "secondary" : "primary"} onClick={onHome}>
            Back to home
          </Button>
        </div>
      }
    >
      <div className="card" style={{ textAlign: "center", padding: "40px 24px" }}>
        <div className={`status-circle ${flagged ? "status-circle--watch" : "status-circle--good"}`}>
          <AppIcon name={flagged ? "alert" : "check"} className="app-icon--sm" />
        </div>
        <p style={{ color: "var(--text-brand)", textWrap: "pretty" }}>
          {flagged
            ? "A caregiver will see this on the timeline. If symptoms are severe or sudden, use the alert button or seek care."
            : "No concerns flagged. Keep up the daily rhythm — it helps spot real changes faster."}
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

function SuddenChangeFlow({ patientName, onSend, onCancel }) {
  const [symptoms, setSymptoms] = useState([]);
  const [note, setNote] = useState("");

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
      subtitle={`What's happening with ${patientName}?`}
      footer={
        <div className="stack stack--tight">
          <Button
            block
            size="lg"
            variant="danger"
            disabled={symptoms.length === 0}
            onClick={() => onSend({ symptoms, note })}
          >
            Send alert to caregiver
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

function AlertSent({ onHome }) {
  return (
    <ScreenLayout
      title="Alert sent"
      subtitle="Your caregiver has been notified."
      footer={<Button block size="lg" onClick={onHome}>Done</Button>}
    >
      <div className="stack">
        <div className="card">
          <p style={{ textWrap: "pretty", marginBottom: 12 }}>
            They'll receive a text with what you logged and a link to the
            timeline.
          </p>
          <p style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>
            Next steps they may take:
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
        <button type="button" className="card card--interactive" style={{ textAlign: "left" }}>
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

  const displayEntries =
    entries.length > 0
      ? entries
      : [
          {
            day: 11,
            month: "Jun",
            type: "alert",
            title: "Sudden change alert",
            detail: "Confusion, fever · UTI strip positive",
            status: "alert",
          },
          {
            day: 10,
            month: "Jun",
            type: "checkin",
            title: "Daily check-in",
            detail: "Confusion: yes · Urine changes: yes",
            status: "watch",
          },
          {
            day: 9,
            month: "Jun",
            type: "checkin",
            title: "Daily check-in",
            detail: "No concerns",
            status: "good",
          },
          {
            day: 8,
            month: "Jun",
            type: "checkin",
            title: "Daily check-in",
            detail: "No concerns",
            status: "good",
          },
        ];

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
                <Chip variant={entry.status}>{entry.status === "good" ? "Stable" : entry.status === "watch" ? "Watch" : "Alert"}</Chip>
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
      <div className="stack">
        <Field label="Patient name">
          <input
            className="field__input"
            value={card.patientName}
            onChange={(e) => setCard({ ...card, patientName: e.target.value })}
          />
        </Field>
        <Field label="Movement disorder neurologist">
          <input
            className="field__input"
            value={card.neurologist}
            onChange={(e) => setCard({ ...card, neurologist: e.target.value })}
          />
        </Field>
        <Field label="Phone">
          <input
            className="field__input"
            value={card.neurologistPhone}
            onChange={(e) =>
              setCard({ ...card, neurologistPhone: e.target.value })
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
        </div>

        <div className="pdf-preview__section">
          <div className="pdf-preview__section-title">Movement disorder specialist</div>
          <div>{card.neurologist}</div>
          <div>{card.neurologistPhone}</div>
        </div>

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
  HomeScreen,
  CheckInFlow,
  CheckInComplete,
  SuddenChangeFlow,
  AlertSent,
  TimelineScreen,
  HospitalCardScreen,
  HospitalCardExport,
});
