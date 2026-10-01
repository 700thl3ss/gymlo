import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const BILATERAL_COUNTERPARTS = [
  {
    name: "Machine Wide Row",
    slug: "machine-wide-row",
    category: "Machine",
    primaryMuscle: "Back",
    secondaryMuscles: "Rear Delts, Biceps",
    equipment: "Wide Row Machine",
    instructions: "Chest against pad, grip handles with both arms and row wide, squeezing upper back and rear delts.",
  },
  {
    name: "Machine Delt Raise",
    slug: "machine-delt-raise",
    category: "Machine",
    primaryMuscle: "Shoulders",
    secondaryMuscles: "Traps",
    equipment: "Lateral Raise Machine",
    instructions: "Rest both arms against machine pads, raise outwards simultaneously to shoulder height with continuous tension.",
  },
  {
    name: "Chest-Supported Dumbbell Row",
    slug: "chest-supported-dumbbell-row",
    category: "Dumbbell",
    primaryMuscle: "Back",
    secondaryMuscles: "Biceps, Rear Delts",
    equipment: "Incline Bench, Dumbbells",
    instructions: "Lie chest down on 30-45 degree incline bench, row both dumbbells together driving elbows back.",
  },
  {
    name: "Single-Arm Cable Lateral Raise",
    slug: "single-arm-cable-lateral-raise",
    category: "Cable",
    primaryMuscle: "Shoulders",
    secondaryMuscles: "Traps",
    equipment: "Cable Machine",
    instructions: "Low pulley cable across body, raise single arm outward to shoulder height.",
  },
  {
    name: "Single-Arm Lat Pulldown",
    slug: "single-arm-lat-pulldown",
    category: "Cable",
    primaryMuscle: "Back",
    secondaryMuscles: "Biceps",
    equipment: "Cable Machine / Pulldown",
    instructions: "Using single handle, pull down driving elbow into hip pocket with intense lat focus.",
  },
  {
    name: "Single-Arm Cable Tricep Pushdown",
    slug: "single-arm-cable-tricep-pushdown",
    category: "Cable",
    primaryMuscle: "Triceps",
    secondaryMuscles: "None",
    equipment: "Cable Machine, Single Handle",
    instructions: "Pin elbow at side, extend one arm down to lockout targeting lateral and long head of triceps.",
  },
  {
    name: "Single-Arm Cable Bicep Curl",
    slug: "single-arm-cable-bicep-curl",
    category: "Cable",
    primaryMuscle: "Biceps",
    secondaryMuscles: "Forearms",
    equipment: "Cable Machine, D-Handle",
    instructions: "Curl single handle up with continuous tension from the bottom of the stretch.",
  },
  {
    name: "Single-Leg Press",
    slug: "single-leg-press",
    category: "Machine",
    primaryMuscle: "Quads",
    secondaryMuscles: "Glutes",
    equipment: "Leg Press Machine",
    instructions: "One foot centered on sled platform, lower controlled to 90 degrees, press to lockout.",
  },
  {
    name: "Single-Arm Machine Chest Press",
    slug: "single-arm-machine-chest-press",
    category: "Machine",
    primaryMuscle: "Chest",
    secondaryMuscles: "Shoulders, Triceps",
    equipment: "Chest Press Machine",
    instructions: "Sit upright, press one handle forward allowing torso stabilization and deep chest contraction.",
  },
];

async function main() {
  console.log("Upserting bilateral and single-arm counterparts...");
  for (const ex of BILATERAL_COUNTERPARTS) {
    await prisma.exercise.upsert({
      where: { slug: ex.slug },
      update: {
        name: ex.name,
        category: ex.category,
        primaryMuscle: ex.primaryMuscle,
        secondaryMuscles: ex.secondaryMuscles,
        equipment: ex.equipment,
        instructions: ex.instructions,
      },
      create: {
        name: ex.name,
        slug: ex.slug,
        category: ex.category,
        primaryMuscle: ex.primaryMuscle,
        secondaryMuscles: ex.secondaryMuscles,
        equipment: ex.equipment,
        instructions: ex.instructions,
        isCustom: false,
      },
    });
  }
  console.log("Successfully seeded counterpart exercises!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
