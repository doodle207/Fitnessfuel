import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import profileRouter from "./profile";
import exercisesRouter from "./exercises";
import workoutsRouter from "./workouts";
import progressRouter from "./progress";
import dashboardRouter from "./dashboard";
import dietRouter from "./diet";
import achievementsRouter from "./achievements";
import imageAnalysisRouter from "./imageAnalysis";
import aiCoachRouter from "./aiCoach";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(profileRouter);
router.use(exercisesRouter);
router.use(workoutsRouter);
router.use(progressRouter);
router.use(dashboardRouter);
router.use(dietRouter);
router.use(achievementsRouter);
router.use(imageAnalysisRouter);
router.use(aiCoachRouter);

export default router;
