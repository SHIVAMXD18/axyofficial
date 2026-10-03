const SUPABASE_URL = "https://vofdgimzcaynqywwzjln.supabase.co";
const SUPABASE_KEY = "sb_publishable_00_bnNvpyha0KQFikUgEvg_PLZcUrnb";
const ADMIN_USERNAME = "AKSHAY18";
const ADMIN_LOGIN_EMAIL = "axymanager@gmail.com";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

const $ = (selector) => document.querySelector(selector);

const menuButton = $("#menuButton");
const navLinks = $("#navLinks");
const loginForm = $("#loginForm");
const loginMessage = $("#loginMessage");
const publisher = $("#publisher");
const updateForm = $("#updateForm");
const publishMessage = $("#publishMessage");
const updatesList = $("#updatesList");
const adminUpdatesList = $("#adminUpdatesList");
const logoutButton = $("#logoutButton");

$("#year").textContent = new Date().getFullYear();

if (menuButton && navLinks) {
  menuButton.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("open");
    menuButton.setAttribute("aria-expanded", String(isOpen));
  });

  navLinks.addEventListener("click", (event) => {
    if (event.target.closest("a")) {
      navLinks.classList.remove("open");
      menuButton.setAttribute("aria-expanded", "false");
    }
  });
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[character]);
}

function updateCardHtml(update, showDelete = false) {
  const deleteButton = showDelete
    ? `<button class="button button-quiet delete-update"
         data-id="${escapeHtml(update.id)}" type="button">Delete</button>`
    : "";

  return `
    <article class="update-card">
      <h3>${escapeHtml(update.title)}</h3>
      <p>${escapeHtml(update.body).replace(/\n/g, "<br>")}</p>
      <time class="update-date" datetime="${escapeHtml(update.created_at)}">
        ${escapeHtml(new Date(update.created_at).toLocaleString())}
      </time>
      ${deleteButton}
    </article>
  `;
}

async function loadPublicUpdates() {
  const { data, error } = await supabaseClient
    .from("updates")
    .select("id, title, body, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    updatesList.innerHTML = "<p>Updates could not be loaded right now.</p>";
    return;
  }

  if (!data.length) {
    updatesList.innerHTML = "<p>No updates yet. Please check back later.</p>";
    return;
  }

  updatesList.innerHTML = data.map((item) => updateCardHtml(item)).join("");
}

async function loadAdminUpdates() {
  const { data, error } = await supabaseClient
    .from("updates")
    .select("id, title, body, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    adminUpdatesList.innerHTML = "<p>Could not load published updates.</p>";
    return;
  }

  if (!data.length) {
    adminUpdatesList.innerHTML = "<p>No updates published yet.</p>";
    return;
  }

  adminUpdatesList.innerHTML = data
    .map((item) => updateCardHtml(item, true))
    .join("");
}

async function setAdminView(isLoggedIn) {
  loginForm.hidden = isLoggedIn;
  publisher.hidden = !isLoggedIn;

  if (isLoggedIn) {
    await loadAdminUpdates();
  }
}

async function checkExistingSession() {
  const { data } = await supabaseClient.auth.getSession();
  await setAdminView(Boolean(data.session));
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  loginMessage.textContent = "Signing in…";

  const username = $("#adminUsername").value.trim();
  const password = $("#adminPassword").value;

  if (username.toLowerCase() !== ADMIN_USERNAME.toLowerCase()) {
    loginMessage.textContent = "Invalid username or password.";
    return;
  }

  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email: ADMIN_LOGIN_EMAIL,
    password
  });

  if (error) {
    loginMessage.textContent =
      "Login failed. Check the Supabase Auth email and password.";
    return;
  }

  loginForm.reset();
  loginMessage.textContent = "";
  await setAdminView(Boolean(data.session));

  // Login ke baad Admin Panel aur update form screen par lao.
  $("#admin").scrollIntoView({ behavior: "smooth", block: "start" });

  setTimeout(() => {
    $("#updateTitle").scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
    $("#updateTitle").focus({ preventScroll: true });
  }, 450);
});

updateForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  publishMessage.textContent = "Publishing…";

  const title = $("#updateTitle").value.trim();
  const body = $("#updateBody").value.trim();

  const { error } = await supabaseClient
    .from("updates")
    .insert({ title, body });

  if (error) {
    publishMessage.textContent =
      "Could not publish. Confirm the account UID is in site_admins.";
    return;
  }

  updateForm.reset();
  publishMessage.textContent = "Update published.";
  await loadAdminUpdates();
  await loadPublicUpdates();
});

adminUpdatesList.addEventListener("click", async (event) => {
  const button = event.target.closest(".delete-update");
  if (!button) return;

  const { error } = await supabaseClient
    .from("updates")
    .delete()
    .eq("id", button.dataset.id);

  if (error) {
    publishMessage.textContent = "Could not delete this update.";
    return;
  }

  publishMessage.textContent = "Update deleted.";
  await loadAdminUpdates();
  await loadPublicUpdates();
});

logoutButton.addEventListener("click", async () => {
  await supabaseClient.auth.signOut();
  publishMessage.textContent = "";
  await setAdminView(false);
  $("#admin").scrollIntoView({ behavior: "smooth", block: "start" });
});

loadPublicUpdates();
checkExistingSession();
