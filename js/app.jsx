const { useState, useEffect } = React;

const SCREEN_LIST = [
  { id: "onboarding-splash", label: "01 Onboarding — Splash" },
  { id: "onboarding-welcome", label: "02 Onboarding — Welcome" },
  { id: "privacy", label: "02b Privacy & data" },
  { id: "onboarding-intro", label: "03 Onboarding — Walkthrough" },
  { id: "onboarding-role", label: "04 Onboarding — Role" },
  { id: "onboarding-setup", label: "05 Onboarding — Setup" },
  { id: "home", label: "06 Home" },
  { id: "checkin", label: "07 Daily check-in" },
  { id: "checkin-complete", label: "08 Check-in complete" },
  { id: "sudden-change", label: "09 Sudden change" },
  { id: "alert-sent", label: "10 Alert sent" },
  { id: "timeline", label: "11 Timeline" },
  { id: "hospital-card", label: "12 Hospital card" },
  { id: "hospital-export", label: "13 PDF export" },
];

const NAV_ITEMS = [
  { id: "home", label: "Home", icon: "home" },
  { id: "checkin", label: "Check-in", icon: "check" },
  { id: "timeline", label: "Timeline", icon: "trend" },
  { id: "hospital-card", label: "Card", icon: "card" },
];

function App() {
  const [screen, setScreen] = useState("onboarding-splash");
  const [tab, setTab] = useState("home");
  const [onboarded, setOnboarded] = useState(false);
  const [role, setRole] = useState("caregiver");
  const [setup, setSetup] = useState({
    patientName: "",
    caregiverContact: "",
    caregiverName: "",
    monitorContact: "",
    monitorName: "",
    reminderTime: "09:00",
  });
  const [careProfile, setCareProfile] = useState(createEmptyCareProfile("caregiver"));
  const [hospitalCard, setHospitalCard] = useState({
    ...DEFAULT_HOSPITAL_CARD,
  });
  const [lastCheckIn, setLastCheckIn] = useState(null);
  const [timelineEntries, setTimelineEntries] = useState([]);
  const [lastCheckInOutcome, setLastCheckInOutcome] = useState("clear");
  const [lastCheckInFlaggedIds, setLastCheckInFlaggedIds] = useState([]);
  const [suddenPrefill, setSuddenPrefill] = useState([]);
  const [lastAlertRecipients, setLastAlertRecipients] = useState([]);
  const [lastAlertSeverity, setLastAlertSeverity] = useState("watch");
  const [monitorAlertBanner, setMonitorAlertBanner] = useState(false);

  const [tweaksOpen, setTweaksOpen] = useState(false);
  const [tweaks, setTweaks] = useState({
    screen: "onboarding-splash",
    role: "caregiver",
    style: "calm",
    darkMode: false,
    framed: true,
    sampleData: true,
    simulateMonitorAlert: false,
  });

  useEffect(() => {
    document.body.classList.toggle("demo-mode", tweaks.framed);
    document.documentElement.setAttribute(
      "data-theme",
      tweaks.darkMode ? "dark" : "light"
    );
    document.documentElement.setAttribute(
      "data-contrast",
      tweaks.style === "high-contrast" ? "high" : "normal"
    );
  }, [tweaks.framed, tweaks.darkMode, tweaks.style]);

  useEffect(() => {
    if (tweaks.role !== role) {
      setRole(tweaks.role);
      setCareProfile((profile) => ({ ...profile, role: tweaks.role }));
    }
  }, [tweaks.role]);

  useEffect(() => {
    if (tweaks.simulateMonitorAlert && role === "caregiver" && screen === "home") {
      setMonitorAlertBanner(true);
    }
  }, [tweaks.simulateMonitorAlert, role, screen]);

  const patientName =
    careProfile.patientName || setup.patientName || "your loved one";

  const alertRecipientNames = getRecipientDisplayNames(
    getAlertRecipients(careProfile)
  );
  const hasAlertRecipients = alertRecipientNames.length > 0;

  const goTo = (next) => {
    setScreen(next);
    setTweaks((t) => ({ ...t, screen: next }));
    if (NAV_ITEMS.some((n) => n.id === next)) setTab(next);
  };

  const finishOnboarding = () => {
    const profile = buildCareProfileFromSetup(role, setup);
    setCareProfile(profile);
    setOnboarded(true);
    setHospitalCard((c) => ({
      ...c,
      patientName: setup.patientName || c.patientName,
    }));
    goTo("home");
  };

  const handleCheckInComplete = ({
    flagged,
    flaggedIds = [],
    outcome = flagged ? "flagged" : "clear",
  }) => {
    const status =
      outcome === "flagged" ? "watch" : outcome === "partial" ? "partial" : "good";
    const flaggedLabels = flaggedIds
      .map((id) => CHECKIN_SHORT_LABELS[id])
      .filter(Boolean);
    const detail =
      outcome === "flagged"
        ? flaggedLabels.length
          ? flaggedLabels.join(", ")
          : "Concerns noted"
        : outcome === "partial"
        ? "Partly logged"
        : "No concerns";
    const entry = {
      date: new Date().toDateString(),
      flagged,
      flaggedIds,
      outcome,
      day: new Date().getDate(),
      month: new Date().toLocaleString("en-US", { month: "short" }),
      type: "checkin",
      title: "Daily check-in",
      detail,
      status,
    };
    setLastCheckIn({ date: entry.date, flagged, outcome });
    setLastCheckInOutcome(outcome);
    setLastCheckInFlaggedIds(flaggedIds);
    setTimelineEntries((prev) => [entry, ...prev]);
    goTo("checkin-complete");
  };

  const handleSuddenAlert = ({ symptoms, note, severity = "watch" }) => {
    const recipients = getAlertRecipients(careProfile);
    const recipientNames = getRecipientDisplayNames(recipients);

    const entry = {
      day: new Date().getDate(),
      month: new Date().toLocaleString("en-US", { month: "short" }),
      type: "alert",
      title: "Sudden change alert",
      detail: `${symptoms.join(", ")}${note ? ` · ${note}` : ""}`,
      status: severity,
      notified: recipientNames,
    };
    setLastAlertRecipients(recipientNames);
    setLastAlertSeverity(severity);
    setTimelineEntries((prev) => [entry, ...prev]);

    if (tweaks.simulateMonitorAlert && role === "caregiver" && recipients.length > 0) {
      setMonitorAlertBanner(true);
    }

    goTo("alert-sent");
  };

  const handleNav = (id) => {
    if (!onboarded && id !== "home") return;
    if (id === "checkin") {
      if (lastCheckIn?.date === new Date().toDateString()) {
        goTo("checkin-complete");
      } else {
        goTo("checkin");
      }
    } else {
      goTo(id);
    }
  };

  const handleTweaksJump = (screenId) => {
    if (
      screenId !== "onboarding-splash" &&
      screenId !== "onboarding-intro" &&
      screenId !== "onboarding-welcome" &&
      screenId !== "privacy" &&
      screenId !== "onboarding-role" &&
      screenId !== "onboarding-setup"
    ) {
      setOnboarded(true);
      if (!setup.patientName) {
        const nextSetup = { ...setup, patientName: "Margaret" };
        setSetup(nextSetup);
        setCareProfile(buildCareProfileFromSetup(role, nextSetup));
      }
    }
    goTo(screenId);
  };

  const showNav =
    onboarded &&
    ["home", "timeline", "hospital-card"].includes(screen) &&
    screen !== "checkin" &&
    screen !== "checkin-complete";

  const renderScreen = () => {
    switch (screen) {
      case "onboarding-splash":
        return <OnboardingSplash onContinue={() => goTo("onboarding-welcome")} />;

      case "onboarding-intro":
        return (
          <OnboardingIntro
            onDone={() => goTo("onboarding-role")}
            onSkip={() => goTo("onboarding-role")}
          />
        );

      case "privacy":
        return <PrivacyScreen onBack={() => goTo("onboarding-welcome")} />;

      case "onboarding-welcome":
        return (
          <OnboardingWelcome
            onNext={() => goTo("onboarding-intro")}
            onPrivacy={() => goTo("privacy")}
            onErMode={() => {
              setOnboarded(true);
              const nextSetup = setup.patientName
                ? setup
                : { ...setup, patientName: "your loved one" };
              if (!setup.patientName) setSetup(nextSetup);
              setCareProfile(buildCareProfileFromSetup(role, nextSetup));
              goTo("sudden-change");
            }}
          />
        );

      case "onboarding-role":
        return (
          <OnboardingRole
            role={role}
            setRole={(r) => {
              setRole(r);
              setTweaks((t) => ({ ...t, role: r }));
            }}
            onNext={() => goTo("onboarding-setup")}
            onBack={() => goTo("onboarding-welcome")}
          />
        );

      case "onboarding-setup":
        return (
          <OnboardingSetup
            data={setup}
            setData={setSetup}
            role={role}
            onNext={finishOnboarding}
            onBack={() => goTo("onboarding-role")}
          />
        );

      case "home":
        return (
          <HomeScreen
            role={role}
            patientName={patientName}
            hasRecipients={hasAlertRecipients}
            lastCheckIn={lastCheckIn}
            timelineEntries={timelineEntries}
            sampleData={tweaks.sampleData}
            monitorAlertBanner={monitorAlertBanner}
            onDismissMonitorBanner={() => setMonitorAlertBanner(false)}
            onCheckIn={() => goTo("checkin")}
            onSuddenChange={() => {
              setSuddenPrefill([]);
              goTo("sudden-change");
            }}
            onHospitalCard={() => goTo("hospital-card")}
            onViewTimeline={() => goTo("timeline")}
          />
        );

      case "checkin":
        return (
          <CheckInFlow
            role={role}
            patientName={patientName}
            onComplete={handleCheckInComplete}
            onCancel={() => goTo("home")}
          />
        );

      case "checkin-complete":
        return (
          <CheckInComplete
            role={role}
            patientName={patientName}
            outcome={lastCheckInOutcome}
            flaggedIds={lastCheckInFlaggedIds}
            onHome={() => goTo("home")}
            onSuddenChange={() => {
              setSuddenPrefill(getSuddenSymptomsFromCheckin(lastCheckInFlaggedIds));
              goTo("sudden-change");
            }}
          />
        );

      case "sudden-change":
        return (
          <SuddenChangeFlow
            role={role}
            patientName={patientName}
            hasRecipients={hasAlertRecipients}
            initialSymptoms={suddenPrefill}
            onSend={handleSuddenAlert}
            onCancel={() => goTo("home")}
          />
        );

      case "alert-sent":
        return (
          <AlertSent
            role={role}
            patientName={patientName}
            recipientNames={lastAlertRecipients}
            severity={lastAlertSeverity}
            onHome={() => goTo("home")}
            onOpenHospitalCard={() => goTo("hospital-card")}
          />
        );

      case "timeline":
        return (
          <TimelineScreen
            entries={timelineEntries}
            sampleData={tweaks.sampleData}
            patientName={patientName}
          />
        );

      case "hospital-card":
        return (
          <HospitalCardScreen
            card={hospitalCard}
            setCard={setHospitalCard}
            timelineEntries={timelineEntries}
            onExport={() => goTo("hospital-export")}
            onBack={() => goTo("home")}
          />
        );

      case "hospital-export":
        return (
          <HospitalCardExport
            card={hospitalCard}
            onBack={() => goTo("hospital-card")}
            onDone={() => goTo("home")}
          />
        );

      default:
        return (
          <OnboardingWelcome
            onNext={() => goTo("onboarding-role")}
            onErMode={() => {
              setOnboarded(true);
              const nextSetup = setup.patientName
                ? setup
                : { ...setup, patientName: "your loved one" };
              if (!setup.patientName) setSetup(nextSetup);
              setCareProfile(buildCareProfileFromSetup(role, nextSetup));
              goTo("sudden-change");
            }}
          />
        );
    }
  };

  // The splash is the only screen whose blue background should fill the whole
  // phone, including the status-bar/safe-area region rather than stopping below.
  const immersive = screen === "onboarding-splash";

  const shell = (
    <div className={`app-shell ${immersive ? "app-shell--tinted" : ""}`}>
      {renderScreen()}
      {showNav && (
        <BottomNav items={NAV_ITEMS} active={tab} onChange={handleNav} />
      )}
    </div>
  );

  return (
    <>
      {tweaks.framed ? (
        <div className={`phone-frame ${immersive ? "phone-frame--tinted" : ""}`}>
          <div className="phone-frame__status" aria-hidden="true">
            <span className="phone-frame__time">9:41</span>
            <div className="phone-frame__island" />
            <span className="phone-frame__icons">●●●</span>
          </div>
          {shell}
          <div className="phone-frame__home" aria-hidden="true" />
        </div>
      ) : (
        shell
      )}

      <button
        type="button"
        className="tweaks-toggle"
        onClick={() => setTweaksOpen((o) => !o)}
        aria-label={tweaksOpen ? "Close tweaks" : "Open tweaks"}
      >
        {tweaksOpen ? "×" : "◇"}
      </button>

      <TweaksPanel
        open={tweaksOpen}
        config={tweaks}
        onChange={setTweaks}
        onJump={handleTweaksJump}
        screens={SCREEN_LIST}
      />
    </>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
