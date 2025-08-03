

let parentalPin = localStorage.getItem('parentalPin') || '0000';
let pinValidated = false;

// Modal PIN
let pinModal = null;
let pinInput = null;
let pinError = null;

// Roleta de Filme
const rouletteBtn = document.getElementById('open-roulette-btn');
let rouletteModal = null;
const API_BASE_URL = 'http://localhost:5000/api';
const movieContainer = document.getElementById('movie-list');
const movieDetailModal = document.getElementById('movie-detail-modal');
const closeModalBtn = document.getElementById('close-modal-btn');
const modalBody = document.getElementById('modal-body');
const loadingIndicator = document.getElementById('loading');
const genreSelect = document.getElementById('genre-select');
const yearSelect = document.getElementById('year-select');
const ratingSelect = document.getElementById('rating-select');
const applyFiltersBtn = document.getElementById('apply-filters-btn');
const movieListTitle = document.getElementById('movie-list-title');

// Carrosséis
const nowPlayingCarouselTrack = document.getElementById('now-playing-carousel-track');
const upcomingCarouselTrack = document.getElementById('upcoming-carousel-track');
const nowPlayingPrevBtn = document.getElementById('now-playing-prev-btn');
const nowPlayingNextBtn = document.getElementById('now-playing-next-btn');
const upcomingPrevBtn = document.getElementById('upcoming-prev-btn');
const upcomingNextBtn = document.getElementById('upcoming-next-btn');

// Login
const openLoginBtn = document.getElementById('open-login-btn');
const loginModal = document.getElementById('login-modal');
const closeLoginModalBtn = document.getElementById('close-login-modal-btn');
const loginForm = document.getElementById('login-form');

// Mensagem
const messageModal = document.getElementById('message-modal');
const messageText = document.getElementById('message-text');
const closeMessageBtn = document.getElementById('close-message-btn');


// Variáveis de paginação e filtragem
let currentPage = 1;
let totalPages = 1;
let loading = false;
let currentFilters = {};
const genres = {};
const genreMap = {}; // Mapeia id do gênero para o nome

// Variáveis para a animação do carrossel
const nowPlayingAnimationFrameId = {};
const upcomingAnimationFrameId = {};


// --- Funções Auxiliares ---

// Função genérica para mostrar um modal
// Função para mostrar o modal de PIN
function showPinModal(callback) {
  if (!pinModal) {
    pinModal = document.createElement('div');
    pinModal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50';
    pinModal.innerHTML = `
      <div class="bg-slate-800 rounded-xl shadow-2xl p-8 w-full max-w-sm relative">
        <h3 class="text-2xl font-bold text-white mb-6 text-center">Digite o PIN para conteúdo +18</h3>
        <input type="password" id="parental-pin-input" class="block w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-white mb-4" maxlength="8" autofocus>
        <div id="parental-pin-error" class="text-red-500 text-sm mb-4 hidden">PIN incorreto!</div>
        <button id="parental-pin-submit" class="w-full bg-amber-500 text-slate-900 font-bold py-2 px-4 rounded-md shadow-lg hover:bg-amber-400 transition-colors">Acessar</button>
      </div>
    `;
    document.body.appendChild(pinModal);
    pinInput = pinModal.querySelector('#parental-pin-input');
    pinError = pinModal.querySelector('#parental-pin-error');
    pinModal.querySelector('#parental-pin-submit').onclick = () => {
      if (pinInput.value === parentalPin) {
        pinValidated = true;
        pinModal.classList.add('hidden');
        pinError.classList.add('hidden');
        callback();
      } else {
        pinError.classList.remove('hidden');
      }
    };
  }
  pinInput.value = '';
  pinError.classList.add('hidden');
  pinModal.classList.remove('hidden');
}
function showModal(modal) {
  modal.classList.remove('hidden');
  setTimeout(() => {
    modal.querySelector('div').classList.remove('scale-95', 'opacity-0');
    modal.querySelector('div').classList.add('scale-100', 'opacity-100');
  }, 10);
}

// Função genérica para esconder um modal
function hideModal(modal) {
  modal.querySelector('div').classList.remove('scale-100', 'opacity-100');
  modal.querySelector('div').classList.add('scale-95', 'opacity-0');
  setTimeout(() => {
    modal.classList.add('hidden');
  }, 300);
}

// Mostra uma mensagem de alerta
function showMessage(text, isError = false) {
  messageText.textContent = text;
  messageModal.querySelector('div').classList.remove('bg-green-600', 'bg-red-600');
  messageModal.querySelector('div').classList.add(isError ? 'bg-red-600' : 'bg-green-600');
  showModal(messageModal);
  setTimeout(() => {
    hideModal(messageModal);
  }, 5000);
}

// Cria um card de filme com lazy loading
async function createMovieCard(movie, isCarousel = false) {
  const movieCard = document.createElement('div');
  movieCard.dataset.movieId = movie.id;

  const widthClass = isCarousel ? 'w-[150px] sm:w-[200px]' : '';
  const marginClass = isCarousel ? '' : 'lg:max-w-[200px] xl:max-w-[250px]';

  const posterPath = movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : 'https://placehold.co/500x750/1e293b/e2e8f0?text=Sem+Imagem';

  movieCard.className = `carousel-item ${widthClass} ${marginClass} bg-slate-800 rounded-xl shadow-lg hover:shadow-2xl overflow-hidden cursor-pointer transform transition-all duration-300 ease-in-out hover:scale-105 animate-fadeIn`;

  movieCard.innerHTML = `
    <div class="relative pb-[150%]">
      <img src="${posterPath}" alt="${movie.title}" loading="lazy" class="absolute inset-0 w-full h-full object-cover">
      <div class="absolute top-2 left-2 z-10 flex flex-wrap gap-1" id="rating-container-${movie.id}"></div>
    </div>
    <div class="p-4">
      <h3 class="text-white text-lg font-semibold truncate">${movie.title}</h3>
      <p class="text-sm text-slate-400 mt-1">${movie.release_date ? movie.release_date.substring(0, 4) : ''}</p>
      <div class="flex items-center mt-2 text-sm text-amber-400">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-star-fill"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        <span class="ml-1">${movie.vote_average.toFixed(1)}</span>
      </div>
    </div>
  `;

  // Sempre busca a classificação brasileira via API, igual à modal
  const ratingContainer = movieCard.querySelector(`#rating-container-${movie.id}`);
  let ratingBadgeHtml = '<span class="text-slate-500 text-xs">Carregando classificação...</span>';
  if (ratingContainer) {
    ratingContainer.innerHTML = ratingBadgeHtml;
    const ageRatingData = await fetchAgeRating(movie.id);
    if (ageRatingData && Array.isArray(ageRatingData.release_dates)) {
      const certification = ageRatingData.release_dates[0]?.certification;
      if (certification && certification.trim() !== '') {
        ratingBadgeHtml = createAgeRatingElement({ certification }).outerHTML;
      } else {
        ratingBadgeHtml = '<span class="text-slate-500 text-xs">N/D</span>';
      }
    } else {
      ratingBadgeHtml = '<span class="text-slate-500 text-xs">N/D</span>';
    }
    ratingContainer.innerHTML = ratingBadgeHtml;
  }

  // Armazena os dados do filme no card para uso posterior (roleta, etc)
  movieCard.movieData = movie;

  // Controle parental: bloqueia filmes +18
  movieCard.addEventListener('click', () => {
    if (movie.adult && !pinValidated) {
      showPinModal(() => showContentDetails(movie.id));
    } else {
      showContentDetails(movie.id);
    }
  });

  return movieCard;
}

// Renderiza a lista de filmes
// Função para roleta de filme aleatório
function rouletteMovie() {
  if (!rouletteModal) {
    rouletteModal = document.createElement('div');
    rouletteModal.className = 'fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50';
    rouletteModal.innerHTML = `
      <div class="bg-slate-800 rounded-xl shadow-2xl p-8 w-full max-w-md relative flex flex-col gap-4">
        <h3 class="text-2xl font-bold text-white mb-2 text-center">Roleta de Filme</h3>
        <label class="text-slate-300 font-semibold">Com quem vai assistir?</label>
        <select id="roulette-withwho" class="bg-slate-700 border border-slate-600 rounded-md p-2 text-white mb-2">
          <option value="Sozinho">Sozinho</option>
          <option value="Amigos">Amigos</option>
          <option value="Família">Família</option>
          <option value="Parceiro(a)">Parceiro(a)</option>
          <option value="Colegas">Colegas</option>
          <option value="Outro">Outro</option>
        </select>
        <label class="text-slate-300 font-semibold">Classificação indicativa</label>
        <select id="roulette-rating" class="bg-slate-700 border border-slate-600 rounded-md p-2 text-white mb-2">
          <option value="">Qualquer</option>
          <option value="L">Livre</option>
          <option value="10">10</option>
          <option value="12">12</option>
          <option value="14">14</option>
          <option value="16">16</option>
          <option value="18">18</option>
        </select>
        <label class="text-slate-300 font-semibold">Gênero</label>
        <select id="roulette-genre" class="bg-slate-700 border border-slate-600 rounded-md p-2 text-white mb-2">
          <option value="">Qualquer</option>
        </select>
        <label class="text-slate-300 font-semibold">Ano</label>
        <select id="roulette-year" class="bg-slate-700 border border-slate-600 rounded-md p-2 text-white mb-2">
          <option value="">Qualquer</option>
        </select>
        <button id="roulette-run" class="w-full bg-amber-500 text-slate-900 font-bold py-2 px-4 rounded-md shadow-lg hover:bg-amber-400 transition-colors">Sortear Filme</button>
        <button id="roulette-cancel" class="w-full bg-slate-700 text-slate-200 font-bold py-2 px-4 rounded-md shadow-lg hover:bg-slate-600 transition-colors mt-2">Cancelar</button>
      </div>
    `;
    document.body.appendChild(rouletteModal);

    // Preenche gêneros e anos
    const genreSelectEl = rouletteModal.querySelector('#roulette-genre');
    Object.entries(genres).forEach(([id, name]) => {
      const option = document.createElement('option');
      option.value = id;
      option.textContent = name;
      genreSelectEl.appendChild(option);
    });
    const yearSelectEl = rouletteModal.querySelector('#roulette-year');
    const currentYear = new Date().getFullYear();
    for (let i = currentYear; i >= 1900; i--) {
      const option = document.createElement('option');
      option.value = i;
      option.textContent = i;
      yearSelectEl.appendChild(option);
    }

    // Cancelar
    rouletteModal.querySelector('#roulette-cancel').onclick = () => {
      rouletteModal.classList.add('hidden');
    };

    // Sortear
    rouletteModal.querySelector('#roulette-run').onclick = () => {
      const withWho = rouletteModal.querySelector('#roulette-withwho').value;
      const selectedRating = rouletteModal.querySelector('#roulette-rating').value;
      const selectedGenre = rouletteModal.querySelector('#roulette-genre').value;
      const selectedYear = rouletteModal.querySelector('#roulette-year').value;

      // Filtra os cards
      const visibleCards = Array.from(movieContainer.children).filter(card => {
        const movie = card.movieData || null;
        if (!movie || (movie.adult && !pinValidated)) return false;

        // Filtra classificação indicativa (ignora se não houver dado)
        if (selectedRating && selectedRating !== '') {
          let cert = null;
          if (movie.release_dates && movie.release_dates.results) {
            const brRelease = movie.release_dates.results.find(r => r.iso_3166_1 === 'BR');
            cert = brRelease?.release_dates[0]?.certification;
          } else if (movie.certification) {
            cert = movie.certification;
          }
          if (cert && cert !== selectedRating) return false;
        }

        // Filtra gênero (ignora se não houver dado)
        if (selectedGenre && selectedGenre !== '') {
          if (movie.genres && Array.isArray(movie.genres)) {
            if (!movie.genres.some(g => g.id == selectedGenre || g == selectedGenre)) return false;
          }
        }

        // Filtra ano (ignora se não houver dado)
        if (selectedYear && selectedYear !== '') {
          if (movie.release_date && !movie.release_date.startsWith(selectedYear)) return false;
        }
        return true;
      });
      if (visibleCards.length === 0) {
        showMessage('Nenhum filme disponível para roleta com esses critérios.', true);
        rouletteModal.classList.add('hidden');
        return;
      }
      const randomCard = visibleCards[Math.floor(Math.random() * visibleCards.length)];
      if (randomCard) {
        // Monta mensagem detalhada
        let msg = `Dica: assista com ${withWho}`;
        if (selectedRating && selectedRating !== '') msg += ` | Classificação: ${selectedRating}`;
        if (selectedGenre && selectedGenre !== '') msg += ` | Gênero: ${genres[selectedGenre] || selectedGenre}`;
        if (selectedYear && selectedYear !== '') msg += ` | Ano: ${selectedYear}`;
        showMessage(msg);
        rouletteModal.classList.add('hidden');
        setTimeout(() => randomCard.click(), 1200);
      }
    };
  }
  rouletteModal.classList.remove('hidden');
}
// Listener para roleta de filme
if (rouletteBtn) {
  rouletteBtn.addEventListener('click', rouletteMovie);
}
async function renderMovies(movies, container, append = false, isCarousel = false) { // Made async
  if (!append) {
    container.innerHTML = '';
  }

  if (movies.length === 0) {
    container.innerHTML = '<p class="text-center text-slate-500 col-span-full">Nenhum filme encontrado com esses critérios.</p>';
    return;
  }

  // Use Promise.all para esperar que todos os cards sejam criados e as classificações buscadas
  const movieCardPromises = movies.map(movie => createMovieCard(movie, isCarousel));
  const movieCards = await Promise.all(movieCardPromises);

  movieCards.forEach(card => {
    container.appendChild(card);
  });
}

// Cria um elemento para a classificação indicativa
function createAgeRatingElement(rating) {
  const ratingElement = document.createElement('span');
  ratingElement.textContent = rating.certification || 'L';
  let ratingClass = 'rating-L';
  switch(rating.certification) {
    case 'L':
    case 'Livre':
      ratingClass = 'rating-L'; break;
    case '10':
      ratingClass = 'rating-10'; break;
    case '12':
      ratingClass = 'rating-12'; break;
    case '14':
      ratingClass = 'rating-14'; break;
    case '16':
      ratingClass = 'rating-16'; break;
    case '18':
      ratingClass = 'rating-18'; break;
    default:
      ratingClass = 'rating-L'; break;
  }
  ratingElement.className = `rating-badge ${ratingClass}`;
  return ratingElement;
}

// Povoa o seletor de anos
function populateYearSelect() {
  const currentYear = new Date().getFullYear();
  for (let i = currentYear; i >= 1900; i--) {
    const option = document.createElement('option');
    option.value = i;
    option.textContent = i;
    yearSelect.appendChild(option);
  }
}

// Busca e popula a lista de gêneros
async function fetchAndPopulateGenres() {
  try {
    const response = await axios.get(`${API_BASE_URL}/tmdb/genre/movie/list`);
    const fetchedGenres = response.data.genres;

    fetchedGenres.forEach(genre => {
      genres[genre.id] = genre.name;
      const option = document.createElement('option');
      option.value = genre.id;
      option.textContent = genre.name;
      genreSelect.appendChild(option);
    });

    // Atualiza o mapa de gêneros para uso posterior
    Object.entries(genres).forEach(([id, name]) => {
      genreMap[id] = name;
    });

  } catch (error) {
    console.error('Erro ao buscar gêneros:', error);
    showMessage('Erro ao carregar gêneros.', true);
  }
}


// --- Funções de API e Renderização Principal ---

// Busca filmes com base nos filtros
async function fetchMovies(page = 1, filters = {}) {
  if (loading) return;
  loading = true;

  if (page === 1) {
    loadingIndicator.classList.remove('hidden');
    movieContainer.innerHTML = ''; // Limpa a lista para a nova busca
    movieListTitle.textContent = 'Buscando Filmes...';
  } else {
    loadingIndicator.classList.remove('hidden');
  }

  const params = {
    page: page,
    with_genres: filters.genre || '',
    'primary_release_date.gte': filters.year ? `${filters.year}-01-01` : '',
    'primary_release_date.lte': filters.year ? `${filters.year}-12-31` : '',
    'vote_average.gte': filters.rating || '',
    append_to_response: 'release_dates' // Adicionado para buscar release_dates
  };

  // Limpa os parâmetros vazios para evitar erros na API
  Object.keys(params).forEach(key => params[key] === '' && delete params[key]);

  try {
    const response = await axios.get(`${API_BASE_URL}/tmdb/discover/movie`, { params });
    const movies = response.data.results;
    totalPages = response.data.total_pages;

    if (page === 1) {
      await renderMovies(movies, movieContainer); // Await here
      movieListTitle.textContent = 'Filmes Populares';
    } else {
      await renderMovies(movies, movieContainer, true); // Await here
    }

  } catch (error) {
    console.error('Erro ao buscar filmes:', error);
    showMessage('Erro ao buscar filmes.', true);
  } finally {
    loading = false;
    loadingIndicator.classList.add('hidden');
  }
}

// Busca e renderiza os lançamentos recentes no carrossel
async function fetchAndRenderNowPlayingCarousel() {
  try {
    const response = await axios.get(`${API_BASE_URL}/tmdb/movie/now_playing`, {
      params: { append_to_response: 'release_dates' } // Adicionado para buscar release_dates
    });
    const movies = response.data.results;
    await renderMovies(movies, nowPlayingCarouselTrack, false, true); // Await here
  } catch (error) {
    console.error('Erro ao buscar lançamentos recentes:', error);
    nowPlayingCarouselTrack.innerHTML = '<p class="text-center text-slate-500">Não foi possível carregar os lançamentos recentes.</p>';
  }
}

// Busca e renderiza os próximos lançamentos no carrossel
async function fetchAndRenderUpcomingCarousel() {
  try {
    const response = await axios.get(`${API_BASE_URL}/tmdb/movie/upcoming`, {
      params: { append_to_response: 'release_dates' } // Adicionado para buscar release_dates
    });
    const movies = response.data.results;
    await renderMovies(movies, upcomingCarouselTrack, false, true); // Await here
  } catch (error) {
    console.error('Erro ao buscar próximos lançamentos:', error);
    upcomingCarouselTrack.innerHTML = '<p class="text-center text-slate-500">Não foi possível carregar os próximos lançamentos.</p>';
  }
}

// Busca a classificação indicativa para um filme específico
async function fetchAgeRating(movieId) {
  try {
    const response = await axios.get(`${API_BASE_URL}/tmdb/movie/${movieId}/release_dates`);
    const releaseDates = response.data.results;
    const brRating = releaseDates.find(r => r.iso_3166_1 === 'BR');

    if (brRating && brRating.release_dates.length > 0) {
      return brRating; // Alterado para retornar o objeto brRating completo
    }
  } catch (error) {
    console.error(`Erro ao buscar a classificação do filme ${movieId}:`, error);
  }
  return null;
}

// Busca o trailer do YouTube
async function fetchYoutubeTrailer(movieTitle) {
  try {
    let year = '';
    if (window.lastMovieYear) year = window.lastMovieYear;
    const response = await axios.get('http://localhost:5000/api/youtube/trailer', {
      params: { title: movieTitle, year }
    });
    return response.data.trailerUrl || null;
  } catch (error) {
    console.error(`Erro ao buscar trailer para "${movieTitle}":`, error);
  }
  return null;
}

// Busca informações do OMDb
async function fetchOmdbData(imdbId) {
  try {
    const response = await axios.get(`${API_BASE_URL}/omdb`, {
      params: { i: imdbId }
    });
    return response.data;
  } catch (error) {
    console.error(`Erro ao buscar dados do OMDb para o ID ${imdbId}:`, error);
  }
  return null;
}


// Mostra os detalhes de um filme no modal
async function showContentDetails(movieId) {
  modalBody.innerHTML = `
    <div class="text-center">
      <svg class="animate-spin-fast h-10 w-10 text-amber-500 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <p class="mt-4 text-slate-400">Carregando detalhes do filme...</p>
    </div>
  `;
  showModal(movieDetailModal);

  try {
    const movieResponse = await axios.get(`${API_BASE_URL}/tmdb/movie/${movieId}`, {
      params: { append_to_response: 'videos,credits,external_ids,release_dates' } // Adicionado release_dates aqui também
    });
    const movie = movieResponse.data;

    // Usa os dados de release_dates já buscados
    const ageRatingData = movie.release_dates;
    let trailerUrl = '';
    let omdbData = null;
    try {
      // Salva o ano do filme para busca mais precisa do trailer
      window.lastMovieYear = movie.release_date ? movie.release_date.substring(0, 4) : '';
      trailerUrl = await fetchYoutubeTrailer(movie.title);
    } catch (err) {
      console.error('Erro ao buscar trailer do YouTube:', err);
    }
    const posterUrl = movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : 'https://placehold.co/500x750/1e293b/e2e8f0?text=Sem+Imagem';
    // Classificação indicativa brasileira (apenas a primeira, sem fallback genérico)
    let ratingBadges = '';
    if (ageRatingData && Array.isArray(ageRatingData.results)) {
      const brReleaseDates = ageRatingData.results.find(item => item.iso_3166_1 === 'BR');
      const certification = brReleaseDates?.release_dates[0]?.certification;
      if (certification && certification.trim() !== '') {
        ratingBadges = createAgeRatingElement({ certification }).outerHTML;
      } else {
        ratingBadges = '<span class="text-slate-500 text-xs">N/D</span>';
      }
    } else {
      ratingBadges = '<span class="text-slate-500 text-xs">N/D</span>';
    }

    // Layout: foto e trailer lado a lado, descrição embaixo; rodapé para direção, produtoras e país
    modalBody.innerHTML = `
      <div class="md:flex md:space-x-8">
        <div class="flex-shrink-0 mb-6 md:mb-0 flex flex-col items-center w-full md:w-64 relative">
          <div class="relative w-full md:w-64 mx-auto">
            <img src="${posterUrl}" alt="${movie.title}" class="rounded-lg shadow-xl w-full h-auto block">
            <div class="absolute top-2 left-2 z-10 flex flex-wrap gap-2">${ratingBadges}</div>
            <div class="absolute top-2 right-2 z-10">
              <span class="bg-slate-700 text-slate-200 text-xs font-semibold rounded px-2 py-1 shadow">${movie.release_date}</span>
            </div>
            <div class="absolute bottom-2 left-2 right-2 z-10 flex flex-col items-center">
              <div class="bg-black bg-opacity-70 rounded px-2 py-1 mb-1 text-xs text-white flex items-center gap-2">
                <span class="font-bold">${movie.runtime} min</span>
                <span class="flex items-center gap-1">
                  <svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='gold' stroke='gold' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' class='lucide lucide-star-fill'><polygon points='12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2'/></svg>
                  <span>${movie.vote_average.toFixed(1)}</span>
                </span>
              </div>
            </div>
          </div>
          <div class="w-full grid grid-cols-3 gap-4 justify-center mt-4">
            ${(() => {
              const famousSurnames = [
                'Johnson','Smith','Pitt','Cruise','Roberts','Streep','Cruz','Watson','Stone','Fox','Diesel','Rock','Affleck','Damon','Clooney','Bale','Hanks','Depp','Downey','Evans','Hemsworth','Johansson','Holland','Gadot','Gosling','Reeves','Ruffalo','Pratt','Lawrence','Blunt','Chastain','McConaughey','Portman','Theron','Winslet','Foster','Kidman','Bullock','Aniston','Carell','Ferrell','Bateman','Sandler','Statham','Hardy','Elba','Mirren','Dench','Cumberbatch','Radcliffe','Watson','Grint','Robbie','Pine','Saldana','Saldaña','Boseman','Nyong\'o','Jordan','Mbatha','Brolin','Rudd','Lilly','Douglas','Pfeiffer','Hurt','Jackson','Freeman','Washington','Foxx','Gyllenhaal','Mara','Page','Wood','Williams','Davis','Spencer','King','Bassett','Ejiofor','Kaluuya','Stanfield','Duke','Wright','Gurira','Coel','Coleman','Colman','Foy','Kirby','Smith','Capaldi','Tennant','Eccleston','Whittaker','Gomez','Sladen','Agyeman','Barrowman','Davies','Moffat','Chibnall','Gatiss','Cornell','Roberts','Gold','Arnold','Murray','Tyler','Jones','Smith','Brown','White','Green','Black','Young','King','Scott','Moore','Clark','Lewis','Walker','Hall','Allen','Sanchez','Ramirez','Torres','Flores','Rivera','Gomez','Diaz','Martinez','Hernandez','Lopez','Gonzalez','Perez','Santos','Silva','Costa','Oliveira','Sousa','Lima','Carvalho','Ribeiro','Alves','Ferreira','Pereira','Rodrigues','Martins','Rocha','Barbosa','Mendes','Nunes','Cunha','Castro','Campos','Teixeira','Moreira','Cardoso','Pinto','Leite','Vieira','Monteiro','Moura','Freitas','Araujo','Ramos','Simoes','Fonseca','Correia','Coelho','Sousa','Faria','Tavares','Peixoto','Pacheco','Matos','Sampaio','Melo','Cavalcanti','Cordeiro','Duarte','Gomes','Guimaraes','Henrique','Lopes','Magalhaes','Menezes','Miranda','Neves','Oliveira','Pacheco','Pereira','Pimentel','Pinheiro','Ramos','Reis','Ribeiro','Rocha','Santos','Silva','Soares','Souza','Teixeira','Vasconcelos','Vieira','Xavier'
              ];
              return movie.credits.cast.slice(0, 6).map(c => {
                const profile = c.profile_path ? `https://image.tmdb.org/t/p/w185${c.profile_path}` : 'https://placehold.co/90x135/1e293b/e2e8f0?text=Sem+Foto';
                let character = c.character ? c.character.replace(/\s*\(voice\)/i, '').trim() : '';
                let nameParts = c.name.split(' ');
                let displayName = nameParts[0];
                if (nameParts.length > 1) {
                  let famous = nameParts.find((part, idx) => idx > 0 && famousSurnames.includes(part));
                  if (famous) {
                    displayName += ' ' + famous;
                  } else {
                    displayName += ' ' + nameParts[1];
                  }
                }
                return `
                  <div class="flex flex-col items-center w-20">
                    <div class="relative w-16 h-24 mb-2">
                      <img src="${profile}" alt="${c.name}" class="rounded-lg shadow w-full h-full object-cover border border-slate-700">
                    </div>
                    <span class="text-xs text-slate-200 text-center font-semibold break-words mt-1">${displayName}</span>
                    <span class="text-xs text-slate-400 text-center break-words">${character}</span>
                  </div>
                `;
              }).join('');
            })()}
          </div>
        </div>
        <div class="flex-1 flex flex-col items-start w-full">
          ${trailerUrl ? `
            <div class="w-full aspect-video rounded-lg overflow-hidden shadow-xl mb-2 flex items-center justify-center bg-black">
              <iframe src="${trailerUrl}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="width:100%;height:100%;min-height:320px;max-height:400px;"></iframe>
            </div>
          ` : ''}
          <div class="text-slate-400 text-sm mb-2 text-left w-full"><strong>Gêneros:</strong> ${movie.genres.map(g => g.name).join(', ')}</div>
          <h2 class="text-3xl font-bold text-white text-left break-words mb-0" style="margin-bottom:0;padding-bottom:0;">${movie.title}</h2>
          <div class="w-full" style="margin-top:0;padding-top:0;">
            <p class="text-slate-300 text-left text-lg leading-relaxed whitespace-pre-line break-words bg-slate-800 rounded-lg shadow" style="margin-top:0;margin-bottom:0;padding:2px 8px 2px 8px;">
              ${movie.overview || ''}
            </p>
          </div>
        </div>
      </div>
      <div class="mt-6"></div>
        <div class="border-t border-slate-700 pt-4 mt-4 text-sm text-slate-400 flex flex-wrap gap-6 justify-center">
          <div><strong>Direção:</strong> ${movie.credits.crew.filter(c => c.job === 'Director').map(c => c.name).join(', ')}</div>
          <div><strong>Produtoras:</strong> ${movie.production_companies.map(p => p.name).join(', ')}</div>
          <div><strong>País de Origem:</strong> ${movie.production_countries.map(c => `<span class='inline-block align-middle mr-1'><img src='https://flagcdn.com/24x18/${c.iso_3166_1.toLowerCase()}.png' alt='${c.iso_3166_1}' class='inline w-6 h-4 rounded-sm border border-slate-600'></span>${c.iso_3166_1}`).join(', ')}</div>
        </div>
      </div>
    `;

    // Adiciona o script para os ícones após a injeção do HTML
    lucide.createIcons();

  } catch (error) {
    console.error(`Erro ao buscar detalhes do filme ${movieId}:`, error);
    modalBody.innerHTML = `<p class="text-center text-red-500 mt-6">Não foi possível carregar os detalhes do filme.</p>`;
  }
}

// Esconde os detalhes do filme
function hideContentDetails() {
  hideModal(movieDetailModal);
  modalBody.innerHTML = ''; // Limpa o conteúdo do modal
}

// Mostra o modal de login
function showLoginModal() {
  showModal(loginModal);
}

// Esconde o modal de login
function hideLoginModal() {
  hideModal(loginModal);
}

// Lida com o login
function handleLogin(e) {
  e.preventDefault();
  const username = e.target.username.value;
  const password = e.target.password.value;
  // TODO: Adicionar lógica de autenticação real aqui
  if (username === 'admin' && password === '123') {
    showMessage('Login bem-sucedido!', false);
    hideLoginModal();
  } else {
    showMessage('Usuário ou senha incorretos.', true);
  }
}

// --- Funções do Carrossel ---

function setupCarouselNavigation(carouselTrack, prevBtn, nextBtn, animationRef) {
  const scrollStep = 250; // Quantidade de pixels a rolar por vez

  // Rolar para a esquerda
  prevBtn.addEventListener('click', () => {
    carouselTrack.scrollBy({
      left: -scrollStep,
      behavior: 'smooth'
    });
    // Para a animação automática ao interagir
    stopCarouselAutoScroll(animationRef);
  });

  // Rolar para a direita
  nextBtn.addEventListener('click', () => {
    carouselTrack.scrollBy({
      left: scrollStep,
      behavior: 'smooth'
    });
    // Para a animação automática ao interagir
    stopCarouselAutoScroll(animationRef);
  });
}

function startCarouselAutoScroll(carouselTrack, animationRef) {
  const scrollSpeed = 0.5; // Pixels por frame

  const autoScroll = () => {
    // Se o carrossel chegou ao fim, volte ao início
    if (carouselTrack.scrollLeft + carouselTrack.offsetWidth >= carouselTrack.scrollWidth) {
      carouselTrack.scrollLeft = 0;
    }
    carouselTrack.scrollLeft += scrollSpeed;
    animationRef.id = requestAnimationFrame(autoScroll);
  };

  animationRef.id = requestAnimationFrame(autoScroll);
}

function stopCarouselAutoScroll(animationRef) {
  cancelAnimationFrame(animationRef.id);
}


// --- Event Listeners ---

// Adiciona um listener para o botão de filtros
applyFiltersBtn.addEventListener('click', () => {
  currentPage = 1;
  currentFilters = {
    genre: genreSelect.value,
    year: yearSelect.value,
    rating: ratingSelect.value
  };
  fetchMovies(currentPage, currentFilters);
});

// Listener para fechar o modal de detalhes do filme
closeModalBtn.addEventListener('click', hideContentDetails);
movieDetailModal.addEventListener('click', (e) => {
  if (e.target.id === 'movie-detail-modal') {
    hideContentDetails();
  }
});

openLoginBtn.addEventListener('click', showLoginModal);
closeLoginModalBtn.addEventListener('click', hideLoginModal);
loginModal.addEventListener('click', (e) => {
  if (e.target.id === 'login-modal') {
    hideLoginModal();
  }
});
loginForm.addEventListener('submit', handleLogin);
closeMessageBtn.addEventListener('click', () => hideModal(messageModal));

// Listener para a rolagem da página para carregar mais filmes (infinite scroll)
window.addEventListener('scroll', () => {
  if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500 && currentPage <= totalPages && !loading) {
    currentPage++;
    fetchMovies(currentPage, currentFilters);
  }
});

// Inicia a busca inicial de filmes e lançamentos quando a página é carregada
document.addEventListener('DOMContentLoaded', () => {
  fetchAndPopulateGenres(); // Busca e popula os gêneros dinamicamente
  populateYearSelect(); // Povoa o seletor de anos
  fetchMovies(); // Busca filmes populares
  fetchAndRenderNowPlayingCarousel(); // Lançamentos recentes
  fetchAndRenderUpcomingCarousel(); // Próximos Lançamentos

  // Configura a navegação manual para ambos os carrosséis
  setupCarouselNavigation(nowPlayingCarouselTrack, nowPlayingPrevBtn, nowPlayingNextBtn, nowPlayingAnimationFrameId);
  setupCarouselNavigation(upcomingCarouselTrack, upcomingPrevBtn, upcomingNextBtn, upcomingAnimationFrameId);

  // Inicia a rolagem automática dos carrosséis
  startCarouselAutoScroll(nowPlayingCarouselTrack, nowPlayingAnimationFrameId);
  startCarouselAutoScroll(upcomingCarouselTrack, upcomingAnimationFrameId);

  // Para a rolagem automática quando o mouse está sobre o carrossel
  nowPlayingCarouselTrack.addEventListener('mouseenter', () => stopCarouselAutoScroll(nowPlayingAnimationFrameId));
  nowPlayingCarouselTrack.addEventListener('mouseleave', () => startCarouselAutoScroll(nowPlayingCarouselTrack, nowPlayingAnimationFrameId));
  upcomingCarouselTrack.addEventListener('mouseenter', () => stopCarouselAutoScroll(upcomingAnimationFrameId));
  upcomingCarouselTrack.addEventListener('mouseleave', () => startCarouselAutoScroll(upcomingCarouselTrack, upcomingAnimationFrameId));
});
