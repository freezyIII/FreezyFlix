// Supabase Configuration
const SUPABASE_URL = 'https://ybuzmohtxmfchjlzisfz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlidXptb2h0eG1mY2hqbHppc2Z6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4MDgxNzYsImV4cCI6MjA5NTM4NDE3Nn0.c_ul0aFQJaPhSa1QfebDhHmH9m8AYWoCCTKAHpslt7o';

// Initialize movies array (will be populated from Supabase)
window.movies = [];
window.moviesLoaded = false;
window.moviesLoadPromise = null;

// Function to fetch movies from Supabase
async function fetchMoviesFromSupabase() {
  try {
    console.log('Attempting to fetch movies from Supabase...');
    const response = await fetch(`${SUPABASE_URL}/rest/v1/movies`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Supabase response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Supabase error response:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const allData = await response.json();
    console.log('Supabase response data:', allData);
    window.movies = allData;
    window.moviesLoaded = true;

    // Debug: show types of items
    const typeCounts = {};
    allData.forEach(item => {
      const type = item.type || 'undefined';
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });
    console.log('Type distribution:', typeCounts);
    console.log(`✅ Loaded ${allData.length} items from Supabase`);

    return allData;
  } catch (error) {
    console.error('❌ Error fetching movies from Supabase:', error);
    console.error('Error details:', error.message);
    // Fallback to empty array if fetch fails
    window.movies = [];
    window.moviesLoaded = true;
    console.warn('⚠️ Using empty array as fallback');
    return [];
  }
}

// Initialize movies loading
window.moviesLoadPromise = fetchMoviesFromSupabase();

// Expose a function to wait for movies to be loaded
window.waitForMovies = async function() {
  if (window.moviesLoaded) {
    return window.movies;
  }
  return await window.moviesLoadPromise;
};
