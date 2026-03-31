/**
 * 100 Habits Explorer — Main Application
 * A calm, contemplative habit discovery and selection tool
 *
 * Enhanced with:
 * - BJ Fogg's Tiny Habits (B=MAP model, ABC recipe, celebrations)
 * - James Clear's Atomic Habits (4 Laws, identity-based habits, 2-minute rule)
 * - Guided onboarding wizard for beginners
 * - Psychoeducation panel
 */

(function () {
  'use strict';

  // ============ State ============
  var habits = [];
  var categories = [];
  var stackingSuggestions = [];
  var state = {
    selectedHabits: [],
    monthlyFocus: null,
    reflectionNotes: '',
    existingRoutines: [],
    celebrations: {},
    lastUpdated: null
  };

  // Filter state
  var filters = {
    search: '',
    categories: [],
    types: [],
    difficulties: [],
    timesOfDay: []
  };

  // UI state
  var activeTab = 'explore';
  var drawerOpen = false;
  var modalHabitId = null;
  var sidebarOpen = false;
  var expandedCards = new Set();
  var storageAvailable = true;
  var confirmCallback = null;
  var onboardingStep = 0;
  var onboardingAnswers = { category: null, time: null, timeOfDay: null };

  // Debounce timers
  var searchDebounce = null;
  var reflectionDebounce = null;

  // Shared element for HTML escaping (optimization: reuse instead of creating each time)
  var escapeDiv = document.createElement('div');

  // ============ SVG Icons ============
  var icons = {
    search: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>',
    x: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>',
    check: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
    star: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
    filter: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>',
    clock: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
    zap: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
    sun: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>',
    copy: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>',
    heart: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>',
    trash: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>'
  };

  // ============ Tiny Versions Data ============
  // BJ Fogg: shrink the behavior until it's "stupid easy"
  var tinyVersions = {
    1: "Write down just 1 accomplishment before bed",
    2: "Send a one-line thank-you text to someone",
    3: "Name 1 thing you're grateful for tonight",
    4: "Catch 1 complaint today and simply pause",
    5: "Take one mindful breath before your next meal",
    6: "Notice 1 beautiful thing on your way somewhere",
    7: "Send a quick 'thanks for today' text after one event",
    8: "Write 1 grateful thought on a sticky note",
    9: "Close your eyes for 10 seconds and think of one blessing",
    10: "Say one kind sentence to yourself in the mirror",
    11: "Put your phone in another room 10 minutes before bed",
    12: "Skip the news homepage just once today",
    13: "Set your alarm for the same time tomorrow",
    14: "Delete 1 unneeded email or app today",
    15: "Pause reading new content for 1 hour today",
    16: "Make one simple meal at home today",
    17: "Walk one short errand instead of driving",
    18: "Skip 1 unnecessary purchase today",
    19: "Pick out tomorrow's shirt before bed",
    20: "Identify 1 non-essential thing you can drop",
    21: "Write just 3 priorities for tomorrow morning",
    22: "Answer one question honestly today that you'd normally dodge",
    23: "Before your next decision, take one slow breath",
    24: "Wake up just 10 minutes earlier tomorrow",
    25: "When your alarm goes off, put both feet on the floor",
    26: "Finish 1 small task you've been avoiding",
    27: "Sketch, doodle, or write for 2 minutes",
    28: "Write just 1 sentence about anything",
    29: "Work on one task for 5 focused minutes, then break",
    30: "Before your next remark, ask: is this kind?",
    31: "Block out just your first hour of work tomorrow",
    32: "Do the same 1 thing as the first step of your morning",
    33: "Clear off 1 surface in your home",
    34: "Text a friend before opening your work email",
    35: "Start your day with the single most important task",
    36: "Clear 1 item off your desk at the end of work",
    37: "Do 5 minutes of movement you enjoy",
    38: "Start getting ready for bed at the same time tonight",
    39: "Pull up your covers when you get out of bed",
    40: "Close your laptop at the same time tonight",
    41: "Do 1 small kind thing for a stranger today",
    42: "Look up 1 local charity's website",
    43: "Send a 'thinking of you' text to 1 person",
    44: "Say 'thank you' and make eye contact with 1 service worker",
    45: "Skip 1 small expense today (coffee, snack)",
    46: "Do 1 small helpful thing for your partner without being asked",
    47: "Give 1 genuine compliment today",
    48: "Decline 1 plastic bag or disposable item today",
    49: "In your next conversation, listen for 30 seconds before responding",
    50: "Straighten 1 area near your entrance",
    51: "Ask your partner 1 meaningful question tonight",
    52: "Give your child 5 minutes of undivided attention",
    53: "Share 1 honest feeling with someone you trust",
    54: "Put your phone face-down during dinner",
    55: "Step outside together for 2 minutes",
    56: "Reach out to 1 friend with a quick message",
    57: "Catch yourself once before saying something unkind about someone",
    58: "Send 1 professional connection a brief hello",
    59: "Write 1 sentence in a journal",
    60: "Sit quietly for 2 minutes and review your day",
    61: "Doodle or write for 2 minutes about how you feel",
    62: "At day's end, name 1 thing you actually did today",
    63: "Take 1 photo of something that caught your eye",
    64: "Before bed, name your #1 highlight of the day",
    65: "Ask yourself: What matters most to me? Take 30 seconds.",
    66: "Rate your mood from 1-10 right now",
    67: "After your next meeting, pause for 10 seconds to reflect",
    68: "When you wake up, jot down 1 thing you remember from a dream",
    69: "Sit in silence for 30 seconds",
    70: "Take your first 3 bites of one meal slowly and mindfully",
    71: "Do 1 thing today that feels slightly challenging",
    72: "Put your phone in a drawer for 10 minutes",
    73: "Right now, feel your feet on the ground for 5 seconds",
    74: "Don't open social media for the first hour today",
    75: "Focus on just 1 thing for the next 5 minutes",
    76: "Water 1 plant or tend to something growing",
    77: "Next time someone speaks, give them your full attention for 30 seconds",
    78: "Leave 5 minutes early for your next appointment",
    79: "Step outside for 2 minutes right now",
    80: "Skip alcohol with just tonight's dinner",
    81: "Walk to the end of your block and back",
    82: "Add 1 fruit or vegetable to your next meal",
    83: "Stretch or move your body for 1 minute",
    84: "Skip dessert at just 1 meal today",
    85: "Switch to water after your first cup of coffee",
    86: "Drink 1 extra glass of water right now",
    87: "Tell yourself 1 encouraging thing",
    88: "Choose 1 virtue and notice 1 chance to practice it today",
    89: "Sit quietly for 2 minutes before starting your day",
    90: "Step outside and look at the sky for 30 seconds",
    91: "Say a brief prayer or set an intention in 1 sentence",
    92: "Read 1 paragraph of something uplifting",
    93: "Close your eyes and breathe deeply 3 times",
    94: "Put on 1 song that lifts your spirits",
    95: "Ask yourself 'what am I learning today?' and sit with the question for 10 seconds",
    96: "Walk mindfully for 1 minute — feel each step",
    97: "Before bed, name 1 thing you can accept as it is",
    98: "Write 1 sentence — a line of a poem, a thought, anything creative"
  };

  var categoryTinyFallbacks = {
    "Gratitude": "Notice 1 thing you're thankful for right now",
    "Simplicity": "Remove or simplify 1 tiny thing in your day",
    "Intentionality": "Take 30 seconds to set 1 clear intention",
    "Order": "Straighten 1 small area of your space",
    "Generosity": "Send 1 kind message to someone",
    "Relationships": "Give someone your undivided attention for 30 seconds",
    "Reflection": "Write 1 sentence about how you feel right now",
    "Presence": "Take 3 slow, deep breaths",
    "Balance": "Stand up and stretch for 30 seconds",
    "Transcendence": "Close your eyes and be still for 10 seconds"
  };

  function getTinyVersion(habit) {
    return tinyVersions[habit.id] || categoryTinyFallbacks[habit.category] || "Try doing just the first 2 minutes of this today.";
  }

  // ============ B=MAP Data ============
  // Behavior = Motivation x Ability x Prompt
  // Rate each 1-5 for display
  function getBMAP(habit) {
    var motivationMap = { easy: 2, moderate: 3, challenging: 4 };
    var abilityMap = { easy: 5, moderate: 3, challenging: 1 };
    var motivation = motivationMap[habit.difficulty] || 3;
    var ability = abilityMap[habit.difficulty] || 3;
    // Prompt strength based on timeOfDay specificity
    var promptMap = { morning: 4, evening: 4, throughout: 2, flexible: 3 };
    var prompt = promptMap[habit.timeOfDay] || 3;

    // Adjust for duration
    if (habit.durationMinutes <= 5) ability = Math.min(5, ability + 1);
    if (habit.durationMinutes >= 30) ability = Math.max(1, ability - 1);
    if (habit.durationMinutes === 0) ability = Math.min(5, ability + 1); // removal habits

    var insight;
    if (ability >= 4) {
      insight = "High ability — this habit is easy to start. Perfect for building momentum.";
    } else if (ability <= 2 && motivation <= 2) {
      insight = "This is a challenging habit. Start with the tiny version and build up over time.";
    } else if (prompt <= 2) {
      insight = "This habit needs a clear trigger. Try pairing it with an existing routine (habit stacking).";
    } else {
      insight = "Good balance. Anchor it to a specific time and start small for the best results.";
    }

    return { motivation: motivation, ability: ability, prompt: prompt, insight: insight };
  }

  // ============ Celebration Suggestions ============
  var celebrationIdeas = [
    "Do a small fist pump",
    "Say 'I did it!' to yourself",
    "Take a deep, satisfying breath",
    "Smile and nod to yourself",
    "Give yourself a mental high-five",
    "Hum a few bars of your favorite song",
    "Do a little happy dance",
    "Say 'That's like me!' with pride"
  ];

  // ============ Psychoeducation Content ============
  var psychoedSections = [
    {
      emoji: "🧪",
      title: "The B=MAP Formula",
      content: '<p>Every behavior — from brushing your teeth to meditating — follows the same equation, discovered by BJ Fogg at Stanford:</p>' +
        '<div class="psychoed-formula"><div class="formula-big"><span>B</span>ehavior = <span>M</span>otivation × <span>A</span>bility × <span>P</span>rompt</div>' +
        '<div class="formula-explain">For a behavior to happen, all three must come together at the same moment. If any one is missing — no behavior.</div></div>' +
        '<p>The breakthrough insight: <strong>instead of relying on motivation (which is unreliable), increase ability by making the behavior tiny, and use a clear prompt.</strong></p>'
    },
    {
      emoji: "🌱",
      title: "Make It Tiny (The 2-Minute Rule)",
      content: '<p>The #1 mistake people make with habits: starting too big. "Meditate for 30 minutes" becomes "meditate never."</p>' +
        '<div class="psychoed-highlight">Shrink the behavior until it takes less than 2 minutes. You\'re not trying to change the world — you\'re trying to show up.</div>' +
        '<p>"Read 30 pages" becomes "read one paragraph." "Exercise daily" becomes "put on your running shoes." The goal is to <strong>make it so easy you can\'t say no.</strong></p>' +
        '<p>Once you\'re doing the tiny version consistently, it naturally grows. But consistency comes first — always.</p>'
    },
    {
      emoji: "📎",
      title: "Habit Stacking (The Anchor)",
      content: '<p>BJ Fogg\'s most powerful technique: attach your new habit to something you already do every day. He calls this the <strong>Anchor Moment</strong>.</p>' +
        '<div class="psychoed-highlight">After I [EXISTING HABIT], I will [NEW TINY HABIT].</div>' +
        '<p>Examples:</p>' +
        '<ul class="psychoed-list">' +
        '<li><span class="list-num">1</span><span class="list-content"><strong>After I pour my morning coffee</strong>, I will write down 1 thing I\'m grateful for.</span></li>' +
        '<li><span class="list-num">2</span><span class="list-content"><strong>After I sit down at my desk</strong>, I will take 3 deep breaths.</span></li>' +
        '<li><span class="list-num">3</span><span class="list-content"><strong>After I brush my teeth at night</strong>, I will write 1 sentence in my journal.</span></li>' +
        '</ul>' +
        '<p>The anchor is your prompt — the P in B=MAP. It makes the new habit almost automatic.</p>'
    },
    {
      emoji: "🎉",
      title: "Celebrate Immediately (The Shine)",
      content: '<p>This is the most overlooked and most important step. BJ Fogg calls it <strong>"Shine"</strong> — the positive emotion you feel right after doing the behavior.</p>' +
        '<div class="psychoed-highlight">Emotions create habits, not repetition. Celebration wires the habit into your brain.</div>' +
        '<p>Right after your tiny habit, do something that makes you feel good:</p>' +
        '<ul class="psychoed-list">' +
        '<li><span class="list-num">✨</span><span class="list-content">Say "I did it!" with genuine enthusiasm</span></li>' +
        '<li><span class="list-num">✨</span><span class="list-content">Do a small fist pump or victory pose</span></li>' +
        '<li><span class="list-num">✨</span><span class="list-content">Smile and take a deep, satisfying breath</span></li>' +
        '<li><span class="list-num">✨</span><span class="list-content">Tell yourself "That\'s like me!"</span></li>' +
        '</ul>' +
        '<p>It might feel silly. Do it anyway. The positive emotion is what makes the habit stick.</p>'
    },
    {
      emoji: "⚖️",
      title: "The 4 Laws of Behavior Change",
      content: '<p>From James Clear\'s <em>Atomic Habits</em> — four levers you can pull to build (or break) any habit:</p>' +
        '<ul class="psychoed-list">' +
        '<li><span class="list-num">1</span><span class="list-content"><strong>Make it Obvious</strong> — Design your environment so the cue is visible. Want to read more? Put the book on your pillow.</span></li>' +
        '<li><span class="list-num">2</span><span class="list-content"><strong>Make it Attractive</strong> — Pair the habit with something you enjoy. "After I do 5 minutes of exercise, I\'ll listen to my favorite podcast."</span></li>' +
        '<li><span class="list-num">3</span><span class="list-content"><strong>Make it Easy</strong> — Reduce friction. Lay out gym clothes the night before. (This is the 2-Minute Rule in action.)</span></li>' +
        '<li><span class="list-num">4</span><span class="list-content"><strong>Make it Satisfying</strong> — Reward yourself immediately. This is why celebration matters.</span></li>' +
        '</ul>' +
        '<p>To <em>break</em> a bad habit, invert the laws: make it invisible, unattractive, difficult, and unsatisfying.</p>'
    },
    {
      emoji: "🪞",
      title: "Identity-Based Habits",
      content: '<p>Most people set goals: "I want to lose weight." Clear\'s deeper insight: <strong>focus on who you want to become, not what you want to achieve.</strong></p>' +
        '<div class="psychoed-highlight">Every action you take is a vote for the person you want to become.</div>' +
        '<p>Instead of "I want to meditate," try: "I am someone who makes time for stillness." Instead of "I should exercise," try: "I am someone who moves their body every day."</p>' +
        '<p>Each tiny habit is evidence of your new identity. You don\'t need to be perfect — you just need to cast enough votes.</p>'
    }
  ];

  // ============ Onboarding Category Data ============
  var categoryEmojis = {
    "Gratitude": "🙏", "Simplicity": "🍃", "Intentionality": "🎯",
    "Order": "📋", "Generosity": "💝", "Relationships": "🤝",
    "Reflection": "📓", "Presence": "🧘", "Balance": "⚖️", "Transcendence": "✨"
  };

  var categoryDescriptions = {
    "Gratitude": "Noticing and appreciating what's good",
    "Simplicity": "Removing the unnecessary, finding clarity",
    "Intentionality": "Living on purpose, not autopilot",
    "Order": "Creating structure and rhythm",
    "Generosity": "Giving to others and your community",
    "Relationships": "Deepening connection with people",
    "Reflection": "Understanding yourself through writing and thought",
    "Presence": "Being here now, fully engaged",
    "Balance": "Caring for your body and energy",
    "Transcendence": "Connecting with something larger"
  };

  // ============ Helpers ============
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.from((ctx || document).querySelectorAll(sel)); }
  function el(tag, attrs, children) {
    var e = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (k === 'className') e.className = v;
      else if (k === 'innerHTML') e.innerHTML = v;
      else if (k.startsWith('on')) e.addEventListener(k.slice(2).toLowerCase(), v);
      else if (k === 'style' && typeof v === 'object') Object.assign(e.style, v);
      else e.setAttribute(k, v);
    });
    if (children) {
      if (typeof children === 'string') e.innerHTML = children;
      else if (Array.isArray(children)) children.forEach(function (c) { if (c) e.appendChild(c); });
      else e.appendChild(children);
    }
    return e;
  }

  function escapeHtml(str) {
    escapeDiv.textContent = str;
    return escapeDiv.innerHTML;
  }

  function getCategoryColor(catName) {
    return categories.find(function (c) { return c.name === catName; }) || { bgColor: '#f0f0f0', textColor: '#666' };
  }

  function getHabitById(id) {
    return habits.find(function (h) { return h.id === id; });
  }

  function isSelected(id) {
    return state.selectedHabits.indexOf(id) !== -1;
  }

  function formatTimeOfDay(tod) {
    var map = { morning: 'Morning', evening: 'Evening', flexible: 'Flexible', throughout: 'All Day' };
    return map[tod] || tod;
  }

  function formatDifficulty(d) {
    return d.charAt(0).toUpperCase() + d.slice(1);
  }

  function formatDuration(mins) {
    if (mins === 0) return 'Ongoing';
    if (mins < 60) return mins + ' min';
    var hrs = Math.floor(mins / 60);
    var rem = mins % 60;
    return rem ? hrs + 'h ' + rem + 'm' : hrs + ' hr';
  }

  // ============ localStorage ============
  function checkStorage() {
    try {
      localStorage.setItem('__test', '1');
      localStorage.removeItem('__test');
      return true;
    } catch (e) {
      return false;
    }
  }

  function saveState() {
    if (!storageAvailable) return;
    try {
      state.lastUpdated = new Date().toISOString();
      localStorage.setItem('habitExplorer', JSON.stringify(state));
    } catch (e) { /* silent fail */ }
  }

  function loadState() {
    if (!storageAvailable) return;
    try {
      var saved = localStorage.getItem('habitExplorer');
      if (saved) {
        var parsed = JSON.parse(saved);
        state.selectedHabits = parsed.selectedHabits || [];
        state.monthlyFocus = parsed.monthlyFocus || null;
        state.reflectionNotes = parsed.reflectionNotes || '';
        state.existingRoutines = parsed.existingRoutines || [];
        state.celebrations = parsed.celebrations || {};
        state.lastUpdated = parsed.lastUpdated || null;
      }
    } catch (e) { /* silent fail */ }
  }

  function resetState() {
    state.selectedHabits = [];
    state.monthlyFocus = null;
    state.reflectionNotes = '';
    state.existingRoutines = [];
    state.celebrations = {};
    state.lastUpdated = null;
    saveState();
    renderAll();
  }

  // ============ Filtering ============
  function getFilteredHabits() {
    return habits.filter(function (h) {
      if (filters.search) {
        var q = filters.search.toLowerCase();
        var inName = h.name.toLowerCase().indexOf(q) !== -1;
        var inDesc = h.description.toLowerCase().indexOf(q) !== -1;
        var inTags = h.tags.some(function (t) { return t.indexOf(q) !== -1; });
        if (!inName && !inDesc && !inTags) return false;
      }
      if (filters.categories.length > 0 && filters.categories.indexOf(h.category) === -1) return false;
      if (filters.types.length > 0 && filters.types.indexOf(h.type) === -1) return false;
      if (filters.difficulties.length > 0 && filters.difficulties.indexOf(h.difficulty) === -1) return false;
      if (filters.timesOfDay.length > 0 && filters.timesOfDay.indexOf(h.timeOfDay) === -1) return false;
      return true;
    });
  }

  function hasActiveFilters() {
    return filters.search || filters.categories.length > 0 || filters.types.length > 0 ||
      filters.difficulties.length > 0 || filters.timesOfDay.length > 0;
  }

  function clearAllFilters() {
    filters = { search: '', categories: [], types: [], difficulties: [], timesOfDay: [] };
    var searchInput = $('#search-input');
    if (searchInput) searchInput.value = '';
    renderFilters();
    renderGrid();
  }

  // ============ Toggle Helpers ============
  function toggleInArray(arr, val) {
    var idx = arr.indexOf(val);
    if (idx === -1) arr.push(val);
    else arr.splice(idx, 1);
  }

  function toggleHabitSelection(id, e) {
    if (e) { e.stopPropagation(); }
    toggleInArray(state.selectedHabits, id);
    if (state.selectedHabits.indexOf(id) === -1 && state.monthlyFocus === id) {
      state.monthlyFocus = null;
    }
    // Show celebration toast on first selection of this habit
    if (state.selectedHabits.indexOf(id) !== -1) {
      var habit = getHabitById(id);
      if (habit) {
        var randomCelebration = celebrationIdeas[Math.floor(Math.random() * celebrationIdeas.length)];
        showToast('Added! Remember to celebrate: ' + randomCelebration);
      }
    }
    saveState();
    renderGrid();
    renderFloatingPill();
    if (drawerOpen) renderDrawerContent();
  }

  // ============ Tab Navigation ============
  function switchTab(tab) {
    activeTab = tab;
    // Update tab buttons
    $$('.nav-tab').forEach(function (btn) {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tab);
    });
    // Show/hide content
    $$('.tab-content').forEach(function (panel) {
      panel.classList.toggle('active', panel.getAttribute('data-tab') === tab);
    });
    // Show/hide sidebar (only for explore tab)
    var sidebar = $('#sidebar');
    if (sidebar) {
      sidebar.style.display = tab === 'explore' ? '' : 'none';
    }
    var mainContent = $('.main-content');
    if (mainContent) {
      mainContent.style.marginLeft = tab === 'explore' ? '' : '0';
    }
  }

  // ============ Render: Onboarding Wizard ============
  function renderOnboarding() {
    var container = $('#onboarding-content');
    if (!container) return;
    container.innerHTML = '';

    var wrapper = el('div', { className: 'onboarding' });

    // Intro
    var intro = el('div', { className: 'onboarding-intro' });
    intro.innerHTML = '<h2>Find Your First Habit</h2>' +
      '<p>Feeling overwhelmed by 144 habits? That\'s normal. You only need <strong>one</strong>. Let\'s find the right one for you in 3 quick steps.</p>';
    wrapper.appendChild(intro);

    // Step indicators
    var dots = el('div', { className: 'onboarding-step-indicator' });
    for (var i = 0; i < 3; i++) {
      var dotClass = 'step-dot';
      if (i === onboardingStep) dotClass += ' active';
      else if (i < onboardingStep) dotClass += ' completed';
      dots.appendChild(el('div', { className: dotClass }));
    }
    wrapper.appendChild(dots);

    if (onboardingStep === 0) {
      renderOnboardingStep1(wrapper);
    } else if (onboardingStep === 1) {
      renderOnboardingStep2(wrapper);
    } else if (onboardingStep === 2) {
      renderOnboardingStep3(wrapper);
    } else {
      renderOnboardingResults(wrapper);
    }

    container.appendChild(wrapper);
  }

  function renderOnboardingStep1(wrapper) {
    var q = el('div', { className: 'onboarding-question' });
    q.innerHTML = '<h3>What area of your life would you most like to improve?</h3>' +
      '<p>Pick the one that calls to you most right now.</p>';
    wrapper.appendChild(q);

    var options = el('div', { className: 'onboarding-options' });
    categories.forEach(function (cat) {
      var emoji = categoryEmojis[cat.name] || '';
      var desc = categoryDescriptions[cat.name] || '';
      var opt = el('button', {
        className: 'onboarding-option' + (onboardingAnswers.category === cat.name ? ' selected' : '')
      });
      opt.innerHTML = '<span class="option-emoji">' + emoji + '</span>' +
        escapeHtml(cat.name) +
        '<div class="option-desc">' + escapeHtml(desc) + '</div>';
      opt.addEventListener('click', function () {
        onboardingAnswers.category = cat.name;
        renderOnboarding();
      });
      options.appendChild(opt);
    });
    wrapper.appendChild(options);

    var nav = el('div', { className: 'onboarding-nav' });
    nav.appendChild(el('div')); // spacer
    var nextBtn = el('button', {
      className: 'onboarding-btn primary',
      disabled: !onboardingAnswers.category ? 'disabled' : null
    }, 'Next');
    nextBtn.addEventListener('click', function () {
      if (onboardingAnswers.category) { onboardingStep = 1; renderOnboarding(); }
    });
    if (!onboardingAnswers.category) nextBtn.setAttribute('disabled', 'disabled');
    nav.appendChild(nextBtn);
    wrapper.appendChild(nav);
  }

  function renderOnboardingStep2(wrapper) {
    var q = el('div', { className: 'onboarding-question' });
    q.innerHTML = '<h3>How much daily time can you invest?</h3>' +
      '<p>Be honest. Starting small is the secret to lasting change.</p>';
    wrapper.appendChild(q);

    var timeOptions = [
      { value: 'tiny', label: '2 minutes or less', desc: 'Perfect starting point', emoji: '⏱️' },
      { value: 'short', label: '5-15 minutes', desc: 'A focused micro-session', emoji: '🕐' },
      { value: 'medium', label: '15-30 minutes', desc: 'A dedicated daily practice', emoji: '🕑' },
      { value: 'long', label: '30+ minutes', desc: 'A meaningful time investment', emoji: '🕐' }
    ];

    var options = el('div', { className: 'onboarding-options single-col' });
    timeOptions.forEach(function (t) {
      var opt = el('button', {
        className: 'onboarding-option' + (onboardingAnswers.time === t.value ? ' selected' : '')
      });
      opt.innerHTML = '<span class="option-emoji">' + t.emoji + '</span>' +
        escapeHtml(t.label) +
        '<div class="option-desc">' + escapeHtml(t.desc) + '</div>';
      opt.addEventListener('click', function () {
        onboardingAnswers.time = t.value;
        renderOnboarding();
      });
      options.appendChild(opt);
    });
    wrapper.appendChild(options);

    var nav = el('div', { className: 'onboarding-nav' });
    var backBtn = el('button', { className: 'onboarding-btn secondary' }, 'Back');
    backBtn.addEventListener('click', function () { onboardingStep = 0; renderOnboarding(); });
    nav.appendChild(backBtn);
    var nextBtn = el('button', {
      className: 'onboarding-btn primary'
    }, 'Next');
    if (!onboardingAnswers.time) nextBtn.setAttribute('disabled', 'disabled');
    nextBtn.addEventListener('click', function () {
      if (onboardingAnswers.time) { onboardingStep = 2; renderOnboarding(); }
    });
    nav.appendChild(nextBtn);
    wrapper.appendChild(nav);
  }

  function renderOnboardingStep3(wrapper) {
    var q = el('div', { className: 'onboarding-question' });
    q.innerHTML = '<h3>When in your day would you do this?</h3>' +
      '<p>Habits stick best when tied to a specific part of your routine.</p>';
    wrapper.appendChild(q);

    var todOptions = [
      { value: 'morning', label: 'Morning', desc: 'Start the day with intention', emoji: '🌅' },
      { value: 'evening', label: 'Evening', desc: 'Wind down with reflection', emoji: '🌙' },
      { value: 'flexible', label: 'Anytime', desc: 'I want flexibility', emoji: '🔄' },
      { value: 'throughout', label: 'Throughout the day', desc: 'A mindset I carry all day', emoji: '☀️' }
    ];

    var options = el('div', { className: 'onboarding-options single-col' });
    todOptions.forEach(function (t) {
      var opt = el('button', {
        className: 'onboarding-option' + (onboardingAnswers.timeOfDay === t.value ? ' selected' : '')
      });
      opt.innerHTML = '<span class="option-emoji">' + t.emoji + '</span>' +
        escapeHtml(t.label) +
        '<div class="option-desc">' + escapeHtml(t.desc) + '</div>';
      opt.addEventListener('click', function () {
        onboardingAnswers.timeOfDay = t.value;
        renderOnboarding();
      });
      options.appendChild(opt);
    });
    wrapper.appendChild(options);

    var nav = el('div', { className: 'onboarding-nav' });
    var backBtn = el('button', { className: 'onboarding-btn secondary' }, 'Back');
    backBtn.addEventListener('click', function () { onboardingStep = 1; renderOnboarding(); });
    nav.appendChild(backBtn);
    var nextBtn = el('button', { className: 'onboarding-btn primary' }, 'Show My Matches');
    if (!onboardingAnswers.timeOfDay) nextBtn.setAttribute('disabled', 'disabled');
    nextBtn.addEventListener('click', function () {
      if (onboardingAnswers.timeOfDay) { onboardingStep = 3; renderOnboarding(); }
    });
    nav.appendChild(nextBtn);
    wrapper.appendChild(nav);
  }

  function renderOnboardingResults(wrapper) {
    // Find matching habits
    var maxDuration = 60;
    if (onboardingAnswers.time === 'tiny') maxDuration = 5;
    else if (onboardingAnswers.time === 'short') maxDuration = 15;
    else if (onboardingAnswers.time === 'medium') maxDuration = 30;

    var matches = habits.filter(function (h) {
      if (h.category !== onboardingAnswers.category) return false;
      if (h.durationMinutes > maxDuration && h.durationMinutes !== 0) return false;
      if (onboardingAnswers.timeOfDay !== 'flexible' && h.timeOfDay !== 'flexible' &&
          h.timeOfDay !== onboardingAnswers.timeOfDay) return false;
      return true;
    });

    // Sort: easiest first (beginners need wins)
    var diffOrder = { easy: 0, moderate: 1, challenging: 2 };
    matches.sort(function (a, b) {
      return (diffOrder[a.difficulty] || 1) - (diffOrder[b.difficulty] || 1);
    });

    // Take top 5
    matches = matches.slice(0, 5);

    // If no exact matches, broaden search
    if (matches.length === 0) {
      matches = habits.filter(function (h) {
        return h.category === onboardingAnswers.category;
      }).sort(function (a, b) {
        return (diffOrder[a.difficulty] || 1) - (diffOrder[b.difficulty] || 1);
      }).slice(0, 5);
    }

    var results = el('div', { className: 'onboarding-results' });
    results.innerHTML = '<h3>Your Perfect Starting Habits</h3>' +
      '<p class="onboarding-results-subtitle">We recommend starting with just the first one. Remember: one habit, done tiny, for one month.</p>';

    matches.forEach(function (habit, index) {
      var catColor = getCategoryColor(habit.category);
      var card = el('div', {
        className: 'result-card' + (index === 0 ? ' recommended' : '')
      });

      var html = '';
      if (index === 0) html += '<span class="recommended-badge">Recommended Start</span>';
      html += '<div style="display:flex;gap:8px;align-items:center;margin-bottom:6px;">' +
        '<span class="category-tag" style="background:' + catColor.bgColor + ';color:' + catColor.textColor + '">' + escapeHtml(habit.category) + '</span>' +
        '<span style="font-size:12px;color:var(--text-muted)">' + escapeHtml(formatDifficulty(habit.difficulty)) + ' · ' + escapeHtml(formatDuration(habit.durationMinutes)) + '</span>' +
        '</div>';
      html += '<h4>' + escapeHtml(habit.name) + '</h4>';
      html += '<p>' + escapeHtml(habit.description.length > 150 ? habit.description.slice(0, 150) + '...' : habit.description) + '</p>';
      html += '<div class="result-tiny"><strong>Start Tiny:</strong> ' + escapeHtml(getTinyVersion(habit)) + '</div>';

      card.innerHTML = html;
      card.addEventListener('click', function () {
        // Select this habit and switch to explore tab
        if (!isSelected(habit.id)) {
          toggleHabitSelection(habit.id);
        }
        openModal(habit.id);
      });
      results.appendChild(card);
    });

    wrapper.appendChild(results);

    var actions = el('div', { className: 'onboarding-results-actions' });
    var backBtn = el('button', { className: 'onboarding-btn secondary' }, 'Start Over');
    backBtn.addEventListener('click', function () {
      onboardingStep = 0;
      onboardingAnswers = { category: null, time: null, timeOfDay: null };
      renderOnboarding();
    });
    actions.appendChild(backBtn);
    var exploreBtn = el('button', { className: 'onboarding-btn primary' }, 'Browse All Habits');
    exploreBtn.addEventListener('click', function () { switchTab('explore'); });
    actions.appendChild(exploreBtn);
    wrapper.appendChild(actions);
  }

  // ============ Render: Psychoeducation ============
  function renderPsychoed() {
    var container = $('#psychoed-content');
    if (!container) return;
    container.innerHTML = '';

    var wrapper = el('div', { className: 'psychoed' });

    var intro = el('div', { className: 'psychoed-intro' });
    intro.innerHTML = '<h2>The Science of Habit Change</h2>' +
      '<p>You don\'t need willpower. You need a system. Here\'s what decades of behavioral science research tells us about how habits actually form — and how to make them stick.</p>';
    wrapper.appendChild(intro);

    psychoedSections.forEach(function (section) {
      var card = el('div', { className: 'psychoed-card' });
      card.innerHTML = '<div class="psychoed-card-header">' +
        '<span class="psychoed-card-emoji">' + section.emoji + '</span>' +
        '<h3>' + escapeHtml(section.title) + '</h3>' +
        '</div>' + section.content;
      wrapper.appendChild(card);
    });

    // Call to action
    var cta = el('div', { style: { textAlign: 'center', padding: '20px 0 40px' } });
    var ctaBtn = el('button', { className: 'onboarding-btn primary' }, 'Find My First Habit');
    ctaBtn.addEventListener('click', function () {
      onboardingStep = 0;
      onboardingAnswers = { category: null, time: null, timeOfDay: null };
      switchTab('start');
    });
    cta.appendChild(ctaBtn);
    wrapper.appendChild(cta);

    container.appendChild(wrapper);
  }

  // ============ Render: Sidebar Filters ============
  function renderFilters() {
    var container = $('#filter-container');
    if (!container) return;
    container.innerHTML = '';

    // Search
    var searchWrap = el('div', { className: 'search-wrapper' });
    searchWrap.innerHTML = '<span class="search-icon">' + icons.search + '</span>';
    var input = el('input', {
      type: 'text',
      id: 'search-input',
      className: 'search-input',
      placeholder: 'Search habits...',
      value: filters.search,
      'aria-label': 'Search habits'
    });
    input.addEventListener('input', function () {
      clearTimeout(searchDebounce);
      searchDebounce = setTimeout(function () {
        filters.search = input.value;
        renderGrid();
        renderFilterSummary();
      }, 200);
    });
    searchWrap.appendChild(input);
    container.appendChild(searchWrap);

    // Category filter
    var catSection = el('div', { className: 'filter-section' });
    catSection.innerHTML = '<div class="filter-section-title">Category</div>';
    var catPills = el('div', { className: 'filter-pills' });
    categories.forEach(function (cat) {
      var count = habits.filter(function (h) { return h.category === cat.name; }).length;
      var pill = el('button', {
        className: 'filter-pill category-pill' + (filters.categories.indexOf(cat.name) !== -1 ? ' active' : ''),
        'aria-pressed': filters.categories.indexOf(cat.name) !== -1 ? 'true' : 'false',
        'aria-label': cat.name + ' (' + count + ' habits)',
        style: {
          '--pill-bg': cat.bgColor,
          '--pill-text': cat.textColor
        }
      }, escapeHtml(cat.name) + ' <span class="pill-count">(' + count + ')</span>');
      pill.addEventListener('click', function () {
        toggleInArray(filters.categories, cat.name);
        renderFilters();
        renderGrid();
      });
      catPills.appendChild(pill);
    });
    catSection.appendChild(catPills);
    container.appendChild(catSection);

    // Type filter
    var typeSection = el('div', { className: 'filter-section' });
    typeSection.innerHTML = '<div class="filter-section-title">Type</div>';
    var typePills = el('div', { className: 'filter-pills' });
    ['addition', 'removal'].forEach(function (t) {
      var label = t === 'addition' ? 'Addition' : 'Removal';
      var pill = el('button', {
        className: 'filter-pill' + (filters.types.indexOf(t) !== -1 ? ' active' : ''),
        'aria-pressed': filters.types.indexOf(t) !== -1 ? 'true' : 'false'
      }, label);
      pill.addEventListener('click', function () {
        toggleInArray(filters.types, t);
        renderFilters();
        renderGrid();
      });
      typePills.appendChild(pill);
    });
    typeSection.appendChild(typePills);
    container.appendChild(typeSection);

    // Difficulty filter
    var diffSection = el('div', { className: 'filter-section' });
    diffSection.innerHTML = '<div class="filter-section-title">Difficulty</div>';
    var diffPills = el('div', { className: 'filter-pills' });
    ['easy', 'moderate', 'challenging'].forEach(function (d) {
      var pill = el('button', {
        className: 'filter-pill' + (filters.difficulties.indexOf(d) !== -1 ? ' active' : ''),
        'aria-pressed': filters.difficulties.indexOf(d) !== -1 ? 'true' : 'false'
      }, formatDifficulty(d));
      pill.addEventListener('click', function () {
        toggleInArray(filters.difficulties, d);
        renderFilters();
        renderGrid();
      });
      diffPills.appendChild(pill);
    });
    diffSection.appendChild(diffPills);
    container.appendChild(diffSection);

    // Time of day filter
    var todSection = el('div', { className: 'filter-section' });
    todSection.innerHTML = '<div class="filter-section-title">Time of Day</div>';
    var todPills = el('div', { className: 'filter-pills' });
    ['morning', 'evening', 'flexible', 'throughout'].forEach(function (t) {
      var pill = el('button', {
        className: 'filter-pill' + (filters.timesOfDay.indexOf(t) !== -1 ? ' active' : ''),
        'aria-pressed': filters.timesOfDay.indexOf(t) !== -1 ? 'true' : 'false'
      }, formatTimeOfDay(t));
      pill.addEventListener('click', function () {
        toggleInArray(filters.timesOfDay, t);
        renderFilters();
        renderGrid();
      });
      todPills.appendChild(pill);
    });
    todSection.appendChild(todPills);
    container.appendChild(todSection);

    // Clear all filters
    if (hasActiveFilters()) {
      var clearBtn = el('button', { className: 'clear-filters-btn' }, icons.x + ' Clear all filters');
      clearBtn.addEventListener('click', clearAllFilters);
      container.appendChild(clearBtn);
    }

    // Summary
    var summary = el('div', { className: 'filter-summary', id: 'filter-summary' });
    container.appendChild(summary);
    renderFilterSummary();
  }

  function renderFilterSummary() {
    var summary = $('#filter-summary');
    if (!summary) return;
    var filtered = getFilteredHabits();
    summary.textContent = 'Showing ' + filtered.length + ' of ' + habits.length + ' habits';
  }

  // ============ Render: Habit Cards Grid ============
  function renderGrid() {
    var grid = $('#habits-grid');
    if (!grid) return;
    var filtered = getFilteredHabits();
    grid.innerHTML = '';

    if (filtered.length === 0) {
      var empty = el('div', { className: 'empty-state' });
      empty.innerHTML = '<p>No habits match your filters. Try broadening your search.</p>';
      var clearLink = el('button', { className: 'clear-link' }, 'Clear filters');
      clearLink.addEventListener('click', clearAllFilters);
      empty.appendChild(clearLink);
      grid.appendChild(empty);
      renderFilterSummary();
      return;
    }

    // Use DocumentFragment for batch DOM insertion (performance optimization)
    var fragment = document.createDocumentFragment();
    filtered.forEach(function (habit) {
      fragment.appendChild(createHabitCard(habit));
    });
    grid.appendChild(fragment);
    renderFilterSummary();
  }

  function createHabitCard(habit) {
    var catColor = getCategoryColor(habit.category);
    var selected = isSelected(habit.id);
    var card = el('div', {
      className: 'habit-card' + (selected ? ' selected' : ''),
      role: 'article',
      'aria-label': habit.name + ' - ' + habit.category,
      tabindex: '0'
    });

    // Click card to open modal
    card.addEventListener('click', function (e) {
      if (e.target.closest('.select-btn') || e.target.closest('.read-more-toggle')) return;
      openModal(habit.id);
    });
    card.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openModal(habit.id);
      }
    });

    // Top row: category tag + bonus badge
    var top = el('div', { className: 'habit-card-top' });
    var tag = el('span', {
      className: 'category-tag',
      style: { background: catColor.bgColor, color: catColor.textColor },
      'aria-label': 'Category: ' + habit.category
    }, escapeHtml(habit.category));
    top.appendChild(tag);
    if (habit.bonus) {
      top.appendChild(el('span', { className: 'bonus-badge', 'aria-label': 'Bonus habit' }, 'Bonus'));
    }
    card.appendChild(top);

    // Title
    card.appendChild(el('h3', {}, escapeHtml(habit.name)));

    // Description (clamped)
    var descId = 'desc-' + habit.id;
    var isExpanded = expandedCards.has(habit.id);
    var desc = el('p', {
      className: 'habit-card-description' + (isExpanded ? ' expanded' : ''),
      id: descId
    }, escapeHtml(habit.description));
    card.appendChild(desc);

    // Read more toggle
    var toggle = el('button', {
      className: 'read-more-toggle',
      'aria-expanded': isExpanded ? 'true' : 'false',
      'aria-controls': descId
    }, isExpanded ? 'Show less' : 'Read more');
    toggle.addEventListener('click', function (e) {
      e.stopPropagation();
      if (expandedCards.has(habit.id)) expandedCards.delete(habit.id);
      else expandedCards.add(habit.id);
      desc.classList.toggle('expanded');
      toggle.textContent = expandedCards.has(habit.id) ? 'Show less' : 'Read more';
      toggle.setAttribute('aria-expanded', expandedCards.has(habit.id) ? 'true' : 'false');
    });
    card.appendChild(toggle);

    // Tiny version hint
    var tinyHint = el('div', { className: 'tiny-hint' });
    tinyHint.innerHTML = '<span class="tiny-hint-icon">🌱</span><span>Start tiny: ' + escapeHtml(getTinyVersion(habit)) + '</span>';
    card.appendChild(tinyHint);

    // Meta row
    var meta = el('div', { className: 'habit-card-meta' });
    meta.innerHTML =
      '<span class="meta-item">' + icons.zap + ' ' + escapeHtml(formatDifficulty(habit.difficulty)) + '</span>' +
      '<span class="meta-item">' + icons.sun + ' ' + escapeHtml(formatTimeOfDay(habit.timeOfDay)) + '</span>' +
      '<span class="meta-item">' + icons.clock + ' ' + escapeHtml(formatDuration(habit.durationMinutes)) + '</span>';
    card.appendChild(meta);

    // Select button
    var actions = el('div', { className: 'habit-card-actions' });
    var btn = el('button', {
      className: 'select-btn ' + (selected ? 'is-selected' : 'unselected'),
      'aria-label': selected ? 'Remove ' + habit.name + ' from my habits' : 'Add ' + habit.name + ' to my habits'
    }, selected ? icons.check + ' Selected' : 'Add to My Habits');
    btn.addEventListener('click', function (e) {
      toggleHabitSelection(habit.id, e);
    });
    actions.appendChild(btn);
    card.appendChild(actions);

    return card;
  }

  // ============ Render: Floating Pill ============
  function renderFloatingPill() {
    var existing = $('#floating-pill');
    if (existing) existing.remove();

    if (state.selectedHabits.length === 0) return;

    var pill = el('button', {
      id: 'floating-pill',
      className: 'floating-pill',
      'aria-label': state.selectedHabits.length + ' habits selected. Click to view your habits.'
    });
    pill.innerHTML = '<span class="pill-dot"></span> ' + state.selectedHabits.length + ' habit' + (state.selectedHabits.length !== 1 ? 's' : '') + ' selected';
    pill.addEventListener('click', function () { openDrawer(); });
    document.body.appendChild(pill);
  }

  // ============ Render: Drawer ============
  function openDrawer() {
    drawerOpen = true;
    renderDrawer();
    setTimeout(function () {
      var closeBtn = $('.drawer .close-btn');
      if (closeBtn) closeBtn.focus();
    }, 100);
  }

  function closeDrawer() {
    drawerOpen = false;
    document.removeEventListener('keydown', drawerEscHandler);
    var backdrop = $('#drawer-backdrop');
    var drawer = $('#my-habits-drawer');
    if (backdrop) backdrop.remove();
    if (drawer) drawer.remove();
  }

  function renderDrawer() {
    var existingBackdrop = $('#drawer-backdrop');
    var existingDrawer = $('#my-habits-drawer');
    if (existingBackdrop) existingBackdrop.remove();
    if (existingDrawer) existingDrawer.remove();

    // Backdrop
    var backdrop = el('div', { className: 'backdrop', id: 'drawer-backdrop' });
    backdrop.addEventListener('click', closeDrawer);
    document.body.appendChild(backdrop);

    // Drawer
    var drawer = el('div', {
      className: 'drawer',
      id: 'my-habits-drawer',
      role: 'dialog',
      'aria-label': 'My Habits',
      'aria-modal': 'true'
    });

    // Header
    var header = el('div', { className: 'drawer-header' });
    header.innerHTML = '<h2>My Habits <span class="habit-count-badge">' + state.selectedHabits.length + '</span></h2>';
    var closeBtn = el('button', { className: 'close-btn', 'aria-label': 'Close drawer' }, icons.x);
    closeBtn.addEventListener('click', closeDrawer);
    header.appendChild(closeBtn);
    drawer.appendChild(header);

    // Body
    var body = el('div', { className: 'drawer-body', id: 'drawer-body' });
    drawer.appendChild(body);

    // Footer
    var footer = el('div', { className: 'drawer-footer' });
    var resetBtn = el('button', { className: 'reset-btn' }, icons.trash + ' Reset All');
    resetBtn.addEventListener('click', function () {
      showConfirm('This will clear all your selections and notes. Continue?', function () {
        resetState();
        closeDrawer();
      });
    });
    footer.appendChild(resetBtn);
    drawer.appendChild(footer);

    document.body.appendChild(drawer);
    renderDrawerContent();

    // Escape key — remove old handler first to prevent stacking
    document.removeEventListener('keydown', drawerEscHandler);
    document.addEventListener('keydown', drawerEscHandler);
  }

  function drawerEscHandler(e) {
    if (e.key === 'Escape' && drawerOpen && !modalHabitId && !confirmCallback) {
      closeDrawer();
    }
  }

  function renderDrawerContent() {
    var body = $('#drawer-body');
    if (!body) return;
    body.innerHTML = '';

    if (state.selectedHabits.length === 0) {
      body.innerHTML = '<div class="drawer-empty">' +
        '<p>You haven\'t selected any habits yet.</p>' +
        '<p>Browse the collection and add habits that speak to you.</p>' +
        '<p style="margin-top:16px"><button class="onboarding-btn primary" id="drawer-find-btn">Help Me Find One</button></p>' +
        '</div>';
      var findBtn = $('#drawer-find-btn');
      if (findBtn) {
        findBtn.addEventListener('click', function () {
          closeDrawer();
          onboardingStep = 0;
          onboardingAnswers = { category: null, time: null, timeOfDay: null };
          switchTab('start');
        });
      }
      var badge = $('.habit-count-badge');
      if (badge) badge.textContent = '0';
      return;
    }

    // Update badge
    var badge = $('.habit-count-badge');
    if (badge) badge.textContent = state.selectedHabits.length;

    // Monthly Focus Section
    var focusSection = el('div', { className: 'drawer-section' });
    focusSection.innerHTML = '<div class="drawer-section-title">' + icons.star + ' Monthly Focus</div>' +
      '<div class="drawer-section-subtitle">Choose one habit as your monthly focus. One is enough.</div>';
    body.appendChild(focusSection);

    // Selected Habits List
    var listSection = el('div', { className: 'drawer-section' });
    listSection.innerHTML = '<div class="drawer-section-title">Selected Habits</div>';

    state.selectedHabits.forEach(function (hid) {
      var habit = getHabitById(hid);
      if (!habit) return;
      var catColor = getCategoryColor(habit.category);
      var isFocus = state.monthlyFocus === hid;

      var item = el('div', { className: 'selected-habit-item' + (isFocus ? ' is-focus' : '') });

      var info = el('div', { className: 'selected-habit-info' });
      info.innerHTML = '<div class="selected-habit-name">' + (isFocus ? icons.star + ' ' : '') + escapeHtml(habit.name) + '</div>' +
        '<span class="selected-habit-category category-tag" style="background:' + catColor.bgColor + ';color:' + catColor.textColor + '">' + escapeHtml(habit.category) + '</span>';
      item.appendChild(info);

      // Focus button
      var focusBtn = el('button', {
        className: 'focus-btn' + (isFocus ? ' is-focus' : ''),
        'aria-label': isFocus ? habit.name + ' is your monthly focus' : 'Set ' + habit.name + ' as monthly focus'
      }, isFocus ? '\u2605 Focus' : 'Set Focus');
      focusBtn.addEventListener('click', function () {
        state.monthlyFocus = isFocus ? null : hid;
        saveState();
        renderDrawerContent();
      });
      item.appendChild(focusBtn);

      // Remove button
      var removeBtn = el('button', {
        className: 'remove-btn',
        'aria-label': 'Remove ' + habit.name
      }, icons.x);
      removeBtn.addEventListener('click', function () {
        toggleHabitSelection(hid);
      });
      item.appendChild(removeBtn);

      listSection.appendChild(item);
    });
    body.appendChild(listSection);

    // Habit Stacking Section — ABC Recipe format
    var stackSection = el('div', { className: 'drawer-section' });
    stackSection.innerHTML = '<div class="drawer-section-title">\uD83D\uDD17 Stack Your Habits (ABC Recipe)</div>' +
      '<div class="drawer-section-subtitle"><strong>A</strong>fter I [anchor], I will do my <strong>B</strong>ehavior, then <strong>C</strong>elebrate.</div>';

    var checklist = el('div', { className: 'routine-checklist' });
    stackingSuggestions.forEach(function (s) {
      var label = el('label', { className: 'routine-check-item' });
      var cb = el('input', {
        type: 'checkbox',
        'aria-label': s.routine
      });
      cb.checked = state.existingRoutines.indexOf(s.routine) !== -1;
      cb.addEventListener('change', function () {
        if (cb.checked) {
          if (state.existingRoutines.indexOf(s.routine) === -1) state.existingRoutines.push(s.routine);
        } else {
          state.existingRoutines = state.existingRoutines.filter(function (r) { return r !== s.routine; });
        }
        saveState();
        renderStackingMatches();
      });
      label.appendChild(cb);
      label.appendChild(document.createTextNode(' ' + s.routine));
      checklist.appendChild(label);
    });
    stackSection.appendChild(checklist);

    var matchesContainer = el('div', { id: 'stacking-matches' });
    stackSection.appendChild(matchesContainer);
    body.appendChild(stackSection);

    renderStackingMatches();

    // Celebration Section
    var celebSection = el('div', { className: 'drawer-section' });
    celebSection.innerHTML = '<div class="drawer-section-title">\uD83C\uDF89 Celebrate (The Secret Ingredient)</div>' +
      '<div class="drawer-section-subtitle">After each tiny habit, celebrate immediately. This is how your brain wires the habit in. What will you do?</div>';

    state.selectedHabits.forEach(function (hid) {
      var habit = getHabitById(hid);
      if (!habit) return;
      var wrap = el('div', { className: 'celebration-input-wrap' });
      var lbl = el('label');
      lbl.textContent = habit.name + ':';
      wrap.appendChild(lbl);
      var inp = el('input', {
        type: 'text',
        className: 'celebration-input',
        placeholder: 'e.g., "Say \'I did it!\' and smile"',
        value: state.celebrations[hid] || ''
      });
      inp.addEventListener('input', function () {
        state.celebrations[hid] = inp.value;
        clearTimeout(reflectionDebounce);
        reflectionDebounce = setTimeout(function () { saveState(); }, 500);
      });
      wrap.appendChild(inp);
      celebSection.appendChild(wrap);
    });

    body.appendChild(celebSection);

    // Reflection Section
    var reflSection = el('div', { className: 'drawer-section' });
    reflSection.innerHTML = '<div class="drawer-section-title">\uD83D\uDCDD Monthly Reflection</div>' +
      '<div class="drawer-section-subtitle">What\'s the one change you can make this month that will have the biggest impact?</div>';
    var textarea = el('textarea', {
      className: 'reflection-textarea',
      placeholder: 'Write your reflection here...',
      'aria-label': 'Monthly reflection notes',
      rows: '6'
    });
    textarea.value = state.reflectionNotes;
    textarea.addEventListener('input', function () {
      clearTimeout(reflectionDebounce);
      reflectionDebounce = setTimeout(function () {
        state.reflectionNotes = textarea.value;
        saveState();
      }, 500);
    });
    reflSection.appendChild(textarea);
    body.appendChild(reflSection);

    // Copy Plan Button
    var exportSection = el('div', { className: 'drawer-section' });
    var copyBtn = el('button', { className: 'copy-plan-btn' }, icons.copy + ' Copy My Plan');
    copyBtn.addEventListener('click', copyPlan);
    exportSection.appendChild(copyBtn);
    body.appendChild(exportSection);
  }

  function renderStackingMatches() {
    var container = $('#stacking-matches');
    if (!container) return;
    container.innerHTML = '';

    var matches = [];
    state.existingRoutines.forEach(function (routineName) {
      var suggestion = stackingSuggestions.find(function (s) { return s.routine === routineName; });
      if (!suggestion) return;
      suggestion.habitIds.forEach(function (hid) {
        if (state.selectedHabits.indexOf(hid) !== -1) {
          var habit = getHabitById(hid);
          if (habit) {
            matches.push({ habit: habit, routine: routineName, tip: suggestion.tip });
          }
        }
      });
    });

    if (matches.length === 0) {
      container.innerHTML = '<div class="no-stacking-msg">Select more habits or routines to see stacking suggestions.</div>';
      return;
    }

    matches.forEach(function (m) {
      var recipe = el('div', { className: 'abc-recipe' });
      var tinyVer = getTinyVersion(m.habit);
      recipe.innerHTML = '<div class="abc-recipe-line">' +
        '<strong>After I</strong> ' + escapeHtml(m.routine.toLowerCase()) + ', ' +
        '<strong>I will</strong> ' + escapeHtml(tinyVer.toLowerCase()) + '.</div>' +
        '<div class="abc-recipe-celebrate">' +
        (state.celebrations[m.habit.id]
          ? 'Then I\'ll celebrate: ' + escapeHtml(state.celebrations[m.habit.id])
          : 'Then I\'ll celebrate by... (set your celebration above!)') +
        '</div>';
      container.appendChild(recipe);
    });
  }

  // ============ Copy Plan ============
  function copyPlan() {
    var focusHabit = state.monthlyFocus ? getHabitById(state.monthlyFocus) : null;
    var text = 'My Habit Plan\n\n';

    if (focusHabit) {
      text += 'Monthly Focus: ' + focusHabit.name + '\n';
      text += 'Start Tiny: ' + getTinyVersion(focusHabit) + '\n\n';
    }

    text += 'Selected Habits:\n';
    state.selectedHabits.forEach(function (hid) {
      var h = getHabitById(hid);
      if (h) {
        text += '\u2022 ' + h.name + ' (' + h.category + ')\n';
        text += '  Start tiny: ' + getTinyVersion(h) + '\n';
      }
    });

    // ABC Recipes
    var stackMatches = [];
    state.existingRoutines.forEach(function (routineName) {
      var suggestion = stackingSuggestions.find(function (s) { return s.routine === routineName; });
      if (!suggestion) return;
      suggestion.habitIds.forEach(function (hid) {
        if (state.selectedHabits.indexOf(hid) !== -1) {
          var habit = getHabitById(hid);
          if (habit) stackMatches.push({ habit: habit, routine: routineName });
        }
      });
    });

    if (stackMatches.length > 0) {
      text += '\nABC Recipes (Anchor \u2192 Behavior \u2192 Celebrate):\n';
      stackMatches.forEach(function (m) {
        var tiny = getTinyVersion(m.habit);
        var celeb = state.celebrations[m.habit.id] || 'celebrate!';
        text += '\u2022 After I ' + m.routine.toLowerCase() + ', I will ' + tiny.toLowerCase() + '. Then I\'ll ' + celeb + '\n';
      });
    }

    if (state.reflectionNotes) {
      text += '\nReflection:\n' + state.reflectionNotes + '\n';
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        showToast('Copied to clipboard!');
      }).catch(function () {
        fallbackCopy(text);
      });
    } else {
      fallbackCopy(text);
    }
  }

  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      showToast('Copied to clipboard!');
    } catch (e) {
      showToast('Could not copy. Please copy manually.');
    }
    document.body.removeChild(ta);
  }

  // ============ Toast ============
  function showToast(msg) {
    var existing = $('.toast');
    if (existing) existing.remove();
    var toast = el('div', { className: 'toast' }, escapeHtml(msg));
    document.body.appendChild(toast);
    setTimeout(function () { if (toast.parentNode) toast.remove(); }, 2500);
  }

  // ============ Confirm Dialog ============
  function showConfirm(msg, onConfirm) {
    confirmCallback = onConfirm;
    var overlay = el('div', { className: 'confirm-overlay', id: 'confirm-overlay' });
    var dialog = el('div', { className: 'confirm-dialog', role: 'alertdialog', 'aria-label': 'Confirmation' });
    dialog.innerHTML = '<p>' + escapeHtml(msg) + '</p>';
    var actions = el('div', { className: 'confirm-actions' });

    var cancelBtn = el('button', { className: 'confirm-cancel' }, 'Cancel');
    cancelBtn.addEventListener('click', function () {
      confirmCallback = null;
      overlay.remove();
    });

    var okBtn = el('button', { className: 'confirm-ok' }, 'Continue');
    okBtn.addEventListener('click', function () {
      overlay.remove();
      if (confirmCallback) {
        var cb = confirmCallback;
        confirmCallback = null;
        cb();
      }
    });

    actions.appendChild(cancelBtn);
    actions.appendChild(okBtn);
    dialog.appendChild(actions);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    cancelBtn.focus();

    overlay.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        confirmCallback = null;
        overlay.remove();
      }
    });
  }

  // ============ Modal (Habit Detail) ============
  function openModal(habitId) {
    modalHabitId = habitId;
    renderModal();
  }

  function closeModal() {
    modalHabitId = null;
    var overlay = $('#modal-overlay');
    if (overlay) overlay.remove();
    document.removeEventListener('keydown', modalEscHandler);
  }

  function modalEscHandler(e) {
    if (e.key === 'Escape' && modalHabitId && !confirmCallback) {
      closeModal();
    }
  }

  function renderModal() {
    var existing = $('#modal-overlay');
    if (existing) existing.remove();

    // Remove old handler before adding new one (prevents stacking)
    document.removeEventListener('keydown', modalEscHandler);

    var habit = getHabitById(modalHabitId);
    if (!habit) return;

    var catColor = getCategoryColor(habit.category);
    var selected = isSelected(habit.id);

    var overlay = el('div', { className: 'modal-overlay', id: 'modal-overlay' });
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeModal();
    });

    var modal = el('div', {
      className: 'modal',
      role: 'dialog',
      'aria-label': habit.name + ' details',
      'aria-modal': 'true'
    });

    // Close button
    var closeBtn = el('button', { className: 'modal-close', 'aria-label': 'Close' }, icons.x);
    closeBtn.addEventListener('click', closeModal);
    modal.appendChild(closeBtn);

    var content = el('div', { className: 'modal-content' });

    // Tags row
    var tags = el('div', { className: 'modal-tags' });
    tags.appendChild(el('span', {
      className: 'category-tag',
      style: { background: catColor.bgColor, color: catColor.textColor }
    }, escapeHtml(habit.category)));
    tags.appendChild(el('span', {
      className: 'type-badge ' + habit.type
    }, habit.type === 'addition' ? '+ Addition' : '\u2212 Removal'));
    if (habit.bonus) {
      tags.appendChild(el('span', { className: 'bonus-badge' }, 'Bonus'));
    }
    content.appendChild(tags);

    // Title
    content.appendChild(el('h2', {}, escapeHtml(habit.name)));

    // Description
    var descText = habit.description;
    var tipText = null;
    var tipMatch = descText.match(/Tip:\s*(.+?)$/i);
    if (tipMatch) {
      tipText = tipMatch[1].trim();
      descText = descText.replace(/\s*Tip:\s*.+?$/i, '').trim();
    }

    content.appendChild(el('p', { className: 'modal-description' }, escapeHtml(descText)));

    // Tip callout
    if (tipText) {
      var tipDiv = el('div', { className: 'tip-callout' });
      tipDiv.innerHTML = '<span class="tip-callout-icon">\uD83D\uDCA1</span><span class="tip-callout-text">' + escapeHtml(tipText) + '</span>';
      content.appendChild(tipDiv);
    }

    // Removal type tip
    if (habit.type === 'removal') {
      var removalTip = el('div', { className: 'removal-tip-callout' });
      removalTip.innerHTML = '<span class="tip-callout-icon">\uD83D\uDCA1</span><span class="removal-tip-callout-text">When removing a habit, replace it with a positive one. Nature abhors a vacuum — fill the space intentionally.</span>';
      content.appendChild(removalTip);
    }

    // Tiny Version section (NEW)
    var tinyDiv = el('div', { className: 'tiny-section' });
    tinyDiv.innerHTML = '<div class="tiny-section-title">\uD83C\uDF31 Start Tiny (2-Minute Version)</div>' +
      '<div class="tiny-section-text">' + escapeHtml(getTinyVersion(habit)) + '</div>' +
      '<div class="tiny-section-footer">Master the tiny version first. Once it\'s automatic, let it grow naturally.</div>';
    content.appendChild(tinyDiv);

    // B=MAP Visual (NEW)
    var bmap = getBMAP(habit);
    var bmapDiv = el('div', { className: 'bmap-section' });
    bmapDiv.innerHTML = '<div class="bmap-title">B=MAP Analysis</div>' +
      '<div class="bmap-formula"><span>B</span>ehavior = <span>M</span>otivation \u00D7 <span>A</span>bility \u00D7 <span>P</span>rompt</div>' +
      '<div class="bmap-bars">' +
        '<div class="bmap-bar-row"><span class="bmap-bar-label">Motivation</span>' +
          '<div class="bmap-bar-track"><div class="bmap-bar-fill motivation" style="width:' + (bmap.motivation * 20) + '%"></div></div>' +
          '<span class="bmap-bar-value">' + bmap.motivation + '/5</span></div>' +
        '<div class="bmap-bar-row"><span class="bmap-bar-label">Ability</span>' +
          '<div class="bmap-bar-track"><div class="bmap-bar-fill ability" style="width:' + (bmap.ability * 20) + '%"></div></div>' +
          '<span class="bmap-bar-value">' + bmap.ability + '/5</span></div>' +
        '<div class="bmap-bar-row"><span class="bmap-bar-label">Prompt</span>' +
          '<div class="bmap-bar-track"><div class="bmap-bar-fill prompt" style="width:' + (bmap.prompt * 20) + '%"></div></div>' +
          '<span class="bmap-bar-value">' + bmap.prompt + '/5</span></div>' +
      '</div>' +
      '<div class="bmap-insight">' + escapeHtml(bmap.insight) + '</div>';
    content.appendChild(bmapDiv);

    // Metadata
    var meta = el('div', { className: 'modal-meta' });
    meta.innerHTML =
      '<div class="modal-meta-item">' + icons.zap + ' <strong>Difficulty:</strong> ' + escapeHtml(formatDifficulty(habit.difficulty)) + '</div>' +
      '<div class="modal-meta-item">' + icons.sun + ' <strong>Time of Day:</strong> ' + escapeHtml(formatTimeOfDay(habit.timeOfDay)) + '</div>' +
      '<div class="modal-meta-item">' + icons.clock + ' <strong>Duration:</strong> ' + escapeHtml(formatDuration(habit.durationMinutes)) + '</div>';
    content.appendChild(meta);

    // Stacking suggestion
    var stackingForHabit = [];
    stackingSuggestions.forEach(function (s) {
      if (s.habitIds.indexOf(habit.id) !== -1) {
        stackingForHabit.push(s);
      }
    });
    if (stackingForHabit.length > 0) {
      stackingForHabit.forEach(function (s) {
        var stackDiv = el('div', { className: 'modal-stacking' });
        stackDiv.innerHTML = '<div class="modal-stacking-title">\uD83D\uDD17 Try stacking this with:</div>' +
          '<div class="modal-stacking-text">"After I ' + escapeHtml(s.routine.toLowerCase()) + ', I will ' + escapeHtml(getTinyVersion(habit).toLowerCase()) + '."</div>';
        content.appendChild(stackDiv);
      });
    }

    // Why this habit matters
    if (habit.whyItMatters) {
      var whyDiv = el('div', { className: 'why-matters' });
      whyDiv.innerHTML = '<div class="why-matters-title">Why This Habit Matters</div>' +
        '<div class="why-matters-text">' + escapeHtml(habit.whyItMatters) + '</div>';
      content.appendChild(whyDiv);
    }

    // Select/Deselect button
    var selectBtn = el('button', {
      className: 'modal-select-btn ' + (selected ? 'is-selected' : 'unselected'),
      'aria-label': selected ? 'Remove ' + habit.name + ' from my habits' : 'Add ' + habit.name + ' to my habits'
    }, selected ? icons.check + ' Selected \u2014 Remove from My Habits' : 'Add to My Habits');
    selectBtn.addEventListener('click', function () {
      toggleHabitSelection(habit.id);
      renderModal();
    });
    content.appendChild(selectBtn);

    modal.appendChild(content);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    closeBtn.focus();
    document.addEventListener('keydown', modalEscHandler);
  }

  // ============ Render All ============
  function renderAll() {
    renderFilters();
    renderGrid();
    renderFloatingPill();
    renderOnboarding();
    renderPsychoed();
    if (drawerOpen) renderDrawerContent();
  }

  // ============ Init ============
  function init() {
    storageAvailable = checkStorage();

    if (!storageAvailable) {
      var banner = el('div', { className: 'storage-banner' }, 'Your selections won\'t be saved in private browsing mode.');
      document.body.prepend(banner);
    }

    fetch('data/habits.json')
      .then(function (r) { return r.json(); })
      .then(function (data) {
        habits = data.habits;
        categories = data.categories;
        stackingSuggestions = data.stackingSuggestions;

        loadState();
        buildLayout();
        renderAll();
      })
      .catch(function (err) {
        console.error('Failed to load habits data:', err);
        document.body.innerHTML = '<div style="padding:40px;text-align:center;color:#c00;">Failed to load habits data. Please ensure data/habits.json is available.</div>';
      });
  }

  function buildLayout() {
    var app = $('#app');
    if (!app) return;
    app.innerHTML = '';

    // Mobile header
    var appHeader = el('div', { className: 'app-header' });
    var headerLeft = el('div');
    headerLeft.innerHTML = '<h1>100 Habits Explorer</h1>';
    appHeader.appendChild(headerLeft);

    var headerRight = el('div', { style: { display: 'flex', gap: '8px' } });
    var filterToggle = el('button', {
      className: 'mobile-filter-toggle',
      'aria-label': 'Toggle filters'
    }, icons.filter + ' Filters');
    filterToggle.addEventListener('click', function () {
      sidebarOpen = !sidebarOpen;
      var sidebar = $('#sidebar');
      var sidebarOv = $('#sidebar-overlay');
      if (sidebar) sidebar.classList.toggle('open', sidebarOpen);
      if (sidebarOv) sidebarOv.classList.toggle('visible', sidebarOpen);
    });
    headerRight.appendChild(filterToggle);

    var myHabitsBtn = el('button', {
      className: 'my-habits-header-btn',
      'aria-label': 'View my habits'
    }, icons.heart + ' My Habits');
    myHabitsBtn.addEventListener('click', openDrawer);
    headerRight.appendChild(myHabitsBtn);
    appHeader.appendChild(headerRight);
    app.appendChild(appHeader);

    // Sidebar overlay (mobile)
    var sidebarOverlay = el('div', { className: 'sidebar-overlay', id: 'sidebar-overlay' });
    sidebarOverlay.addEventListener('click', function () {
      sidebarOpen = false;
      var sidebar = $('#sidebar');
      if (sidebar) sidebar.classList.remove('open');
      sidebarOverlay.classList.remove('visible');
    });
    app.appendChild(sidebarOverlay);

    // Layout
    var layout = el('div', { className: 'app-layout' });

    // Sidebar
    var sidebar = el('aside', { className: 'sidebar', id: 'sidebar', role: 'complementary', 'aria-label': 'Filters' });
    var sidebarHeader = el('div', { className: 'sidebar-header' });
    sidebarHeader.innerHTML = '<h2>Filters</h2>';
    sidebar.appendChild(sidebarHeader);
    var filterContainer = el('div', { id: 'filter-container' });
    sidebar.appendChild(filterContainer);
    layout.appendChild(sidebar);

    // Main
    var main = el('main', { className: 'main-content' });

    // Desktop header
    var mainHeader = el('div', { className: 'main-header' });
    mainHeader.innerHTML = '<h1>100 Habits Explorer</h1><p class="subtitle">Choose one habit. Practice it for a month. Transform your life.</p>';
    main.appendChild(mainHeader);

    // Navigation tabs
    var tabBar = el('div', { className: 'nav-tabs' });
    var tabs = [
      { id: 'explore', label: 'Explore Habits', emoji: '\uD83D\uDD0D' },
      { id: 'start', label: 'Get Started', emoji: '\uD83C\uDF31' },
      { id: 'learn', label: 'Learn the Science', emoji: '\uD83E\uDDE0' }
    ];
    tabs.forEach(function (t) {
      var tab = el('button', {
        className: 'nav-tab' + (t.id === activeTab ? ' active' : ''),
        'data-tab': t.id
      }, '<span class="tab-emoji">' + t.emoji + '</span> ' + t.label);
      tab.addEventListener('click', function () { switchTab(t.id); });
      tabBar.appendChild(tab);
    });
    main.appendChild(tabBar);

    // Tab: Explore (habit grid)
    var exploreTab = el('div', { className: 'tab-content' + (activeTab === 'explore' ? ' active' : ''), 'data-tab': 'explore' });
    var grid = el('div', { className: 'habits-grid', id: 'habits-grid', 'aria-label': 'Habits grid' });
    exploreTab.appendChild(grid);
    main.appendChild(exploreTab);

    // Tab: Get Started (onboarding)
    var startTab = el('div', { className: 'tab-content' + (activeTab === 'start' ? ' active' : ''), 'data-tab': 'start' });
    var onboardingContent = el('div', { id: 'onboarding-content' });
    startTab.appendChild(onboardingContent);
    main.appendChild(startTab);

    // Tab: Learn (psychoeducation)
    var learnTab = el('div', { className: 'tab-content' + (activeTab === 'learn' ? ' active' : ''), 'data-tab': 'learn' });
    var psychoedContent = el('div', { id: 'psychoed-content' });
    learnTab.appendChild(psychoedContent);
    main.appendChild(learnTab);

    layout.appendChild(main);
    app.appendChild(layout);

    // Apply initial tab visibility for sidebar
    if (activeTab !== 'explore') {
      sidebar.style.display = 'none';
      main.style.marginLeft = '0';
    }
  }

  // Start
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
