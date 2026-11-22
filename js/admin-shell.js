/* URWA Admin shared shell: one navigation and one responsive behaviour on every Admin page. */
(() => {
  const body = document.body;
  if (!body || body.dataset.urwaRole !== "admin") return;

  const sidebar = document.querySelector(".sidebar");
  const topbar = document.querySelector(".topbar");
  if (!sidebar || !topbar) return;

  // One canonical menu prevents pages drifting into different navigation systems.
  const nav = sidebar.querySelector(".nav");
  if (nav) {
    nav.setAttribute("aria-label", "Admin dashboard navigation");
    nav.innerHTML = `
      <a href="admin-dashboard.html" data-admin-nav><span class="ico">▦</span>Dashboard</a>
      <div class="nav-label">Learning</div>
      <a href="halaqas.html" data-admin-nav><span class="ico">▤</span>Halaqas</a>
      <a href="programmes.html" data-admin-nav><span class="ico">▣</span>Programmes</a>
      <a href="attendance.html" data-admin-nav><span class="ico">♧</span>Attendance</a>
      <a href="assignments.html" data-admin-nav><span class="ico">✎</span>Assignments</a>
      <a href="timetable.html" data-admin-nav><span class="ico">◷</span>Timetable</a>
      <a href="homework.html" data-admin-nav><span class="ico">▤</span>Homework</a>
      <a href="library.html" data-admin-nav><span class="ico">▱</span>Library</a>
      <div class="nav-label">People</div>
      <a href="students.html" data-admin-nav><span class="ico">♙</span>Students</a>
      <a href="ablas.html" data-admin-nav><span class="ico">♙</span>Ustadh/Ustadhas</a>
      <a href="admissions.html" data-admin-nav><span class="ico">✚</span>Admissions</a>
      <a href="users.html" data-admin-nav><span class="ico">♙</span>User management</a>
      <div class="nav-label">Operations</div>
      <a href="fees.html" data-admin-nav><span class="ico">$</span>Fees</a>
      <a href="communication.html" data-admin-nav><span class="ico">▢</span>Communication</a>
      <a href="reports.html" data-admin-nav><span class="ico">▧</span>Reports &amp; Analytics</a>
      <a href="settings.html" data-admin-nav><span class="ico">⚙</span>Settings</a>
      <a href="../departments/operations.html"><span class="ico">◇</span>Projects &amp; approvals</a>
    `;
  }

  const current = location.pathname.split("/").pop() || "admin-dashboard.html";
  sidebar.querySelectorAll("a").forEach(link => {
    const href = link.getAttribute("href") || "";
    const page = href.split("#")[0].split("?")[0].split("/").pop();
    const active = page === current;
    link.classList.toggle("active", active);
    if (active) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });

  // Reuse an existing page menu button; never add a duplicate hamburger.
  let menu = topbar.querySelector(".admin-shell-menu, .menu-btn");
  if (!menu) {
    menu = document.createElement("button");
    menu.type = "button";
    menu.className = "admin-shell-menu";
    menu.textContent = "☰";
    topbar.insertBefore(menu, topbar.firstChild);
  }
  menu.setAttribute("aria-label", "Open admin navigation");
  menu.setAttribute("aria-controls", "admin-sidebar");
  menu.setAttribute("aria-expanded", "false");
  sidebar.id = "admin-sidebar";

  const closeMenu = () => {
    body.classList.remove("admin-menu-open", "menu-open");
    menu.setAttribute("aria-expanded", "false");
    menu.setAttribute("aria-label", "Open admin navigation");
  };
  const toggleMenu = event => {
    event.preventDefault();
    event.stopPropagation();
    const open = !body.classList.contains("admin-menu-open");
    body.classList.toggle("admin-menu-open", open);
    body.classList.remove("menu-open");
    menu.setAttribute("aria-expanded", String(open));
    menu.setAttribute("aria-label", open ? "Close admin navigation" : "Open admin navigation");
  };

  menu.addEventListener("click", toggleMenu);
  sidebar.querySelectorAll("a").forEach(link => link.addEventListener("click", closeMenu));
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeMenu();
  });
  document.addEventListener("click", event => {
    if (body.classList.contains("admin-menu-open") &&
        !sidebar.contains(event.target) && !menu.contains(event.target)) closeMenu();
  });
})();