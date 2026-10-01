import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const result = await prisma.exercise.updateMany({
    where: { primaryMuscle: "Arms" },
    data: { primaryMuscle: "Forearms" },
  });
  console.log("Updated", result.count, "exercises to Forearms");
  await prisma.$disconnect();
}
main().catch(console.error);
