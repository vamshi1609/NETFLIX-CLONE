const API_KEY = "f5cc10f2da1447d94a8812f0099cb542";
const BASE_URL = "https://api.themoviedb.org/3";
const IMG_BASE_URL = "https://image.tmdb.org/t/p/original";

const originalsContainer = document.getElementById("originals");
const trendingContainer = document.getElementById("trending");
const topRatedContainer = document.getElementById("top-rated");
const animeContainer = document.getElementById("anime");

const bannerTitle = document.getElementById("banner-title");
const bannerDescription = document.getElementById("banner-description");
const bannerSection = document.getElementById("banner");

const trailerModal = document.getElementById("trailerModal");
const trailerFrame = document.getElementById("trailerFrame");
const trailerClose = document.querySelector(".close");

const searchInput = document.getElementById("searchInput");

const addToListBtn = document.getElementById("addToList");

let allMovies = []; // to store all loaded movies for search filtering
let bannerMovie = null;

// Helper to fetch movies from API
async function fetchMovies(url) {
  try {
    const res = await fetch(url);
    const data = await res.json();
    return data.results || [];
  } catch (e) {
    console.error("Failed fetching movies:", e);
    return [];
  }
}

// Shuffle array utility
function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Display movies in a container with Add to My List button
function displayMovies(movies, container) {
  container.innerHTML = "";
  movies.forEach((movie) => {
    const div = document.createElement("div");
    div.classList.add("movie-card");
    div.style.position = "relative";

    const img = document.createElement("img");
    img.classList.add("row-poster");
    img.src = movie.poster_path
      ? IMG_BASE_URL + movie.poster_path
      : "https://via.placeholder.com/150x225?text=No+Image";
    img.alt = movie.title || movie.name;
    img.title = movie.title || movie.name;

    // On click show trailer
    img.addEventListener("click", () => showTrailer(movie));

    // Add to list button
    const addBtn = document.createElement("button");
    addBtn.textContent = "+";
    addBtn.title = "Add to My List";
    addBtn.classList.add("add-to-list-btn");
    addBtn.style.position = "absolute";
    addBtn.style.top = "5px";
    addBtn.style.right = "5px";
    addBtn.style.padding = "4px 7px";
    addBtn.style.background = "rgba(0,0,0,0.6)";
    addBtn.style.border = "none";
    addBtn.style.color = "white";
    addBtn.style.fontWeight = "700";
    addBtn.style.borderRadius = "50%";
    addBtn.style.cursor = "pointer";

    addBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      addToMyList(movie);
    });

    div.appendChild(img);
    div.appendChild(addBtn);
    container.appendChild(div);
  });
}

// Set banner info
function setBanner(movie) {
  bannerMovie = movie;
  bannerTitle.textContent = movie.title || movie.name;
  bannerDescription.textContent = movie.overview || "No description available.";
  bannerSection.style.backgroundImage = movie.backdrop_path
    ? `url(${IMG_BASE_URL + movie.backdrop_path})`
    : "none";
}

// Show trailer modal
async function showTrailer(movie) {
  trailerFrame.src = ""; // reset
  trailerModal.style.display = "block";

  try {
    const url = `${BASE_URL}/movie/${movie.id}/videos?api_key=${API_KEY}&language=en-US`;
    const res = await fetch(url);
    const data = await res.json();

    // Find trailer from videos
    const trailer = data.results.find(
      (vid) => vid.type === "Trailer" && vid.site === "YouTube"
    );

    if (trailer) {
      trailerFrame.src = `https://www.youtube.com/embed/${trailer.key}?autoplay=1`;
    } else {
      trailerFrame.src = "";
      alert("Trailer not found.");
      trailerModal.style.display = "none";
    }
  } catch {
    alert("Error loading trailer.");
    trailerModal.style.display = "none";
  }
}

// Close trailer modal
trailerClose.addEventListener("click", () => {
  trailerFrame.src = "";
  trailerModal.style.display = "none";
});

// Close modal if clicked outside iframe
window.addEventListener("click", (e) => {
  if (e.target === trailerModal) {
    trailerFrame.src = "";
    trailerModal.style.display = "none";
  }
});

// Add to My List in localStorage
function addToMyList(movie) {
  let myList = JSON.parse(localStorage.getItem("myList")) || [];
  if (myList.find((m) => m.id === movie.id)) {
    alert("Movie already in your list!");
    return;
  }
  myList.push(movie);
  localStorage.setItem("myList", JSON.stringify(myList));
  alert(`Added "${movie.title || movie.name}" to your list.`);
}

// Load Netflix Originals + banner
async function loadNetflixOriginals() {
  const url = `${BASE_URL}/discover/tv?api_key=${API_KEY}&with_networks=213`;
  const movies = await fetchMovies(url);
  if (movies.length) {
    const shuffled = shuffleArray(movies);
    setBanner(shuffled[0]);
    displayMovies(shuffled, originalsContainer);
    allMovies = allMovies.concat(shuffled);
  }
}

// Load Trending
async function loadTrending() {
  const url = `${BASE_URL}/trending/all/week?api_key=${API_KEY}`;
  const movies = await fetchMovies(url);
  displayMovies(shuffleArray(movies), trendingContainer);
  allMovies = allMovies.concat(movies);
}

// Load Top Rated
async function loadTopRated() {
  const url = `${BASE_URL}/movie/top_rated?api_key=${API_KEY}`;
  const movies = await fetchMovies(url);
  displayMovies(shuffleArray(movies), topRatedContainer);
  allMovies = allMovies.concat(movies);
}

// Load Anime
async function loadAnime() {
  const url = `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=16`;
  const movies = await fetchMovies(url);
  displayMovies(shuffleArray(movies), animeContainer);
  allMovies = allMovies.concat(movies);
}

// Search functionality
searchInput.addEventListener("input", () => {
  const query = searchInput.value.trim().toLowerCase();
  if (!query) {
    // reload all rows if no search
    loadNetflixOriginals();
    loadTrending();
    loadTopRated();
    loadAnime();
    return;
  }
  // Filter allMovies
  const filtered = allMovies.filter((movie) => {
    const title = (movie.title || movie.name || "").toLowerCase();
    return title.includes(query);
  });
  // Clear rows and show filtered in one container (you can style differently)
  originalsContainer.innerHTML = "";
  trendingContainer.innerHTML = "";
  topRatedContainer.innerHTML = "";
  animeContainer.innerHTML = "";
  if (filtered.length === 0) {
    originalsContainer.innerHTML = "<p>No results found.</p>";
    return;
  }
  displayMovies(filtered, originalsContainer);
  setBanner(filtered[0]);
});

// Add to list button on banner
addToListBtn.addEventListener("click", () => {
  if (bannerMovie) addToMyList(bannerMovie);
});

// Logout button in dropdown
const logoutBtn = document.getElementById("logout");
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("loggedIn");
    alert("Logged out successfully!");
    window.location.href = "login.html";
  });
}

// Initial load
(async function () {
  allMovies = [];
  await Promise.all([
    loadNetflixOriginals(),
    loadTrending(),
    loadTopRated(),
    loadAnime(),
  ]);
})();
