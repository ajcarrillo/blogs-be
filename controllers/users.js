const bcrypt = require("bcrypt")
const userRouter = require("express").Router()
const User = require("../models/user")

userRouter.get("/", async (request, response) => {
  const users = await User.find({}).populate("blogs")
  response.json(users)
})

userRouter.post("/", async (request, response) => {
  const body = request.body

  if (body.username === undefined || body.password === undefined) {
    return response
      .status(400)
      .json({ error: "username and password are required" })
  }

  const saltRounds = 10
  const passwordHash = await bcrypt.hash(body.password, saltRounds)

  const user = new User({
    username: body.username,
    name: body.name,
    passwordHash,
  })

  const savedUser = await user.save()
  response.status(201).json(savedUser)
})

module.exports = userRouter
