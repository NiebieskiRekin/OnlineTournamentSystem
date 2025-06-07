import apiClient from '@webdev-project/api-client';

export default apiClient('http://localhost:3000', {
    fetch: ((input, init) => {
        return fetch(input, { 
          ...init, 
          credentials: "include" // Required for sending cookies cross-origin
        });
      }) satisfies typeof fetch,
});
