import { Router } from "express"
import { User, PrismaClient } from "@prisma/client"
import jwt from "jsonwebtoken"

import passport from "passport"
import { jwtStrategy, localLoginStrategy, localRegisterStrategy } from "../passport"
import { ensureAuthenticated } from "./guards"

const router = Router()
const prisma = new PrismaClient()

passport.use(jwtStrategy)

/**
 * Logs in a user and returns a JWT
 */
router.post("/login", async (req, res, next) => {
  passport.authenticate(localLoginStrategy, { session: false }, (err, user: User, info) => {
    try {
      if (err || !user) {
        const error = new Error("An error occurred.")

        return res.status(500).json({ error })
      }

      req.login(user as any, { session: false }, async (error) => {
        if (error) return res.status(500).json({ error })

        const body = { _id: user.id, username: user.username, isAdmin: user.isAdmin }
        const token = jwt.sign({ user: body }, process.env.JWT_SECRET!)

        return res.json({ token })
      })
    } catch (error) {
      return res.status(500).json({ error })
    }
  })(req, res, next)
})

/**
 * Registers a user and returns a JWT
 */
router.post("/register", passport.authenticate(localRegisterStrategy, { session: false }), async (req, res, next) => {
  if (!req.user) return res.status(500).json({ error: "User has not been assigned to internal parameters." })

  await prisma.feed.create({
    data: {
      userId: (req.user as any)._id,
      title: "Default Feed",
      description: "Downplay's default feed",
      isDefault: true,
    },
  })

  req.login(req.user, { session: false }, async (error) => {
    if (error) return res.status(500).json({ error })

    const { id, username, isAdmin } = req.user as User

    const body = { _id: id, username, isAdmin }
    const token = jwt.sign({ user: body }, process.env.JWT_SECRET!)

    return res.json({ token })
  })
})

router.post("/update", ensureAuthenticated, (req, res, next) => {})

export default router
