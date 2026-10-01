import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const PERSONAL_EXERCISES = [
  {
    name: "Leg Press",
    slug: "leg-press",
    category: "Machine",
    primaryMuscle: "Quads",
    secondaryMuscles: "Glutes, Hamstrings",
    equipment: "Leg Press Machine",
    instructions: "Feet shoulder-width on platform, smooth descent to 90 degrees knee bend, drive through midfoot.",
  },
  {
    name: "Romanian Deadlift (RDL)",
    slug: "romanian-deadlift",
    category: "Barbell",
    primaryMuscle: "Hamstrings",
    secondaryMuscles: "Glutes, Lower Back",
    equipment: "Barbell",
    instructions: "Hinge at hips with soft knees, feel deep stretch in hamstrings, drive hips through to lockout.",
  },
  {
    name: "Seated Leg Extension Machine",
    slug: "seated-leg-extension-machine",
    category: "Machine",
    primaryMuscle: "Quads",
    secondaryMuscles: "None",
    equipment: "Leg Extension Machine",
    instructions: "Align knee joint with machine pivot, extend legs and squeeze quads at peak contraction.",
  },
  {
    name: "Seated Leg Curl Machine",
    slug: "seated-leg-curl-machine",
    category: "Machine",
    primaryMuscle: "Hamstrings",
    secondaryMuscles: "Calves",
    equipment: "Leg Curl Machine",
    instructions: "Lap pad pinned securely, curl heels under seat squeezing hamstrings, control return.",
  },
  {
    name: "Machine Hip Adduction",
    slug: "machine-hip-adduction",
    category: "Machine",
    primaryMuscle: "Glutes",
    secondaryMuscles: "Inner Thighs",
    equipment: "Adductor Machine",
    instructions: "Squeeze pads inward towards center, targeting inner thighs and adductor muscles.",
  },
  {
    name: "Standing Calf Raise Machine",
    slug: "standing-calf-raise-machine",
    category: "Machine",
    primaryMuscle: "Calves",
    secondaryMuscles: "None",
    equipment: "Calf Raise Machine",
    instructions: "Balls of feet on step edge, lower heels deep for stretch, push up onto tiptoes.",
  },
  {
    name: "Abdominal Crunch Machine",
    slug: "abdominal-crunch-machine",
    category: "Machine",
    primaryMuscle: "Core",
    secondaryMuscles: "None",
    equipment: "Ab Crunch Machine",
    instructions: "Hold handles, crunch ribcage down toward pelvis focusing purely on abdominal contraction.",
  },
  {
    name: "Incline Bench Press",
    slug: "incline-bench-press",
    category: "Barbell",
    primaryMuscle: "Chest",
    secondaryMuscles: "Shoulders, Triceps",
    equipment: "Incline Bench, Barbell",
    instructions: "Barbell lowered smoothly to upper chest (bar to nipple), press up to lockout.",
  },
  {
    name: "Machine Pec Fly",
    slug: "pec-deck-chest-fly-machine",
    category: "Machine",
    primaryMuscle: "Chest",
    secondaryMuscles: "Shoulders",
    equipment: "Pec Deck Machine",
    instructions: "Slight bend in elbows, arc arms together in front of chest squeezing pecs tightly.",
  },
  {
    name: "Single-Arm Machine Delt Raise",
    slug: "single-arm-machine-delt-raise",
    category: "Machine",
    primaryMuscle: "Shoulders",
    secondaryMuscles: "Traps",
    equipment: "Lateral Raise Machine / Cable",
    instructions: "Single arm lateral raise on machine, bicep should line up with body, sweep elbow out wide.",
  },
  {
    name: "Machine Shoulder Press",
    slug: "machine-shoulder-press",
    category: "Machine",
    primaryMuscle: "Shoulders",
    secondaryMuscles: "Triceps",
    equipment: "Shoulder Press Machine",
    instructions: "Handles aligned with ears/chin, press upward with controlled eccentric.",
  },
  {
    name: "Machine Lat Pulldown",
    slug: "machine-lat-pulldown",
    category: "Machine",
    primaryMuscle: "Back",
    secondaryMuscles: "Biceps",
    equipment: "Lat Pulldown Machine",
    instructions: "Drive elbows down and back toward ribs, full stretch at top.",
  },
  {
    name: "Single-Arm Machine Wide Row",
    slug: "single-arm-machine-wide-row",
    category: "Machine",
    primaryMuscle: "Back",
    secondaryMuscles: "Rear Delts, Biceps",
    equipment: "Wide Row Machine",
    instructions: "Single arm grip, pull elbow wide out to side targeting upper back, rear delts, and lats.",
  },
  {
    name: "Machine Preacher Bicep Curl",
    slug: "machine-preacher-bicep-curl",
    category: "Machine",
    primaryMuscle: "Biceps",
    secondaryMuscles: "Forearms",
    equipment: "Preacher Curl Machine",
    instructions: "Triceps flat on slanted pad, curl handles up squeezing biceps strictly.",
  },
  {
    name: "Cable Tricep Pushdown (V-Bar)",
    slug: "cable-tricep-pushdown-vbar",
    category: "Cable",
    primaryMuscle: "Triceps",
    secondaryMuscles: "Forearms",
    equipment: "Cable Machine, V-Bar",
    instructions: "Elbows pinned to sides, push V-bar down to full triceps lockout.",
  },
  {
    name: "Meows",
    slug: "meows",
    category: "Cable",
    primaryMuscle: "Arms",
    secondaryMuscles: "Shoulders",
    equipment: "Cable Machine",
    instructions: "Personal arm/delt isolation movement, steady tempo with peak squeeze.",
  },
  {
    name: "EZ-Bar Meows",
    slug: "ez-bar-meows-1",
    category: "Barbell",
    primaryMuscle: "Arms",
    secondaryMuscles: "Forearms",
    equipment: "EZ-Curl Bar",
    instructions: "EZ-bar movement, controlled tempo focusing on arm recruitment.",
  },
];

async function main() {
  console.log("Adding personal exercises and routines...");

  // 1. Upsert exercises
  const exMap: Record<string, string> = {};
  for (const ex of PERSONAL_EXERCISES) {
    const item = await prisma.exercise.upsert({
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
    exMap[ex.slug] = item.id;
  }

  // 2. Upsert Lower Routine: "Lower: RSat"
  await prisma.routine.upsert({
    where: { id: "routine-lower-rsat" },
    update: {
      name: "Lower: RSat",
      description: "Leg press, RDLs, leg extensions, leg curls, adductors, standing calf raise, machine crunch.",
      exercises: {
        deleteMany: {},
        create: [
          {
            exerciseId: exMap["leg-press"],
            orderIndex: 0,
            targetSets: 3,
            targetReps: "6-9",
            notes: "@ 3 plates + 15s (345 lbs) • 6/9",
          },
          {
            exerciseId: exMap["romanian-deadlift"],
            orderIndex: 1,
            targetSets: 3,
            targetReps: "7-9",
            notes: "@ plate + 25s (185 lbs) • 7/9",
          },
          {
            exerciseId: exMap["seated-leg-extension-machine"],
            orderIndex: 2,
            targetSets: 3,
            targetReps: "5-9",
            notes: "@ 170lbs (settings: 2,S,6) • 5/9",
          },
          {
            exerciseId: exMap["seated-leg-curl-machine"],
            orderIndex: 3,
            targetSets: 3,
            targetReps: "5-9",
            notes: "@ 110lbs (settings: -,S,5) • 5/9",
          },
          {
            exerciseId: exMap["machine-hip-adduction"],
            orderIndex: 4,
            targetSets: 3,
            targetReps: "8-9",
            notes: "Adductors close @ 100lbs • 8/9",
          },
          {
            exerciseId: exMap["standing-calf-raise-machine"],
            orderIndex: 5,
            targetSets: 4,
            targetReps: "10-15",
            notes: "Standing calf raise @ 170lbs",
          },
          {
            exerciseId: exMap["abdominal-crunch-machine"],
            orderIndex: 6,
            targetSets: 3,
            targetReps: "7-9",
            notes: "Machine crunch @ 130lbs (settings: #6 seen) • 7/9",
          },
        ],
      },
    },
    create: {
      id: "routine-lower-rsat",
      name: "Lower: RSat",
      description: "Leg press, RDLs, leg extensions, leg curls, adductors, standing calf raise, machine crunch.",
      userId: "guest-user",
      exercises: {
        create: [
          {
            exerciseId: exMap["leg-press"],
            orderIndex: 0,
            targetSets: 3,
            targetReps: "6-9",
            notes: "@ 3 plates + 15s (345 lbs) • 6/9",
          },
          {
            exerciseId: exMap["romanian-deadlift"],
            orderIndex: 1,
            targetSets: 3,
            targetReps: "7-9",
            notes: "@ plate + 25s (185 lbs) • 7/9",
          },
          {
            exerciseId: exMap["seated-leg-extension-machine"],
            orderIndex: 2,
            targetSets: 3,
            targetReps: "5-9",
            notes: "@ 170lbs (settings: 2,S,6) • 5/9",
          },
          {
            exerciseId: exMap["seated-leg-curl-machine"],
            orderIndex: 3,
            targetSets: 3,
            targetReps: "5-9",
            notes: "@ 110lbs (settings: -,S,5) • 5/9",
          },
          {
            exerciseId: exMap["machine-hip-adduction"],
            orderIndex: 4,
            targetSets: 3,
            targetReps: "8-9",
            notes: "Adductors close @ 100lbs • 8/9",
          },
          {
            exerciseId: exMap["standing-calf-raise-machine"],
            orderIndex: 5,
            targetSets: 4,
            targetReps: "10-15",
            notes: "Standing calf raise @ 170lbs",
          },
          {
            exerciseId: exMap["abdominal-crunch-machine"],
            orderIndex: 6,
            targetSets: 3,
            targetReps: "7-9",
            notes: "Machine crunch @ 130lbs (settings: #6 seen) • 7/9",
          },
        ],
      },
    },
  });

  // 3. Upsert Upper Routine: "Upper: T-R UL, Sun Upper"
  await prisma.routine.upsert({
    where: { id: "routine-upper-tr-sun" },
    update: {
      name: "Upper: T-R UL, Sun Upper",
      description: "Incline bench, pec fly, SA delt raise, shoulder press, lat pulls, SA wide row, preacher curls, tricep push, meows.",
      exercises: {
        deleteMany: {},
        create: [
          {
            exerciseId: exMap["incline-bench-press"],
            orderIndex: 0,
            targetSets: 3,
            targetReps: "7-9",
            notes: "Incline bench @ plate + 5lbs (145 lbs) (bar to nipple) • 7/9",
          },
          {
            exerciseId: exMap["pec-deck-chest-fly-machine"],
            orderIndex: 1,
            targetSets: 3,
            targetReps: "7-9",
            notes: "Machine pec fly @ 160lbs (settings: #6 seen, 3) • 7/9",
          },
          {
            exerciseId: exMap["single-arm-machine-delt-raise"],
            orderIndex: 2,
            targetSets: 3,
            targetReps: "7-9",
            notes: "SA Machine delt raise @ 110lbs (2 hole seen, 6 chest - bicep lines up with body) • 7/9",
          },
          {
            exerciseId: exMap["machine-shoulder-press"],
            orderIndex: 3,
            targetSets: 3,
            targetReps: "6-9",
            notes: "Machine shoulder press @ 120lbs (settings: #3 seen) • 6/9",
          },
          {
            exerciseId: exMap["machine-lat-pulldown"],
            orderIndex: 4,
            targetSets: 3,
            targetReps: "7-9",
            notes: "Machine lat pulls @ 190lbs (settings: bolt seen, 1 hole seen) • 7/9",
          },
          {
            exerciseId: exMap["single-arm-machine-wide-row"],
            orderIndex: 5,
            targetSets: 3,
            targetReps: "4-9",
            notes: "S/A machine wide row @ 150lbs (settings: #8) • 4/9",
          },
          {
            exerciseId: exMap["machine-preacher-bicep-curl"],
            orderIndex: 6,
            targetSets: 3,
            targetReps: "4-9",
            notes: "Preacher curls @ 160lbs (settings: 1 hole seen) • 4/9",
          },
          {
            exerciseId: exMap["cable-tricep-pushdown-vbar"],
            orderIndex: 7,
            targetSets: 3,
            targetReps: "7-9",
            notes: "Cable tricep push (vbar) @ 71.5lbs + 5lbs (76.5 lbs) • 7/9",
          },
          {
            exerciseId: exMap["meows"],
            orderIndex: 8,
            targetSets: 3,
            targetReps: "8-9",
            notes: "Meows @ 77lbs • 8/9",
          },
          {
            exerciseId: exMap["ez-bar-meows-1"],
            orderIndex: 9,
            targetSets: 3,
            targetReps: "8-9",
            notes: "Ez bar meows (#1) @ 44lbs • 8/9",
          },
        ],
      },
    },
    create: {
      id: "routine-upper-tr-sun",
      name: "Upper: T-R UL, Sun Upper",
      description: "Incline bench, pec fly, SA delt raise, shoulder press, lat pulls, SA wide row, preacher curls, tricep push, meows.",
      userId: "guest-user",
      exercises: {
        create: [
          {
            exerciseId: exMap["incline-bench-press"],
            orderIndex: 0,
            targetSets: 3,
            targetReps: "7-9",
            notes: "Incline bench @ plate + 5lbs (145 lbs) (bar to nipple) • 7/9",
          },
          {
            exerciseId: exMap["pec-deck-chest-fly-machine"],
            orderIndex: 1,
            targetSets: 3,
            targetReps: "7-9",
            notes: "Machine pec fly @ 160lbs (settings: #6 seen, 3) • 7/9",
          },
          {
            exerciseId: exMap["single-arm-machine-delt-raise"],
            orderIndex: 2,
            targetSets: 3,
            targetReps: "7-9",
            notes: "SA Machine delt raise @ 110lbs (2 hole seen, 6 chest - bicep lines up with body) • 7/9",
          },
          {
            exerciseId: exMap["machine-shoulder-press"],
            orderIndex: 3,
            targetSets: 3,
            targetReps: "6-9",
            notes: "Machine shoulder press @ 120lbs (settings: #3 seen) • 6/9",
          },
          {
            exerciseId: exMap["machine-lat-pulldown"],
            orderIndex: 4,
            targetSets: 3,
            targetReps: "7-9",
            notes: "Machine lat pulls @ 190lbs (settings: bolt seen, 1 hole seen) • 7/9",
          },
          {
            exerciseId: exMap["single-arm-machine-wide-row"],
            orderIndex: 5,
            targetSets: 3,
            targetReps: "4-9",
            notes: "S/A machine wide row @ 150lbs (settings: #8) • 4/9",
          },
          {
            exerciseId: exMap["machine-preacher-bicep-curl"],
            orderIndex: 6,
            targetSets: 3,
            targetReps: "4-9",
            notes: "Preacher curls @ 160lbs (settings: 1 hole seen) • 4/9",
          },
          {
            exerciseId: exMap["cable-tricep-pushdown-vbar"],
            orderIndex: 7,
            targetSets: 3,
            targetReps: "7-9",
            notes: "Cable tricep push (vbar) @ 71.5lbs + 5lbs (76.5 lbs) • 7/9",
          },
          {
            exerciseId: exMap["meows"],
            orderIndex: 8,
            targetSets: 3,
            targetReps: "8-9",
            notes: "Meows @ 77lbs • 8/9",
          },
          {
            exerciseId: exMap["ez-bar-meows-1"],
            orderIndex: 9,
            targetSets: 3,
            targetReps: "8-9",
            notes: "Ez bar meows (#1) @ 44lbs • 8/9",
          },
        ],
      },
    },
  });

  console.log("Successfully created user routines: 'Lower: RSat' and 'Upper: T-R UL, Sun Upper'!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
