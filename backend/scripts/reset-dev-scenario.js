const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const DEFAULT_PORT = process.env.PORT || "3010";
const API_BASE_URL =
  process.env.API_BASE_URL || `http://127.0.0.1:${DEFAULT_PORT}`;
const ASSET_BASE_URL = process.env.BASE_URL || API_BASE_URL;

const PHOTO_FILES = [
  "uifaces-human-avatar.jpg",
  "uifaces-human-avatar (1).jpg",
  "uifaces-human-avatar (2).jpg",
];

const SCENARIOS = {
  "ui-preview": {
    password: "PreviewPass123!",
    users: [
      {
        key: "lana",
        email: "preview.lana@brdg.local",
        firstName: "Lana",
        birthdate: "1996-04-14",
        gender: "woman",
        profile: {
          city: "Honolulu",
          country: "US",
          latitude: 21.2767,
          longitude: -157.8275,
          bio: "Morning runner looking for dates, workouts, and low-pressure beach hangs.",
          intentDating: true,
          intentWorkout: true,
          intentFriends: false,
          showMeMen: true,
          showMeWomen: true,
          showMeOther: true,
          maxDistanceKm: 50,
        },
        fitness: {
          intensityLevel: "INTERMEDIATE",
          weeklyFrequencyBand: "3-4",
          primaryGoal: "endurance",
          favoriteActivities: "Running, Yoga, Beach",
          prefersMorning: true,
          prefersEvening: true,
        },
      },
      {
        key: "mason",
        email: "preview.mason@brdg.local",
        firstName: "Mason",
        birthdate: "1993-11-02",
        gender: "man",
        profile: {
          city: "Kakaako",
          country: "US",
          latitude: 21.2968,
          longitude: -157.8581,
          bio: "Beach workouts, last-minute coffees, and low-ego training blocks.",
          intentDating: true,
          intentWorkout: true,
          intentFriends: false,
          showMeMen: true,
          showMeWomen: true,
          showMeOther: true,
          maxDistanceKm: 50,
        },
        fitness: {
          intensityLevel: "ADVANCED",
          weeklyFrequencyBand: "4-5",
          primaryGoal: "strength",
          favoriteActivities: "Beach, Running, Boxing",
          prefersMorning: false,
          prefersEvening: true,
        },
      },
      {
        key: "niko",
        email: "preview.niko@brdg.local",
        firstName: "Niko",
        birthdate: "1995-07-22",
        gender: "man",
        profile: {
          city: "Manoa",
          country: "US",
          latitude: 21.3169,
          longitude: -157.8075,
          bio: "Climbs, trail miles, and early starts. Good candidate for a fresh discovery card.",
          intentDating: true,
          intentWorkout: true,
          intentFriends: true,
          showMeMen: true,
          showMeWomen: true,
          showMeOther: true,
          maxDistanceKm: 50,
        },
        fitness: {
          intensityLevel: "INTERMEDIATE",
          weeklyFrequencyBand: "3-4",
          primaryGoal: "mobility",
          favoriteActivities: "Hiking, Running, Climbing",
          prefersMorning: true,
          prefersEvening: false,
        },
      },
    ],
  },
};

async function request(pathname, { method = "GET", token, body } = {}) {
  const headers = {};

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API_BASE_URL}${pathname}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${method} ${pathname} failed (${response.status}): ${text}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

async function cleanupPreviewUsers() {
  await prisma.user.deleteMany({
    where: {
      email: {
        startsWith: "preview.",
      },
    },
  });
}

async function createUser(definition, password, index) {
  const signup = await request("/auth/signup", {
    method: "POST",
    body: {
      email: definition.email,
      password,
      firstName: definition.firstName,
      birthdate: definition.birthdate,
      gender: definition.gender,
    },
  });

  const token = signup.access_token;
  const userId = signup.user.id;

  await prisma.user.update({
    where: { id: userId },
    data: {
      hasVerifiedEmail: true,
    },
  });

  await prisma.userProfile.upsert({
    where: { userId },
    update: definition.profile,
    create: {
      userId,
      ...definition.profile,
    },
  });

  await request("/profile/fitness", {
    method: "PUT",
    token,
    body: definition.fitness,
  });

  await prisma.userPhoto.create({
    data: {
      userId,
      storageKey: `${ASSET_BASE_URL}/pfps/${PHOTO_FILES[index % PHOTO_FILES.length]}`,
      isPrimary: true,
      sortOrder: 0,
    },
  });

  return {
    ...definition,
    token,
    userId,
  };
}

async function prepareUiPreviewScenario() {
  const scenario = SCENARIOS["ui-preview"];
  const createdUsers = {};

  for (const [index, definition] of scenario.users.entries()) {
    createdUsers[definition.key] = await createUser(
      definition,
      scenario.password,
      index,
    );
  }

  const lana = createdUsers.lana;
  const mason = createdUsers.mason;

  await request(`/discovery/like/${mason.userId}`, {
    method: "POST",
    token: lana.token,
  });

  const matchResult = await request(`/discovery/like/${lana.userId}`, {
    method: "POST",
    token: mason.token,
  });

  const matchId = matchResult.match?.id;
  if (!matchId) {
    throw new Error("Expected deterministic match id for ui-preview scenario");
  }

  await request(`/matches/${matchId}/messages`, {
    method: "POST",
    token: mason.token,
    body: { content: "Coffee after the sunrise run?" },
  });

  await request(`/matches/${matchId}/messages`, {
    method: "POST",
    token: lana.token,
    body: { content: "Yes. Magic Island at 8 works for me." },
  });

  const createdEvent = await request("/events", {
    method: "POST",
    token: lana.token,
    body: {
      title: "Preview Beach Workout",
      description: "Low-pressure bodyweight session by the water.",
      location: "Magic Island",
      category: "FITNESS",
      startsAt: new Date(Date.now() + 36 * 60 * 60 * 1000).toISOString(),
      endsAt: new Date(Date.now() + 38 * 60 * 60 * 1000).toISOString(),
    },
  });

  await request(`/events/${createdEvent.id}/rsvp`, {
    method: "POST",
    token: mason.token,
  });

  return {
    password: scenario.password,
    matchId,
    eventId: createdEvent.id,
    users: Object.values(createdUsers).map((user) => ({
      email: user.email,
      firstName: user.firstName,
    })),
  };
}

async function main() {
  const scenarioName = process.argv[2] || "ui-preview";
  if (!SCENARIOS[scenarioName]) {
    throw new Error(`Unsupported scenario: ${scenarioName}`);
  }

  await cleanupPreviewUsers();

  let result;
  if (scenarioName === "ui-preview") {
    result = await prepareUiPreviewScenario();
  }

  console.log(
    JSON.stringify(
      {
        scenario: scenarioName,
        apiBaseUrl: API_BASE_URL,
        ...result,
      },
      null,
      2,
    ),
  );
}

main()
  .catch(async (error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
