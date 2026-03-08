document.addEventListener("DOMContentLoaded", () => {
  // DOM elements
  const activitiesList = document.getElementById("activities-list");
  const messageDiv = document.getElementById("message");
  const registrationModal = document.getElementById("registration-modal");
  const modalActivityName = document.getElementById("modal-activity-name");
  const signupForm = document.getElementById("signup-form");
  const activityInput = document.getElementById("activity");
  const closeRegistrationModal = document.querySelector(".close-modal");

  // Search and filter elements
  const searchInput = document.getElementById("activity-search");
  const searchButton = document.getElementById("search-button");
  const categoryFilters = document.querySelectorAll(".category-filter");
  const dayFilters = document.querySelectorAll(".day-filter");
  const timeFilters = document.querySelectorAll(".time-filter");

  // Authentication elements
  const loginButton = document.getElementById("login-button");
  const userInfo = document.getElementById("user-info");
  const displayName = document.getElementById("display-name");
  const logoutButton = document.getElementById("logout-button");
  const loginModal = document.getElementById("login-modal");
  const loginForm = document.getElementById("login-form");
  const closeLoginModal = document.querySelector(".close-login-modal");
  const loginMessage = document.getElementById("login-message");

  // Announcement elements
  const announcementBanner = document.getElementById("announcement-banner");
  const announcementItems = document.getElementById("announcement-items");
  const manageAnnouncementsButton = document.getElementById(
    "manage-announcements-button"
  );
  const announcementModal = document.getElementById("announcement-modal");
  const closeAnnouncementModal = document.querySelector(
    ".close-announcement-modal"
  );
  const announcementForm = document.getElementById("announcement-form");
  const announcementIdInput = document.getElementById("announcement-id");
  const announcementMessageInput = document.getElementById(
    "announcement-message"
  );
  const announcementStartDateInput = document.getElementById(
    "announcement-start-date"
  );
  const announcementExpirationDateInput = document.getElementById(
    "announcement-expiration-date"
  );
  const announcementResetButton = document.getElementById(
    "announcement-reset-button"
  );
  const announcementList = document.getElementById("announcement-list");
  const announcementAdminMessage = document.getElementById(
    "announcement-admin-message"
  );

  // Activity categories with corresponding colors
  const activityTypes = {
    sports: { label: "Sports", color: "#e8f5e9", textColor: "#2e7d32" },
    arts: { label: "Arts", color: "#f3e5f5", textColor: "#7b1fa2" },
    academic: { label: "Academic", color: "#e3f2fd", textColor: "#1565c0" },
    community: { label: "Community", color: "#fff3e0", textColor: "#e65100" },
    technology: { label: "Technology", color: "#e8eaf6", textColor: "#3949ab" },
  };

  // State for activities and filters
  let allActivities = {};
  let currentFilter = "all";
  let searchQuery = "";
  let currentDay = "";
  let currentTimeRange = "";
  let managedAnnouncements = [];

  // Authentication state
  let currentUser = null;

  // Time range mappings for the dropdown
  const timeRanges = {
    morning: { start: "06:00", end: "08:00" },
    afternoon: { start: "15:00", end: "18:00" },
    weekend: { days: ["Saturday", "Sunday"] },
  };

  function escapeHtml(value) {
    const div = document.createElement("div");
    div.textContent = value;
    return div.innerHTML;
  }

  function toIsoDate(value) {
    return value instanceof Date
      ? value.toISOString().slice(0, 10)
      : String(value).slice(0, 10);
  }

  function formatDateLabel(dateValue) {
    if (!dateValue) {
      return "Not set";
    }

    const date = new Date(`${toIsoDate(dateValue)}T00:00:00`);
    if (Number.isNaN(date.getTime())) {
      return dateValue;
    }

    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  }

  function getAnnouncementStatus(announcement) {
    const today = toIsoDate(new Date());
    const startDate = announcement.start_date || "";
    const endDate = announcement.expiration_date;

    if (startDate && startDate > today) {
      return "Scheduled";
    }

    if (endDate < today) {
      return "Expired";
    }

    return "Active";
  }

  function setAnnouncementMessage(
    text,
    type = "info",
    autoHide = true,
    target = announcementAdminMessage
  ) {
    target.textContent = text;
    target.className = `message ${type}`;
    target.classList.remove("hidden");

    if (autoHide) {
      setTimeout(() => {
        target.classList.add("hidden");
      }, 4000);
    }
  }

  async function fetchActiveAnnouncements() {
    try {
      const response = await fetch("/announcements");
      if (!response.ok) {
        throw new Error("Unable to fetch announcements");
      }

      const announcements = await response.json();
      renderAnnouncementBanner(announcements);
    } catch (error) {
      announcementBanner.classList.add("hidden");
      console.error("Error loading announcements:", error);
    }
  }

  function renderAnnouncementBanner(announcements) {
    if (!announcements || announcements.length === 0) {
      announcementBanner.classList.add("hidden");
      announcementItems.innerHTML = "";
      return;
    }

    announcementItems.innerHTML = announcements
      .map(
        (announcement) => `
          <article class="announcement-chip">
            <div class="announcement-chip-icon" aria-hidden="true">📢</div>
            <div class="announcement-chip-content">
              <p>${escapeHtml(announcement.message)}</p>
              <small>
                ${
                  announcement.start_date
                    ? `Starts ${formatDateLabel(announcement.start_date)} • `
                    : ""
                }Until ${formatDateLabel(announcement.expiration_date)}
              </small>
            </div>
          </article>
        `
      )
      .join("");

    announcementBanner.classList.remove("hidden");
  }

  async function fetchManagedAnnouncements() {
    if (!currentUser) {
      return;
    }

    try {
      const response = await fetch(
        `/announcements/manage?teacher_username=${encodeURIComponent(
          currentUser.username
        )}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to load announcements");
      }

      managedAnnouncements = data;
      renderManagedAnnouncementList();
    } catch (error) {
      setAnnouncementMessage(error.message, "error", false);
      console.error("Error loading announcement manager:", error);
    }
  }

  function renderManagedAnnouncementList() {
    announcementList.innerHTML = "";

    if (!managedAnnouncements.length) {
      announcementList.innerHTML =
        '<li class="empty-announcement">No announcements yet. Create one to get started.</li>';
      return;
    }

    managedAnnouncements.forEach((announcement) => {
      const li = document.createElement("li");
      li.className = "announcement-row";

      const status = getAnnouncementStatus(announcement);
      const safeMessage = escapeHtml(announcement.message);
      const startDateText = announcement.start_date
        ? formatDateLabel(announcement.start_date)
        : "No start date";

      li.innerHTML = `
        <div class="announcement-row-main">
          <p>${safeMessage}</p>
          <div class="announcement-meta">
            <span class="announcement-status ${status.toLowerCase()}">${status}</span>
            <span>Start: ${startDateText}</span>
            <span>Expires: ${formatDateLabel(announcement.expiration_date)}</span>
          </div>
        </div>
        <div class="announcement-row-actions">
          <button class="edit-announcement-button" data-id="${announcement.id}">Edit</button>
          <button class="delete-announcement-button" data-id="${announcement.id}">Delete</button>
        </div>
      `;

      announcementList.appendChild(li);
    });

    announcementList
      .querySelectorAll(".edit-announcement-button")
      .forEach((button) => {
        button.addEventListener("click", () => {
          const target = managedAnnouncements.find(
            (item) => item.id === button.dataset.id
          );
          if (target) {
            populateAnnouncementForm(target);
          }
        });
      });

    announcementList
      .querySelectorAll(".delete-announcement-button")
      .forEach((button) => {
        button.addEventListener("click", () => {
          const target = managedAnnouncements.find(
            (item) => item.id === button.dataset.id
          );
          if (!target) {
            return;
          }

          showConfirmationDialog(
            "Delete this announcement? This action cannot be undone.",
            () => deleteAnnouncement(target.id)
          );
        });
      });
  }

  function populateAnnouncementForm(announcement) {
    announcementIdInput.value = announcement.id;
    announcementMessageInput.value = announcement.message;
    announcementStartDateInput.value = announcement.start_date || "";
    announcementExpirationDateInput.value = announcement.expiration_date;
    announcementMessageInput.focus();
  }

  function resetAnnouncementForm() {
    announcementIdInput.value = "";
    announcementForm.reset();
  }

  function openAnnouncementModal() {
    if (!currentUser) {
      showMessage("Please sign in to manage announcements.", "error");
      return;
    }

    announcementModal.classList.remove("hidden");
    setTimeout(() => {
      announcementModal.classList.add("show");
    }, 10);

    announcementAdminMessage.classList.add("hidden");
    resetAnnouncementForm();
    fetchManagedAnnouncements();
  }

  function closeAnnouncementModalHandler() {
    announcementModal.classList.remove("show");
    setTimeout(() => {
      announcementModal.classList.add("hidden");
      resetAnnouncementForm();
    }, 300);
  }

  async function saveAnnouncement(event) {
    event.preventDefault();

    if (!currentUser) {
      setAnnouncementMessage("Authentication required.", "error", false);
      return;
    }

    const payload = {
      message: announcementMessageInput.value.trim(),
      start_date: announcementStartDateInput.value || null,
      expiration_date: announcementExpirationDateInput.value,
    };

    if (!payload.expiration_date) {
      setAnnouncementMessage("Expiration date is required.", "error", false);
      return;
    }

    const expirationDate = new Date(payload.expiration_date);
    if (isNaN(expirationDate.getTime())) {
      setAnnouncementMessage("Invalid expiration date.", "error", false);
      return;
    }

    const startDate = payload.start_date ? new Date(payload.start_date) : null;
    if (startDate && isNaN(startDate.getTime())) {
      setAnnouncementMessage("Invalid start date.", "error", false);
      return;
    }

    if (startDate && startDate > expirationDate) {
      setAnnouncementMessage(
        "Start date cannot be later than expiration date.",
        "error",
        false
      );
      return;
    }

    const editingId = announcementIdInput.value;
    const method = editingId ? "PUT" : "POST";
    const endpoint = editingId
      ? `/announcements/${encodeURIComponent(editingId)}`
      : "/announcements";

    try {
      const response = await fetch(
        `${endpoint}?teacher_username=${encodeURIComponent(currentUser.username)}`,
        {
          method,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || "Failed to save announcement");
      }

      setAnnouncementMessage(
        editingId ? "Announcement updated." : "Announcement created.",
        "success"
      );
      resetAnnouncementForm();
      await fetchManagedAnnouncements();
      await fetchActiveAnnouncements();
    } catch (error) {
      setAnnouncementMessage(error.message, "error", false);
      console.error("Error saving announcement:", error);
    }
  }

  async function deleteAnnouncement(announcementId) {
    if (!currentUser) {
      setAnnouncementMessage("Authentication required.", "error", false);
      return;
    }

    try {
      const response = await fetch(
        `/announcements/${encodeURIComponent(
          announcementId
        )}?teacher_username=${encodeURIComponent(currentUser.username)}`,
        { method: "DELETE" }
      );

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.detail || "Failed to delete announcement");
      }

      setAnnouncementMessage("Announcement deleted.", "success");
      await fetchManagedAnnouncements();
      await fetchActiveAnnouncements();
      if (announcementIdInput.value === announcementId) {
        resetAnnouncementForm();
      }
    } catch (error) {
      setAnnouncementMessage(error.message, "error", false);
      console.error("Error deleting announcement:", error);
    }
  }

  function initializeFilters() {
    const activeDayFilter = document.querySelector(".day-filter.active");
    if (activeDayFilter) {
      currentDay = activeDayFilter.dataset.day;
    }

    const activeTimeFilter = document.querySelector(".time-filter.active");
    if (activeTimeFilter) {
      currentTimeRange = activeTimeFilter.dataset.time;
    }
  }

  function setDayFilter(day) {
    currentDay = day;

    dayFilters.forEach((btn) => {
      if (btn.dataset.day === day) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });

    fetchActivities();
  }

  function setTimeRangeFilter(timeRange) {
    currentTimeRange = timeRange;

    timeFilters.forEach((btn) => {
      if (btn.dataset.time === timeRange) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });

    fetchActivities();
  }

  function checkAuthentication() {
    const savedUser = localStorage.getItem("currentUser");
    if (savedUser) {
      try {
        currentUser = JSON.parse(savedUser);
        updateAuthUI();
        validateUserSession(currentUser.username);
      } catch (error) {
        console.error("Error parsing saved user", error);
        logout();
      }
    }

    updateAuthBodyClass();
  }

  async function validateUserSession(username) {
    try {
      const response = await fetch(
        `/auth/check-session?username=${encodeURIComponent(username)}`
      );

      if (!response.ok) {
        logout();
        return;
      }

      const userData = await response.json();
      currentUser = userData;
      localStorage.setItem("currentUser", JSON.stringify(userData));
      updateAuthUI();
    } catch (error) {
      console.error("Error validating session:", error);
    }
  }

  function updateAuthUI() {
    if (currentUser) {
      loginButton.classList.add("hidden");
      userInfo.classList.remove("hidden");
      displayName.textContent = currentUser.display_name;
      manageAnnouncementsButton.classList.remove("hidden");
    } else {
      loginButton.classList.remove("hidden");
      userInfo.classList.add("hidden");
      displayName.textContent = "";
      manageAnnouncementsButton.classList.add("hidden");
      closeAnnouncementModalHandler();
    }

    updateAuthBodyClass();
    fetchActivities();
  }

  function updateAuthBodyClass() {
    if (currentUser) {
      document.body.classList.remove("not-authenticated");
    } else {
      document.body.classList.add("not-authenticated");
    }
  }

  async function login(username, password) {
    try {
      const response = await fetch(
        `/auth/login?username=${encodeURIComponent(
          username
        )}&password=${encodeURIComponent(password)}`,
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        showLoginMessage(data.detail || "Invalid username or password", "error");
        return false;
      }

      currentUser = data;
      localStorage.setItem("currentUser", JSON.stringify(data));
      updateAuthUI();
      closeLoginModalHandler();
      showMessage(`Welcome, ${currentUser.display_name}!`, "success");
      return true;
    } catch (error) {
      console.error("Error during login:", error);
      showLoginMessage("Login failed. Please try again.", "error");
      return false;
    }
  }

  function logout() {
    currentUser = null;
    localStorage.removeItem("currentUser");
    updateAuthUI();
    showMessage("You have been logged out.", "info");
  }

  function showLoginMessage(text, type) {
    loginMessage.textContent = text;
    loginMessage.className = `message ${type}`;
    loginMessage.classList.remove("hidden");
  }

  function openLoginModal() {
    loginModal.classList.remove("hidden");
    loginModal.classList.add("show");
    loginMessage.classList.add("hidden");
    loginForm.reset();
  }

  function closeLoginModalHandler() {
    loginModal.classList.remove("show");
    setTimeout(() => {
      loginModal.classList.add("hidden");
      loginForm.reset();
    }, 300);
  }

  loginButton.addEventListener("click", openLoginModal);
  logoutButton.addEventListener("click", logout);
  closeLoginModal.addEventListener("click", closeLoginModalHandler);
  manageAnnouncementsButton.addEventListener("click", openAnnouncementModal);
  closeAnnouncementModal.addEventListener("click", closeAnnouncementModalHandler);
  announcementForm.addEventListener("submit", saveAnnouncement);
  announcementResetButton.addEventListener("click", resetAnnouncementForm);

  window.addEventListener("click", (event) => {
    if (event.target === loginModal) {
      closeLoginModalHandler();
    }

    if (event.target === registrationModal) {
      closeRegistrationModalHandler();
    }

    if (event.target === announcementModal) {
      closeAnnouncementModalHandler();
    }
  });

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    await login(username, password);
  });

  function showLoadingSkeletons() {
    activitiesList.innerHTML = "";

    for (let i = 0; i < 9; i += 1) {
      const skeletonCard = document.createElement("div");
      skeletonCard.className = "skeleton-card";
      skeletonCard.innerHTML = `
        <div class="skeleton-line skeleton-title"></div>
        <div class="skeleton-line"></div>
        <div class="skeleton-line skeleton-text short"></div>
        <div style="margin-top: 8px;">
          <div class="skeleton-line" style="height: 6px;"></div>
          <div class="skeleton-line skeleton-text short" style="height: 8px; margin-top: 3px;"></div>
        </div>
        <div style="margin-top: auto;">
          <div class="skeleton-line" style="height: 24px; margin-top: 8px;"></div>
        </div>
      `;
      activitiesList.appendChild(skeletonCard);
    }
  }

  function formatSchedule(details) {
    if (details.schedule_details) {
      const days = details.schedule_details.days.join(", ");

      const formatTime = (time24) => {
        const [hours, minutes] = time24.split(":").map((num) => parseInt(num, 10));
        const period = hours >= 12 ? "PM" : "AM";
        const displayHours = hours % 12 || 12;
        return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
      };

      const startTime = formatTime(details.schedule_details.start_time);
      const endTime = formatTime(details.schedule_details.end_time);

      return `${days}, ${startTime} - ${endTime}`;
    }

    return details.schedule;
  }

  function getActivityType(activityName, description) {
    const name = activityName.toLowerCase();
    const desc = description.toLowerCase();

    if (
      name.includes("soccer") ||
      name.includes("basketball") ||
      name.includes("sport") ||
      name.includes("fitness") ||
      desc.includes("team") ||
      desc.includes("game") ||
      desc.includes("athletic")
    ) {
      return "sports";
    }

    if (
      name.includes("art") ||
      name.includes("music") ||
      name.includes("theater") ||
      name.includes("drama") ||
      desc.includes("creative") ||
      desc.includes("paint")
    ) {
      return "arts";
    }

    if (
      name.includes("science") ||
      name.includes("math") ||
      name.includes("academic") ||
      name.includes("study") ||
      name.includes("olympiad") ||
      desc.includes("learning") ||
      desc.includes("education") ||
      desc.includes("competition")
    ) {
      return "academic";
    }

    if (
      name.includes("volunteer") ||
      name.includes("community") ||
      desc.includes("service") ||
      desc.includes("volunteer")
    ) {
      return "community";
    }

    if (
      name.includes("computer") ||
      name.includes("coding") ||
      name.includes("tech") ||
      name.includes("robotics") ||
      desc.includes("programming") ||
      desc.includes("technology") ||
      desc.includes("digital") ||
      desc.includes("robot")
    ) {
      return "technology";
    }

    return "academic";
  }

  async function fetchActivities() {
    showLoadingSkeletons();

    try {
      const queryParams = [];

      if (currentDay) {
        queryParams.push(`day=${encodeURIComponent(currentDay)}`);
      }

      if (currentTimeRange) {
        const range = timeRanges[currentTimeRange];

        if (currentTimeRange !== "weekend" && range) {
          queryParams.push(`start_time=${encodeURIComponent(range.start)}`);
          queryParams.push(`end_time=${encodeURIComponent(range.end)}`);
        }
      }

      const queryString = queryParams.length > 0 ? `?${queryParams.join("&")}` : "";
      const response = await fetch(`/activities${queryString}`);
      const activities = await response.json();

      allActivities = activities;
      displayFilteredActivities();
    } catch (error) {
      activitiesList.innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  function displayFilteredActivities() {
    activitiesList.innerHTML = "";

    const filteredActivities = {};

    Object.entries(allActivities).forEach(([name, details]) => {
      const activityType = getActivityType(name, details.description);

      if (currentFilter !== "all" && activityType !== currentFilter) {
        return;
      }

      if (currentTimeRange === "weekend" && details.schedule_details) {
        const activityDays = details.schedule_details.days;
        const isWeekendActivity = activityDays.some((day) =>
          timeRanges.weekend.days.includes(day)
        );

        if (!isWeekendActivity) {
          return;
        }
      }

      const searchableContent = [
        name.toLowerCase(),
        details.description.toLowerCase(),
        formatSchedule(details).toLowerCase(),
      ].join(" ");

      if (searchQuery && !searchableContent.includes(searchQuery.toLowerCase())) {
        return;
      }

      filteredActivities[name] = details;
    });

    if (Object.keys(filteredActivities).length === 0) {
      activitiesList.innerHTML = `
        <div class="no-results">
          <h4>No activities found</h4>
          <p>Try adjusting your search or filter criteria</p>
        </div>
      `;
      return;
    }

    Object.entries(filteredActivities).forEach(([name, details]) => {
      renderActivityCard(name, details);
    });
  }

  function renderActivityCard(name, details) {
    const activityCard = document.createElement("div");
    activityCard.className = "activity-card";

    const totalSpots = details.max_participants;
    const takenSpots = details.participants.length;
    const spotsLeft = totalSpots - takenSpots;
    const capacityPercentage = (takenSpots / totalSpots) * 100;
    const isFull = spotsLeft <= 0;

    let capacityStatusClass = "capacity-available";
    if (isFull) {
      capacityStatusClass = "capacity-full";
    } else if (capacityPercentage >= 75) {
      capacityStatusClass = "capacity-near-full";
    }

    const activityType = getActivityType(name, details.description);
    const typeInfo = activityTypes[activityType];
    const formattedSchedule = formatSchedule(details);

    const tagHtml = `
      <span class="activity-tag" style="background-color: ${typeInfo.color}; color: ${typeInfo.textColor}">
        ${typeInfo.label}
      </span>
    `;

    const capacityIndicator = `
      <div class="capacity-container ${capacityStatusClass}">
        <div class="capacity-bar-bg">
          <div class="capacity-bar-fill" style="width: ${capacityPercentage}%"></div>
        </div>
        <div class="capacity-text">
          <span>${takenSpots} enrolled</span>
          <span>${spotsLeft} spots left</span>
        </div>
      </div>
    `;

    activityCard.innerHTML = `
      ${tagHtml}
      <h4>${escapeHtml(name)}</h4>
      <p>${escapeHtml(details.description)}</p>
      <p class="tooltip">
        <strong>Schedule:</strong> ${escapeHtml(formattedSchedule)}
        <span class="tooltip-text">Regular meetings at this time throughout the semester</span>
      </p>
      ${capacityIndicator}
      <div class="participants-list">
        <h5>Current Participants:</h5>
        <ul>
          ${details.participants
            .map(
              (email) => `
            <li>
              ${escapeHtml(email)}
              ${
                currentUser
                  ? `
                <span class="delete-participant tooltip" data-activity="${escapeHtml(
                  name
                )}" data-email="${escapeHtml(email)}">
                  ✖
                  <span class="tooltip-text">Unregister this student</span>
                </span>
              `
                  : ""
              }
            </li>
          `
            )
            .join("")}
        </ul>
      </div>
      <div class="activity-card-actions">
        ${
          currentUser
            ? `
          <button class="register-button" data-activity="${escapeHtml(name)}" ${
                isFull ? "disabled" : ""
              }>
            ${isFull ? "Activity Full" : "Register Student"}
          </button>
        `
            : `
          <div class="auth-notice">
            Teachers can register students.
          </div>
        `
        }
      </div>
    `;

    const deleteButtons = activityCard.querySelectorAll(".delete-participant");
    deleteButtons.forEach((button) => {
      button.addEventListener("click", handleUnregister);
    });

    if (currentUser) {
      const registerButton = activityCard.querySelector(".register-button");
      if (!isFull) {
        registerButton.addEventListener("click", () => {
          openRegistrationModal(name);
        });
      }
    }

    activitiesList.appendChild(activityCard);
  }

  searchInput.addEventListener("input", (event) => {
    searchQuery = event.target.value;
    displayFilteredActivities();
  });

  searchButton.addEventListener("click", (event) => {
    event.preventDefault();
    searchQuery = searchInput.value;
    displayFilteredActivities();
  });

  categoryFilters.forEach((button) => {
    button.addEventListener("click", () => {
      categoryFilters.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");

      currentFilter = button.dataset.category;
      displayFilteredActivities();
    });
  });

  dayFilters.forEach((button) => {
    button.addEventListener("click", () => {
      dayFilters.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");

      currentDay = button.dataset.day;
      fetchActivities();
    });
  });

  timeFilters.forEach((button) => {
    button.addEventListener("click", () => {
      timeFilters.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");

      currentTimeRange = button.dataset.time;
      fetchActivities();
    });
  });

  function openRegistrationModal(activityName) {
    modalActivityName.textContent = activityName;
    activityInput.value = activityName;
    registrationModal.classList.remove("hidden");
    setTimeout(() => {
      registrationModal.classList.add("show");
    }, 10);
  }

  function closeRegistrationModalHandler() {
    registrationModal.classList.remove("show");
    setTimeout(() => {
      registrationModal.classList.add("hidden");
      signupForm.reset();
    }, 300);
  }

  closeRegistrationModal.addEventListener("click", closeRegistrationModalHandler);

  function showConfirmationDialog(message, confirmCallback) {
    let confirmDialog = document.getElementById("confirm-dialog");
    if (!confirmDialog) {
      confirmDialog = document.createElement("div");
      confirmDialog.id = "confirm-dialog";
      confirmDialog.className = "modal hidden";
      confirmDialog.innerHTML = `
        <div class="modal-content">
          <h3>Confirm Action</h3>
          <p id="confirm-message"></p>
          <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
            <button id="cancel-button" class="cancel-btn">Cancel</button>
            <button id="confirm-button" class="confirm-btn">Confirm</button>
          </div>
        </div>
      `;
      document.body.appendChild(confirmDialog);

      const cancelBtn = confirmDialog.querySelector("#cancel-button");
      const confirmBtn = confirmDialog.querySelector("#confirm-button");
      cancelBtn.style.backgroundColor = "#f1f1f1";
      cancelBtn.style.color = "#333";
      confirmBtn.style.backgroundColor = "#dc3545";
      confirmBtn.style.color = "white";
    }

    const confirmMessage = document.getElementById("confirm-message");
    confirmMessage.textContent = message;

    confirmDialog.classList.remove("hidden");
    setTimeout(() => {
      confirmDialog.classList.add("show");
    }, 10);

    const cancelButton = document.getElementById("cancel-button");
    const confirmButton = document.getElementById("confirm-button");

    const newCancelButton = cancelButton.cloneNode(true);
    const newConfirmButton = confirmButton.cloneNode(true);
    cancelButton.parentNode.replaceChild(newCancelButton, cancelButton);
    confirmButton.parentNode.replaceChild(newConfirmButton, confirmButton);

    newCancelButton.addEventListener("click", () => {
      confirmDialog.classList.remove("show");
      setTimeout(() => {
        confirmDialog.classList.add("hidden");
      }, 300);
    });

    newConfirmButton.addEventListener("click", () => {
      confirmCallback();
      confirmDialog.classList.remove("show");
      setTimeout(() => {
        confirmDialog.classList.add("hidden");
      }, 300);
    });

    confirmDialog.addEventListener("click", (event) => {
      if (event.target === confirmDialog) {
        confirmDialog.classList.remove("show");
        setTimeout(() => {
          confirmDialog.classList.add("hidden");
        }, 300);
      }
    });
  }

  async function handleUnregister(event) {
    if (!currentUser) {
      showMessage(
        "You must be logged in as a teacher to unregister students.",
        "error"
      );
      return;
    }

    const activity = event.target.dataset.activity;
    const email = event.target.dataset.email;

    showConfirmationDialog(
      `Are you sure you want to unregister ${email} from ${activity}?`,
      async () => {
        try {
          const response = await fetch(
            `/activities/${encodeURIComponent(
              activity
            )}/unregister?email=${encodeURIComponent(
              email
            )}&teacher_username=${encodeURIComponent(currentUser.username)}`,
            {
              method: "POST",
            }
          );

          const result = await response.json();

          if (response.ok) {
            showMessage(result.message, "success");
            fetchActivities();
          } else {
            showMessage(result.detail || "An error occurred", "error");
          }
        } catch (error) {
          showMessage("Failed to unregister. Please try again.", "error");
          console.error("Error unregistering:", error);
        }
      }
    );
  }

  function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    messageDiv.classList.remove("hidden");

    setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!currentUser) {
      showMessage(
        "You must be logged in as a teacher to register students.",
        "error"
      );
      return;
    }

    const email = document.getElementById("email").value;
    const activity = activityInput.value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(
          email
        )}&teacher_username=${encodeURIComponent(currentUser.username)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        closeRegistrationModalHandler();
        fetchActivities();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  });

  window.activityFilters = {
    setDayFilter,
    setTimeRangeFilter,
  };

  checkAuthentication();
  initializeFilters();
  fetchActivities();
  fetchActiveAnnouncements();
});
