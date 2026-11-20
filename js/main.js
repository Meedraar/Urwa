(() => {const y=document.querySelector("#yr");if(y)y.textContent=new Date().getFullYear();const toast=document.querySelector("#toast");const show=m=>{if(!toast)return;toast.textContent=m;toast.classList.add("show");toast.style.display="block";window.setTimeout(()=>{toast.classList.remove("show");toast.style.display="none";},4500);};document.querySelectorAll(".js-demo-form").forEach(f=>f.addEventListener("submit",e=>{e.preventDefault();show(f.dataset.message||"This form is a preview and is not connected yet.");f.reset();}));})();

const calendarGrid = document.getElementById('cg');
const monthLabel = document.getElementById('ml');
const previousMonth = document.getElementById('pm');
const nextMonth = document.getElementById('nm');

let displayedMonth = new Date();
displayedMonth.setDate(1);

const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function renderCalendar() {
  const year = displayedMonth.getFullYear();
  const month = displayedMonth.getMonth();

  monthLabel.textContent = new Intl.DateTimeFormat('en', {
    month: 'long',
    year: 'numeric'
  }).format(displayedMonth);

  calendarGrid.innerHTML = '';

  // Add weekday headings
  weekdays.forEach(day => {
    const heading = document.createElement('div');
    heading.className = 'calendar-weekday';
    heading.textContent = day;
    calendarGrid.appendChild(heading);
  });

  // Monday-first calendar
  const firstDay = new Date(year, month, 1).getDay();
  const startingOffset = (firstDay + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Empty spaces before the first day
  for (let i = 0; i < startingOffset; i++) {
    const blank = document.createElement('div');
    blank.className = 'calendar-empty';
    calendarGrid.appendChild(blank);
  }

  // Calendar dates
  const today = new Date();

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const cell = document.createElement('div');

    cell.className = 'calendar-day';
    cell.textContent = day;

    if (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    ) {
      cell.classList.add('today');
      cell.setAttribute('aria-current', 'date');
    }

    calendarGrid.appendChild(cell);
  }
}

previousMonth.addEventListener('click', () => {
  displayedMonth.setMonth(displayedMonth.getMonth() - 1);
  renderCalendar();
});

nextMonth.addEventListener('click', () => {
  displayedMonth.setMonth(displayedMonth.getMonth() + 1);
  renderCalendar();
});

renderCalendar();
