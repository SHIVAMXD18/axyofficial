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
const updateImageInput = $("#updateImage");

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
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[character]);
}

function safeWebUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.href
      : null;
  } catch {
    return null;
  }
}

function updateCardHtml(update, showDelete = false) {
  const imageUrl = update.image_url ? safeWebUrl(update.image_url) : null;
  const imageHtml = imageUrl
    ? `<img class="update-image" src="${escapeHtml(imageUrl)}" alt="${escapeHtml(update.title)}">`
    : "";

  const buttonUrl = update.button_url ? safeWebUrl(update.button_url) : null;
  const ctaHtml = buttonUrl && update.button_text
    ? `<a class="update-cta" href="${escapeHtml(buttonUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(update.button_text)}</a>`
    : "";

  const deleteHtml = showDelete
    ? `<button class="button button-quiet delete-update" data-id="${escapeHtml(update.id)}" type="button">Delete</button>`
    : "";

  return `
    <article class="update-card">
      <h3>${escapeHtml(update.title)}</h3>
      ${imageHtml}
      <p>${escapeHtml(update.body).replace(/\n/g, "<br>")}</p>
      <time class="update-date" datetime="${escapeHtml(update.created_at)}">
        ${escapeHtml(new Date(update.created_at).toLocaleString())}
      </time>
      ${ctaHtml}
      ${deleteHtml}
    </article>
  `;
}

async function loadPublicUpdates() {
  const { data, error } = await supabaseClient
    .from("updates")
    .select("id, title, body, image_url, button_text, button_url, created_at")
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
    .select("id, title, body, image_url, button_text, button_url, created_at")
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
  const buttonText = $("#updateButtonText").value.trim();
  const rawButtonUrl = $("#updateButtonUrl").value.trim();
  const imageFile = updateImageInput.files[0];

  let buttonUrl = null;

  if (buttonText || rawButtonUrl) {
    buttonUrl = safeWebUrl(rawButtonUrl);

    if (!buttonText || !buttonUrl) {
      publishMessage.textContent =
        "Button ke liye text aur valid http/https link dono bharo.";
      return;
    }
  }

  let imageUrl = null;

  if (imageFile) {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif"
    ];

    if (!allowedTypes.includes(imageFile.type)) {
      publishMessage.textContent = "JPG, PNG, WEBP, ya GIF image choose karo.";
      return;
    }

    if (imageFile.size > 5 * 1024 * 1024) {
      publishMessage.textContent = "Image 5 MB se chhoti honi chahiye.";
      return;
    }

    const extension = imageFile.name.split(".").pop().toLowerCase();
    const filePath = `${Date.now()}-${crypto.randomUUID()}.${extension}`;

    const { error: uploadError } = await supabaseClient
      .storage
      .from("updates-images")
      .upload(filePath, imageFile, {
        cacheControl: "3600",
        upsert: false,
        contentType: imageFile.type
      });

if (uploadError) {
  console.error("Supabase image upload error:", uploadError);
  publishMessage.textContent = `Image upload error: ${uploadError.message}`;
  return;
}
    const { data: imageData } = supabaseClient
      .storage
      .from("updates-images")
      .getPublicUrl(filePath);

    imageUrl = imageData.publicUrl;
  }

  const { error } = await supabaseClient
    .from("updates")
    .insert({
      title,
      body,
      image_url: imageUrl,
      button_text: buttonText || null,
      button_url: buttonUrl
    });

  if (error) {
    publishMessage.textContent =
      "Publish nahi hua. Admin UID aur Supabase policies check karo.";
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
    publishMessage.textContent = "Update delete nahi hua.";
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
