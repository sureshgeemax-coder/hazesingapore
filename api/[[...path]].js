// Vercel loads this function through CommonJS, so use a dynamic import for the ESM app.
module.exports = async (req, res) => {
  const { app } = await import('../server/src/app.js');
  return app(req, res);
};
