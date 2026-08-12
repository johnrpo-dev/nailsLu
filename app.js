const services = [
  { id: "manicure", name: "Manicure clásico", minutes: 45, price: 45000 },
  { id: "semipermanente", name: "Semipermanente", minutes: 60, price: 65000 },
  { id: "acrilicas", name: "Uñas acrílicas", minutes: 120, price: 130000 },
  { id: "gel", name: "Uñas en gel", minutes: 100, price: 115000 },
  { id: "pedicure", name: "Pedicure spa", minutes: 70, price: 75000 },
  { id: "retiro", name: "Retiro de producto", minutes: 30, price: 30000 },
  { id: "nailart", name: "Nail art", minutes: 35, price: 40000 },
];

const storageKey = "nail-spa-appointments";
const formatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});
const dateFormatter = new Intl.DateTimeFormat("es-CO", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});
const monthFormatter = new Intl.DateTimeFormat("es-CO", {
  month: "long",
  year: "numeric",
});

const state = {
  appointments: loadAppointments(),
  selectedDate: toISODate(new Date()),
  visibleMonth: startOfMonth(new Date()),
};

const elements = {
  form: document.querySelector("#appointmentForm"),
  appointmentId: document.querySelector("#appointmentId"),
  clientName: document.querySelector("#clientName"),
  clientPhone: document.querySelector("#clientPhone"),
  appointmentDate: document.querySelector("#appointmentDate"),
  appointmentTime: document.querySelector("#appointmentTime"),
  appointmentNotes: document.querySelector("#appointmentNotes"),
  serviceList: document.querySelector("#serviceList"),
  serviceSummary: document.querySelector("#serviceSummary"),
  totalSummary: document.querySelector("#totalSummary"),
  submitButton: document.querySelector("#submitButton"),
  resetButton: document.querySelector("#resetButton"),
  todayLabel: document.querySelector("#todayLabel"),
  monthLabel: document.querySelector("#monthLabel"),
  prevMonth: document.querySelector("#prevMonth"),
  nextMonth: document.querySelector("#nextMonth"),
  todayButton: document.querySelector("#todayButton"),
  calendarGrid: document.querySelector("#calendarGrid"),
  selectedDayLabel: document.querySelector("#selectedDayLabel"),
  dayCount: document.querySelector("#dayCount"),
  appointmentList: document.querySelector("#appointmentList"),
};

function init() {
  renderServices();
  elements.todayLabel.textContent = shortDate(new Date());
  elements.appointmentDate.value = state.selectedDate;
  updateServiceSummary();
  renderTimeOptions();
  renderCalendar();
  renderDayDetails();
  bindEvents();
}

function bindEvents() {
  elements.form.addEventListener("submit", handleSubmit);
  elements.resetButton.addEventListener("click", resetForm);
  elements.serviceList.addEventListener("change", () => {
    updateServiceSummary();
    renderTimeOptions();
  });
  elements.appointmentDate.addEventListener("change", (event) => {
    state.selectedDate = event.target.value;
    state.visibleMonth = startOfMonth(parseISODate(event.target.value));
    renderTimeOptions();
    renderCalendar();
    renderDayDetails();
  });
  elements.prevMonth.addEventListener("click", () => changeMonth(-1));
  elements.nextMonth.addEventListener("click", () => changeMonth(1));
  elements.todayButton.addEventListener("click", goToday);
}

function renderServices() {
  elements.serviceList.innerHTML = services
    .map(
      (service) => `
        <label class="service-option">
          <input type="checkbox" name="services" value="${service.id}" />
          <span>
            <span class="service-name">${service.name}</span>
            <span class="service-meta">${service.minutes} min</span>
          </span>
          <span class="service-price">${formatter.format(service.price)}</span>
        </label>
      `,
    )
    .join("");
}

function handleSubmit(event) {
  event.preventDefault();
  const selectedServices = getSelectedServices();

  if (!selectedServices.length) {
    elements.serviceSummary.textContent = "Selecciona al menos un servicio";
    elements.serviceList.focus();
    return;
  }

  const appointment = {
    id: elements.appointmentId.value || crypto.randomUUID(),
    clientName: elements.clientName.value.trim(),
    clientPhone: elements.clientPhone.value.trim(),
    date: elements.appointmentDate.value,
    time: elements.appointmentTime.value,
    services: selectedServices.map((service) => service.id),
    notes: elements.appointmentNotes.value.trim(),
    totalMinutes: selectedServices.reduce((sum, service) => sum + service.minutes, 0),
    totalPrice: selectedServices.reduce((sum, service) => sum + service.price, 0),
  };

  const existingIndex = state.appointments.findIndex((item) => item.id === appointment.id);
  if (existingIndex >= 0) {
    state.appointments[existingIndex] = appointment;
  } else {
    state.appointments.push(appointment);
  }

  saveAppointments();
  state.selectedDate = appointment.date;
  state.visibleMonth = startOfMonth(parseISODate(appointment.date));
  resetForm(false);
  elements.appointmentDate.value = state.selectedDate;
  renderTimeOptions();
  renderCalendar();
  renderDayDetails();
}

function resetForm(keepDate = true) {
  const date = keepDate ? elements.appointmentDate.value : state.selectedDate;
  elements.form.reset();
  elements.appointmentId.value = "";
  elements.appointmentDate.value = date;
  elements.submitButton.textContent = "Agendar cita";
  updateServiceSummary();
  renderTimeOptions();
}

function editAppointment(id) {
  const appointment = state.appointments.find((item) => item.id === id);
  if (!appointment) return;

  elements.appointmentId.value = appointment.id;
  elements.clientName.value = appointment.clientName;
  elements.clientPhone.value = appointment.clientPhone;
  elements.appointmentDate.value = appointment.date;
  elements.appointmentNotes.value = appointment.notes;
  document.querySelectorAll("[name='services']").forEach((checkbox) => {
    checkbox.checked = appointment.services.includes(checkbox.value);
  });
  updateServiceSummary();
  renderTimeOptions(appointment.time);
  elements.appointmentTime.value = appointment.time;
  elements.submitButton.textContent = "Guardar cambios";
  state.selectedDate = appointment.date;
  state.visibleMonth = startOfMonth(parseISODate(appointment.date));
  renderCalendar();
  renderDayDetails();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function deleteAppointment(id) {
  state.appointments = state.appointments.filter((item) => item.id !== id);
  saveAppointments();
  renderTimeOptions();
  renderCalendar();
  renderDayDetails();
}

function updateServiceSummary() {
  const selectedServices = getSelectedServices();
  const totalMinutes = selectedServices.reduce((sum, service) => sum + service.minutes, 0);
  const totalPrice = selectedServices.reduce((sum, service) => sum + service.price, 0);

  elements.serviceSummary.textContent = selectedServices.length
    ? selectedServices.map((service) => service.name).join(", ")
    : "Selecciona al menos un servicio";
  elements.totalSummary.textContent = `${formatter.format(totalPrice)} · ${totalMinutes} min`;
}

function renderTimeOptions(preferredTime = "") {
  const duration = getSelectedServices().reduce((sum, service) => sum + service.minutes, 0) || 45;
  const selectedDate = elements.appointmentDate.value || state.selectedDate;
  const editingId = elements.appointmentId.value;
  const slots = createTimeSlots("09:00", "19:00", 30);

  elements.appointmentTime.innerHTML = "";

  slots.forEach((slot) => {
    const available = isSlotAvailable(selectedDate, slot, duration, editingId);
    const option = document.createElement("option");
    option.value = slot;
    option.textContent = available ? slot : `${slot} - ocupado`;
    option.disabled = !available && slot !== preferredTime;
    elements.appointmentTime.appendChild(option);
  });

  const firstAvailable = [...elements.appointmentTime.options].find((option) => !option.disabled);
  elements.appointmentTime.value = preferredTime || firstAvailable?.value || "";
}

function renderCalendar() {
  elements.monthLabel.textContent = capitalize(monthFormatter.format(state.visibleMonth));
  elements.calendarGrid.innerHTML = "";

  calendarDays(state.visibleMonth).forEach((date) => {
    const iso = toISODate(date);
    const appointments = getAppointmentsForDate(iso);
    const button = document.createElement("button");
    button.type = "button";
    button.className = [
      "day-cell",
      date.getMonth() !== state.visibleMonth.getMonth() ? "is-muted" : "",
      iso === state.selectedDate ? "is-selected" : "",
      iso === toISODate(new Date()) ? "is-today" : "",
    ]
      .filter(Boolean)
      .join(" ");
    button.innerHTML = `
      <span class="day-number">${date.getDate()}</span>
      <span class="day-load">
        ${appointments
          .slice(0, 2)
          .map((item) => `<span class="load-line">${item.time} ${escapeHTML(item.clientName)}</span>`)
          .join("")}
        ${appointments.length > 2 ? `<span class="more-count">+${appointments.length - 2} más</span>` : ""}
      </span>
    `;
    button.addEventListener("click", () => selectDate(iso));
    elements.calendarGrid.appendChild(button);
  });
}

function renderDayDetails() {
  const appointments = getAppointmentsForDate(state.selectedDate);
  elements.selectedDayLabel.textContent = capitalize(dateFormatter.format(parseISODate(state.selectedDate)));
  elements.dayCount.textContent = `${appointments.length} turno${appointments.length === 1 ? "" : "s"}`;

  if (!appointments.length) {
    elements.appointmentList.innerHTML = `<div class="empty-state">No hay turnos agendados para este día.</div>`;
    return;
  }

  elements.appointmentList.innerHTML = appointments
    .map((appointment) => {
      const appointmentServices = appointment.services.map(findService).filter(Boolean);
      return `
        <article class="appointment-card">
          <div>
            <span class="appointment-time">${appointment.time} · ${appointment.totalMinutes} min</span>
            <h4>${escapeHTML(appointment.clientName)}</h4>
            <p>${appointmentServices.map((service) => service.name).join(", ")}</p>
            <p>${formatter.format(appointment.totalPrice)}${appointment.clientPhone ? ` · ${escapeHTML(appointment.clientPhone)}` : ""}</p>
            ${appointment.notes ? `<p>${escapeHTML(appointment.notes)}</p>` : ""}
          </div>
          <div class="appointment-tools">
            <button type="button" class="icon-button" title="Editar" onclick="editAppointment('${appointment.id}')">✎</button>
            <button type="button" class="icon-button" title="Eliminar" onclick="deleteAppointment('${appointment.id}')">×</button>
          </div>
        </article>
      `;
    })
    .join("");
}

function selectDate(iso) {
  state.selectedDate = iso;
  elements.appointmentDate.value = iso;
  renderTimeOptions();
  renderCalendar();
  renderDayDetails();
}

function changeMonth(direction) {
  state.visibleMonth = new Date(state.visibleMonth.getFullYear(), state.visibleMonth.getMonth() + direction, 1);
  renderCalendar();
}

function goToday() {
  const today = new Date();
  state.selectedDate = toISODate(today);
  state.visibleMonth = startOfMonth(today);
  elements.appointmentDate.value = state.selectedDate;
  renderTimeOptions();
  renderCalendar();
  renderDayDetails();
}

function getSelectedServices() {
  const checked = [...document.querySelectorAll("[name='services']:checked")].map((input) => input.value);
  return services.filter((service) => checked.includes(service.id));
}

function findService(id) {
  return services.find((service) => service.id === id);
}

function getAppointmentsForDate(iso) {
  return state.appointments
    .filter((appointment) => appointment.date === iso)
    .sort((a, b) => a.time.localeCompare(b.time));
}

function isSlotAvailable(date, time, duration, editingId) {
  const start = minutesFromTime(time);
  const end = start + duration;
  const close = minutesFromTime("19:00");
  if (end > close) return false;

  return getAppointmentsForDate(date)
    .filter((appointment) => appointment.id !== editingId)
    .every((appointment) => {
      const appointmentStart = minutesFromTime(appointment.time);
      const appointmentEnd = appointmentStart + appointment.totalMinutes;
      return end <= appointmentStart || start >= appointmentEnd;
    });
}

function createTimeSlots(startTime, endTime, step) {
  const slots = [];
  for (let minutes = minutesFromTime(startTime); minutes < minutesFromTime(endTime); minutes += step) {
    slots.push(timeFromMinutes(minutes));
  }
  return slots;
}

function minutesFromTime(time) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function timeFromMinutes(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60).toString().padStart(2, "0");
  const minutes = (totalMinutes % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

function calendarDays(monthDate) {
  const first = startOfMonth(monthDate);
  const startOffset = (first.getDay() + 6) % 7;
  const start = new Date(first);
  start.setDate(first.getDate() - startOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function toISODate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseISODate(iso) {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function shortDate(date) {
  return date.toLocaleDateString("es-CO", { day: "numeric", month: "short" });
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function escapeHTML(value) {
  return value.replace(/[&<>"']/g, (char) => {
    const entities = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" };
    return entities[char];
  });
}

function loadAppointments() {
  try {
    return JSON.parse(localStorage.getItem(storageKey)) || [];
  } catch {
    return [];
  }
}

function saveAppointments() {
  localStorage.setItem(storageKey, JSON.stringify(state.appointments));
}

window.editAppointment = editAppointment;
window.deleteAppointment = deleteAppointment;

init();
