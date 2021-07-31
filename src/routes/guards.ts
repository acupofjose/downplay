import { NextFunction, Request } from "express"
import passport from "passport"

export const ensureAuthenticated = passport.authenticate("jwt", { session: false })
