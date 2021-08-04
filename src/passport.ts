import { PrismaClient } from "@prisma/client"
import { Strategy as JwtStrategy, ExtractJwt, StrategyOptions } from "passport-jwt"
import { Strategy as LocalStrategy } from "passport-local"
import { compare, hash } from "./util"

const prisma = new PrismaClient()

const jwtOptions: StrategyOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET,
}

export const jwtStrategy = new JwtStrategy(jwtOptions, async (jwtPayload, done) => {
  try {
    return done(null, jwtPayload.user)
  } catch (error) {
    done(error)
  }
})

export const localLoginStrategy = new LocalStrategy(
  { usernameField: "username", passwordField: "password" },
  async (username, password, done) => {
    try {
      const user = await prisma.user.findFirst({ where: { username } })

      if (!user) {
        return done(new Error("Username and Password combination not found."), null)
      }

      if (!compare(password, user.password)) {
        return done(null, false)
      }

      return done(null, user)
    } catch (err) {
      return done(err)
    }
  }
)

export const localRegisterStrategy = new LocalStrategy(
  { usernameField: "username", passwordField: "password" },
  async (username, password, done) => {
    try {
      const userCount = await prisma.user.count()
      const hashedPassword = await hash(password)
      const user = await prisma.user.create({ data: { username, password: hashedPassword, isAdmin: userCount === 0 } })

      if (!user) {
        return done(new Error("Unable to create user, is the database created?"), null)
      }

      return done(null, user)
    } catch (err) {
      return done(err)
    }
  }
)
