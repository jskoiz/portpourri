import { PrismaClient } from '@prisma/client';
import { appConfig } from '../src/config/app.config';

const prisma = new PrismaClient();

const BASE_URL = appConfig.seed.assetBaseUrl;

async function main() {
    console.log('Start seeding ...');

    // Cleanup existing data
    await prisma.eventRsvp.deleteMany();
    await prisma.event.deleteMany();
    await prisma.message.deleteMany();
    await prisma.match.deleteMany();
    await prisma.like.deleteMany();
    await prisma.userPhoto.deleteMany();
    await prisma.userFitnessProfile.deleteMany();
    await prisma.userProfile.deleteMany();
    await prisma.user.deleteMany();

    const users = [
        {
            firstName: 'Liam',
            gender: 'male',
            birthdate: new Date('1995-06-15'),
            city: 'Los Angeles',
            bio: 'CrossFit enthusiast and weekend surfer. Looking for someone to crush WODs with and grab tacos after.',
            intentWorkout: true,
            intentDating: true,
            fitness: {
                intensityLevel: 'high',
                weeklyFrequencyBand: '5+',
                primaryGoal: 'strength',
                favoriteActivities: 'CrossFit, Surfing, Olympic Lifting',
            },
            photo: 'uifaces-human-avatar.jpg'
        },
        {
            firstName: 'Emma',
            gender: 'female',
            birthdate: new Date('1998-03-22'),
            city: 'Santa Monica',
            bio: 'Yoga teacher and plant mom. I believe in balance - hard workouts and slow mornings.',
            intentWorkout: true,
            intentDating: true,
            fitness: {
                intensityLevel: 'moderate',
                weeklyFrequencyBand: '3-4',
                primaryGoal: 'flexibility',
                favoriteActivities: 'Vinyasa Yoga, Pilates, Beach Runs',
            },
            photo: 'uifaces-human-avatar (1).jpg'
        },
        {
            firstName: 'Noah',
            gender: 'male',
            birthdate: new Date('1992-08-30'),
            city: 'West Hollywood',
            bio: 'Training for my first Ironman. Need a cycling buddy for long weekend rides!',
            intentWorkout: true,
            intentDating: false,
            fitness: {
                intensityLevel: 'high',
                weeklyFrequencyBand: '6-7',
                primaryGoal: 'endurance',
                favoriteActivities: 'Triathlon, Cycling, Swimming',
            },
            photo: 'uifaces-human-avatar (2).jpg'
        },
        {
            firstName: 'Olivia',
            gender: 'female',
            birthdate: new Date('1999-01-12'),
            city: 'Culver City',
            bio: 'Just moved here! Love bouldering and hiking. Show me the best spots?',
            intentWorkout: true,
            intentDating: true,
            fitness: {
                intensityLevel: 'moderate',
                weeklyFrequencyBand: '2-3',
                primaryGoal: 'fun',
                favoriteActivities: 'Bouldering, Hiking, Camping',
            },
            photo: 'uifaces-human-avatar (3).jpg'
        },
        {
            firstName: 'William',
            gender: 'male',
            birthdate: new Date('1990-05-20'),
            city: 'Silver Lake',
            bio: 'Former college athlete getting back into shape. Let’s play tennis or basketball.',
            intentWorkout: true,
            intentDating: false,
            fitness: {
                intensityLevel: 'moderate',
                weeklyFrequencyBand: '3-4',
                primaryGoal: 'health',
                favoriteActivities: 'Tennis, Basketball, HIIT',
            },
            photo: 'uifaces-human-avatar (4).jpg'
        },
        {
            firstName: 'Ava',
            gender: 'female',
            birthdate: new Date('1994-09-18'),
            city: 'Downtown LA',
            bio: 'Spin class addict and smoothie connoisseur. 6am classes are my jam.',
            intentWorkout: true,
            intentDating: true,
            fitness: {
                intensityLevel: 'high',
                weeklyFrequencyBand: '4-5',
                primaryGoal: 'cardio',
                favoriteActivities: 'Spinning, Running, Boxing',
            },
            photo: 'uifaces-human-avatar (5).jpg'
        },
        {
            firstName: 'James',
            gender: 'male',
            birthdate: new Date('1993-11-05'),
            city: 'Venice',
            bio: 'Calisthenics at Muscle Beach? I’m there every morning.',
            intentWorkout: true,
            intentDating: true,
            fitness: {
                intensityLevel: 'high',
                weeklyFrequencyBand: '5+',
                primaryGoal: 'hypertrophy',
                favoriteActivities: 'Calisthenics, Weightlifting',
            },
            photo: 'uifaces-popular-avatar.jpg'
        },
        {
            firstName: 'Sophia',
            gender: 'female',
            birthdate: new Date('1997-02-14'),
            city: 'Pasadena',
            bio: 'Hiking the PCT section by section. Looking for reliable trail partners.',
            intentWorkout: true,
            intentDating: false,
            fitness: {
                intensityLevel: 'high',
                weeklyFrequencyBand: '2-3',
                primaryGoal: 'adventure',
                favoriteActivities: 'Hiking, Backpacking, Trail Running',
            },
            photo: 'uifaces-popular-avatar (1).jpg'
        },
        {
            firstName: 'Benjamin',
            gender: 'male',
            birthdate: new Date('1991-07-23'),
            city: 'Santa Monica',
            bio: 'Beach volleyball player. Always looking for a 2v2 partner.',
            intentWorkout: true,
            intentDating: true,
            fitness: {
                intensityLevel: 'moderate',
                weeklyFrequencyBand: '3-4',
                primaryGoal: 'skill',
                favoriteActivities: 'Volleyball, Beach Tennis',
            },
            photo: 'uifaces-popular-avatar (2).jpg'
        },
        {
            firstName: 'Isabella',
            gender: 'female',
            birthdate: new Date('2000-04-30'),
            city: 'Westwood',
            bio: 'Student at UCLA. Love dance classes and pilates.',
            intentWorkout: true,
            intentDating: true,
            fitness: {
                intensityLevel: 'moderate',
                weeklyFrequencyBand: '2-3',
                primaryGoal: 'flexibility',
                favoriteActivities: 'Dance, Pilates, Yoga',
            },
            photo: 'uifaces-popular-avatar (3).jpg'
        },
        {
            firstName: 'Lucas',
            gender: 'male',
            birthdate: new Date('1989-12-10'),
            city: 'Manhattan Beach',
            bio: 'Surfing at dawn, lifting at dusk. Balanced lifestyle.',
            intentWorkout: true,
            intentDating: true,
            fitness: {
                intensityLevel: 'high',
                weeklyFrequencyBand: '5+',
                primaryGoal: 'strength',
                favoriteActivities: 'Surfing, Powerlifting',
            },
            photo: 'uifaces-popular-avatar (4).jpg'
        },
        {
            firstName: 'Mia',
            gender: 'female',
            birthdate: new Date('1996-08-08'),
            city: 'Long Beach',
            bio: 'Roller skating and park days. Let’s vibe!',
            intentWorkout: false,
            intentDating: true,
            fitness: {
                intensityLevel: 'low',
                weeklyFrequencyBand: '1-2',
                primaryGoal: 'fun',
                favoriteActivities: 'Roller Skating, Walking',
            },
            photo: 'uifaces-popular-avatar (5).jpg'
        },
    ];

    const createdUsers: Array<{ id: string; firstName: string }> = [];

    for (const u of users) {
        const user = await prisma.user.create({
            data: {
                email: `${u.firstName.toLowerCase()}@example.com`,
                firstName: u.firstName,
                birthdate: u.birthdate,
                gender: u.gender,
                isOnboarded: true,
                profile: {
                    create: {
                        city: u.city,
                        bio: u.bio,
                        intentWorkout: u.intentWorkout,
                        intentDating: u.intentDating,
                        showMeMen: true,
                        showMeWomen: true,
                    },
                },
                fitnessProfile: {
                    create: {
                        intensityLevel: u.fitness.intensityLevel,
                        weeklyFrequencyBand: u.fitness.weeklyFrequencyBand,
                        primaryGoal: u.fitness.primaryGoal,
                        favoriteActivities: u.fitness.favoriteActivities,
                    },
                },
                photos: {
                    create: [
                        {
                            storageKey: `${BASE_URL}/pfps/${u.photo}`,
                            isPrimary: true,
                            sortOrder: 0
                        }
                    ]
                }
            },
        });
        createdUsers.push({ id: user.id, firstName: user.firstName });
        console.log(`Created user: ${u.firstName}`);
    }

    const events = [
        {
            title: 'Sunset Yoga Flow',
            description: 'Golden hour rooftop flow with a chill post-session tea circle.',
            location: 'Venice Rooftop Studio',
            category: 'Yoga',
            imageUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1200&q=80',
            startsAt: new Date(Date.now() + 1000 * 60 * 60 * 28),
            endsAt: new Date(Date.now() + 1000 * 60 * 60 * 30),
            hostId: createdUsers[1]?.id,
        },
        {
            title: '5K Boardwalk Run Club',
            description: 'Easy-to-moderate pace. First timers welcome. Coffee after the run.',
            location: 'Santa Monica Boardwalk',
            category: 'Running',
            imageUrl: 'https://images.unsplash.com/photo-1552674605-469523170d9e?w=1200&q=80',
            startsAt: new Date(Date.now() + 1000 * 60 * 60 * 44),
            endsAt: new Date(Date.now() + 1000 * 60 * 60 * 46),
            hostId: createdUsers[0]?.id,
        },
        {
            title: 'Beginner Bouldering Night',
            description: 'Technique-focused bouldering session with partner drills and spot coaching.',
            location: 'Sender One Climbing LA',
            category: 'Climbing',
            imageUrl: 'https://images.unsplash.com/photo-1522163182402-834f871fd851?w=1200&q=80',
            startsAt: new Date(Date.now() + 1000 * 60 * 60 * 72),
            endsAt: new Date(Date.now() + 1000 * 60 * 60 * 74),
            hostId: createdUsers[3]?.id,
        },
    ];

    const createdEvents = [] as Array<{ id: string; title: string }>;

    for (const e of events) {
        if (!e.hostId) continue;
        const event = await prisma.event.create({ data: e });
        createdEvents.push({ id: event.id, title: event.title });
        console.log(`Created event: ${event.title}`);
    }

    if (createdEvents[0] && createdUsers[2]) {
        await prisma.eventRsvp.create({
            data: { eventId: createdEvents[0].id, userId: createdUsers[2].id },
        });
    }

    if (createdEvents[1] && createdUsers[4]) {
        await prisma.eventRsvp.create({
            data: { eventId: createdEvents[1].id, userId: createdUsers[4].id },
        });
    }

    console.log('Seeding finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
