const menuButton = document.querySelector("#menuButton");
const navLinks = document.querySelector("#navLinks");
const contactForm = document.querySelector("#contactForm");
const formStatus = document.querySelector("#formStatus");
const yearElement = document.querySelector("#year");

// Keep the footer year current.
if (yearElement) {
  yearElement.textContent = new Date().getFullYear();
}

// Open and close the mobile navigation.
if (menuButton && navLinks) {
  menuButton.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("open");

    menuButton.setAttribute("aria-expanded", String(isOpen));
    menuButton.setAttribute(
      "aria-label",
      isOpen ? "Close navigation menu" : "Open navigation menu"
    );
  });

  // Close the mobile menu after a navigation link is selected.
  navLinks.addEventListener("click", (event) => {
    if (event.target.closest("a")) {
      navLinks.classList.remove("open");
      menuButton.setAttribute("aria-expanded", "false");
      menuButton.setAttribute("aria-label", "Open navigation menu");
    }
  });
}

// Open an email draft with the enquiry details.
// Change this address to the email where you want to receive enquiries.
if (contactForm) {
  contactForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(contactForm);
    const name = formData.get("name");
    const email = formData.get("email");
    const phone = formData.get("phone") || "Not provided";
    const message = formData.get("message");

    const subject = encodeURIComponent(`Travel enquiry from ${name}`);
    const body = encodeURIComponent(
      `Name: ${name}\nEmail: ${email}\nPhone: ${phone}\n\nTrip details:\n${message}`
    );

    // Replace with your own business email address.
    window.location.href =
      `mailto:YOUR_EMAIL@example.com?subject=${subject}&body=${body}`;

    if (formStatus) {
      formStatus.textContent =
        "Your email app should open with the enquiry ready to send.";
    }
  });
}
