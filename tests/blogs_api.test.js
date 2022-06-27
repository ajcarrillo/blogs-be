const bcrypt = require("bcrypt")
const mongoose = require("mongoose")
const supertest = require("supertest")
const helper = require("../utils/test_helper")
const app = require("../app")
const api = supertest(app)
const User = require("../models/user")
const Blog = require("../models/blog")

beforeEach(async () => {
  await Blog.deleteMany({})
  await User.deleteMany({})

  for (let blog of helper.initialBlogs) {
    let blogObject = new Blog(blog)
    await blogObject.save()
  }

  const passwordHash = await bcrypt.hash("secret", 10)
  let user = new User({ username: "root", passwordHash })
  await user.save()
  user = new User({ username: "ajcarrillo", passwordHash })
  await user.save()
})

describe("when there is initially some blogs saved", () => {
  test("blogs are returned as json", async () => {
    await api
      .get("/api/blogs")
      .expect(200)
      .expect("Content-Type", /application\/json/)
  })

  test("there are two blogs", async () => {
    const response = await api.get("/api/blogs")

    expect(response.body).toHaveLength(helper.initialBlogs.length)
  })

  test("a valid blog can be added", async () => {
    const response = await api
      .post("/api/login")
      .send({ username: "root", password: "secret" })

    const token = response.body.token

    const newBlog = {
      title: "async/await simplifies making async calls",
      author: "Andrés Carrillo",
      url: "https://reactpatterns.com/",
      likes: 10,
    }

    await api
      .post("/api/blogs")
      .set("Authorization", `Bearer ${token}`)
      .send(newBlog)
      .expect(201)
      .expect("Content-Type", /application\/json/)

    const blogsAtEnd = await helper.blogsInDb()
    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length + 1)

    const contents = blogsAtEnd.map((blog) => blog.title)
    expect(contents).toContain("async/await simplifies making async calls")
  })

  test("there is a unique id property", async () => {
    const blog = await Blog.findOne({}).exec()
    expect(blog.id).toBeDefined()
  })

  test("a blog cant created without user login", async () => {
    const newBlog = {
      title: "async/await simplifies making async calls",
      author: "Andrés Carrillo",
      url: "https://reactpatterns.com/",
      likes: 10,
    }

    const response = await api
      .post("/api/blogs")
      .send(newBlog)
      .expect(401)
      .expect("Content-Type", /application\/json/)

    const blogsAtEnd = await helper.blogsInDb()
    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length)
    expect(response.body.error).toBe("invalid token")
  })

  test("a blog cant be deleted for any user", async () => {
    const blogsAtStart = await helper.blogsInDb()

    const responseRoot = await api
      .post("/api/login")
      .send({ username: "root", password: "secret" })

    const tokenRoot = responseRoot.body.token

    const newBlog = {
      title: "async/await simplifies making async calls",
      author: "Andrés Carrillo",
      url: "https://reactpatterns.com/",
      likes: 10,
    }

    const response = await api
      .post("/api/blogs")
      .set("Authorization", `Bearer ${tokenRoot}`)
      .send(newBlog)

    const blogToDelete = response.body

    const responseNewLogin = await api
      .post("/api/login")
      .send({ username: "ajcarrillo", password: "secret" })

    const tokenNewLogin = responseNewLogin.body.token

    await api
      .delete(`/api/blogs/${blogToDelete.id}`)
      .set("Authorization", `Bearer ${tokenNewLogin}`)
      .expect(401)

    const blogsAtEnd = await helper.blogsInDb()
    expect(blogsAtEnd).toHaveLength(blogsAtStart.length + 1)
  })

  test("a blog can be deleted only for creator", async () => {
    const blogsAtStart = await helper.blogsInDb()

    const responseRoot = await api
      .post("/api/login")
      .send({ username: "root", password: "secret" })

    const tokenRoot = responseRoot.body.token

    const newBlog = {
      title: "async/await simplifies making async calls",
      author: "Andrés Carrillo",
      url: "https://reactpatterns.com/",
      likes: 10,
    }

    const response = await api
      .post("/api/blogs")
      .set("Authorization", `Bearer ${tokenRoot}`)
      .send(newBlog)

    const blogToDelete = response.body

    await api
      .delete(`/api/blogs/${blogToDelete.id}`)
      .set("Authorization", `Bearer ${tokenRoot}`)
      .expect(204)

    const blogsAtEnd = await helper.blogsInDb()
    expect(blogsAtEnd).toHaveLength(blogsAtStart.length)
  })
})

describe("viewing a specific blog", () => {
  test("succeeds with a valid id", async () => {
    const blogsAtStart = await helper.blogsInDb()
    const blogToView = blogsAtStart[0]

    const resultBlog = await api
      .get(`/api/blogs/${blogToView.id}`)
      .expect(200)
      .expect("Content-Type", /application\/json/)

    expect(resultBlog.body).toEqual(blogToView)
  })

  test("fails with status code 404 if blog does not exist", async () => {
    const validNonexistingId = await helper.nonExistingId()

    await api.get(`/api/blogs/${validNonexistingId}`).expect(404)
  })

  test("fails with status code 400 if id is invalid", async () => {
    const invalidId = "5a3d5da3-51f7-4f68-a1b2-11e12eee0145"

    await api.get(`/api/blogs/${invalidId}`).expect(400)
  })
})

describe("adding a new blog", () => {
  test("a blog without likes gets likes set to 0", async () => {
    const responseLogin = await api
      .post("/api/login")
      .send({ username: "root", password: "secret" })

    const token = responseLogin.body.token

    const newBlog = {
      title: "async/await simplifies making async calls",
      author: "Andrés Carrillo",
      url: "https://reactpatterns.com/",
    }

    const response = await api
      .post("/api/blogs")
      .set("Authorization", `Bearer ${token}`)
      .send(newBlog)
      .expect(201)
      .expect("Content-Type", /application\/json/)

    expect(response.body.likes).toBe(0)
  })

  test("a blog without title or url is not added", async () => {
    const responseLogin = await api
      .post("/api/login")
      .send({ username: "root", password: "secret" })

    const token = responseLogin.body.token

    const newBlog = {
      author: "Andrés Carrillo",
    }

    await api
      .post("/api/blogs")
      .set("Authorization", `Bearer ${token}`)
      .send(newBlog)
      .expect(400)
  })
})

describe("deleting a blog", () => {
  test("fails with status code 404 if id is not given", async () => {
    const response = await api
      .post("/api/login")
      .send({ username: "root", password: "secret" })

    const token = response.body.token

    await api
      .delete("/api/blogs")
      .set("Authorization", `Bearer ${token}`)
      .expect(404)
  })

  test("fails with status code 400 if id is not a string", async () => {
    const response = await api
      .post("/api/login")
      .send({ username: "root", password: "secret" })

    const token = response.body.token

    await api
      .delete("/api/blogs/5")
      .set("Authorization", `Bearer ${token}`)
      .expect(400)
  })

  test("fails with status code 400 if id is not a valid id", async () => {
    const response = await api
      .post("/api/login")
      .send({ username: "root", password: "secret" })

    const token = response.body.token

    await api
      .delete("/api/blogs/bb84ff50-4001-4c98-990b-a9e2e6684d43")
      .set("Authorization", `Bearer ${token}`)
      .expect(400)
  })
})

describe("updating a blog", () => {
  test("a blog can be liked", async () => {
    const blogsAtStart = await helper.blogsInDb()
    const blogToUpdate = blogsAtStart[0]

    const response = await api
      .put(`/api/blogs/${blogToUpdate.id}/likes`)
      .expect(200)
    expect(response.body.likes).toBe(blogToUpdate.likes + 1)
  })
})

afterAll(() => {
  mongoose.connection.close()
})
