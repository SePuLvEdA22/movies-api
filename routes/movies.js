import { Router } from 'express'
import { readJSON } from '../utils.js'
import { validateMovie, ValidatePartialMovie } from '../schemas/movies.js'
import { randomUUID } from 'node:crypto'

const movies = readJSON('./data/movies.json')

export const moviesRouter = Router()

moviesRouter.get('/', (req, res) => {
  // res.header('Access-Control-Allow-Origin', '*')
  const { genre } = req.query
  if (genre) {
    const filteredMovies = movies.filter(
      (movie) => movie.genre.some(g => g.toLowerCase() === genre.toLowerCase()))
    return res.json(filteredMovies)
  }
  res.json(movies)
})

moviesRouter.get('/:id', (req, res) => {
  const { id } = req.params
  const movie = movies.find((movie) => movie.id === id)
  if (movie) res.json(movie)
  res.status(404).json({ message: 'Movie not found' })
})

moviesRouter.post('/', (req, res) => {
  const result = validateMovie(req.body)

  if (!result.success) {
    return res.status(400).json({ error: JSON.parse(result.error.message) })
  }
  const newNMovie = {
    id: randomUUID(),
    ...result.data
  }
  // Esto no seria REST, porque estamos guardando
  // el estado en memoria
  movies.push(newNMovie)
  res.status(201).json(newNMovie) // actualizar la cache del cliente
})

moviesRouter.delete('/:id', (req, res) => {
  const { id } = req.params
  const movieIndex = movies.findIndex((movie) => movie.id === id)

  if (movieIndex === -1) {
    return res.status(404).json({ message: 'Movie not found' })
  }

  movies.splice(movieIndex, 1)
  return res.json({ message: 'Movie deleted' })
})

moviesRouter.patch('/:id', (req, res) => {
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
