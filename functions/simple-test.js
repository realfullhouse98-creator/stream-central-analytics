exports.handler = async (event, context) => {
  return {
    statusCode: 200,
    body: JSON.stringify({ 
      message: "🎉 Netlify Functions are WORKING!",
      timestamp: new Date().toISOString()
    })
  };
};
