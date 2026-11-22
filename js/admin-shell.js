/* Shared navigation behaviour for URWA Admin pages. */
(() => {
  const body = document.body;
  if (!body || body.dataset.urwaRole !== "admin") return;
  const current = location.pathname.split("/").pop() || "admin-dashboard.html";
  document.querySelectorAll(".sidebar .nav a, .sidebar .nav-link").forEach(link => {
    const href = link.getAttribute("href") || "";
    const page = href.split("#")[0].split("?")[0].split("/").pop();
    link.classList.toggle("active", page === current);
    if (page === current) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
  const topbar = document.querySelector(".topbar");
  const sidebar = document.querySelector(".sidebar");
  if (!topbar || !sidebar) return;
  if (!topbar.querySelector(".admin-shell-menu")) {
    const menu = document.createElement("button");
    menu.type = "button";
    menu.className = "admin-shell-menu";
    menu.setAttribute("aria-label", "Open admin navigation");
    menu.setAttribute("aria-expanded", "false");
    menu.textContent = "☰";
    menu.style.cssText = "display:none;width:36px;height:36px;place-items:center;border:1px solid #e7dfcf;border-radius:8px;background:#e3f0ea;color:#0e4a40;font-size:18px;cursor:pointer;flex:none";
    topbar.insertBefore(menu, topbar.firstChild);
    menu.addEventListener("click", () => {
      const open = body.classList.toggle("admin-menu-open");
      menu.setAttribute("aria-expanded", String(open));
      menu.setAttribute("aria-label", open ? "Close admin navigation" : "Open admin navigation");
    });
    sidebar.querySelectorAll("a").forEach(link => link.addEventListener("click", () => {
      body.classList.remove("admin-menu-open");
      menu.setAttribute("aria-expanded", "false");
    }));
    document.addEventListener("keydown", event => {
      if (event.key === "Escape") {
        body.classList.remove("admin-menu-open");
        menu.setAttribute("aria-expanded", "false");
      }
    });
    body.addEventListener("click", event => {
      if (body.classList.contains("admin-menu-open") && !sidebar.contains(event.target) && !menu.contains(event.target)) {
        body.classList.remove("admin-menu-open");
        menu.setAttribute("aria-expanded", "false");
      }
    });
  }
})();
