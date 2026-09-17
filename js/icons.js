// Genel arayüz ikonları (vektör, emoji değil). currentColor kullanır, CSS ile renklenir.

function iconGear() {
  return `<svg viewBox="0 0 24 24" class="ui-icon" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>`;
}

function iconPin() {
  return `<svg viewBox="0 0 24 24" class="ui-icon" fill="currentColor">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"/>
  </svg>`;
}

function iconPhone() {
  return `<svg viewBox="0 0 24 24" class="ui-icon" fill="currentColor">
    <path d="M6.6 10.8c1.4 2.7 3.6 5 6.4 6.4l2.1-2.1c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.5.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.5.1.4 0 .8-.2 1L6.6 10.8z"/>
  </svg>`;
}

function iconStore() {
  return `<svg viewBox="0 0 24 24" class="ui-icon" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <path d="M3 9l1.5-5h15L21 9"/>
    <path d="M3 9a2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0"/>
    <path d="M5 9v10h14V9"/>
    <path d="M9 21v-6h6v6"/>
  </svg>`;
}

function iconPill() {
  return `<svg viewBox="0 0 24 24" class="ui-icon">
    <g transform="rotate(45 12 12)">
      <path d="M4 12a5 5 0 0 1 5-5h6a5 5 0 0 1 0 10H9a5 5 0 0 1-5-5z" fill="none" stroke="currentColor" stroke-width="1.8"/>
      <path d="M12 7v10" stroke="currentColor" stroke-width="1.8"/>
      <path d="M4.3 12h7.7v5H9a5 5 0 0 1-4.7-5z" fill="currentColor" opacity="0.9"/>
    </g>
  </svg>`;
}

function iconCross() {
  return `<svg viewBox="0 0 24 24" class="ui-icon" fill="currentColor">
    <path d="M10 3h4v7h7v4h-7v7h-4v-7H3V10h7z"/>
  </svg>`;
}

function iconSave() {
  return `<svg viewBox="0 0 24 24" class="ui-icon" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
    <path d="M17 21v-8H7v8"/>
    <path d="M7 3v5h8"/>
  </svg>`;
}
