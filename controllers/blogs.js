const jwt = require("jsonwebtoken")
const blogRouter = require("express").Router()
const User = require("../models/user")
const Blog = require("../models/blog")

// const getTokenFrom = (request) => {
//   const authorization = request.get("authorization")
//   if (authorization && authorization.toLowerCase().startsWith("bearer ")) {
//     return authorization.substring(7)
//   }
//   return null
// }

blogRouter.get("/", async (request, response) => {
  const blogs = await Blog.find({}).populate("user", { username: 1, name: 1 })

  response.json(blogs)
})

blogRouter.post("/", async (request, response) => {
  const body = request.body

  const token = request.token
  const decodedToken = jwt.verify(token, process.env.SECRET)
  if (!token || !decodedToken.id) {
    return response.status(401).json({ error: "token missing or invalid" })
  }
  const user = await User.findById(decodedToken.id)

  const blog = new Blog({
    title: body.title,
    author: body.author,
    url: body.url,
    user: user._id,
  })

  if (request.body.likes === undefined) {
    blog.likes = 0
  }

  if (request.body.url === undefined || request.body.title === undefined) {
    response.status(400).json({ error: "title and url are required" })
  } else {
    const blogSaved = await blog.save()
    user.blogs = user.blogs.concat(blogSaved._id)
    await user.save()
    response.status(201).json(blogSaved)
  }
})

blogRouter.delete("/:id", async (request, response) => {
  if (request.params.id === undefined) {
    return response.status(400).json({ error: "id is required" })
  }

  const token = request.token
  const decodedToken = jwt.verify(token, process.env.SECRET)
  if (!token || !decodedToken.id) {
    return response.status(401).json({ error: "token missing or invalid" })
  }
  const user = await User.findById(decodedToken.id)
  const blog = await Blog.findById(request.params.id)

  if (blog.user.toString() !== user._id.toString()) {
    return response.status(401).json({ error: "not authorized" })
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
