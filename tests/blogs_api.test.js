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
  const user = new User({ username: "root", passwordHash })
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
    const usersAtStart = await helper.usersInDb()

    const newBlog = {
      title: "async/await simplifies making async calls",
      author: "Andrés Carrillo",
      url: "https://reactpatterns.com/",
      likes: 10,
      userId: usersAtStart[0].id,
    }

    await api
      .post("/api/blogs")
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
    const usersAtStart = await helper.usersInDb()

    const newBlog = {
      title: "async/await simplifies making async calls",
      author: "Andrés Carrillo",
      url: "https://reactpatterns.com/",
      userId: usersAtStart[0].id,
    }

    const response = await api
      .post("/api/blogs")
      .send(newBlog)
      .expect(201)
      .expect("Content-Type", /application\/json/)

    expect(response.body.likes).toBe(0)
  })

  test("a blog without title or url is not added", async () => {
    const usersAtStart = await helper.usersInDb()

    const newBlog = {
      author: "Andrés Carrillo",
      userId: usersAtStart[0].id,
    }

    await api.post("/api/blogs").send(newBlog).expect(400)
  })
})

describe("deleting a blog", () => {
  test("succeeds with status code 204 if id is valid", async () => {
    const blogsAtStart = await helper.blogsInDb()
    const blogToDelete = blogsAtStart[0]

    await api.delete(`/api/blogs/${blogToDelete.id}`).expect(204)

    const blogsAtEnd = await helper.blogsInDb()
    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length - 1)

    const contents = blogsAtEnd.map((blog) => blog.title)
    expect(contents).not.toContain(blogToDelete.title)
  })

  test("fails with status code 404 if id is not given", async () => {
    await api.delete("/api/blogs").expect(404)
  })

  test("fails with status code 400 if id is not a string", async () => {
    await api.delete("/api/blogs/5").expect(400)
  })

  test("fails with status code 400 if id is not a valid id", async () => {
    await api
      .delete("/api/blogs/bb84ff50-4001-4c98-990b-a9e2e6684d43")
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
