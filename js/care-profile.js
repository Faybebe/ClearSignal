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

const SAMPLE_TIMELINE_ENTRIES = [
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
];

function getTimelineDisplayEntries(entries, sampleData) {
  if (entries.length > 0) return entries;
  if (sampleData) return SAMPLE_TIMELINE_ENTRIES;
  return [];
}

Object.assign(window, {
  createMember,
  createEmptyCareProfile,
  createSetupFromCareProfile,
  buildCareProfileFromSetup,
  getAlertRecipients,
  getRecipientDisplayNames,
  SAMPLE_TIMELINE_ENTRIES,
  getTimelineDisplayEntries,
});
