const COPY = {
  patient: {
    "checkin.question.confusion": "More confused than usual?",
    "checkin.question.hallucinations": "Seeing or hearing things that aren't there?",
    "checkin.question.falls": "Any falls or near-falls?",
    "checkin.question.urine": "Urine changes?",
    "checkin.question.fever": "Fever or feeling unwell?",
    "checkin.question.eating": "Eating or drinking much less?",
    "checkin.footer": "Compare to your usual baseline — not perfect days.",
    "checkin.complete.title.flagged": "Thanks — we noted some concerns",
    "checkin.complete.title.clear": "All clear for today",
    "checkin.complete.subtitle.flagged":
      "Consider a UTI test if confusion or urine changes were yes.",
    "checkin.complete.subtitle.clear": "Check-in saved. Same time tomorrow.",
    "checkin.complete.body.flagged":
      "A caregiver will see this on the timeline. If symptoms are severe or sudden, use the alert button or seek care.",
    "checkin.complete.body.clear":
      "No concerns flagged. Keep up the daily rhythm — it helps spot real changes faster.",
    "checkin.complete.alertCta": "Alert caregiver now",
    "suddenChange.subtitle": "What's happening?",
    "suddenChange.cta": "Send alert to caregiver",
    "alertSent.subtitle": "Your caregiver has been notified.",
    "alertSent.body":
      "They'll receive a text with what you logged and a link to the timeline.",
    "home.suddenChange.subtitle": "Alert caregiver · Log what you're seeing",
    "home.title": "Good morning",
  },
  caregiver: {
    "checkin.question.confusion":
      "Are you noticing new confusion or behavior changes in {name} today?",
    "checkin.question.hallucinations":
      "Is {name} seeing or hearing things that aren't there?",
    "checkin.question.falls": "Has {name} had any falls or near-falls since yesterday?",
    "checkin.question.urine": "Any urine changes for {name}?",
    "checkin.question.fever": "Does {name} have a fever or seem unwell?",
    "checkin.question.eating": "Is {name} eating or drinking much less?",
    "checkin.footer": "Compare to {name}'s usual baseline — not perfect days.",
    "checkin.complete.title.flagged": "Concerns noted for {name}",
    "checkin.complete.title.clear": "All clear for {name} today",
    "checkin.complete.subtitle.flagged":
      "{name} flagged some concerns today. Consider a UTI test if confusion or urine changes were yes.",
    "checkin.complete.subtitle.clear": "Check-in saved. Same time tomorrow.",
    "checkin.complete.body.flagged":
      "This appears on the timeline. If symptoms are severe or sudden, notify the care team or seek care.",
    "checkin.complete.body.clear":
      "No concerns flagged. The daily rhythm helps spot real changes faster.",
    "checkin.complete.alertCta": "Notify care team now",
    "suddenChange.subtitle": "What's happening with {name}?",
    "suddenChange.cta": "Notify care team",
    "alertSent.subtitle": "Care team notified.",
    "alertSent.body":
      "They'll receive a text with what you logged and a link to the timeline.",
    "home.suddenChange.subtitle": "Notify care team · Log what you're seeing",
    "home.title": "{name}'s status",
    "home.checkin.title": "Log check-in for {name}",
    "home.checkin.subtitle": "About 60 seconds · observation questions",
    "home.checkin.action": "Log now",
  },
};

function getCopy(scope, { role = "patient", patientName = "your loved one" } = {}) {
  const roleCopy = COPY[role] || COPY.patient;
  const template = roleCopy[scope] || COPY.patient[scope] || scope;
  return template.replace(/\{name\}/g, patientName);
}

Object.assign(window, { COPY, getCopy });
