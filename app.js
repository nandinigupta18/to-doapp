/**
 * TaskFlow Application Logic
 * Modern, responsive, local-first Todo App with rich interactions
 */

(function () {
  'use strict';

  // --- Storage Keys ---
  const STORAGE_KEY = 'taskflow_tasks_v1';
  const THEME_KEY = 'taskflow_theme_v1';

  // --- Initial Demo Tasks ---
  const DEFAULT_SAMPLE_TASKS = [
    {
      id: 'demo-1',
      title: 'Welcome to TaskFlow! Click the checkmark to mark this complete ✨',
      completed: false,
      priority: 'high',
      category: 'Work',
      dueDate: getRelativeDate(0), // Today
      isStarred: true,
      createdAt: Date.now() - 3600000 * 2
    },
    {
      id: 'demo-2',
      title: 'Review weekly project milestones and prepare summary report 📊',
      completed: false,
      priority: 'medium',
      category: 'Work',
      dueDate: getRelativeDate(1), // Tomorrow
      isStarred: false,
      createdAt: Date.now() - 3600000
    },
    {
      id: 'demo-3',
      title: 'Hydrate: Drink 2 liters of water today 💧',
      completed: true,
      priority: 'low',
      category: 'Health',
      dueDate: getRelativeDate(0),
      isStarred: false,
      createdAt: Date.now() - 7200000
    }
  ];

  // Helper for dates formatted YYYY-MM-DD
  function getRelativeDate(offsetDays) {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString().split('T')[0];
  }

  // --- State ---
  let tasks = loadTasks();
  let currentFilter = 'all';
  let currentSort = 'created-desc';
  let searchQuery = '';

  // --- DOM Elements ---
  const currentDateEl = document.getElementById('current-date');
  const themeToggleBtn = document.getElementById('theme-toggle');
  const themeIcon = document.getElementById('theme-icon');

  const addTaskForm = document.getElementById('add-task-form');
  const taskTitleInput = document.getElementById('task-title-input');
  const taskPrioritySelect = document.getElementById('task-priority-select');
  const taskCategorySelect = document.getElementById('task-category-select');
  const taskDueDate = document.getElementById('task-due-date');

  const progressBarFill = document.getElementById('progress-bar-fill');
  const progressPercentageEl = document.getElementById('progress-percentage');
  const progressHeadingEl = document.getElementById('progress-heading');
  const progressStatsTextEl = document.getElementById('progress-stats-text');
  const progressBarWrapper = document.getElementById('progress-bar-wrapper');

  const searchInput = document.getElementById('search-input');
  const clearSearchBtn = document.getElementById('clear-search-btn');
  const filterTabs = document.querySelectorAll('.filter-tab');
  const sortSelect = document.getElementById('sort-select');

  const taskListEl = document.getElementById('task-list');
  const emptyStateEl = document.getElementById('empty-state');
  const emptyTitleEl = document.getElementById('empty-title');
  const emptyDescEl = document.getElementById('empty-desc');

  const countAllEl = document.getElementById('count-all');
  const countActiveEl = document.getElementById('count-active');
  const countCompletedEl = document.getElementById('count-completed');
  const countStarredEl = document.getElementById('count-starred');
  const footerTasksCountEl = document.getElementById('footer-tasks-count');

  const clearCompletedBtn = document.getElementById('clear-completed-btn');
  const resetSampleBtn = document.getElementById('reset-sample-btn');

  // Edit Modal Elements
  const editModal = document.getElementById('edit-modal');
  const editForm = document.getElementById('edit-form');
  const editTaskIdInput = document.getElementById('edit-task-id');
  const editTitleInput = document.getElementById('edit-title-input');
  const editPrioritySelect = document.getElementById('edit-priority-select');
  const editCategorySelect = document.getElementById('edit-category-select');
  const editDueDateInput = document.getElementById('edit-due-date');
  const closeModalBtn = document.getElementById('close-modal-btn');
  const cancelEditBtn = document.getElementById('cancel-edit-btn');

  const toastContainer = document.getElementById('toast-container');
  const confettiCanvas = document.getElementById('confetti-canvas');

  // --- Initialization ---
  function init() {
    setupDateDisplay();
    setupTheme();
    setupDefaultDueDate();
    setupEventListeners();
    render();
  }

  // --- Date & Time Display ---
  function setupDateDisplay() {
    const options = { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' };
    const today = new Date();
    currentDateEl.textContent = today.toLocaleDateString(undefined, options);
  }

  function setupDefaultDueDate() {
    // Default form date picker min date to today
    const todayStr = new Date().toISOString().split('T')[0];
    taskDueDate.min = todayStr;
  }

  // --- Theme Management ---
  function setupTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY) || 'dark';
    if (savedTheme === 'light') {
      document.body.classList.add('light-theme');
      updateThemeIcon(true);
    } else {
      document.body.classList.remove('light-theme');
      updateThemeIcon(false);
    }
  }

  function toggleTheme() {
    const isLight = document.body.classList.toggle('light-theme');
    localStorage.setItem(THEME_KEY, isLight ? 'light' : 'dark');
    updateThemeIcon(isLight);
    showToast(isLight ? 'Switched to Light Mode' : 'Switched to Dark Mode');
  }

  function updateThemeIcon(isLight) {
    if (isLight) {
      themeIcon.innerHTML = `
        <circle cx="12" cy="12" r="5"></circle>
        <line x1="12" y1="1" x2="12" y2="3"></line>
        <line x1="12" y1="21" x2="12" y2="23"></line>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
        <line x1="1" y1="12" x2="3" y2="12"></line>
        <line x1="21" y1="12" x2="23" y2="12"></line>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
      `;
    } else {
      themeIcon.innerHTML = `
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
      `;
    }
  }

  // --- LocalStorage Operations ---
  function loadTasks() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // First visit: initialize with default sample tasks
      saveTasks(DEFAULT_SAMPLE_TASKS);
      return [...DEFAULT_SAMPLE_TASKS];
    }
    try {
      return JSON.parse(raw);
    } catch (e) {
      console.error('Error loading tasks from localStorage', e);
      return [];
    }
  }

  function saveTasks(tasksToSave) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasksToSave));
  }

  // --- Event Listeners Setup ---
  function setupEventListeners() {
    // Theme toggle
    themeToggleBtn.addEventListener('click', toggleTheme);

    // Add Task Form Submission
    addTaskForm.addEventListener('submit', handleAddTask);

    // Search Input
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.trim().toLowerCase();
      clearSearchBtn.style.display = searchQuery ? 'block' : 'none';
      render();
    });

    clearSearchBtn.addEventListener('click', () => {
      searchInput.value = '';
      searchQuery = '';
      clearSearchBtn.style.display = 'none';
      searchInput.focus();
      render();
    });

    // Filter Tabs
    filterTabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        filterTabs.forEach((t) => {
          t.classList.remove('active');
          t.setAttribute('aria-selected', 'false');
        });
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');
        currentFilter = tab.getAttribute('data-filter');
        render();
      });
    });

    // Sort Dropdown
    sortSelect.addEventListener('change', (e) => {
      currentSort = e.target.value;
      render();
    });

    // Clear Completed
    clearCompletedBtn.addEventListener('click', handleClearCompleted);

    // Reset / Reload Sample Tasks
    resetSampleBtn.addEventListener('click', () => {
      tasks = [
        ...DEFAULT_SAMPLE_TASKS.map((t) => ({
          ...t,
          id: 'demo-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4)
        }))
      ];
      saveTasks(tasks);
      render();
      showToast('Sample tasks reloaded');
    });

    // Edit Modal events
    closeModalBtn.addEventListener('click', () => editModal.close());
    cancelEditBtn.addEventListener('click', () => editModal.close());
    editForm.addEventListener('submit', handleSaveEditedTask);

    // Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
      if (e.key === '/' && document.activeElement !== searchInput && document.activeElement !== taskTitleInput) {
        e.preventDefault();
        searchInput.focus();
      } else if (e.key === 'Escape') {
        if (editModal.open) {
          editModal.close();
        } else if (document.activeElement === searchInput && searchInput.value) {
          searchInput.value = '';
          searchQuery = '';
          clearSearchBtn.style.display = 'none';
          render();
        }
      }
    });
  }

  // --- Add Task Handler ---
  function handleAddTask(e) {
    e.preventDefault();
    const title = taskTitleInput.value.trim();

    if (!title) {
      taskTitleInput.classList.add('shake');
      setTimeout(() => taskTitleInput.classList.remove('shake'), 400);
      showToast('Please type a task title first');
      return;
    }

    const newTask = {
      id: 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      title: title,
      completed: false,
      priority: taskPrioritySelect.value || 'medium',
      category: taskCategorySelect.value || 'Personal',
      dueDate: taskDueDate.value || '',
      isStarred: false,
      createdAt: Date.now()
    };

    tasks.unshift(newTask);
    saveTasks(tasks);

    // Reset inputs
    taskTitleInput.value = '';
    taskDueDate.value = '';
    taskPrioritySelect.value = 'medium';
    taskCategorySelect.value = 'Personal';

    taskTitleInput.focus();

    render();
    showToast('Task added successfully! 🎉');
  }

  // --- Task Item Actions ---
  function toggleTaskCompletion(id) {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    task.completed = !task.completed;
    saveTasks(tasks);

    if (task.completed) {
      showToast('Task completed! Keep it up ⭐');
      // If all active tasks completed, trigger celebration confetti
      const activeCount = tasks.filter((t) => !t.completed).length;
      if (activeCount === 0 && tasks.length > 0) {
        triggerConfetti();
        showToast('All tasks finished! You crushed it! 🏆');
      }
    }

    render();
  }

  function toggleTaskStar(id) {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    task.isStarred = !task.isStarred;
    saveTasks(tasks);
    render();
    showToast(task.isStarred ? 'Task starred ⭐' : 'Task unstarred');
  }

  function deleteTask(id) {
    const taskEl = document.querySelector(`[data-id="${id}"]`);
    if (taskEl) {
      taskEl.classList.add('slide-out');
      setTimeout(() => {
        tasks = tasks.filter((t) => t.id !== id);
        saveTasks(tasks);
        render();
        showToast('Task removed');
      }, 250);
    } else {
      tasks = tasks.filter((t) => t.id !== id);
      saveTasks(tasks);
      render();
    }
  }

  function openEditModal(id) {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    editTaskIdInput.value = task.id;
    editTitleInput.value = task.title;
    editPrioritySelect.value = task.priority;
    editCategorySelect.value = task.category;
    editDueDateInput.value = task.dueDate || '';

    editModal.showModal();
    editTitleInput.focus();
  }

  function handleSaveEditedTask(e) {
    e.preventDefault();
    const id = editTaskIdInput.value;
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    const newTitle = editTitleInput.value.trim();
    if (!newTitle) return;

    task.title = newTitle;
    task.priority = editPrioritySelect.value;
    task.category = editCategorySelect.value;
    task.dueDate = editDueDateInput.value;

    saveTasks(tasks);
    editModal.close();
    render();
    showToast('Task updated successfully');
  }

  function handleClearCompleted() {
    const completedCount = tasks.filter((t) => t.completed).length;
    if (completedCount === 0) {
      showToast('No completed tasks to clear');
      return;
    }

    tasks = tasks.filter((t) => !t.completed);
    saveTasks(tasks);
    render();
    showToast(`Cleared ${completedCount} completed task${completedCount > 1 ? 's' : ''}`);
  }

  // --- Filtering & Sorting ---
  function getFilteredAndSortedTasks() {
    let result = tasks.filter((task) => {
      // Tab filter
      if (currentFilter === 'active' && task.completed) return false;
      if (currentFilter === 'completed' && !task.completed) return false;
      if (currentFilter === 'starred' && !task.isStarred) return false;

      // Search filter
      if (searchQuery) {
        const matchesTitle = task.title.toLowerCase().includes(searchQuery);
        const matchesCategory = task.category.toLowerCase().includes(searchQuery);
        if (!matchesTitle && !matchesCategory) return false;
      }

      return true;
    });

    // Starred tasks always float higher inside sort unless already filtered
    const priorityWeight = { high: 3, medium: 2, low: 1 };

    result.sort((a, b) => {
      // Primary: Starred first
      if (a.isStarred !== b.isStarred) {
        return a.isStarred ? -1 : 1;
      }

      // Secondary: User chosen sort
      if (currentSort === 'created-desc') {
        return b.createdAt - a.createdAt;
      } else if (currentSort === 'created-asc') {
        return a.createdAt - b.createdAt;
      } else if (currentSort === 'priority-desc') {
        return priorityWeight[b.priority] - priorityWeight[a.priority];
      } else if (currentSort === 'due-date') {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
      }
      return 0;
    });

    return result;
  }

  // --- Render UI ---
  function render() {
    updateCounts();
    updateProgress();

    const filteredTasks = getFilteredAndSortedTasks();
    taskListEl.innerHTML = '';

    if (filteredTasks.length === 0) {
      emptyStateEl.style.display = 'flex';
      if (searchQuery) {
        emptyTitleEl.textContent = 'No matching tasks';
        emptyDescEl.textContent = `No results found for "${searchQuery}". Try different keywords.`;
      } else if (currentFilter === 'completed') {
        emptyTitleEl.textContent = 'No completed tasks';
        emptyDescEl.textContent = 'Complete some of your active tasks to view them here!';
      } else if (currentFilter === 'starred') {
        emptyTitleEl.textContent = 'No starred tasks';
        emptyDescEl.textContent = 'Star important tasks to keep them pinned at the top.';
      } else {
        emptyTitleEl.textContent = 'All caught up!';
        emptyDescEl.textContent = 'You have no tasks in this list. Take a breather or create a new one above.';
      }
    } else {
      emptyStateEl.style.display = 'none';
      filteredTasks.forEach((task) => {
        const itemEl = createTaskElement(task);
        taskListEl.appendChild(itemEl);
      });
    }
  }

  function updateCounts() {
    const totalCount = tasks.length;
    const completedCount = tasks.filter((t) => t.completed).length;
    const activeCount = totalCount - completedCount;
    const starredCount = tasks.filter((t) => t.isStarred).length;

    countAllEl.textContent = totalCount;
    countActiveEl.textContent = activeCount;
    countCompletedEl.textContent = completedCount;
    countStarredEl.textContent = starredCount;

    footerTasksCountEl.textContent = `${activeCount} task${activeCount === 1 ? '' : 's'} remaining`;
  }

  function updateProgress() {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.completed).length;
    const pct = total === 0 ? 0 : Math.round((completed / total) * 100);

    progressBarFill.style.width = `${pct}%`;
    progressBarWrapper.setAttribute('aria-valuenow', pct);
    progressPercentageEl.textContent = `${pct}%`;
    progressStatsTextEl.textContent = `${completed} of ${total} tasks completed`;

    if (total === 0) {
      progressHeadingEl.textContent = 'Start by adding your first task! ✨';
    } else if (pct === 100) {
      progressHeadingEl.textContent = 'Unstoppable! Everything completed today 🎉';
    } else if (pct >= 50) {
      progressHeadingEl.textContent = 'Halfway there! Keep up the momentum 💪';
    } else if (pct > 0) {
      progressHeadingEl.textContent = 'Great start! One step at a time 🚀';
    } else {
      progressHeadingEl.textContent = 'Ready to conquer your goals?';
    }
  }

  // --- Task DOM Builder ---
  function createTaskElement(task) {
    const li = document.createElement('li');
    li.className = `task-item ${task.completed ? 'completed' : ''}`;
    li.setAttribute('data-id', task.id);
    li.setAttribute('data-priority', task.priority);

    // Date formatting & overdue calculation
    let dateBadgeHtml = '';
    if (task.dueDate) {
      const todayStr = new Date().toISOString().split('T')[0];
      const isOverdue = !task.completed && task.dueDate < todayStr;
      const dateFormatted = formatTaskDate(task.dueDate);

      dateBadgeHtml = `
        <span class="tag-badge date-tag ${isOverdue ? 'date-overdue' : ''}">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          ${isOverdue ? '⚠️ Overdue: ' : ''}${dateFormatted}
        </span>
      `;
    }

    const priorityLabel = {
      high: '🔥 High',
      medium: '⚡ Medium',
      low: '🌱 Low'
    }[task.priority] || 'Medium';

    li.innerHTML = `
      <div class="task-checkbox-container" title="${task.completed ? 'Mark incomplete' : 'Mark complete'}">
        <div class="custom-checkbox">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
      </div>

      <div class="task-content">
        <span class="task-title">${escapeHTML(task.title)}</span>
        <div class="task-tags">
          <span class="tag-badge priority-${task.priority}">${priorityLabel}</span>
          <span class="tag-badge category-tag">${escapeHTML(task.category)}</span>
          ${dateBadgeHtml}
        </div>
      </div>

      <div class="task-actions">
        <button class="action-btn star-btn ${task.isStarred ? 'starred' : ''}" title="${task.isStarred ? 'Unstar task' : 'Star task'}" aria-label="Star task">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="${task.isStarred ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
          </svg>
        </button>

        <button class="action-btn edit-btn" title="Edit task" aria-label="Edit task">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 20h9"></path>
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
          </svg>
        </button>

        <button class="action-btn delete-btn" title="Delete task" aria-label="Delete task">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </div>
    `;

    // Hook internal element events
    const checkboxEl = li.querySelector('.task-checkbox-container');
    const starBtn = li.querySelector('.star-btn');
    const editBtn = li.querySelector('.edit-btn');
    const deleteBtn = li.querySelector('.delete-btn');

    checkboxEl.addEventListener('click', () => toggleTaskCompletion(task.id));
    starBtn.addEventListener('click', () => toggleTaskStar(task.id));
    editBtn.addEventListener('click', () => openEditModal(task.id));
    deleteBtn.addEventListener('click', () => deleteTask(task.id));

    return li;
  }

  // --- Utilities ---
  function escapeHTML(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function formatTaskDate(dateString) {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    const dateObj = new Date(year, month - 1, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffDays = Math.round((dateObj - today) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';

    return dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  // --- Toast Notifications ---
  function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <polyline points="12 6 12 12 14 14"></polyline>
      </svg>
      <span>${escapeHTML(message)}</span>
    `;

    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('toast-exit');
      setTimeout(() => {
        if (toast.parentElement) toast.parentElement.removeChild(toast);
      }, 300);
    }, 2800);
  }

  // --- Particle Confetti System ---
  function triggerConfetti() {
    if (!confettiCanvas) return;
    const ctx = confettiCanvas.getContext('2d');
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;

    const particles = [];
    const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#3b82f6', '#10b981', '#fbbf24', '#f43f5e'];

    for (let i = 0; i < 90; i++) {
      particles.push({
        x: confettiCanvas.width / 2 + (Math.random() - 0.5) * 200,
        y: confettiCanvas.height / 2 - 50,
        radius: Math.random() * 6 + 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 14,
        vy: (Math.random() - 0.8) * 16,
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 10,
        alpha: 1,
        life: 0.98
      });
    }

    let animationFrame;
    function renderConfetti() {
      ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
      let alive = false;

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.35; // gravity
        p.vx *= 0.99;
        p.rotation += p.rotSpeed;
        p.alpha *= p.life;

        if (p.alpha > 0.05 && p.y < confettiCanvas.height) {
          alive = true;
          ctx.save();
          ctx.globalAlpha = p.alpha;
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.radius, -p.radius, p.radius * 2, p.radius * 1.6);
          ctx.restore();
        }
      });

      if (alive) {
        animationFrame = requestAnimationFrame(renderConfetti);
      } else {
        ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
        cancelAnimationFrame(animationFrame);
      }
    }

    renderConfetti();
  }

  // Handle window resizing for canvas
  window.addEventListener('resize', () => {
    if (confettiCanvas) {
      confettiCanvas.width = window.innerWidth;
      confettiCanvas.height = window.innerHeight;
    }
  });

  // Start the application
  init();
})();
