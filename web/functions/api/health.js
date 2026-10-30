// Pages Function: GET /api/health - the house "prove the Functions wire works" canary.
export async function onRequestGet(context) {
  return Response.json({
    ok: true,
    name: context.env.SITE_NAME || 'govstruct',
    service: 'landing',
    ts: new Date().toISOString(),
  })
}
