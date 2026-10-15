import app from './index.js';

export default function handler(request: any, response: any) {
  const requestUrl = request.url ?? '/';
  if (requestUrl !== '/api' && !requestUrl.startsWith('/api/')) {
    request.url = `/api${requestUrl.startsWith('/') ? requestUrl : `/${requestUrl}`}`;
  }
  return app(request, response);
}