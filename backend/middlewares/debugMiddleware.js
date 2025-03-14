export const debugMiddleware = (req, res, next) => {
  console.log('\n--- Debug Info ---');
  console.log('Request URL:', req.url);
  console.log('Request Method:', req.method);
  console.log('Authorization Header:', req.headers.authorization);
  console.log('User from request:', req.user);
  console.log('----------------\n');
  next();
}; 