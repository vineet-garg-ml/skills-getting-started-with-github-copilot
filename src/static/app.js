document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});

/* Fetch activities, render cards, populate select, handle signups */

const activitiesListEl = document.getElementById("activities-list");
const activitySelectEl = document.getElementById("activity");
const signupForm = document.getElementById("signup-form");
const messageEl = document.getElementById("message");

let activitiesCache = {}; // keep a local copy for quick UI updates

function showMessage(text, type = "info") {
  messageEl.className = `message ${type}`;
  messageEl.textContent = text;
  messageEl.classList.remove("hidden");
  setTimeout(() => {
    messageEl.classList.add("hidden");
  }, 4000);
}

function createActivityCard(name, data) {
  const container = document.createElement("div");
  container.className = "activity-card";
  container.dataset.activity = name;

  // title + count badge
  const title = document.createElement("h4");
  title.textContent = name;
  const countBadge = document.createElement("span");
  countBadge.className = "participant-count";
  countBadge.textContent = `${data.participants.length} participant${data.participants.length !== 1 ? "s" : ""}`;
  title.appendChild(countBadge);

  // description & schedule
  const desc = document.createElement("p");
  desc.textContent = data.description;
  const schedule = document.createElement("p");
  schedule.innerHTML = `<strong>Schedule:</strong> ${data.schedule}`;

  // participants section
  const participantsSection = document.createElement("div");
  participantsSection.className = "participants";
  const participantsHeading = document.createElement("h5");
  participantsHeading.textContent = "Participants";
  participantsSection.appendChild(participantsHeading);

  if (data.participants.length === 0) {
    const none = document.createElement("p");
    none.className = "info";
    none.textContent = "No participants yet.";
    participantsSection.appendChild(none);
  } else {
    const ul = document.createElement("ul");
    ul.className = "participants-list";
    data.participants.forEach((p) => {
      const li = document.createElement("li");
      li.textContent = p;
      ul.appendChild(li);
    });
    participantsSection.appendChild(ul);
  }

  container.appendChild(title);
  container.appendChild(desc);
  container.appendChild(schedule);
  container.appendChild(participantsSection);

  return container;
}

function renderActivities(activities) {
  activitiesListEl.innerHTML = "";
  activitySelectEl.querySelectorAll("option:not([value=''])")?.forEach(o => o.remove());

  activitiesCache = activities;

  Object.keys(activities).forEach((name) => {
    const card = createActivityCard(name, activities[name]);
    activitiesListEl.appendChild(card);

    const option = document.createElement("option");
    option.value = name;
    option.textContent = `${name} (${activities[name].participants.length})`;
    activitySelectEl.appendChild(option);
  });
}

async function loadActivities() {
  activitiesListEl.innerHTML = "<p>Loading activities...</p>";
  try {
    const res = await fetch("/activities");
    if (!res.ok) throw new Error("Failed to load activities");
    const data = await res.json();
    renderActivities(data);
  } catch (err) {
    activitiesListEl.innerHTML = `<p class="error">Could not load activities.</p>`;
    console.error(err);
  }
}

signupForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value.trim();
  const activity = document.getElementById("activity").value;

  if (!email || !activity) {
    showMessage("Please provide an email and select an activity.", "error");
    return;
  }

  try {
    const url = `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`;
    const res = await fetch(url, { method: "POST" });
    const body = await res.json();
    if (!res.ok) {
      showMessage(body.detail || "Sign up failed.", "error");
      return;
    }

    // Update local cache and UI
    const card = document.querySelector(`.activity-card[data-activity="${CSS.escape(activity)}"]`);
    // If the server added successfully, append to participants list
    if (activitiesCache[activity]) {
      activitiesCache[activity].participants.push(email);
      // Update badge text
      const badge = card.querySelector(".participant-count");
      badge.textContent = `${activitiesCache[activity].participants.length} participant${activitiesCache[activity].participants.length !== 1 ? "s" : ""}`;

      // Replace participants list area
      const participantsSection = card.querySelector(".participants");
      participantsSection.innerHTML = "";
      const participantsHeading = document.createElement("h5");
      participantsHeading.textContent = "Participants";
      participantsSection.appendChild(participantsHeading);
      const ul = document.createElement("ul");
      ul.className = "participants-list";
      activitiesCache[activity].participants.forEach((p) => {
        const li = document.createElement("li");
        li.textContent = p;
        ul.appendChild(li);
      });
      participantsSection.appendChild(ul);

      // Update the activity select option label
      const opt = Array.from(activitySelectEl.options).find(o => o.value === activity);
      if (opt) opt.textContent = `${activity} (${activitiesCache[activity].participants.length})`;

      showMessage(body.message || "Signed up successfully.", "success");
      signupForm.reset();
    } else {
      // Fallback: reload everything
      await loadActivities();
      showMessage(body.message || "Signed up successfully.", "success");
      signupForm.reset();
    }
  } catch (err) {
    console.error(err);
    showMessage("An unexpected error occurred.", "error");
  }
});

// Initial load
loadActivities();
