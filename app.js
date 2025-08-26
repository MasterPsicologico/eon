document.addEventListener('DOMContentLoaded', () => {
  const API_KEY = '03e66e3a69ab27b33648570df1c843df';
  const API_URL = 'https://api.themoviedb.org/3/search/movie';
  const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';
  const SUGGESTION_DELAY = 300;
  const searchInput = document.getElementById('search-input');
  const searchButton = document.getElementById('search-button');
  const moviesContainer = document.getElementById('movies-container');
  const suggestionsContainer = document.getElementById('suggestions-container');
  const closeResultsButton = document.getElementById('close-results');
  closeResultsButton.addEventListener('click', closeResults);

const totalPages = 3;
  const currentPage = 1;


  console.log("Realizando solicitud a la API...");

  function fillYearOptions() {
    const yearSelect = document.getElementById('year');
    const currentYear = new Date().getFullYear();

    for (let year = currentYear; year >= 1900; year--) {
      const option = document.createElement('option');
      option.value = year;
      option.textContent = year;
      yearSelect.appendChild(option);
    }
  }

  console.log("Realizando solicitud a la API...");

  function updateRatingDisplay() {
    const rating = document.getElementById('rating').value;
    document.getElementById('rating-display').textContent = rating;
  }

  fillYearOptions();
  document.getElementById('rating').addEventListener('input', updateRatingDisplay);

  async function fetchGenres() {
    const url = `https://api.themoviedb.org/3/genre/movie/list?api_key=${API_KEY}&language=es-ES`;

    try {
      const response = await fetch(url);
      const data = await response.json();
      displayGenres(data.genres);
    } catch (error) {
      console.error('Error fetching genres:', error);
    }
  }

  function displayGenres(genres) {
    const genreSelect = document.getElementById('genre');
    genres.forEach(genre => {
      const option = document.createElement('option');
      option.value = genre.id;
      option.textContent = genre.name;
      genreSelect.appendChild(option);
    });
  }

  fetchGenres();

  async function searchWithFilters(year, genre, rating, totalPages = 3) {
    const loadingMessage = document.getElementById('loading-message');

    const fetchMovies = (page) => {
      let url = `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&language=es-ES&page=${page}&include_adult=false`;

      if (year) {
        url += `&primary_release_year=${year}`;
      }

      if (genre) {
        url += `&with_genres=${genre}`;
      }

      if (rating) {
        url += `&vote_average.gte=${rating}`;
      }

      return fetch(url).then(response => response.json());
    };

    const allPages = Array.from({ length: totalPages }, (_, index) => index + 1);
    const allRequests = allPages.map(page => fetchMovies(page));

    // Muestra el mensaje de "Cargando..."
    loadingMessage.style.display = 'block';

    try {
      const pagesData = await Promise.all(allRequests);
      const allResults = pagesData.flatMap(pageData => pageData.results);
      if (allResults.length > 0) {
        await displayMovies(allResults); // Asume que ya tienes una función para mostrar los resultados
      } else {
        alert('No se encontraron películas con los filtros seleccionados.');
      }
    } catch (error) {
      console.error('Error al buscar películas con filtros:', error);
    } finally {
      // Oculta el mensaje de "Cargando..."
      loadingMessage.style.display = 'none';
    }
  }

  document.getElementById('search-filters-button').addEventListener('click', () => {
    const year = document.getElementById('year').value;
    const genre = document.getElementById('genre').value;
    const rating = document.getElementById('rating').value;

    searchWithFilters(year, genre, rating);
  });

  async function fetchUpcomingMovies() {
    const url = `https://api.themoviedb.org/3/movie/upcoming?api_key=${API_KEY}&page=${PAGE_NUMBER}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      console.log(data);
      displayUpcomingMovies(data.results);
    } catch (error) {
      console.error('Error fetching upcoming movies:', error);
    }
  }

  function displayUpcomingMovies(movies) {
    // Aquí puedes implementar cómo mostrar las películas en tu aplicación
    movies.forEach(movie => {
      console.log(movie.title, movie.release_date);
    });
  }

  fetchUpcomingMovies();

  searchButton.addEventListener('click', searchMovies);

  searchInput.addEventListener('keyup', event => {
    if (event.key === 'Enter') {
      searchMovies();
    }
    getSuggestions(searchInput.value);
  });

  async function fetchMovieDetails(movieId) {
    const url = `https://api.themoviedb.org/3/movie/${movieId}?api_key=${API_KEY}&language=es-ES&append_to_response=keywords`;
    try {
      const response = await fetch(url);
      const data = await response.json();

      const detailsContainer = document.createElement('div');
      detailsContainer.className = 'mb-4';

      const movieDetails = [
        { label: 'Sinopsis: ', value: data.overview },
        { label: 'Palabras clave: ', value: data.keywords.keywords.map(keyword => keyword.name).join(', ') },
        { label: 'Duración:', value: `${data.runtime} min` },
        { label: 'Presupuesto: ', value: `$${data.budget.toLocaleString()}` },
        { label: 'Recaudación: ', value: `$${data.revenue.toLocaleString()}` },
        { label: 'Fecha de lanzamiento: ', value: data.release_date },
        { label: 'Género: ', value: data.genres.map(genre => genre.name).join(', ') },
        { label: 'Calificación en TMDb: ', value: `${data.vote_average} (${data.vote_count} votos)` },
        { label: 'URL de la película en TMDb: ', value: `https://www.themoviedb.org/movie/${movieId}`, link: true },
        { label: 'Página oficial: ', value: data.homepage || 'No disponible', link: !!data.homepage },
        { label: 'Compañías productoras: ', value: data.production_companies.map(company => company.name).join(', ') },
        { label: 'Estado: ', value: data.status },
        { label: 'Idioma original: ', value: data.original_language },
        { label: 'Países de producción: ', value: data.production_countries.map(country => country.name).join(', ') },
      ];

      movieDetails.forEach(detail => {
        const detailRow = document.createElement('div');
        detailRow.className = 'mb-2';

        const detailLabel = document.createElement('strong');
        detailLabel.textContent = detail.label;
        detailRow.appendChild(detailLabel);

        if (detail.link) {
          const detailValue = document.createElement('a');
          detailValue.href = detail.value;
          detailValue.textContent = detail.value;
          detailValue.target = '_blank';
          detailValue.rel = 'noopener noreferrer';
          detailRow.appendChild(detailValue);
        } else {
          const detailValue = document.createElement('span');
          detailValue.textContent = detail.value;
          detailRow.appendChild(detailValue);
        }

        detailsContainer.appendChild(detailRow);
      });

      return detailsContainer;
    } catch (error) {
      console.error('Error fetching movie details:', error);
    }
  }

  async function fetchMovieCastAndCrew(movieId) {
    const url = `https://api.themoviedb.org/3/movie/${movieId}/credits?api_key=${API_KEY}&language=es-ES`;
    const imageUrl = 'https://image.tmdb.org/t/p/w200';

    try {
      const response = await fetch(url);
      const data = await response.json();

      const castAndCrewContainer = document.createElement('div');
      castAndCrewContainer.className = 'row';

      // Fetch and add movie details
      const movieDetails = await fetchMovieDetails(movieId);
      if (movieDetails) {
        castAndCrewContainer.appendChild(movieDetails);
      }

      const castColumn = document.createElement('div');
      castColumn.className = 'col-md-6';
      const castTitle = document.createElement('h3');
      castTitle.textContent = 'Reparto:';
      castColumn.appendChild(castTitle);

      const castList = document.createElement('div');
      castList.className = 'row';
      const castPromises = data.cast.slice(0, 5).map(async (actor) => {
        const wikipediaUrl = await fetchWikipediaInfo(actor.name);
        const actorInfo = createPersonCard(actor, imageUrl, wikipediaUrl);
        castList.appendChild(actorInfo);
      });

      await Promise.allSettled(castPromises);
      castColumn.appendChild(castList);
      castAndCrewContainer.appendChild(castColumn);

      const crewColumn = document.createElement('div');
      crewColumn.className = 'col-md-6';
      const crewTitle = document.createElement('h3');
      crewTitle.textContent = 'Equipo:';
      crewColumn.appendChild(crewTitle);

      const crewRoles = [
        { job: 'Director', label: 'Director(es):' },
        { job: 'Screenplay', label: 'Guionista(s):' },
        { job: 'Producer', label: 'Productor(es):' },
        { job: 'Director of Photography', label: 'Director(es) de fotografía:' },
      ];

      for (const crewRole of crewRoles) {
        const crewList = data.crew.filter(crewMember => crewMember.job === crewRole.job);

        if (crewList.length > 0) {
          const roleTitle = document.createElement('h4');
          roleTitle.textContent = crewRole.label;
          crewColumn.appendChild(roleTitle);

          const roleList = document.createElement('div');
          roleList.className = 'row';
          const crewPromises = crewList.map(async (crewMember) => {
            const wikipediaUrl = await fetchWikipediaInfo(crewMember.name);
            const crewInfo = createPersonCard(crewMember, imageUrl, wikipediaUrl);
            roleList.appendChild(crewInfo);
          });

          await Promise.allSettled(crewPromises);
          crewColumn.appendChild(roleList);
        }
      }

      castAndCrewContainer.appendChild(crewColumn);

      const movieInfo = document.getElementById('movie-info');
      movieInfo.innerHTML = '';
      movieInfo.appendChild(castAndCrewContainer);

      const movieModal = new bootstrap.Modal(document.getElementById('movie-modal'));
      movieModal.show();
    } catch (error) {
      console.error('Error fetching movie cast and crew:', error);
    }
  }

  async function fetchWikipediaInfo(name) {
    const apiUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=info&inprop=url&titles=${encodeURIComponent(name)}&origin=*`;

    try {
      const response = await fetch(apiUrl);
      const data = await response.json();
      const pageInfo = data.query.pages;
      const firstPage = Object.values(pageInfo)[0];

      if (firstPage && !firstPage.missing) {
        return firstPage.fullurl;
      }
    } catch (error) {
      console.error('Error fetching Wikipedia info:', error);
    }

    return null;
  }

  function createPersonCard(person, imageUrl, wikipediaUrl) {
    const personInfo = document.createElement('div');
    personInfo.className = 'col-sm-4 col-md-6 mb-3';

    const personCard = document.createElement('div');
    personCard.className = 'card';

    if (person.profile_path) {
      const personPhoto = document.createElement('img');
      personPhoto.src = `${imageUrl}${person.profile_path}`;
      personPhoto.className = 'card-img-top';
      personCard.appendChild(personPhoto);
    }

    const cardBody = document.createElement('div');
    cardBody.className = 'card-body';

    const personName = document.createElement('h5');
    personName.className = 'card-title';
    personName.textContent = person.name;
    cardBody.appendChild(personName);

    if (person.character) {
      const characterName = document.createElement('p');
      characterName.className = 'card-text';
      characterName.textContent = `como ${person.character}`;
      cardBody.appendChild(characterName);
    }

    // Agregar enlace a la biografía de Wikipedia si está disponible
    if (wikipediaUrl) {
      const wikipediaLink = document.createElement("a");
      wikipediaLink.href = wikipediaUrl;
      wikipediaLink.textContent = "Biografía de Wikipedia";
      wikipediaLink.target = "_blank";
      wikipediaLink.rel = "noopener noreferrer";
      cardBody.appendChild(wikipediaLink);
    }

    personCard.appendChild(cardBody);
    personInfo.appendChild(personCard);

    return personInfo;
  }

  async function searchMovies() {
    const query = searchInput.value;

    if (!query) {
      return;
    }

    const year = document.getElementById('year').value;
    const genre = document.getElementById('genre').value;
    const rating = document.getElementById('rating').value;

    let url = `${API_URL}?api_key=${API_KEY}&query=${query}&language=es-ES`;

    if (year) {
      const startDate = `${year}-01-01`;
      const endDate = `${year}-12-31`;
      url += `&primary_release_date.gte=${startDate}&primary_release_date.lte=${endDate}`;
    }

    if (genre) {
      url += `&with_genres=${genre}`;
    }

    if (rating) {
      url += `&vote_average.gte=${rating}`;
    }

    const response = await fetch(url);
    const data = await response.json();

    displayMovies(data.results);
  }

  async function searchVimeoMovie(movieTitle) {
    const accessToken = '0aa406e918084445ec50a53b44de498b';
    const searchUrl = `https://api.vimeo.com/videos?query=${encodeURIComponent(movieTitle)}&per_page=1`;

    const response = await fetch(searchUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    const data = await response.json();

    if (data.total > 0) {
      return data.data[0].link;
    }

    return null; 
  }




  async function getSuggestions(query) {
    if (!query) {
      suggestionsContainer.innerHTML = '';
      return;
    }

    const response = await fetch(`${API_URL}?api_key=${API_KEY}&query=${query}&language=es-ES`);
    const data = await response.json();

    displaySuggestions(data.results);
  }




  function displaySuggestions(suggestions) {
    suggestionsContainer.innerHTML = '';

    for (const suggestion of suggestions) {
      const suggestionElement = document.createElement('div');
      suggestionElement.innerText = suggestion.title;

      // Agregar evento de clic a cada elemento de sugerencia
      suggestionElement.addEventListener('click', () => {
        displayMovies([suggestion]);
        suggestionsContainer.innerHTML = '';
        searchInput.value = '';
      });

      suggestionsContainer.appendChild(suggestionElement);
    }
  }

  function closeResults() {
    moviesContainer.innerHTML = '';
    closeResultsButton.style.display = 'none';
  }





  async function fetchMovieStreamingServices(movieId) {
    const response = await fetch(`https://api.themoviedb.org/3/movie/${movieId}/watch/providers?api_key=${API_KEY}`);
    const data = await response.json();

    return data.results.US;
  }



async function searchArchiveOrgMovie(movieTitle) {
  try {
    const encodedTitle = encodeURIComponent(`"${movieTitle}"`);
    const response = await fetch(
      `https://archive.org/advancedsearch.php?q=title:${encodedTitle}+AND+mediatype:movies&fl%5B%5D=identifier&sort%5B%5D=&sort%5B%5D=&sort%5B%5D=&rows=3&page=1&output=json`
    );
    const data = await response.json();
    if (data.response.docs.length > 0) {
      return data.response.docs.map(doc => `https://archive.org/details/${doc.identifier}`);
    } else {
      return [];
    }
  } catch (error) {
    console.error("Error fetching movie from archive.org:", error);
    return [];
  }
}



async function displayMovies(movies) {
  moviesContainer.innerHTML = "";
  closeResultsButton.style.display = "block";

  const movieCards = await Promise.all(
    movies.map(async (movie) => {
      const movieCard = document.createElement("div");
      movieCard.classList.add("movie-card");

      const vimeoLink = await searchVimeoMovie(movie.title);
      if (vimeoLink != null) {
        const movieVimeoLink = document.createElement("a");
        movieVimeoLink.href = vimeoLink;
        movieVimeoLink.target = "_blank";
        movieVimeoLink.innerText = "Ver trailer en Vimeo.com";
        movieCard.appendChild(movieVimeoLink);
      }

      const movieStreamingServices = await fetchMovieStreamingServices(movie.id);
      if (movieStreamingServices) {
        const streamingServices = movieStreamingServices.flatrate
          ? movieStreamingServices.flatrate.map((service) => service.provider_name).join(", ")
          : "No disponible en servicios de streaming";
        const movieStreamingServicesInfo = document.createElement("p");
        movieStreamingServicesInfo.innerText = `Servicios de streaming: ${streamingServices}`;
        movieCard.appendChild(movieStreamingServicesInfo);
      }

      const moviePoster = document.createElement("img");
      moviePoster.src = `${IMAGE_BASE_URL}${movie.poster_path}`;
      moviePoster.alt = `${movie.title} poster`;
      movieCard.appendChild(moviePoster);

      const releaseYear = movie.release_date.slice(0, 4);
      const movieTitle = document.createElement("h3");
      movieTitle.innerText = `${movie.title} (${releaseYear})`;
      movieCard.appendChild(movieTitle);

      

const movieOverview = document.createElement("p");
      movieOverview.innerText = `Fecha de lanzamiento: ${movie.release_date}`;
      movieCard.appendChild(movieOverview);






      const movieTrailerButton = document.createElement("button");
      movieTrailerButton.innerText = "Ver tráiler";
      movieTrailerButton.addEventListener("click", () => displayTrailer(movie.id));
      movieCard.appendChild(movieTrailerButton);

      const movieRecommendationsButton = document.createElement("button");
      movieRecommendationsButton.innerText = "Recomendaciones";
      movieRecommendationsButton.addEventListener("click", () => displayRecommendations(movie.id));
      movieCard.appendChild(movieRecommendationsButton);



const buttonsContainer = document.createElement("div");
movieCard.appendChild(buttonsContainer);
      const castAndCrewButton = document.createElement('button');
      castAndCrewButton.textContent = 'Reparto y equipo';
      castAndCrewButton.onclick = () => fetchMovieCastAndCrew(movie.id);
      buttonsContainer.appendChild(castAndCrewButton);





      const relatedPosts = await searchWordPressPosts(movie.title);
      console.log("Publicaciones relacionadas en WordPress:", relatedPosts);
      if (relatedPosts.length > 0) {
        const postLink = document.createElement('button');
        postLink.textContent = 'Ver en mi sitio web';
        postLink.addEventListener('click', () => {
          window.open(relatedPosts[0].link, '_blank');
        });
        movieCard.appendChild(postLink);
      }







const archiveOrgLinks = await searchArchiveOrgMovie(movie.title);
      if (archiveOrgLinks.length > 0) {
        archiveOrgLinks.forEach((link, index) => {
          const movieArchiveOrgButton = document.createElement("button");
          movieArchiveOrgButton.innerText = `Ver en archive.org (${index + 1})`;
          movieArchiveOrgButton.addEventListener("click", () => {
            window.open(link, "_blank");
          });
          movieCard.appendChild(movieArchiveOrgButton);
        });
      }


      return movieCard;
    })
  );

  movieCards.forEach((movieCard) => {
    moviesContainer.appendChild(movieCard);
  });
}













 async function displayAdditionalInfo(movieId) {
    const url = `https://api.themoviedb.org/3/movie/${movieId}?api_key=${API_KEY}&language=es-ES&append_to_response=external_ids,credits,keywords`;

    

try {
        const response = await fetch(url);
        const data = await response.json();

    } catch (error) {
        console.error('Error al buscar información adicional de la película:', error);
        alert('No se encontró información adicional para esta película.');
    }
}



async function fetchMovieTrailer(movieId) {
    const url = `https://api.themoviedb.org/3/movie/${movieId}/videos?api_key=${API_KEY}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        const spanishTrailers = data.results.filter(
            video => video.type === 'Trailer' && video.iso_639_1 === 'es'
        );
        const englishTrailers = data.results.filter(
            video => video.type === 'Trailer' && video.iso_639_1 === 'en'
        );
        const trailer = spanishTrailers.length > 0 ? spanishTrailers[0] : (englishTrailers.length > 0 ? englishTrailers[0] : null);
        return trailer ? trailer.key : null;
    } catch (error) {
        console.error('Error al buscar tráiler de la película:', error);
    }
}

 async function displayTrailer(movieId) {
    const trailerKey = await fetchMovieTrailer(movieId);

    if (trailerKey) {
        const trailerUrl = `https://www.youtube.com/watch?v=${trailerKey}`;
        window.open(trailerUrl, '_blank');
    } else {
        alert('No se encontró tráiler para esta película.');
    }
}




async function fetchMovieRecommendations(movieId) {
    const url = `https://api.themoviedb.org/3/movie/${movieId}/recommendations?api_key=${API_KEY}&language=es-ES`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        return data.results;
    } catch (error) {
        console.error('Error al buscar recomendaciones de películas:', error);
    }
}

async function displayRecommendations(movieId) {
    const recommendations = await fetchMovieRecommendations(movieId);

    if (recommendations.length > 0) {
        displayMovies(recommendations);
    } else {
        alert('No se encontraron recomendaciones para esta película.');
    }
}


});