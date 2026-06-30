const COPY = {
  patient: {
    "checkin.question.confusion": "More confused than usual?",
    "checkin.question.hallucinations": "Seeing or hearing things that aren't there?",
    "checkin.question.falls": "Any falls or near-falls?",
    "checkin.question.urine": "Urine changes?",
    "checkin.question.fever": "Fever or feeling unwell?",
    "checkin.question.eating": "Eating or drinking much less?",
    "checkin.question.mood": "Feeling unusually low, hopeless, or withdrawn today?",
    "checkin.footer": "Compare to your usual baseline — not perfect days.",
    "checkin.complete.title.flagged": "Thanks — we noted some concerns",
    "checkin.complete.title.clear": "All clear for today",
    "checkin.complete.subtitle.flagged":
      "Consider a home UTI test if you flagged confusion or urine changes.",
    "checkin.complete.subtitle.flagged.acute":
      "A fall or sharp change can need attention. Report a sudden change to alert your caregiver, or seek care.",
    "checkin.complete.subtitle.clear": "Check-in saved. Same time tomorrow.",
    "checkin.complete.body.flagged":
      "This is logged to your timeline — no one is alerted. If something is new or getting worse fast, report a sudden change to notify your caregiver, or seek care.",
    "checkin.complete.body.clear":
      "No concerns flagged. Keep up the daily rhythm — it helps spot real changes faster.",
    "checkin.complete.title.partial": "Check-in saved — partly logged",
    "checkin.complete.subtitle.partial":
      "Some items were marked 'Not observed', so today isn't marked all-clear.",
    "checkin.complete.body.partial":
      "That's okay — fill in the unobserved items when you can. It keeps your baseline accurate so real changes stand out.",
    "checkin.complete.title.mood": "Thanks — noted how you're feeling",
    "checkin.complete.subtitle.mood":
      "Low mood matters. Consider mentioning it to your care team or PCP.",
    "checkin.complete.body.mood":
      "This is saved to your timeline. Low mood is common in Parkinson's and treatable — you don't have to manage it alone. If you ever feel unsafe, call or text 988.",
    "checkin.complete.alertCta": "Report a sudden change",
    "triage.alert.title": "This may be an emergency",
    "triage.alert.body":
      "Call 911 or go to the ER now. Bring your hospital card.",
    "triage.watch.title": "Act today",
    "triage.watch.body":
      "Sudden changes are often caused by infection or medication — not normal progression. Run a home UTI test and call your PCP or neurologist today.",
    "suddenChange.subtitle": "What's happening?",
    "suddenChange.lead":
      "Often infection, dehydration, or meds — not normal Parkinson's. When in doubt, seek care.",
    "suddenChange.cta": "Log & alert your caregiver",
    "suddenChange.cta.none": "Log sudden change",
    "suddenChange.step.notify": "Tap below to log this & alert your caregiver",
    "suddenChange.step.notify.none": "Tap below to log this on the timeline",
    "suddenChange.shareNote":
      "Sending this alerts your caregiver — it isn't an emergency call.",
    "suddenChange.who":
      "Your caregiver gets a text with what you logged. This isn't a monitored service — for an emergency, call 911.",
    "suddenChange.who.none":
      "No one will be texted yet — add a caregiver contact in setup so they're alerted next time. For an emergency, call 911.",
    "alertSent.subtitle": "Your caregiver has been notified.",
    "alertSent.body":
      "They'll get a text with what you logged and a link to the timeline, and can call to check in.",
    "alertSent.none.subtitle": "Logged — no one was notified",
    "alertSent.none.body":
      "This is saved to your timeline, but no alert was sent because you haven't added a caregiver contact yet. Add one so your caregiver is notified next time.",
    "alertSent.safety":
      "Not monitored around the clock — call 911 in an emergency.",
    "home.suddenChange.subtitle": "Alert your caregiver · Log what you're seeing",
    "home.suddenChange.subtitle.none": "Log what you're seeing · Seek care if severe",
    "home.title": "Good morning",
  },
  caregiver: {
    "checkin.question.confusion":
      "New confusion or behavior changes in {name} today?",
    "checkin.question.hallucinations":
      "Is {name} seeing or hearing things that aren't there?",
    "checkin.question.falls": "Any falls or near-falls for {name} since yesterday?",
    "checkin.question.urine": "Any urine changes for {name}?",
    "checkin.question.fever": "Does {name} have a fever or seem unwell?",
    "checkin.question.eating": "Is {name} eating or drinking much less?",
    "checkin.question.mood":
      "Is {name} more withdrawn, low, or tearful than usual?",
    "checkin.footer": "Compare to {name}'s usual baseline — not perfect days.",
    "checkin.complete.title.flagged": "Concerns noted for {name}",
    "checkin.complete.title.clear": "All clear for {name} today",
    "checkin.complete.subtitle.flagged":
      "Consider a home UTI test if you flagged confusion or urine changes for {name}.",
    "checkin.complete.subtitle.flagged.acute":
      "A fall or sharp change can need attention. Report a sudden change to alert your circle, or seek care.",
    "checkin.complete.subtitle.clear": "Check-in saved. Same time tomorrow.",
    "checkin.complete.body.flagged":
      "This is logged to {name}'s timeline — no one is alerted. If something is new or getting worse fast, report a sudden change to notify your circle, or seek care.",
    "checkin.complete.body.clear":
      "No concerns flagged. The daily rhythm helps spot real changes faster.",
    "checkin.complete.title.partial": "Partly logged for {name}",
    "checkin.complete.subtitle.partial":
      "Some items were marked 'Not observed', so today isn't marked all-clear.",
    "checkin.complete.body.partial":
      "That's okay — fill in the unobserved items when you can. It keeps {name}'s baseline accurate so real changes stand out.",
    "checkin.complete.title.mood": "Noted {name}'s mood",
    "checkin.complete.subtitle.mood":
      "{name} seemed low today. Worth mentioning to their care team or PCP.",
    "checkin.complete.body.mood":
      "This is saved to {name}'s timeline. Low mood is common in Parkinson's and treatable — worth raising with their PCP. In a crisis, call or text 988.",
    "checkin.complete.alertCta": "Report a sudden change",
    "triage.alert.title": "This may be an emergency",
    "triage.alert.body":
      "Call 911 or go to the ER now. Bring {name}'s hospital card.",
    "triage.watch.title": "Act today",
    "triage.watch.body":
      "Sudden changes in {name} are often caused by infection or medication — not normal progression. Run a home UTI test and call their PCP or neurologist today.",
    "suddenChange.subtitle": "What's happening with {name}?",
    "suddenChange.lead":
      "Often infection, dehydration, or meds — not normal Parkinson's. When in doubt, seek care.",
    "suddenChange.cta": "Log & notify your care circle",
    "suddenChange.cta.none": "Log sudden change",
    "suddenChange.step.notify": "Tap below to log this & alert your care circle",
    "suddenChange.step.notify.none": "Tap below to log this on {name}'s timeline",
    "suddenChange.shareNote":
      "Sending this shares it with your circle — it isn't an emergency call.",
    "suddenChange.who":
      "Everyone you added to {name}'s care circle gets a text with what you logged. This isn't a monitored service — for an emergency, call 911.",
    "suddenChange.who.none":
      "No one will be texted yet — add a care-circle contact in setup so they're alerted next time. For an emergency, call 911.",
    "alertSent.subtitle": "Your care circle has been notified.",
    "alertSent.body":
      "They'll get a text with what you logged and a link to the timeline, and can call to check in.",
    "alertSent.none.subtitle": "Logged — no one was notified",
    "alertSent.none.body":
      "This sudden change is saved to {name}'s timeline, but no one was alerted — you haven't added a care-circle contact yet. Add one so they're notified next time.",
    "alertSent.safety":
      "Not monitored around the clock — call 911 in an emergency.",
    "home.suddenChange.subtitle": "Notify your care circle · Log what you're seeing",
    "home.suddenChange.subtitle.none": "Log what you're seeing · Seek care if severe",
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
