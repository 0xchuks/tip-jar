import { Router, type IRouter } from "express";
import healthRouter from "./health";
import recipientRouter from "./recipient";
import verifyPaymentRouter from "./verify-payment";

const router: IRouter = Router();

router.use(healthRouter);
router.use(recipientRouter);
router.use(verifyPaymentRouter);

export default router;
