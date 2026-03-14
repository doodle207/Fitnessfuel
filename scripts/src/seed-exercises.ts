import { db } from "@workspace/db";
import { exercisesTable } from "@workspace/db/schema";
import { count } from "drizzle-orm";

const exercises = [
  // Chest
  { name: "Bench Press", muscleGroup: "Chest", secondaryMuscles: "Triceps, Shoulders", equipment: "Barbell", instructions: "Lie flat on a bench. Grip the barbell slightly wider than shoulder width. Lower the bar to your chest, then press it back up. Keep your core tight and feet flat on the floor.", difficulty: "Intermediate" },
  { name: "Incline Dumbbell Press", muscleGroup: "Chest", secondaryMuscles: "Triceps, Shoulders", equipment: "Dumbbells", instructions: "Set bench to 30-45 degrees. Hold dumbbells at chest level with elbows flared. Press dumbbells up and together, then lower slowly.", difficulty: "Intermediate" },
  { name: "Push-Ups", muscleGroup: "Chest", secondaryMuscles: "Triceps, Core", equipment: "Bodyweight", instructions: "Start in plank position with hands shoulder-width apart. Lower your body until chest nearly touches floor, then push back up. Keep body in straight line.", difficulty: "Beginner" },
  { name: "Cable Flyes", muscleGroup: "Chest", secondaryMuscles: "Shoulders", equipment: "Cable Machine", instructions: "Stand between cable pulleys set at shoulder height. With slight bend in elbows, bring cables together in front of you. Control the return.", difficulty: "Intermediate" },
  { name: "Dips", muscleGroup: "Chest", secondaryMuscles: "Triceps, Shoulders", equipment: "Parallel Bars", instructions: "Support yourself on dip bars. Lean forward slightly and lower yourself until upper arms are parallel to ground. Press back up.", difficulty: "Intermediate" },

  // Back
  { name: "Pull-Ups", muscleGroup: "Back", secondaryMuscles: "Biceps, Core", equipment: "Pull-up Bar", instructions: "Hang from bar with overhand grip wider than shoulders. Pull yourself up until chin clears the bar. Lower slowly with control.", difficulty: "Intermediate" },
  { name: "Barbell Row", muscleGroup: "Back", secondaryMuscles: "Biceps, Rear Deltoids", equipment: "Barbell", instructions: "Hinge forward at hips, keeping back straight. Grip barbell with overhand grip. Pull bar to lower chest, squeezing shoulder blades together.", difficulty: "Intermediate" },
  { name: "Lat Pulldown", muscleGroup: "Back", secondaryMuscles: "Biceps", equipment: "Cable Machine", instructions: "Sit at pulldown machine. Grip bar wider than shoulder width. Pull bar down to upper chest while leaning back slightly. Slowly return.", difficulty: "Beginner" },
  { name: "Deadlift", muscleGroup: "Back", secondaryMuscles: "Glutes, Hamstrings, Core", equipment: "Barbell", instructions: "Stand with feet hip-width. Bend and grip bar just outside legs. Keep back flat, chest up. Drive through heels to stand up straight, then lower controlled.", difficulty: "Advanced" },
  { name: "Seated Cable Row", muscleGroup: "Back", secondaryMuscles: "Biceps, Rear Deltoids", equipment: "Cable Machine", instructions: "Sit at cable row machine with feet on platform. Pull handle to lower chest keeping back straight. Squeeze shoulder blades, then slowly return.", difficulty: "Beginner" },

  // Shoulders
  { name: "Overhead Press", muscleGroup: "Shoulders", secondaryMuscles: "Triceps, Core", equipment: "Barbell", instructions: "Stand with barbell at shoulder height. Press bar overhead until arms are locked out. Lower back to shoulders with control.", difficulty: "Intermediate" },
  { name: "Dumbbell Lateral Raises", muscleGroup: "Shoulders", secondaryMuscles: "Traps", equipment: "Dumbbells", instructions: "Stand holding dumbbells at sides. Raise arms out to sides until parallel with floor. Lower slowly. Keep slight bend in elbows.", difficulty: "Beginner" },
  { name: "Arnold Press", muscleGroup: "Shoulders", secondaryMuscles: "Triceps", equipment: "Dumbbells", instructions: "Start with dumbbells at chin, palms facing you. As you press up, rotate palms to face forward. Reverse on the way down.", difficulty: "Intermediate" },
  { name: "Face Pulls", muscleGroup: "Shoulders", secondaryMuscles: "Rear Deltoids, Traps", equipment: "Cable Machine", instructions: "Set cable at head height with rope attachment. Pull rope toward face, separating hands at ear level. Focus on squeezing rear deltoids.", difficulty: "Beginner" },

  // Arms
  { name: "Barbell Curl", muscleGroup: "Arms", secondaryMuscles: "Forearms", equipment: "Barbell", instructions: "Stand holding barbell with underhand grip. Keep elbows at sides. Curl bar up to shoulder level. Lower slowly.", difficulty: "Beginner" },
  { name: "Tricep Pushdown", muscleGroup: "Arms", secondaryMuscles: "Forearms", equipment: "Cable Machine", instructions: "Stand at cable machine with bar at head height. Keep elbows at sides and push bar down until arms are straight. Control the return.", difficulty: "Beginner" },
  { name: "Hammer Curls", muscleGroup: "Arms", secondaryMuscles: "Forearms, Brachialis", equipment: "Dumbbells", instructions: "Hold dumbbells with neutral grip (palms facing each other). Curl up without rotating wrist. Targets brachialis for overall arm size.", difficulty: "Beginner" },
  { name: "Skull Crushers", muscleGroup: "Arms", secondaryMuscles: "", equipment: "Barbell", instructions: "Lie on bench holding barbell above chest. Lower bar toward forehead by bending elbows only. Press back up. Keep upper arms stationary.", difficulty: "Intermediate" },

  // Legs
  { name: "Back Squat", muscleGroup: "Legs", secondaryMuscles: "Glutes, Core, Lower Back", equipment: "Barbell", instructions: "Place barbell on upper traps. Feet shoulder-width apart, toes slightly out. Squat down until thighs are parallel to floor, keeping chest up. Drive through heels to stand.", difficulty: "Intermediate" },
  { name: "Romanian Deadlift", muscleGroup: "Legs", secondaryMuscles: "Glutes, Lower Back", equipment: "Barbell", instructions: "Hold barbell in front of thighs. Hinge at hips pushing them back, keeping back flat and legs nearly straight. Lower until you feel hamstring stretch, then drive hips forward.", difficulty: "Intermediate" },
  { name: "Leg Press", muscleGroup: "Legs", secondaryMuscles: "Glutes", equipment: "Machine", instructions: "Sit in leg press machine. Place feet shoulder-width on platform. Lower weight until knees reach 90 degrees. Push back to start without locking knees.", difficulty: "Beginner" },
  { name: "Walking Lunges", muscleGroup: "Legs", secondaryMuscles: "Glutes, Core", equipment: "Dumbbells", instructions: "Hold dumbbells at sides. Step forward and lower back knee toward floor. Push through front heel to bring feet together. Alternate legs.", difficulty: "Beginner" },
  { name: "Calf Raises", muscleGroup: "Legs", secondaryMuscles: "", equipment: "Machine", instructions: "Stand on calf raise machine or step edge. Rise up on toes as high as possible. Lower heel below platform level for full range of motion.", difficulty: "Beginner" },
  { name: "Bulgarian Split Squat", muscleGroup: "Legs", secondaryMuscles: "Glutes, Core", equipment: "Dumbbells", instructions: "Place rear foot on bench. Hold dumbbells. Lower front knee until thigh is parallel. Keep torso upright. Drive through front heel to stand.", difficulty: "Intermediate" },

  // Core
  { name: "Plank", muscleGroup: "Core", secondaryMuscles: "Shoulders, Glutes", equipment: "Bodyweight", instructions: "Support yourself on forearms and toes. Keep body in straight line from head to heels. Engage core and hold position. Don't let hips sag.", difficulty: "Beginner" },
  { name: "Cable Crunches", muscleGroup: "Core", secondaryMuscles: "", equipment: "Cable Machine", instructions: "Kneel at cable machine with rope at head level. Grip rope behind head. Crunch down bringing elbows toward knees. Control the return.", difficulty: "Intermediate" },
  { name: "Russian Twists", muscleGroup: "Core", secondaryMuscles: "Obliques", equipment: "Bodyweight", instructions: "Sit with knees bent, lean back slightly. Rotate torso side to side touching floor beside you. Add weight for more resistance.", difficulty: "Beginner" },
  { name: "Hanging Leg Raises", muscleGroup: "Core", secondaryMuscles: "Hip Flexors", equipment: "Pull-up Bar", instructions: "Hang from bar with arms straight. Raise legs straight up until parallel to floor. Lower slowly without swinging.", difficulty: "Intermediate" },
  { name: "Dead Bug", muscleGroup: "Core", secondaryMuscles: "Hip Flexors", equipment: "Bodyweight", instructions: "Lie on back with arms extended to ceiling and knees at 90°. Slowly extend opposite arm and leg toward floor. Return and repeat other side.", difficulty: "Beginner" },

  // Cardio
  { name: "Treadmill Run", muscleGroup: "Cardio", secondaryMuscles: "Legs, Core", equipment: "Treadmill", instructions: "Set treadmill to desired speed. Maintain upright posture. Land mid-foot. Swing arms naturally. Start at comfortable pace and increase gradually.", difficulty: "Beginner" },
  { name: "Rowing Machine", muscleGroup: "Cardio", secondaryMuscles: "Back, Arms, Legs", equipment: "Rowing Machine", instructions: "Sit on rower with feet strapped in. Push with legs first, then lean back and pull handle to lower chest. Reverse the motion (arms, torso, legs).", difficulty: "Beginner" },
  { name: "Jump Rope", muscleGroup: "Cardio", secondaryMuscles: "Calves, Shoulders", equipment: "Jump Rope", instructions: "Hold handles lightly with wrists. Jump on balls of feet, keeping jumps small. Rotate rope with wrists, not arms. Find a consistent rhythm.", difficulty: "Beginner" },
  { name: "Burpees", muscleGroup: "Cardio", secondaryMuscles: "Full Body", equipment: "Bodyweight", instructions: "Stand, drop hands to floor, jump feet back to plank, do push-up, jump feet to hands, then jump up with arms overhead. Move explosively.", difficulty: "Intermediate" },
];

async function seed() {
  const existing = await db.select({ count: count() }).from(exercisesTable);
  if (existing[0].count > 0) {
    console.log(`Exercises already seeded (${existing[0].count} found). Skipping.`);
    process.exit(0);
  }
  
  await db.insert(exercisesTable).values(exercises);
  console.log(`Seeded ${exercises.length} exercises!`);
  process.exit(0);
}

seed().catch(console.error);
