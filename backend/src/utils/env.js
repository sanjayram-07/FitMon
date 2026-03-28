function parseOrigins(origins) {
  if (!origins) {
    return ['http://localhost:5173', 'http://localhost:3000'];
  }

  return origins
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

module.exports = {
  clientOrigins: parseOrigins(process.env.CLIENT_ORIGINS),
  port: Number(process.env.PORT || 3001),
};
