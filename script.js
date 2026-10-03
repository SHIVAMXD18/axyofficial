const SUPABASE_URL = "https://vofdgimzcaynqywwzjln.supabase.co";
const SUPABASE_KEY = "sb_publishable_00_bnNvpyha0KQFikUgEvg_PLZcUrnb";

const ADMIN_USERNAME = "AKSHAY18";
const ADMIN_LOGIN_EMAIL = "axymanager@gmail.com";
const RADIO_PLAYLIST_ID = "PLgObA3pAqvOh87Z03QG8Z4xE-uqlAWSBy";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const $ = (selector) => document.querySelector(selector);

const page = document.body.dataset.page;

$("#year") && ($("#year").textContent = new Date().getFullYear());

/* Shared safe helpers */
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
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
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
    ? `<button class="button button-light delete-update" data-id="${escapeHtml(update.id)}" type="button">Delete</button>`
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

/* Public updates */
async function loadPublicUpdates() {
  const list = $("#updatesList");
  if (!list) return;

  const { data, error } = await supabaseClient
    .from("updates")
    .select("id, title, body, image_url, button_text, button_url, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    list.innerHTML = "<p>Updates could not be loaded right now.</p>";
    return;
  }

  if (!data.length) {
    list.innerHTML = "<p>No updates yet. Please check back later.</p>";
    return;
  }

  list.innerHTML = data.map((item) => updateCardHtml(item)).join("");
}

/* Menu on the home page */
if (page === "home") {
  const menuButton = $("#menuButton");
  const navLinks = $("#navLinks");

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

  loadPublicUpdates();
  startRadio();
}

/* Admin page */
if (page === "admin") {
  setupAdminPage();
}

function setupAdminPage() {
  const loginForm = $("#loginForm");
  const loginMessage = $("#loginMessage");
  const publisher = $("#publisher");
  const updateForm = $("#updateForm");
  const publishMessage = $("#publishMessage");
  const adminUpdatesList = $("#adminUpdatesList");
  const logoutButton = $("#logoutButton");

  async function loadAdminUpdates() {
    const { data, error } = await supabaseClient
      .from("updates")
      .select("id, title, body, image_url, button_text, button_url, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      adminUpdatesList.innerHTML = "<p>Could not load updates.</p>";
      return;
    }

    if (!data.length) {
      adminUpdatesList.innerHTML = "<p>No updates published yet.</p>";
      return;
    }

    adminUpdatesList.innerHTML = data.map((item) => updateCardHtml(item, true)).join("");
  }

  async function setAdminView(isLoggedIn) {
    loginForm.hidden = isLoggedIn;
    publisher.hidden = !isLoggedIn;
    if (isLoggedIn) await loadAdminUpdates();
  }

  supabaseClient.auth.getSession().then(({ data }) => {
    setAdminView(Boolean(data.session));
  });

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
      loginMessage.textContent = "Login failed. Check the Supabase Auth email and password.";
      return;
    }

    loginForm.reset();
    loginMessage.textContent = "";
    await setAdminView(Boolean(data.session));
    $("#publisher").scrollIntoView({ behavior: "smooth", block: "start" });
  });

  updateForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    publishMessage.textContent = "Publishing…";

    const title = $("#updateTitle").value.trim();
    const body = $("#updateBody").value.trim();
    const buttonText = $("#updateButtonText").value.trim();
    const rawButtonUrl = $("#updateButtonUrl").value.trim();
    const imageFile = $("#updateImage").files[0];

    let buttonUrl = null;

    if (buttonText || rawButtonUrl) {
      buttonUrl = safeWebUrl(rawButtonUrl);
      if (!buttonText || !buttonUrl) {
        publishMessage.textContent = "For a button, enter both its text and a valid http/https link.";
        return;
      }
    }

    let imageUrl = null;

    if (imageFile) {
      const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];

      if (!allowedTypes.includes(imageFile.type)) {
        publishMessage.textContent = "Choose a JPG, PNG, WEBP, or GIF image.";
        return;
      }

      if (imageFile.size > 5 * 1024 * 1024) {
        publishMessage.textContent = "Image must be smaller than 5 MB.";
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
        console.error("Image upload error:", uploadError);
        publishMessage.textContent = `Image upload failed: ${uploadError.message}`;
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
      console.error("Publish error:", error);
      publishMessage.textContent = "Publish failed. Check admin UID and Supabase policies.";
      return;
    }

    updateForm.reset();
    publishMessage.textContent = "Update published.";
    await loadAdminUpdates();
  });

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
  });

  logoutButton.addEventListener("click", async () => {
    await supabaseClient.auth.signOut();
    publishMessage.textContent = "";
    await setAdminView(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

/* YouTube playlist and current listener presence */
let radioPlayer;
let radioChannel;
let isListening = false;
let radioPresenceKey = `axy-${Date.now()}-${Math.random().toString(36).slice(2)}`;

function updateListenerCount() {
  const countElement = $("#listenerCount");
  if (!radioChannel || !countElement) return;

  const state = radioChannel.presenceState();
  const people = Object.values(state).flat();
  countElement.textContent = String(
    people.filter((person) => person.listening === true).length
  );
}

async function setListeningStatus(listening) {
  isListening = listening;

  if (radioChannel) {
    await radioChannel.track({ listening });
    updateListenerCount();
  }
}

function startRadioPresence() {
  radioChannel = supabaseClient.channel("axy-radio-listeners", {
    config: { presence: { key: radioPresenceKey } }
  });

  radioChannel
    .on("presence", { event: "sync" }, updateListenerCount)
    .subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await radioChannel.track({ listening: isListening });
        updateListenerCount();
      }
    });
}

let radioInitialized = false;

function createRadioPlayer() {
  if (radioInitialized || !window.YT || !window.YT.Player || !$("#ytPlayer")) return;
  radioInitialized = true;

  radioPlayer = new YT.Player("ytPlayer", {
    width: "100%",
    height: "100%",
    playerVars: {
      listType: "playlist",
      list: RADIO_PLAYLIST_ID,
      controls: 1,
      playsinline: 1
    },
    events: {
      onStateChange(event) {
        setListeningStatus(event.data === YT.PlayerState.PLAYING);
      }
    }
  });
}

function startRadio() {
  startRadioPresence();

  window.onYouTubeIframeAPIReady = createRadioPlayer;

  // Fallback in case the YouTube API loaded before this file's callback.
  if (window.YT && window.YT.Player) {
    createRadioPlayer();
  }
}

window.addEventListener("beforeunload", () => {
  if (radioChannel) radioChannel.untrack();
});
