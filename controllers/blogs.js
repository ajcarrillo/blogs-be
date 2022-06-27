const blogRouter = require("express").Router()
const Blog = require("../models/blog")

blogRouter.get("/", async (request, response) => {
  const blogs = await Blog.find({})

  response.json(blogs)
})

blogRouter.post("/", async (request, response) => {
  const blog = new Blog(request.body)

  if (request.body.likes === undefined) {
    blog.likes = 0
  }

  if (request.body.url === undefined || request.body.title === undefined) {
    response.status(400).json({ error: "title and url are required" })
  } else {
    await blog.save()
    response.status(201).json(blog)
  }
})

module.exports = blogRouter
