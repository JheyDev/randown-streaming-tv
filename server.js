require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const axios = require('axios');

const PORT = process.env.PORT || 5000;
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const OMDB_API_KEY = process.env.OMDB_API_KEY;
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

app.use(cors());
app.use(express.static('public'));

const fetch = require('node-fetch');

app.use('/api/tmdb', async (req, res) => {
  const path = req.url.replace('/', ''); // remove a barra inicial
  // Se já existe "?" na URL, use "&" para os parâmetros extras
  const hasQuery = path.includes('?');
  const url = `https://api.themoviedb.org/3/${path}${hasQuery ? '&' : '?'}api_key=${TMDB_API_KEY}&language=pt-BR`;
  console.log('TMDB URL:', url);

  try {
    const response = await fetch(url);
    if (!response.ok) {
      const errorBody = await response.text();
      console.error('TMDb response error:', errorBody);
      throw new Error('Erro ao buscar dados da TMDb');
    }
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Erro detalhado TMDb:', error);
    res.status(500).json({ erro: 'Erro ao acessar a TMDb', detalhes: error.message });
  }
});

// Endpoint para buscar trailer do YouTube sem expor a chave
app.get('/api/youtube/trailer', async (req, res) => {
  const { title, year } = req.query;
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'YouTube API key not configured.' });
  }
  try {
    const query = encodeURIComponent(`${title} trailer oficial ${year || ''}`);
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${query}&type=video&videoEmbeddable=true&key=${apiKey}&maxResults=10`;
    const response = await axios.get(url);
    let trailer = response.data.items.find(item =>
      item.snippet.title.toLowerCase().includes('trailer oficial') &&
      (year ? item.snippet.title.includes(year) : true)
    );
    if (!trailer) {
      trailer = response.data.items.find(item =>
        item.snippet.title.toLowerCase().includes('trailer oficial')
      );
    }
    if (!trailer && year) {
      trailer = response.data.items.find(item =>
        item.snippet.title.toLowerCase().includes('trailer') && item.snippet.title.includes(year)
      );
    }
    if (!trailer) {
      trailer = response.data.items.find(item =>
        item.snippet.title.toLowerCase().includes('trailer')
      );
    }
    if (trailer) {
      return res.json({ trailerUrl: `https://www.youtube.com/embed/${trailer.id.videoId}` });
    } else {
      return res.json({ trailerUrl: null });
    }
  } catch (error) {
    // Mostra detalhes do erro do YouTube no log e na resposta
    if (error.response && error.response.data) {
      console.error('Erro ao buscar trailer do YouTube:', error.response.data);
      return res.status(500).json({ error: 'Erro ao buscar trailer do YouTube.', details: error.response.data });
    } else {
      console.error('Erro ao buscar trailer do YouTube:', error.message);
      return res.status(500).json({ error: 'Erro ao buscar trailer do YouTube.', details: error.message });
    }
  }
});

// Rota para buscar filme completo por título no OMDb e YouTube
app.get('/api/filme/:titulo', async (req, res) => {
  const titulo = req.params.titulo;

  try {
    // Buscar no OMDb
    const omdbUrl = `https://www.omdbapi.com/?t=${encodeURIComponent(titulo)}&apikey=${OMDB_API_KEY}`;
    const omdbRes = await fetch(omdbUrl);
    const omdbData = await omdbRes.json();

    // Buscar trailer no YouTube
    const youtubeUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(titulo + " trailer")}&key=${YOUTUBE_API_KEY}&maxResults=5&type=video`;
    const ytRes = await fetch(youtubeUrl);
    const ytData = await ytRes.json();
    let trailer = null;
    if (Array.isArray(ytData.items) && ytData.items.length > 0) {
      // Tenta encontrar "Official Trailer" no título
      const oficial = ytData.items.find(item => item.snippet && item.snippet.title && item.snippet.title.toLowerCase().includes('official trailer'));
      if (oficial && oficial.id && oficial.id.videoId) {
        trailer = `https://www.youtube.com/watch?v=${oficial.id.videoId}`;
      } else if (ytData.items[0].id && ytData.items[0].id.videoId) {
        trailer = `https://www.youtube.com/watch?v=${ytData.items[0].id.videoId}`;
      }
    }

    // Montar resposta
    const resposta = {
      titulo: omdbData.Title || titulo,
      descricao: omdbData.Plot || '',
      genero: omdbData.Genre || '',
      nota: parseFloat(omdbData.imdbRating) || null,
      imagem: omdbData.Poster || '',
      ano: omdbData.Year || '',
      trailer: trailer || '',
      imdb: omdbData
    };

    res.json(resposta);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao buscar dados', detalhes: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});