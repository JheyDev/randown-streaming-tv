// A API Key para a API do TMDb (The Movie Database)
// Obtenha sua chave em https://www.themoviedb.org/settings/api
// Substitua o placeholder abaixo pela sua chave real.
const TMDB_API_KEY = "YOUR_TMDB_API_KEY";
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";

// Dados para os filtros (manter a UI, mas a filtragem agora é feita no front-end após a busca inicial)
const genres = ["Ação", "Animação", "Aventura", "Comédia", "Crime", "Drama", "Fantasia", "Ficção Científica", "Histórico", "Mistério", "Terror", "Thriller", "Esportes", "Guerra"];
const moods = ["Adrenalina", "Calmo", "Curioso", "Divertido", "Épico", "Inspirador", "Intenso", "Nostálgico", "Para pensar", "Para relaxar"];
const company = ["Amigos", "Crianças", "Casal", "Família", "Sozinho"];
const ageRatings = ["Livre", "10", "12", "14", "16", "18"];
// As plataformas agora são mockadas, pois a API do TMDb não fornece essa informação na busca principal
const platformColors = {
  "Netflix": "bg-red-600",
  "HBO Max": "bg-purple-800",
  "Prime Video": "bg-blue-600",
  "Disney+": "bg-indigo-600",
  "Star+": "bg-yellow-600",
};

// Elementos do DOM
const genresContainer = document.getElementById('genres-container');
const moodsContainer = document.getElementById('moods-container');
const companyContainer = document.getElementById('company-container');
const platformSelect = document.getElementById('platform-select');
const ageRatingSelect = document.getElementById('age-rating-select');
const searchInput = document.getElementById('search-input');
const filterBtn = document.getElementById('filter-btn');
const clearFiltersBtn = document.getElementById('clear-filters-btn');
const rouletteBtn = document.getElementById('roulette-btn');
const rouletteSpinner = document.getElementById('roulette-spinner');
const rouletteText = document.getElementById('roulette-text');
const moviesContainer = document.getElementById('movies-container');
const movieCount = document.getElementById('movie-count');
const movieDetailModal = document.getElementById('movie-detail-modal');
const closeModalBtn = document.getElementById('close-modal-btn');
const movieDetailContent = document.getElementById('movie-detail-content');
const loginModal = document.getElementById('login-modal');
const closeLoginModalBtn = document.getElementById('close-login-modal-btn');
const loginForm = document.getElementById('login-form');
const openLoginBtn = document.getElementById('open-login-btn');
const watchedListBtn = document.getElementById('watched-list-btn');
const homeBtn = document.getElementById('home-btn');
const movieListTitle = document.getElementById('movie-list-title');
const filterSection = document.getElementById('filter-section');

// Estado da aplicação
let selectedGenres = [];
let selectedMoods = [];
let selectedCompany = [];
let selectedPlatform = '';
let selectedAgeRating = '';
let searchText = '';
let isLoggedIn = false;
let currentView = 'all_content';
let allContent = []; // Armazenará o conteúdo da API
let userRatings = JSON.parse(localStorage.getItem('userRatings')) || {};
let watchedMovies = JSON.parse(localStorage.getItem('watchedMovies')) || [];

// Funções de Utilitário
const saveUserData = () => {
  localStorage.setItem('userRatings', JSON.stringify(userRatings));
  localStorage.setItem('watchedMovies', JSON.stringify(watchedMovies));
};

const renderFilterButtons = (data, container, selectedArray) => {
  container.innerHTML = '';
  data.forEach(item => {
    const button = document.createElement('button');
    button.textContent = item;
    button.className = `px-3 py-1 rounded-full text-sm font-medium transition-colors duration-200 ${
      selectedArray.includes(item) ? 'bg-purple-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
    }`;
    button.addEventListener('click', () => {
      if (selectedArray.includes(item)) {
        selectedArray = selectedArray.filter(s => s !== item);
      } else {
        selectedArray.push(item);
      }
      applyFilters();
      renderFilterButtons(data, container, selectedArray);
    });
    container.appendChild(button);
  });
  if (container.id === 'genres-container') selectedGenres = selectedArray;
  if (container.id === 'moods-container') selectedMoods = selectedArray;
  if (container.id === 'company-container') selectedCompany = selectedArray;
};

const renderSelectOptions = (data, selectElement) => {
  data.forEach(item => {
    const option = document.createElement('option');
    option.value = item;
    option.textContent = item === "Livre" ? "Livre" : `${item} anos`;
    selectElement.appendChild(option);
  });
};

const filterContent = (contentArray) => {
  return contentArray.filter(content => {
    // A filtragem de gênero, humor e companhia é mantida para o mock,
    // mas a API do TMDb não retorna essas tags para a busca principal
    const matchesGenre = selectedGenres.length === 0 || selectedGenres.some(g => content.genres?.includes(g));
    const matchesMood = selectedMoods.length === 0 || selectedMoods.some(m => content.moods?.includes(m));
    const matchesCompany = selectedCompany.length === 0 || selectedCompany.some(c => content.company?.includes(c));
    const matchesPlatform = selectedPlatform === '' || content.platforms?.includes(selectedPlatform);
    const matchesAgeRating = selectedAgeRating === '' || (content.ageRating === 'Livre' ? true : parseInt(content.ageRating) <= parseInt(selectedAgeRating));
    const matchesSearch = searchText === '' ||
      content.title.toLowerCase().includes(searchText.toLowerCase()) ||
      content.overview.toLowerCase().includes(searchText.toLowerCase());

    return matchesGenre && matchesMood && matchesCompany && matchesPlatform && matchesAgeRating && matchesSearch;
  });
};

const renderContentCards = (moviesToRender, containerElement) => {
  containerElement.innerHTML = '';
  if (moviesToRender.length === 0) {
    const p = document.createElement('p');
    p.className = 'text-center col-span-full text-lg text-slate-400';
    p.textContent = 'Nenhum filme ou série encontrado com os filtros selecionados.';
    containerElement.appendChild(p);
  } else {
    moviesToRender.forEach(content => {
      const posterUrl = content.poster_path ? `${TMDB_IMAGE_BASE_URL}${content.poster_path}` : 'https://placehold.co/500x750/1e293b/cbd5e1?text=Poster+não+disponível';
      
      const contentCard = document.createElement('div');
      contentCard.className = "group relative rounded-2xl overflow-hidden shadow-xl border border-slate-700 cursor-pointer transition-all duration-300 hover:scale-105 flex flex-col justify-end items-start h-96 bg-slate-800 bg-cover bg-center";
      contentCard.style.backgroundImage = `linear-gradient(to top, rgba(15, 23, 42, 0.9) 0%, rgba(15, 23, 42, 0) 60%), url(${posterUrl})`;
      contentCard.addEventListener('click', () => showContentDetails(content));

      const platformsList = content.platforms ? content.platforms.map(p => {
        const platformClass = platformColors[p] || 'bg-slate-600';
        return `<span class="px-2 py-0.5 rounded-full text-xs font-medium text-white ${platformClass}">${p}</span>`;
      }).join('') : '';

      contentCard.innerHTML = `
        <div class="p-4 flex flex-col justify-between items-start w-full h-full text-white">
          <div class="flex flex-wrap gap-1 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            ${platformsList}
          </div>
          <div>
            <h3 class="text-xl font-semibold text-purple-300 mb-1">${content.title || content.name}</h3>
            <p class="text-slate-400 text-sm">${content.release_date ? 'Filme' : 'Série'} (${(content.release_date || content.first_air_date || '').substring(0, 4)})</p>
            <div class="flex items-center mt-1">
              <i data-lucide="star" class="w-4 h-4 text-yellow-400 fill-current"></i>
              <span class="ml-1 text-sm font-medium text-yellow-300">${(content.vote_average || 0).toFixed(1)}/10</span>
            </div>
          </div>
        </div>
      `;
      containerElement.appendChild(contentCard);
    });
  }
  lucide.createIcons();
};

const showContentDetails = (content) => {
  movieDetailContent.innerHTML = '';
  const posterUrl = content.poster_path ? `${TMDB_IMAGE_BASE_URL}${content.poster_path}` : 'https://placehold.co/500x750/1e293b/cbd5e1?text=Poster+não+disponível';
  
  const platformsList = content.platforms ? content.platforms.map(p => {
    const platformClass = platformColors[p] || 'bg-slate-600';
    return `<span class="px-3 py-1 rounded-full text-sm font-medium text-white ${platformClass}">${p}</span>`;
  }).join(' ') : '';

  movieDetailContent.innerHTML = `
    <div class="md:w-1/3 flex-shrink-0">
      <img src="${posterUrl}" alt="${content.title || content.name}" class="rounded-lg shadow-lg w-full h-auto object-cover">
    </div>
    <div class="md:w-2/3 flex-grow">
      <h2 class="text-3xl md:text-4xl font-bold font-display text-purple-400 mb-2">${content.title || content.name}</h2>
      <p class="text-slate-300 text-lg mb-4">${content.release_date ? 'Filme' : 'Série'} (${(content.release_date || content.first_air_date || '').substring(0, 4)})</p>
      
      <div class="flex flex-wrap gap-2 mb-4">
        ${platformsList}
      </div>

      <p class="text-slate-200 mb-4">${content.overview || 'Sinopse não disponível.'}</p>
      <p class="text-slate-300 mb-2"><strong class="text-purple-300">Avaliação Média:</strong> ${(content.vote_average || 0).toFixed(1)} / 10</p>
      
      <!-- Seção de Avaliação e Marcar como Assistido -->
      ${isLoggedIn ? `
        <div class="mt-6 pt-4 border-t border-slate-700">
            <h3 class="text-xl font-semibold text-purple-300 mb-3">Minha Avaliação:</h3>
            <div id="rating-buttons" class="flex gap-4">
                <!-- Botões de avaliação serão injetados via JS -->
            </div>
            <div class="flex gap-4 mt-4">
                <button id="mark-watched-btn" class="flex items-center px-4 py-2 text-sm font-medium text-green-400 bg-slate-800 rounded-full hover:bg-slate-700 transition-colors duration-200 shadow-md">
                    <i data-lucide="bookmark-check" class="mr-1 w-4 h-4"></i>
                    Marcar como Assistido
                </button>
            </div>
        </div>
      ` : `<p class="mt-6 pt-4 border-t border-slate-700 text-slate-400 text-sm">Faça login para avaliar filmes e gerenciar sua lista de assistidos.</p>`}
    </div>
  `;

  movieDetailModal.classList.remove('hidden');
  lucide.createIcons();

  if (isLoggedIn) {
    const ratingButtonsContainer = document.getElementById('rating-buttons');
    const markWatchedBtn = document.getElementById('mark-watched-btn');
    
    const userMovieRating = userRatings[content.id] || null;
    
    if (ratingButtonsContainer) {
      ratingButtonsContainer.innerHTML = `
        <button id="like-btn" class="flex items-center px-4 py-2 text-sm font-medium rounded-full transition-colors duration-200 shadow-md ${userMovieRating === 'liked' ? 'bg-green-600 text-white' : 'bg-slate-800 text-white'}" data-rating="liked">
          <i data-lucide="thumbs-up" class="mr-1 w-4 h-4"></i>
          Gostei
        </button>
        <button id="neutral-btn" class="flex items-center px-4 py-2 text-sm font-medium rounded-full transition-colors duration-200 shadow-md ${userMovieRating === 'neutral' ? 'bg-yellow-600 text-white' : 'bg-slate-800 text-white'}" data-rating="neutral">
          <i data-lucide="minus" class="mr-1 w-4 h-4"></i>
          Mais ou Menos
        </button>
        <button id="dislike-btn" class="flex items-center px-4 py-2 text-sm font-medium rounded-full transition-colors duration-200 shadow-md ${userMovieRating === 'disliked' ? 'bg-red-600 text-white' : 'bg-slate-800 text-white'}" data-rating="disliked">
          <i data-lucide="thumbs-down" class="mr-1 w-4 h-4"></i>
          Não Gostei
        </button>
      `;

      document.querySelectorAll('#rating-buttons button').forEach(button => {
        button.addEventListener('click', () => {
          const rating = button.dataset.rating;
          if (userRatings[content.id] === rating) {
            delete userRatings[content.id];
          } else {
            userRatings[content.id] = rating;
          }
          saveUserData();
          showContentDetails(content);
          renderCurrentView();
        });
      });
    }

    if (markWatchedBtn) {
      const isWatched = watchedMovies.includes(content.id);
      if (isWatched) {
        markWatchedBtn.textContent = 'Assistido';
        markWatchedBtn.classList.add('opacity-50', 'cursor-not-allowed', 'bg-green-700', 'text-white');
        markWatchedBtn.classList.remove('text-green-400', 'bg-slate-800', 'hover:bg-slate-700');
        markWatchedBtn.disabled = true;
      } else {
        markWatchedBtn.textContent = 'Marcar como Assistido';
        markWatchedBtn.classList.remove('opacity-50', 'cursor-not-allowed', 'bg-green-700', 'text-white');
        markWatchedBtn.classList.add('text-green-400', 'bg-slate-800', 'hover:bg-slate-700');
        markWatchedBtn.disabled = false;
        markWatchedBtn.onclick = () => {
          watchedMovies.push(content.id);
          saveUserData();
          console.log(`${content.title || content.name} marcado como assistido!`);
          showContentDetails(content);
          renderCurrentView();
        };
      }
    }
  }
};

const hideContentDetails = () => {
  movieDetailModal.classList.add('hidden');
};

const applyFilters = () => {
  renderCurrentView();
};

const clearFilters = () => {
  selectedGenres = [];
  selectedMoods = [];
  selectedCompany = [];
  selectedPlatform = '';
  selectedAgeRating = '';
  searchText = '';

  platformSelect.value = '';
  ageRatingSelect.value = '';
  searchInput.value = '';

  renderFilterButtons(genres, genresContainer, selectedGenres);
  renderFilterButtons(moods, moodsContainer, selectedMoods);
  renderFilterButtons(company, companyContainer, selectedCompany);

  rouletteText.classList.add('hidden');
  renderCurrentView();
};

// Funções da API TMDb
const fetchContent = async (endpoint, queryParams = {}) => {
  try {
    const url = new URL(`${TMDB_BASE_URL}/${endpoint}`);
    url.searchParams.append('api_key', TMDB_API_KEY);
    url.searchParams.append('language', 'pt-BR');
    for (const key in queryParams) {
      url.searchParams.append(key, queryParams[key]);
    }
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Erro na requisição: ${response.status}`);
    }
    const data = await response.json();
    return data.results;
  } catch (error) {
    console.error("Falha ao buscar dados da API do TMDb:", error);
    return [];
  }
};

const fetchPopularMovies = async () => {
  moviesContainer.innerHTML = '<p class="text-center col-span-full text-lg text-slate-400">Carregando filmes populares...</p>';
  allContent = await fetchContent('movie/popular');
  renderAllContent();
};

const fetchPopularTvShows = async () => {
  moviesContainer.innerHTML = '<p class="text-center col-span-full text-lg text-slate-400">Carregando séries populares...</p>';
  const tvShows = await fetchContent('tv/popular');
  allContent = allContent.concat(tvShows);
  renderAllContent();
};

const searchContent = async (query) => {
  if (query.trim() === '') {
    await fetchPopularMovies();
    return;
  }
  moviesContainer.innerHTML = '<p class="text-center col-span-full text-lg text-slate-400">Buscando por filmes e séries...</p>';
  const movies = await fetchContent('search/movie', { query });
  const tvShows = await fetchContent('search/tv', { query });
  allContent = [...movies, ...tvShows];
  renderAllContent();
};

const renderAllContent = () => {
  filterSection.classList.remove('hidden');
  movieListTitle.textContent = "Filmes e Séries Disponíveis";
  const filteredMovies = filterContent(allContent);
  moviesContainer.innerHTML = '';
  renderContentCards(filteredMovies, moviesContainer);
  movieCount.textContent = `${filteredMovies.length} filme(s) e série(s) disponível(is).`;
};

const renderWatchedList = () => {
  filterSection.classList.add('hidden');
  movieListTitle.textContent = "Meus Filmes e Séries Assistidos";
  
  moviesContainer.innerHTML = '';
  
  const watchedContent = allContent.filter(movie => watchedMovies.includes(movie.id));
  
  if (watchedContent.length === 0) {
    moviesContainer.innerHTML = '<p class="text-center col-span-full text-lg text-slate-400">Você ainda não marcou nenhum filme ou série como assistido.</p>';
    movieCount.textContent = `0 filme(s) e série(s) assistido(s).`;
    return;
  }

  const likedMovies = watchedContent.filter(movie => userRatings[movie.id] === 'liked');
  const neutralMovies = watchedContent.filter(movie => userRatings[movie.id] === 'neutral');
  const dislikedMovies = watchedContent.filter(movie => userRatings[movie.id] === 'disliked');
  
  const createCategorySection = (title, movies) => {
    if (movies.length > 0) {
      const sectionHtml = `
        <div class="col-span-full mt-8">
          <h4 class="text-2xl font-bold font-display text-white mb-4">${title} (${movies.length})</h4>
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            <!-- Cards will be injected here -->
          </div>
        </div>
      `;
      moviesContainer.insertAdjacentHTML('beforeend', sectionHtml);
      const categoryContainer = moviesContainer.lastElementChild.querySelector('div.grid');
      renderContentCards(movies, categoryContainer);
    }
  };

  createCategorySection('Gostei', likedMovies);
  createCategorySection('Mais ou Menos', neutralMovies);
  createCategorySection('Não Gostei', dislikedMovies);
  
  movieCount.textContent = `${watchedContent.length} filme(s) e série(s) assistido(s).`;
};

const renderCurrentView = () => {
  if (currentView === 'all_content') {
    renderAllContent();
  } else if (currentView === 'watched_list') {
    renderWatchedList();
  }
};


const runRoulette = () => {
  rouletteSpinner.classList.remove('hidden');
  rouletteText.classList.add('hidden');
  moviesContainer.innerHTML = '<p class="text-center col-span-full text-lg text-slate-400">Girando a roleta...</p>';
  movieCount.textContent = 'Girando a roleta...';

  const moviesForRoulette = filterContent(allContent);

  setTimeout(() => {
    rouletteSpinner.classList.add('hidden');
    if (moviesForRoulette.length > 0) {
      const randomIndex = Math.floor(Math.random() * moviesForRoulette.length);
      const chosenMovie = moviesForRoulette[randomIndex];
      showContentDetails(chosenMovie);
      rouletteText.textContent = `Sua escolha: ${chosenMovie.title || chosenMovie.name}!`;
      rouletteText.classList.remove('hidden');
    } else {
      rouletteText.textContent = 'Nenhum filme encontrado com os filtros selecionados para a roleta.';
      rouletteText.classList.remove('hidden');
    }
    renderCurrentView();
  }, 1500);
};

// Funções de Login
const showLoginModal = () => {
  loginModal.classList.remove('hidden');
};

const hideLoginModal = () => {
  loginModal.classList.add('hidden');
  loginForm.reset();
};

const handleLogin = (e) => {
  e.preventDefault();
  const username = loginForm.username.value;
  const password = loginForm.password.value;

  if (username === 'test' && password === 'password') {
    isLoggedIn = true;
    console.log('Login bem-sucedido!');
    hideLoginModal();
    updateHeaderButtons();
    renderCurrentView();
  } else {
    console.log('Usuário ou senha inválidos.');
  }
};

const handleLogout = () => {
  isLoggedIn = false;
  userRatings = {};
  watchedMovies = [];
  saveUserData();
  console.log('Logout realizado.');
  updateHeaderButtons();
  currentView = 'all_content';
  renderCurrentView();
};

const updateHeaderButtons = () => {
  if (isLoggedIn) {
    openLoginBtn.textContent = 'Logout';
    openLoginBtn.removeEventListener('click', showLoginModal);
    openLoginBtn.addEventListener('click', handleLogout);
    watchedListBtn.classList.remove('hidden');
  } else {
    openLoginBtn.textContent = 'Login';
    openLoginBtn.removeEventListener('click', handleLogout);
    openLoginBtn.addEventListener('click', showLoginModal);
    watchedListBtn.classList.add('hidden');
  }
};


// Listeners de Eventos
filterBtn.addEventListener('click', applyFilters);
clearFiltersBtn.addEventListener('click', clearFilters);
rouletteBtn.addEventListener('click', runRoulette);

platformSelect.addEventListener('change', (e) => {
  selectedPlatform = e.target.value;
  applyFilters();
});

ageRatingSelect.addEventListener('change', (e) => {
  selectedAgeRating = e.target.value;
  applyFilters();
});

searchInput.addEventListener('input', (e) => {
  searchText = e.target.value;
  if (searchText.length > 2 || searchText.length === 0) {
    searchContent(searchText);
  }
});

closeModalBtn.addEventListener('click', hideContentDetails);

movieDetailModal.addEventListener('click', (e) => {
  if (e.target.id === 'movie-detail-modal') {
    hideContentDetails();
  }
});

// Listeners do Modal de Login
openLoginBtn.addEventListener('click', showLoginModal);
closeLoginModalBtn.addEventListener('click', hideLoginModal);
loginModal.addEventListener('click', (e) => {
  if (e.target.id === 'login-modal') {
    hideLoginModal();
  }
});
loginForm.addEventListener('submit', handleLogin);

// Listener para o botão "Meus Assistidos"
watchedListBtn.addEventListener('click', (e) => {
  e.preventDefault();
  currentView = 'watched_list';
  clearFilters();
  watchedListBtn.classList.add('bg-purple-700', 'text-white');
  homeBtn.classList.remove('bg-purple-700', 'text-white');
});

// Listener para o botão "Home" no título
homeBtn.addEventListener('click', (e) => {
  e.preventDefault();
  currentView = 'all_content';
  clearFilters();
  homeBtn.classList.add('bg-purple-700', 'text-white');
  watchedListBtn.classList.remove('bg-purple-700', 'text-white');
});


// Inicialização da página
document.addEventListener('DOMContentLoaded', async () => {
  renderFilterButtons(genres, genresContainer, selectedGenres);
  renderFilterButtons(moods, moodsContainer, selectedMoods);
  renderFilterButtons(company, companyContainer, selectedCompany);
  renderSelectOptions(ageRatings, ageRatingSelect);
  updateHeaderButtons();
  await fetchPopularMovies();
});
