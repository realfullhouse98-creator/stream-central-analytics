export default async function handler(request, response) {
  return response.status(200).json({
    message: "🎉 Vercel Functions are WORKING!",
    timestamp: new Date().toISOString(),
    platform: "Vercel Serverless"
  });
}
