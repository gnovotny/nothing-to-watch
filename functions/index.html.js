export async function onRequest({ request, next }) {
  // Get the original response
  const response = await next()

  // Create a new response with the same body but allow header modification
  const newResponse = new Response(response.body, response)

  // Get the User-Agent header
  const userAgent = request.headers.get('User-Agent') || ''

  // Set headers based on User-Agent
  if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
    newResponse.headers.set('Cross-Origin-Embedder-Policy', 'require-corp')
  }

  return newResponse
}
