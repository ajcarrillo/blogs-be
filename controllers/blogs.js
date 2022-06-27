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

blogRouter.delete("/:id", async (request, response) => {
  if (request.params.id === undefined) {
    return response.status(400).json({ error: "id is required" })
  }

  await Blog.findByIdAndRemove(request.params.id)
  response.status(204).end()
})

blogRouter.get("/:id", async (request, response) => {
  const blog = await Blog.findById(request.params.id)
  if (!blog) {
    response.status(404).end()
  } else {
    response.json(blog)
  }
})

blogRouter.put("/:id/likes", async (request, response) => {
  const blog = await Blog.findById(request.params.id)
  if (!blog) {
    response.status(404).end()
  } else {
    blog.likes = blog.likes + 1
    await blog.save()
    response.json(blog)
  }
})

module.exports = blogRouter
