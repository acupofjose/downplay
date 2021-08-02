import { User } from "@prisma/client"
import { NextFunction, Request } from "express"
import passport from "passport"

export const ensureAuthenticated = passport.authenticate("jwt", { session: false })

export const ensureAdmin = (req: Express.Request, res: any, next: NextFunction) => {
  passport.authenticate("jwt", { session: false }, (err, user: User, info) => {
    if (err || !user.isAdmin) {
      return res.status(403).json({ error: "Unauthorized" })
    }
    next()
  })(req, res, next)
}
