const mongoose = require("mongoose")
const supertest = require("supertest")
const helper = require("../utils/test_helper")
const app = require("../app")
const api = supertest(app)
const Blog = require("../models/blog")

beforeEach(async () => {
  await Blog.deleteMany({})

  for (let blog of helper.initialBlogs) {
    let blogObject = new Blog(blog)
    await blogObject.save()
  }
})

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
  const newBlog = {
    title: "async/await simplifies making async calls",
    author: "Andrés Carrillo",
    url: "https://reactpatterns.com/",
    likes: 10,
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

test("a blog without likes gets likes set to 0", async () => {
  const newBlog = {
    title: "async/await simplifies making async calls",
    author: "Andrés Carrillo",
    url: "https://reactpatterns.com/",
  }

  const response = await api
    .post("/api/blogs")
    .send(newBlog)
    .expect(201)
    .expect("Content-Type", /application\/json/)

  expect(response.body.likes).toBe(0)
})

test("a blog without title or url is not added", async () => {
  const newBlog = {
    author: "Andrés Carrillo",
  }

  await api.post("/api/blogs").send(newBlog).expect(400)
})

afterAll(() => {
  mongoose.connection.close()
})
