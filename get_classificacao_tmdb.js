
const axios = require('axios');

// Substitua pela sua chave API do TMDb
const apiKey = 'SUA_CHAVE_API_AQUI'; // <-- Coloque sua chave real aqui
const movieId = 12345; // Substitua pelo ID do filme desejado

// URL para detalhes do filme + release_dates + videos
const url = `https://api.themoviedb.org/3/movie/${movieId}?api_key=${apiKey}&language=pt-BR&append_to_response=release_dates,videos`;

axios.get(url)
  .then(response => {
    const movieData = response.data;
    // Classificação indicativa BR
    const brReleaseDates = movieData.release_dates.results.find(item => item.iso_3166_1 === 'BR');
    const certification = brReleaseDates?.release_dates[0]?.certification || 'Classificação não encontrada';

    // Trailer do filme (YouTube)
    const trailer = movieData.videos.results.find(
      v => v.type === 'Trailer' && v.site === 'YouTube'
    );
    const trailerUrl = trailer ? `https://www.youtube.com/embed/${trailer.key}` : null;

    console.log(`Classificação indicativa para o filme "${movieData.title}": ${certification}`);
    if (trailerUrl) {
      console.log(`Trailer YouTube: ${trailerUrl}`);
      // Exemplo de HTML para embed do trailer
      console.log(`\n<iframe width="560" height="315" src="${trailerUrl}" frameborder="0" allowfullscreen></iframe>\n`);
    } else {
      console.log('Trailer não encontrado no YouTube.');
    }
  })
  .catch(error => {
    console.error('Erro ao buscar dados da API:', error);
  });
