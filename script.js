const SUPABASE_URL = "YOUR_SUPABASE_PROJECT_URL";
const SUPABASE_KEY = "YOUR_SUPABASE_PUBLISHABLE_KEY";

// Supabase Auth user ka email yahan set karein.
const ADMIN_LOGIN_EMAIL = "axymanager@gmail.com";

// Login form mein yeh username accept hoga.
// Password check Supabase Auth karta hai; password yahan store nahi hota.
const ADMIN_USERNAME = "AXYASKHAY18";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

const menuButton = document.querySelector("#menuButton");
const navLinks = document.querySelector("#navLinks");
const yearElement = document.querySelector("#year");

const loginForm = document.querySelector("#loginForm");
const loginMessage = document.querySelector("#loginMessage");
const publisher = document.querySelector("#publisher");
const updateForm = document.querySelector("#updateForm");
const publishMessage = document.querySelector("#publishMessage");
const updatesList = document.querySelector("#updatesList");
const adminUpdatesList = document.querySelector("#adminUpdatesList");
const logoutButton = document.querySelector("#logoutButton");

if (yearElement) {
  yearElement.textContent = new Date().getFullYear();
}

if (menuButton && navLinks) {
  menuButton.addEventListener("click", () => {
    const open = navLinks.classList.toggle("open");
    menuButton.setAttribute("aria-expanded", String(open));
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

function formatDate(dateValue) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(dateValue));
}

function makeUpdateCard(update, includeDelete = false) {
  const deleteButton = includeDelete
    ? `<button class="button button-quiet delete-update"
         data-id="${escapeHtml(update.id)}" type="button">Delete</button>`
    : "";

  return `
    <article class="update-card">
      <h3>${escapeHtml(update.title)}</h3>
      <p>${escapeHtml(update.body).replace(/\n/g, "<br>")}</p>
      <time class="update-date" datetime="${escapeHtml(update.created_at)}">
        ${escapeHtml(formatDate(update.created_at))}
      </time>
      ${deleteButton}
    </article>
  `;
}

async function loadPublicUpdates() {
  if (!updatesList) return;

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

  updatesList.innerHTML = data.map((item) => makeUpdateCard(item)).join("");
}

async function loadAdminUpdates() {
  if (!adminUpdatesList) return;

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
    .map((item) => makeUpdateCard(item, true))
    .join("");
}

async function showLoginState() {
  const { data } = await supabaseClient.auth.getSession();
  const session = data.session;

  if (publisher) publisher.hidden = !session;
  if (loginForm) loginForm.hidden = Boolean(session);

  if (session) {
    await loadAdminUpdates();
  }
}

if (loginForm) {
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    loginMessage.textContent = "Signing in…";

    const username = document.querySelector("#adminUsername").value.trim();
    const password = document.querySelector("#adminPassword").value;

    if (username.toLowerCase() !== ADMIN_USERNAME.toLowerCase()) {
      loginMessage.textContent = "Invalid username or password.";
      return;
    }

    const { error } = await supabaseClient.auth.signInWithPassword({
      email: ADMIN_LOGIN_EMAIL,
      password
    });

    if (error) {
      loginMessage.textContent = "Login failed. Check your username and password.";
      return;
    }

    loginMessage.textContent = "";
    loginForm.reset();
    await showLoginState();
  });
}

if (updateForm) {
  updateForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    publishMessage.textContent = "Publishing…";

    const title = document.querySelector("#updateTitle").value.trim();
    const body = document.querySelector("#updateBody").value.trim();

    const { error } = await supabaseClient
      .from("updates")
      .insert({ title, body });

    if (error) {
      publishMessage.textContent =
        "Could not publish. Check that this account is an authorized admin.";
      return;
    }

    updateForm.reset();
    publishMessage.textContent = "Update published.";
    await loadAdminUpdates();
    await loadPublicUpdates();
  });
}

if (adminUpdatesList) {
  adminUpdatesList.addEventListener("click", async (event) => {
    const button = event.target.closest(".delete-update");
    if (!button) return;

    const { error } = await supabaseClient
      .from("updates")
      .delete()
      .eq("id", button.dataset.id);

    if (error) {
      publishMessage.textContent = "Could not delete that update.";
      return;
    }

    publishMessage.textContent = "Update deleted.";
    await loadAdminUpdates();
    await loadPublicUpdates();
  });
}

if (logoutButton) {
  logoutButton.addEventListener("click", async () => {
    await supabaseClient.auth.signOut();
    publishMessage.textContent = "";
    await showLoginState();
  });
}

supabaseClient.auth.onAuthStateChange(() => {
  showLoginState();
});

loadPublicUpdates();
showLoginState();
