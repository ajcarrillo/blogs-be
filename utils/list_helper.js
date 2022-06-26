const dummy = (blogs) => {
  console.log(blogs)
  return 1
}

const totalLikes = (blogs) => {
  return blogs.reduce((sum, blog) => sum + blog.likes, 0)
}

const favoriteBlog = (blogs) => {
  const maxLikes = blogs.reduce((max, blog) => Math.max(max, blog.likes), 0)
  return blogs.find((blog) => blog.likes === maxLikes)
}

const mostBlogs = (blogs) => {
  const authors = blogs.map((blog) => blog.author)

  const authorCount = authors.reduce((count, author) => {
    count[author] = (count[author] || 0) + 1
    return count
  }, {})

  const maxAuthor = Object.keys(authorCount).reduce(
    (max, author) => Math.max(max, authorCount[author]),
    0
  )

  return Object.keys(authorCount).find(
    (author) => authorCount[author] === maxAuthor
  )
}

const mostLikes = (blogs) => {
  const authors = blogs.map((blog) => blog.author)

  const likesCount = authors.reduce((count, author) => {
    count[author] = blogs
      .filter((blog) => blog.author === author)
      .reduce((likes, blog) => likes + blog.likes, 0)
    return count
  }, {})

  const maxAuthor = Object.keys(likesCount).reduce(
    (max, author) => Math.max(max, likesCount[author]),
    0
  )

  return Object.keys(likesCount).find(
    (author) => likesCount[author] === maxAuthor
  )
}

module.exports = {
  dummy,
  totalLikes,
  favoriteBlog,
  mostBlogs,
  mostLikes,
}
