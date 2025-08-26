const API_KEY = '03e66e3a69ab27b33648570df1c843df';
const PAGE_NUMBER = 1;
const moviesContainer = document.getElementById('movies-container');

// Cerrar tráiler de película
function closeMovieTrailer(videoContainer) {
  videoContainer.innerHTML = '';
}

// Coincidencia de palabras clave
function matchKeywords(movieTitle, postTitle) {
  const movieKeywords = movieTitle.split(/[:\W]+/).map((word) => word.toLowerCase());
  const postKeywords = postTitle.split(/[:\W]+/).map((word) => word.toLowerCase());

  return movieKeywords.every((keyword) => postKeywords.includes(keyword));
}

let upcomingMovies; 
let topRatedMovies;
let lastFetch = 0;

// Obtener películas mejor calificadas (versión con caché)
function fetchTopRatedMovies() {
  const now = Date.now();
  if (topRatedMovies && now - lastFetch < 600000) { // 10 minutes
    displayMovies(topRatedMovies);
  } else {
    lastFetch = now;
    fetch('https://api.themoviedb.org/3/movie/top_rated?...')
      .then(res => res.json())
      .then(movies => {
        topRatedMovies = movies;
        displayMovies(movies);
      });
  }
}

// Obtener películas mejor calificadas (versión sin caché, código duplicado)
function fetchTopRatedMovies() {
  displayLoader(); // Muestra el loader
  
  fetch('https://api.themoviedb.org/3/movie/top_rated?...')
    .then(res => res.json())
    .then(movies => {
      hideLoader(); // Oculta el loader
      displayMovies(movies);
    });
}

// Limpiar título
function cleanTitle(title) {
  return title.replace(/[^a-zA-Z0-9\s]/g, '').toLowerCase();
}

// Limpiar contenedores de películas
function clearMovieContainers() {
  homeButtonMoviesContainer.innerHTML = '';
  topRatedMoviesContainer.innerHTML = '';
  upcomingMoviesContainer.innerHTML = '';
}

// Obtener series de televisión populares
async function fetchPopularTvShows() {
  // Define cuántas páginas de resultados deseas obtener
  const totalPagesToFetch = 3;
  
  try {
    // Realiza solicitudes para cada número de página y almacena las promesas en un array
    const fetchPromises = [];
    for (let i = 1; i <= totalPagesToFetch; i++) {
      const url = `https://api.themoviedb.org/3/tv/popular?api_key=${API_KEY}&language=es-ES&page=${i}`;
      fetchPromises.push(fetch(url));
    }

    // Espera a que todas las solicitudes se completen y extrae los datos JSON
    const responses = await Promise.all(fetchPromises);
    const jsonData = await Promise.all(responses.map(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    }));

    // Combina todos los resultados de las series en un solo array
    const allResults = jsonData.flatMap(data => data.results);

    // Muestra todos los resultados en las tarjetas de series
    displayTvShows(allResults);
  } catch (error) {
    console.error('Error fetching popular TV shows:', error);
  }
}









































// Función para mostrar las series de TV en tarjetas
async function displayTvShows(tvShows) {
  const movieCards = await Promise.all(tvShows.map(async (tvShow) => {
    // Crear tarjeta de película
    const movieCard = document.createElement('div');
    movieCard.className = 'movie-card';

    // Agregar póster
    const poster = document.createElement('img');
    poster.className = 'poster';
    poster.src = `https://image.tmdb.org/t/p/w500${tvShow.poster_path}`;
    poster.loading = 'lazy';
    movieCard.appendChild(poster);

    // Agregar información de la serie
    const movieInfo = document.createElement('div');
    movieInfo.className = 'tvShowInfo';
    movieCard.appendChild(movieInfo);

    // Agregar título
    const title = document.createElement('h3');
    title.textContent = tvShow.name;
    movieInfo.appendChild(title);

    // Agregar fecha de lanzamiento
    const releaseDate = document.createElement('p');
    releaseDate.textContent = `Fecha de estreno: ${tvShow.first_air_date}`;
    movieInfo.appendChild(releaseDate);

    // Agregar calificación
    const rating = document.createElement('p');
    rating.textContent = `Calificación: ${tvShow.vote_average}`;
    movieInfo.appendChild(rating);

    // Agregar cantidad de votos
    const voteCount = document.createElement('p');
    voteCount.textContent = `Cantidad de votos: ${tvShow.vote_count}`;
    movieInfo.appendChild(voteCount);



// Agregar botón de tráiler
const trailerButton = document.createElement('button');
trailerButton.textContent = 'Ver tráiler';
trailerButton.addEventListener('click', async () => {
  await fetchTvShowTrailerAndShowModal(tvShow.id);
});
movieInfo.appendChild(trailerButton);



    // Agregar botón de recomendaciones
    const recommendationsButton = document.createElement('button');
    recommendationsButton.textContent = 'Recomendaciones';
    recommendationsButton.addEventListener('click', async () => {
      const recommendedTvShows = await fetchTvShowRecommendations(tvShow.id);
      displayTvShows(recommendedTvShows);
    });
    movieInfo.appendChild(recommendationsButton);

    // Agregar botón de detalles, reparto y equipo
    const detailsButton = document.createElement('button');
    detailsButton.textContent = 'Detalles, reparto y equipo';
    detailsButton.addEventListener('click', () => {
      showModal(tvShow.id);
    });
    movieInfo.appendChild(detailsButton);

    return movieCard;
  }));

  // Agregar tarjetas de series al contenedor
  moviesContainer.innerHTML = '';
  movieCards.forEach((movieCard) => moviesContainer.appendChild(movieCard));
}





// Función para buscar el tráiler de la serie
async function fetchTvShowTrailer(tvShowId) {
  const url = `https://api.themoviedb.org/3/tv/${tvShowId}/videos?api_key=${API_KEY}&language=en-US`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }

  const data = await response.json();
  const youtubeTrailer = data.results.find(video => video.site === 'YouTube' && video.type === 'Trailer');

  // Cambiar la URL para que sea compatible con la incrustación en un iframe
  return youtubeTrailer ? `https://www.youtube.com/embed/${youtubeTrailer.key}?autoplay=1` : null;
}





// Función para buscar el tráiler de la serie y mostrarlo en una ventana modal
async function fetchTvShowTrailerAndShowModal(tvShowId) {
  const trailerUrl = await fetchTvShowTrailer(tvShowId);
  if (trailerUrl) {
    const modal = document.getElementById('modal');
    const closeModal = document.getElementById('closeModal');
    const trailerIframe = document.getElementById('trailerIframe');

    trailerIframe.src = trailerUrl;
    modal.style.display = 'block';

    closeModal.onclick = () => {
      modal.style.display = 'none';
      trailerIframe.src = '';
    };

    window.onclick = (event) => {
      if (event.target == modal) {
        modal.style.display = 'none';
        trailerIframe.src = '';
      }
    };
  } else {
    alert('No se encontró un tráiler para esta serie.');
  }
}






// Función para buscar recomendaciones de series
async function fetchTvShowRecommendations(tvShowId) {
  const url = `https://api.themoviedb.org/3/tv/${tvShowId}/recommendations?api_key=${API_KEY}&language=es-ES&page=1`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }

  const data = await response.json();
  return data.results;
}

// Acción para el botón de series populares
const popularTvShowsButton = document.getElementById('popularTvShowsButton');

popularTvShowsButton.addEventListener('click', () => {
  moviesContainer.innerHTML = 'Cargando';
  fetchPopularTvShows();
});









// Función para obtener detalles de la serie, reparto y equipo

async function fetchTvShowDetails(tvShowId) {
  const [detailsUrl, creditsUrl, imagesUrl] = [
    `https://api.themoviedb.org/3/tv/${tvShowId}?api_key=${API_KEY}&language=es-ES`,
    `https://api.themoviedb.org/3/tv/${tvShowId}/credits?api_key=${API_KEY}&language=es-ES`,
    `https://api.themoviedb.org/3/tv/${tvShowId}/images?api_key=${API_KEY}`,
  ];

  const [detailsResponse, creditsResponse, imagesResponse] = await Promise.all([
    fetch(detailsUrl),
    fetch(creditsUrl),
    fetch(imagesUrl),
  ]);

  if (!detailsResponse.ok || !creditsResponse.ok || !imagesResponse.ok) {
    throw new Error(
      `HTTP error! Status: ${detailsResponse.status}, ${creditsResponse.status}, ${imagesResponse.status}`
    );
  }

  const [detailsData, creditsData, imagesData] = await Promise.all([
    detailsResponse.json(),
    creditsResponse.json(),
    imagesResponse.json(),
  ]);

  return { details: detailsData, credits: creditsData, images: imagesData };
}





// Obtiene el enlace a la biografía de un actor en Wikipedia
async function fetchActorBioLink(actorName) {
  const wikipediaApiUrl = 'https://en.wikipedia.org/w/api.php';

  try {
    const response = await fetch(`${wikipediaApiUrl}?action=query&format=json&prop=info&inprop=url&titles=${encodeURIComponent(actorName)}&origin=*`);
    const data = await response.json();

    const pages = data.query.pages;
    const firstPage = Object.values(pages)[0];

    if (firstPage.missing !== undefined) {
      throw new Error(`No Wikipedia page found for ${actorName}`);
    }

    return firstPage.fullurl;
  } catch (error) {
    console.error(`Error fetching Wikipedia link for ${actorName}:`, error);
    return null;
  }
}




// Agrega el enlace a la biografía de un actor en Wikipedia a un contenedor
async function addActorBioLink(actorName, bioLinkContainer) {
  try {
    const bioLink = await fetchActorBioLink(actorName);
    if (bioLink) {
      const bioAnchor = document.createElement('a');
      bioAnchor.href = bioLink;
      bioAnchor.target = '_blank';
      bioAnchor.rel = 'noopener noreferrer';
      bioAnchor.textContent = 'Biografía en Wikipedia';
      bioAnchor.style.textDecoration = 'none';
      bioAnchor.style.color = '#007bff';

      bioLinkContainer.appendChild(bioAnchor);
    }
  } catch (error) {
    console.error(`Error adding Wikipedia link for ${actorName}:`, error);
  }
}

















async function showModal(tvShowId) {
  try {
    const { details, credits, images } = await fetchTvShowDetails(tvShowId);
    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = ''; // Limpia el contenido anterior

    // Título de la serie
    const title = document.createElement('h2');
    title.textContent = details.name;
    modalBody.appendChild(title);

    // Crear tabla para la información
    const table = document.createElement('table');
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';

    const addRow = (title, content, isLink = false) => {
      const row = document.createElement('tr');

      const titleCell = document.createElement('td');
      titleCell.style.fontWeight = 'bold';
      titleCell.textContent = title;
      row.appendChild(titleCell);

      const contentCell = document.createElement('td');

      if (isLink) {
        const link = document.createElement('a');
        link.href = content;
        link.target = '_blank'; // Abre el enlace en una nueva pestaña
        link.rel = 'noopener noreferrer'; // Mejora la seguridad y el rendimiento
        link.textContent = content;
        contentCell.appendChild(link);
      } else {
        contentCell.textContent = content;
      }

      row.appendChild(contentCell);

      table.appendChild(row);
    };

    // Sinopsis
    addRow('Sinopsis:', details.overview);

    // URL de la serie en TMDb
    addRow('Ver serie en TMDb:', `https://www.themoviedb.org/tv/${tvShowId}`, true);

    // Página oficial
    if (details.homepage) {
      addRow('Página oficial:', details.homepage, true);
    }

    // Fecha de lanzamiento
    addRow('Fecha de lanzamiento:', details.first_air_date);

    // Géneros
    addRow('Géneros:', details.genres.map((genre) => genre.name).join(', '));

    // Duración
    addRow('Duración:', `${details.episode_run_time[0]} minutos (aproximado)`);

    // Calificación
    addRow('Calificación:', `${details.vote_average} / 10`);

    // Países de producción
    addRow('Países de producción:', details.production_countries.map((country) => country.name).join(', '));

    modalBody.appendChild(table);







    // Reparto y equipo
    const castAndCrewTitle = document.createElement('h3');
    castAndCrewTitle.textContent = 'Reparto y equipo:';
    modalBody.appendChild(castAndCrewTitle);

    const castAndCrewContainer = document.createElement('div');
    castAndCrewContainer.style.display = 'flex';
    castAndCrewContainer.style.flexWrap = 'wrap';
    castAndCrewContainer.style.gap = '16px';

    for (const actor of credits.cast.slice(0, 10)) {
      const actorContainer = document.createElement('div');
      actorContainer.style.display = 'flex';
      actorContainer.style.flexDirection = 'column';
      actorContainer.style.alignItems = 'center';
      actorContainer.style.width = '150px';

      // Agregar la imagen del actor
      if (actor.profile_path) {
        const actorImage = document.createElement('img');
        actorImage.src = `https://image.tmdb.org/t/p/w500${actor.profile_path}`;
        actorImage.alt = `${actor.name} - ${actor.character}`;
        actorImage.style.width = '100px';
        actorImage.style.height = 'auto';
        actorImage.style.marginBottom = '8px';
        actorContainer.appendChild(actorImage);
      }

      const actorName = document.createElement('p');
      actorName.textContent = actor.name;
      actorName.style.margin = '0';
      actorName.style.fontWeight = 'bold';

      const actorCharacter = document.createElement('p');
      actorCharacter.textContent = `(${actor.character})`;
      actorCharacter.style.margin = '0';

      actorContainer.appendChild(actorName);
      actorContainer.appendChild(actorCharacter);

      // Agregar contenedor para el enlace a la biografía del actor en Wikipedia
      const bioLinkContainer = document.createElement('div');
      actorContainer.appendChild(bioLinkContainer);

      castAndCrewContainer.appendChild(actorContainer);

      // Carga diferida del enlace a la biografía del actor en Wikipedia
      addActorBioLink(actor.name, bioLinkContainer);
    }

    modalBody.appendChild(castAndCrewContainer);

    const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

    const behindTheScenesTitle = document.createElement('h3');
    behindTheScenesTitle.textContent = 'Imágenes promocionales:';
    modalBody.appendChild(behindTheScenesTitle);

    const behindTheScenesContainer = document.createElement('div');
    behindTheScenesContainer.style.display = 'flex';
    behindTheScenesContainer.style.flexWrap = 'wrap';
    behindTheScenesContainer.style.gap = '16px';

    const behindTheScenesImages = images.backdrops.slice(0, 10);
    for (const image of behindTheScenesImages) {
      const imageElement = document.createElement('img');
      imageElement.src = `${IMAGE_BASE_URL}${image.file_path}`;
      imageElement.alt = 'Imagen detrás de cámaras';
      imageElement.style.width = '200px';
      imageElement.style.height = 'auto';
      imageElement.style.marginBottom = '8px';
      behindTheScenesContainer.appendChild(imageElement);
    }

    modalBody.appendChild(behindTheScenesContainer);

    // Muestra la ventana modal
    const modal = document.getElementById('modal');
    modal.style.display = 'block';

    const modalClose = document.getElementById('modalClose');
    modalClose.onclick = () => {
      modal.style.display = 'none';
    };

    window.onclick = (event) => {
      if (event.target == modal) {
        modal.style.display = 'none';
      }
    };
  } catch (error) {
    console.error('Error fetching TV show details:', error);
  }
}

































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











async function fetchUpcomingMovies() {



  const url = `https://api.themoviedb.org/3/movie/upcoming?api_key=${API_KEY}&page=${PAGE_NUMBER}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    displayUpcomingMovies(data.results);
  } catch (error) {
    console.error('Error fetching upcoming movies:', error);
  }
}






async function displayMovieDetails(movieId) {
  console.log('Detalles de la película:', movieId);
  const url = `https://api.themoviedb.org/3/movie/${movieId}?api_key=${API_KEY}&language=es-ES&append_to_response=external_ids,credits,keywords`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    






  } catch (error) {
    console.error('Error al buscar información adicional de la película:', error);
    alert('No se encontró información adicional para esta película.');
  }
}








async function displayMovieTrailer(movieId, videoContainer) {
  console.log('Tráiler de la película:', movieId);
  const trailerKey = await fetchMovieTrailer(movieId);

  if (trailerKey) {
    const trailerUrl = `https://www.youtube.com/embed/${trailerKey}`;
    videoContainer.innerHTML = `<iframe width="100%" height="315" src="${trailerUrl}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
  } else {
    alert('No se encontró tráiler para esta película.');
  }
}

async function fetchMovieTrailer(movieId) {
  const url = `https://api.themoviedb.org/3/movie/${movieId}/videos?api_key=${API_KEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    const spanishTrailers = data.results.filter(
      video => video.type === 'Trailer'&& video.site === 'YouTube' && video.iso_639_1 === 'es'
    );
    const anyTrailers = data.results.filter(
      video => video.type === 'Trailer' && video.site === 'YouTube'
    );

    if (spanishTrailers.length > 0) {
      return spanishTrailers[0].key;
    } else if (anyTrailers.length > 0) {
      return anyTrailers[0].key;
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error al buscar tráiler de la película:', error);
    return null;
  }
}





async function fetchMovieKeywords(movieId) {
  const url = `https://api.themoviedb.org/3/movie/${movieId}/keywords?api_key=${API_KEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    return data.keywords.map(keyword => keyword.id);
  } catch (error) {
    console.error('Error al buscar palabras clave de la película:', error);
    return [];
  }
}




async function searchWordPressPosts(query) {
  const url = `https://b.dcardkevein.xyz/wp-json/wp/v2/posts?search=${encodeURIComponent(query)}&_fields=id,title,link`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();

    // Filtra los resultados de la búsqueda utilizando la función matchKeywords
    const filteredData = data.filter((post) => matchKeywords(query, post.title.rendered));
    


    return filteredData;
  } catch (error) {
    console.error("Error al buscar publicaciones en WordPress:", error);
    return [];
  }
}





async function fetchMovieRecommendations(movieId) {
  console.log('Recomendaciones de películas:', movieId);
  const url = `https://api.themoviedb.org/3/movie/${movieId}/recommendations?api_key=${API_KEY}&language=es-ES`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    const recommendations = data.results.slice(0, 10);

    if (recommendations.length > 0) {
      // Limpia el contenedor de películas antes de agregar las recomendaciones
      moviesContainer.innerHTML = '';

      // Mostrar las recomendaciones en lugar de las próximas películas
      displayUpcomingMovies(recommendations);
    } else {
      alert('No se encontraron recomendaciones para esta película.');
    }
  } catch (error) {
    console.error('Error al buscar recomendaciones de películas:', error);
  }
}












  async function fetchMovieStreamingServices(movieId) {
    const response = await fetch(`https://api.themoviedb.org/3/movie/${movieId}/watch/providers?api_key=${API_KEY}`);
    const data = await response.json();

    return data.results.US;
  }










async function displayUpcomingMovies(movies) {

  const movieCards = await Promise.all(movies.map(async (movie) => {
    const movieCard = document.createElement('div');
    movieCard.className = 'movie-card';

    const moviePoster = document.createElement('img');
    moviePoster.src = `https://image.tmdb.org/t/p/w342${movie.poster_path}`;
    moviePoster.alt = `${movie.title} poster`;
    movieCard.appendChild(moviePoster);

    const movieInfo = document.createElement('div');
    movieInfo.className = 'movie-info';

    const movieStreamingServices = await fetchMovieStreamingServices(movie.id);
    if (movieStreamingServices) {
      const streamingServices = movieStreamingServices.flatrate
        ? movieStreamingServices.flatrate.map((service) => service.provider_name).join(", ")
        : "No disponible en servicios de streaming";
      const movieStreamingServicesInfo = document.createElement("p");
      movieStreamingServicesInfo.innerText = `Servicios de streaming: ${streamingServices}`;
      movieCard.appendChild(movieStreamingServicesInfo);
    }

    const releaseYear = movie.release_date.slice(0, 4);
    const movieTitle = document.createElement('h3');
    movieTitle.textContent = `${movie.title} (${releaseYear})`;
    movieInfo.appendChild(movieTitle);

    const movieReleaseDate = document.createElement('p');
    movieReleaseDate.textContent = `Fecha de lanzamiento: ${movie.release_date}`;
    movieInfo.appendChild(movieReleaseDate);

    movieCard.appendChild(movieInfo);

    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'buttons-container';









// En la función displayUpcomingMovies:
const trailerButton = document.createElement('button');
trailerButton.textContent = 'Tráiler';
const videoContainer = document.createElement('div');

videoContainer.className = 'video-container';


trailerButton.onclick = () => {
  if (trailerButton.textContent === 'Tráiler') {
    displayMovieTrailer(movie.id, videoContainer).then(() => {

      trailerButton.textContent = 'Cerrar tráiler';




    });
  } else {
    closeMovieTrailer(videoContainer);
    trailerButton.textContent = 'Tráiler';
  }
};

buttonsContainer.appendChild(trailerButton);





    const recommendationsButton = document.createElement('button');
    recommendationsButton.textContent = 'Recomendaciones';
    recommendationsButton.onclick = () => fetchMovieRecommendations(movie.id);
    buttonsContainer.appendChild(recommendationsButton);




// Añade un botón para buscar actores y equipo de producción
const castAndCrewButton = document.createElement('button');
castAndCrewButton.textContent = 'Detalles, reparto y equipo';
castAndCrewButton.onclick = () => fetchMovieCastAndCrew(movie.id);
buttonsContainer.appendChild(castAndCrewButton);



    await (async () => {
      try {
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
      } catch (error) {
        console.error("Error al buscar publicaciones relacionadas en WordPress:", error);
      }














    })();

    movieCard.appendChild(buttonsContainer);
    movieCard.appendChild(videoContainer);
    moviesContainer.appendChild(movieCard);

    return movieCard;
  }));
}




async function fetchTopRatedMovies(pageNumber = 1) {
  const totalPagesToFetch = 2; // Número de páginas que deseas obtener

  const fetchPage = async (pageNumber) => {
    const url = `https://api.themoviedb.org/3/movie/top_rated?api_key=${API_KEY}&language=es-ES&page=${pageNumber}`;

    try {
      const response = await fetch(url);
      const data = await response.json();
      return data.results;
    } catch (error) {
      console.error('Error al buscar películas mejor calificadas:', error);
      return [];
    }
  };

  // Limpia el contenedor de películas antes de agregar las películas mejor calificadas
  moviesContainer.innerHTML = '';

  for (let i = 0; i < totalPagesToFetch; i++) {
    const topRatedMovies = await fetchPage(pageNumber + i);

    // Mostrar las películas mejor calificadas usando la función displayUpcomingMovies
    displayUpcomingMovies(topRatedMovies);
  }
}


async function fetchUpcomingMovies() {
  // Define cuántas páginas de resultados deseas obtener
  const totalPagesToFetch = 2;

  try {
    // Realiza solicitudes para cada número de página y almacena las promesas en un array
    const fetchPromises = [];
    for (let i = 1; i <= totalPagesToFetch; i++) {
      const url = `https://api.themoviedb.org/3/movie/upcoming?api_key=${API_KEY}&language=es-ES&page=${i}`;
      fetchPromises.push(fetch(url));
    }

    // Espera a que todas las solicitudes se completen y extrae los datos JSON
    const responses = await Promise.all(fetchPromises);
    const jsonData = await Promise.all(responses.map(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    }));

    // Combina todos los resultados de las películas en un solo array
    const allResults = jsonData.flatMap(data => data.results);

    // Muestra todos los resultados en las tarjetas de películas
    displayUpcomingMovies(allResults);
  } catch (error) {
    console.error('Error fetching upcoming movies:', error);
  }
}



async function fetchUpcomingMoviesPage(pageNumber = 1) {
  const totalPagesToFetch = 2; // Número de páginas que deseas obtener

  const fetchPage = async (pageNumber) => {
    const url = `https://api.themoviedb.org/3/movie/upcoming?api_key=${API_KEY}&language=es-ES&page=${pageNumber}`;

    try {
      const response = await fetch(url);
      const data = await response.json();
      return data.results;
    } catch (error) {
      console.error('Error al buscar próximas películas:', error);
      return [];
    }
  };

  // Limpia el contenedor de películas antes de agregar las próximas películas
  moviesContainer.innerHTML = '';

  for (let i = 0; i < totalPagesToFetch; i++) {
    const upcomingMovies = await fetchPage(pageNumber + i);

    // Mostrar las próximas películas usando la función displayUpcomingMovies
    displayUpcomingMovies(upcomingMovies);
  }
}





const homeButton = document.getElementById('homeButton');
const topRatedButton = document.getElementById('topRatedButton');
const upcomingMoviesButton = document.getElementById('upcomingMoviesButton');


homeButton.addEventListener('click', () => {
moviesContainer.innerHTML = '';
  // Llama a la función que muestra las próximas películas u otras películas iniciales
  fetchUpcomingMovies();
});



topRatedButton.addEventListener('click', () => {
moviesContainer.innerHTML = 'cargando';

  // Llama a la función que muestra las películas mejor calificadas
  fetchTopRatedMovies();
});




upcomingMoviesButton.addEventListener('click', () => {
moviesContainer.innerHTML = 'Cargando';

  // Llama a la función que muestra las próximas películas a estrenarse en cines
  fetchUpcomingMoviesPage(); // Pasa el número de página como argumento (1 en este ejemplo)
});





fetchUpcomingMovies();



