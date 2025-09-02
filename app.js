const express = require('express')
const crypto = require('node:crypto')
const movies = require('./data/movies.json')
const { validateMovie, ValidatePartialMovie } = require('./schemas/movies')

const app = express()
app.use(express.json()) // middleware que parsea el body a json
app.disable('x-powered-by') // deshabilita el header x-powered-by; Express

const ACCEPTED_ORIGINS = [
  'http://localhost:8080',
  'http://localhost:3000',
  'https://myapp.com'
]

app.get('/movies', (req, res) => {
  const origin = req.header('origin')
  if (ACCEPTED_ORIGINS.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin)
  }
  // res.header('Access-Control-Allow-Origin', '*')
  const { genre } = req.query
  if (genre) {
    const filteredMovie = movies.filter(
      (movie) => movie.genre.some(g => g.toLowerCase() === genre.toLowerCase()))
    return res.json(filteredMovie)
  }
  res.json(movies)
})

app.post('/movies', (req, res) => {
  const result = validateMovie(req.body)

  if (!result.success) {
    return res.status(400).json({ error: JSON.parse(result.error.message) })
  }
  const newNMovie = {
    id: crypto.randomUUID(),
    ...result.data
  }
  // Esto no seria REST, porque estamos guardando
  // el estado en memoria
  movies.push(newNMovie)
  res.status(201).json(newNMovie) // actualizar la cache del cliente
})

app.patch('/movies/:id', (req, res) => {
  const result = ValidatePartialMovie(req.body)

  if (!result.success) {
    return res.status(400).json({ error: JSON.parse(result.error.message) })
  }

  const { id } = req.params

  const movieIndex = movies.findIndex((movie) => movie.id === id)

  if (movieIndex === -1) {
    return res.status(404).json({ message: 'Movie not found' })
  }

  const updateMovie = {
    ...movies[movieIndex],
    ...result.data
  }

  movies[movieIndex] = updateMovie

  return res.json(updateMovie)
})

app.get('/movies/:id', (req, res) => {
  const { id } = req.params
  const movie = movies.find((movie) => movie.id === id)
  if (movie) res.json(movie)
  res.status(404).json({ message: 'Movie not found' })
})

app.delete('/movies/:id', (req, res) => {
  const origin = req.header('origin')
  if (ACCEPTED_ORIGINS.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin)
  }
  const { id } = req.params
  const movieIndex = movies.findIndex((movie) => movie.id === id)

  if (movieIndex === -1) {
    return res.status(404).json({ message: 'Movie not found' })
  }

  movies.splice(movieIndex, 1)
  return res.json({ message: 'Movie deleted' })
})

app.options('/movies/:id', (req, res) => {
  const origin = req.header('origin')
  if (ACCEPTED_ORIGINS.includes(origin) || !origin) {
    res.header('Access-Control-Allow-Origin', origin)
    res.header('Access-Control-Allow-Methods', 'GET,POST,DELETE,PATCH')
  }
  return res.send()
})

const PORT = process.env.PORT ?? 3000

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`)
})
