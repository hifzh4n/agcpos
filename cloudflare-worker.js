const worker = {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request);
    if (response.status !== 404) {
      return response;
    }

    const url = new URL(request.url);
    if (url.pathname.includes(".")) {
      return response;
    }

    const pagePath = url.pathname.endsWith("/")
      ? `${url.pathname}index.html`
      : `${url.pathname}/index.html`;
    const pageUrl = new URL(pagePath, url.origin);

    return env.ASSETS.fetch(new Request(pageUrl, request));
  },
};

export default worker;
