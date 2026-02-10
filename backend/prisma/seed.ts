import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Used for seeding photo URLs so devices can load images.
// Set e.g.: BASE_URL=http://localhost:3000 (simulator) or http://<your-mac-ip>:3000 (device)
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function main() {
    console.log('Start seeding ...');

    // Cleanup existing data
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
        console.log(`Created user: ${u.firstName}`);
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
