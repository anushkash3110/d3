const ACTIVITIES = {
  water: {
    type: "water",
    icon: "💧",
    title: "Hydration Break",
    description: "Drink a full glass of water. Your brain is 75% water — feed it.",
    durationSeconds: 30,
    category: "physical",
  },
  breathing: {
    type: "breathing",
    icon: "🌬️",
    title: "4-7-8 Breathing",
    description: "Inhale 4 seconds → Hold 7 seconds → Exhale 8 seconds. Repeat 3 times.",
    durationSeconds: 60,
    category: "mindfulness",
    steps: ["Inhale... 1, 2, 3, 4", "Hold... 1, 2, 3, 4, 5, 6, 7", "Exhale... 1–8"],
  },
  walk: {
    type: "walk",
    icon: "🚶",
    title: "5-Minute Walk",
    description: "Step away. Walk anywhere — room, hallway, outside. No phone.",
    durationSeconds: 300,
    category: "physical",
  },
  stretch: {
    type: "stretch",
    icon: "🧘",
    title: "Desk Stretch",
    description: "Roll your neck, arms overhead, touch your toes. 60 seconds.",
    durationSeconds: 60,
    category: "physical",
  },
  read: {
    type: "read",
    icon: "📖",
    title: "Read 2 Pages",
    description: "Pick up any book. Read just 2 pages — slowly and mindfully.",
    durationSeconds: 180,
    category: "cognitive",
  },
  gratitude: {
    type: "gratitude",
    icon: "🙏",
    title: "Gratitude Pause",
    description: "Name 3 things you are grateful for. Say them out loud.",
    durationSeconds: 45,
    category: "mindfulness",
  },
  pomodoro: {
    type: "pomodoro",
    icon: "🍅",
    title: "Focus Session",
    description: "25 minutes of deep work. No distractions. Phone face down.",
    durationSeconds: 1500,
    category: "productivity",
  },
};

const pickRandom = (items) => items[Math.floor(Math.random() * items.length)];

const getActivityForContext = (hour, mode) => {
  if (mode === "lock") return ACTIVITIES.pomodoro;
  if (hour >= 6 && hour < 10) return pickRandom([ACTIVITIES.water, ACTIVITIES.stretch, ACTIVITIES.breathing]);
  if (hour >= 10 && hour < 14) return pickRandom([ACTIVITIES.water, ACTIVITIES.pomodoro, ACTIVITIES.read]);
  if (hour >= 14 && hour < 18) return pickRandom([ACTIVITIES.breathing, ACTIVITIES.walk, ACTIVITIES.stretch]);
  if (hour >= 18 && hour < 22) return pickRandom([ACTIVITIES.gratitude, ACTIVITIES.read, ACTIVITIES.breathing]);
  return pickRandom([ACTIVITIES.breathing, ACTIVITIES.gratitude]);
};

module.exports = { ACTIVITIES, getActivityForContext };
