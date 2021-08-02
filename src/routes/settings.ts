import { Router } from "express"
import { ensureAuthenticated } from "./guards"

const router = Router()

router.get("/", (req, res, next) => {
  res.json({ success: true })
})

router.post("/", (req, res, next) => {})

export default router
