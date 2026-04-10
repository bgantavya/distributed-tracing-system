export function errorHandler(err, req, res, next) {
  const traceContext = req.traceContext;

  const statusCode = err.statusCode || 500;
  const errorResponse = {
    error: {
      message: err.message,
      code: err.code,
      traceId: traceContext?.traceId,
      spanId: traceContext?.spanId
    }
  };

  if (process.env.NODE_ENV === 'development') {
    errorResponse.error.stack = err.stack;
  }

  res.status(statusCode).json(errorResponse);
}
