let memberIdCounter = 0;

function createMember({ name = "", contact = "", role, notifyOnSuddenChange = true }) {
  memberIdCounter += 1;
  return {
    id: `member-${memberIdCounter}`,
    name,
    contact,
    role,
    notifyOnSuddenChange,
  };
}

function createEmptyCareProfile(role = "patient") {
  return {
    role,
    patientName: "",
    members: [],
    reminderTime: "09:00",
  };
}

function createSetupFromCareProfile(careProfile) {
  const primary = careProfile.members.find((m) => m.role === "primary_caregiver");
  const monitor = careProfile.members.find((m) => m.role === "monitor");
  const selfMember = careProfile.members.find(
    (m) => m.role === "primary_caregiver" && careProfile.role === "caregiver"
  );

  return {
    patientName: careProfile.patientName,
    caregiverContact: primary?.contact || "",
    caregiverName: selfMember?.name || "",
    monitorContact: monitor?.contact || "",
    monitorName: monitor?.name || "",
    reminderTime: careProfile.reminderTime,
  };
}

function buildCareProfileFromSetup(role, setup) {
  const members = [];

  if (role === "patient" && setup.caregiverContact?.trim()) {
    members.push(
      createMember({
        name: "",
        contact: setup.caregiverContact.trim(),
        role: "primary_caregiver",
        notifyOnSuddenChange: true,
      })
    );
  }

  if (role === "caregiver") {
    if (setup.caregiverName?.trim()) {
      members.push(
        createMember({
          name: setup.caregiverName.trim(),
          contact: "",
          role: "primary_caregiver",
          notifyOnSuddenChange: false,
        })
      );
    }

    if (setup.monitorContact?.trim()) {
      members.push(
        createMember({
          name: setup.monitorName?.trim() || "",
          contact: setup.monitorContact.trim(),
          role: "monitor",
          notifyOnSuddenChange: true,
        })
      );
    }
  }

  return {
    role,
    patientName: (setup.patientName || "").trim(),
    members,
    reminderTime: setup.reminderTime || "09:00",
  };
}

function getAlertRecipients(careProfile) {
  if (!careProfile?.members?.length) return [];

  if (careProfile.role === "patient") {
    return careProfile.members.filter(
      (m) => m.role === "primary_caregiver" && m.notifyOnSuddenChange && m.contact
    );
  }

  return careProfile.members.filter(
    (m) => m.role === "monitor" && m.notifyOnSuddenChange && m.contact
  );
}

function getRecipientDisplayNames(recipients) {
  return recipients.map((r) => r.name || r.contact).filter(Boolean);
}

const SAMPLE_TIMELINE_PATTERN =
  "Confusion 2 days in a row, then fever and a positive UTI strip.";

// Week aligned with Home (ending Tuesday, Nov 10). Newest first.
const SAMPLE_TIMELINE_ENTRIES = [
  {
    day: 10,
    month: "Nov",
    time: "2:14 pm",
    type: "alert",
    title: "Sudden change",
    detail: "Confusion, fever · UTI strip positive",
    status: "alert",
    outcome: "Alert sent to Joe",
    chips: [
      { label: "Confusion", tone: "alert" },
      { label: "Fever", tone: "alert" },
      { label: "UTI strip positive", tone: "alert" },
    ],
  },
  {
    day: 9,
    month: "Nov",
    time: "9:05 am",
    type: "checkin",
    title: "Daily check-in · Watch",
    detail: "Confusion, Urine changes",
    status: "watch",
    chips: [
      { label: "Confusion", tone: "watch" },
      { label: "Urine changes", tone: "watch" },
      { label: "Falls: didn't see", tone: "unseen" },
    ],
  },
  {
    day: 8,
    month: "Nov",
    time: "8:40 am",
    type: "checkin",
    title: "Daily check-in · Stable",
    detail: "No concerns",
    status: "good",
    chips: [],
  },
  {
    day: 7,
    month: "Nov",
    type: "missed",
    title: "No check-in",
    detail: "",
    status: "missed",
    chips: [],
  },
];

function getTimelineDisplayEntries(entries, sampleData) {
  if (entries.length > 0) return entries;
  if (sampleData) return SAMPLE_TIMELINE_ENTRIES;
  return [];
}

function getTimelinePatternSummary(entries, sampleData) {
  if (sampleData && (!entries || entries.length === 0)) {
    return SAMPLE_TIMELINE_PATTERN;
  }
  return null;
}

function getTimelineRangeLabel(entries, { sampleWeek = false } = {}) {
  if (sampleWeek) return "Nov 4 – 10";
  if (!entries || entries.length === 0) return "Last 7 days";
  const days = entries.map((e) => e.day).filter((d) => d != null);
  if (!days.length) return "Last 7 days";
  const month = entries[0].month || "";
  const lo = Math.min(...days);
  const hi = Math.max(...days);
  if (lo === hi) return `${month} ${lo}`;
  return `${month} ${lo} – ${hi}`;
}

Object.assign(window, {
  createMember,
  createEmptyCareProfile,
  createSetupFromCareProfile,
  buildCareProfileFromSetup,
  getAlertRecipients,
  getRecipientDisplayNames,
  SAMPLE_TIMELINE_ENTRIES,
  SAMPLE_TIMELINE_PATTERN,
  getTimelineDisplayEntries,
  getTimelinePatternSummary,
  getTimelineRangeLabel,
});
