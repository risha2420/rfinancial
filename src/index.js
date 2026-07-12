export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) {
      const backendUrl = 'https://r-financial-services-api.onrender.com' + url.pathname + url.search;
      return fetch(backendUrl, {
        method: request.method,
        headers: request.headers,
        body: request.body,
      });
    }
    return env.ASSETS.fetch(request);
  }
}



