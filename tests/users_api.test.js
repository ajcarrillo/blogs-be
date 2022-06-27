const bcrypt = require("bcrypt")
const mongoose = require("mongoose")
const supertest = require("supertest")
const helper = require("../utils/test_helper")
const app = require("../app")
const api = supertest(app)
const User = require("../models/user")

describe("when there is initially one user in db", () => {
  beforeEach(async () => {
    await User.deleteMany({})
    const passwordHash = await bcrypt.hash("secret", 10)
    const user = new User({ username: "root", passwordHash })
    await user.save()
  })

  test("creation succeeds with a fresh username", async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: "ajcarrillo",
      name: "Andrés Carrillo",
      password: "secret",
    }

    await api
      .post("/api/users")
      .send(newUser)
      .expect(201)
      .expect("Content-Type", /application\/json/)

    const userAtEnd = await helper.usersInDb()
    expect(userAtEnd).toHaveLength(usersAtStart.length + 1)
    const usernames = userAtEnd.map((u) => u.username)
    expect(usernames).toContain(newUser.username)
  })

  test("creation fails with proper statuscode and message if username already taken", async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: "root",
      name: "Superuser",
      password: "secret",
    }

    const result = await api
      .post("/api/users")
      .send(newUser)
      .expect(400)
      .expect("Content-Type", /application\/json/)

    expect(result.body.error).toContain("`username` to be unique")

    const userAtEnd = await helper.usersInDb()
    expect(userAtEnd).toHaveLength(usersAtStart.length)
  })
})

describe("adding a new user", () => {
  test("a invalid new user cant be added", async () => {
    const newUser = {
      name: "Andres Carrillo",
    }

    const response = await api
      .post("/api/users")
      .send(newUser)
      .expect(400)
      .expect("Content-Type", /application\/json/)

    expect(response.body.error).toContain("username and password are required")

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd).toHaveLength(1)
  })

  test("a invalid new user with two chars in password cant be added", async () => {
    const newUser = {
      name: "Andres Carrillo",
      username: "ajcarrillo",
      password: "12",
    }

    const response = await api
      .post("/api/users")
      .send(newUser)
      .expect(400)
      .expect("Content-Type", /application\/json/)

    expect(response.body.error).toContain(
      "password must be at least 3 characters long"
    )

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd).toHaveLength(1)
  })

  test("a invalid new user with existing username cant be added", async () => {
    const newUser = {
      name: "Andres Carrillo",
      username: "root",
      password: "secret",
    }

    const response = await api
      .post("/api/users")
      .send(newUser)
      .expect(400)
      .expect("Content-Type", /application\/json/)

    expect(response.body.error).toContain(
      "User validation failed: username: Error, expected `username` to be unique. Value: `root`"
    )

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd).toHaveLength(1)
  })

  test("a invalid new user with two chars in username cant be added", async () => {
    const newUser = {
      username: "jo",
      name: "Jonh Doe",
      password: "secret",
    }

    const response = await api
      .post("/api/users")
      .send(newUser)
      .expect(400)
      .expect("Content-Type", /application\/json/)

    expect(response.body.error).toContain(
      `User validation failed: username: Path \`username\` (\`${newUser.username}\`) is shorter than the minimum allowed length (3)`
    )

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd).toHaveLength(1)
  })
})

afterAll(() => {
  mongoose.connection.close()
})
