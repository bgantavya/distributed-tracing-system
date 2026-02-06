'use strict'
import express from "express";
import { loadDo, loadStats, loadUser } from "./src/loaders";
import { andRestrictTo, andRestrictToSelf, authenticate } from "./src/restrict";
import { traceRequest } from "./src/tracer";
import { deleteUser, editUser, notFound, showDelay, showLogs, showStatus, showUser } from "./src/views";
import { RoleTypes } from "./utils/enums";
import { Paths } from "./utils/constant";
import { AppError } from "./utils/errors";
import { loadEnvFile } from "process";

export const app = express();
loadEnvFile()
// Example requests:
//     curl http://localhost:3000/user/0
//     curl http://localhost:3000/user/0/edit
//     curl http://localhost:3000/user/1
//     curl http://localhost:3000/user/1/edit (unauthorized since this is not you)
//     curl -X DELETE http://localhost:3000/user/0 (unauthorized since you are not an admin)



// Interceptor middleware
// app.use(express.json({ limit: config.bodyLimit }));
// app.use(securityHeaders);
// app.use(rateLimiter);
app.use(traceRequest);
// app.use(requestLogger);
app.use(authenticate);

app.get('/', function(req, res){
  res.redirect('/user/0');
});

app.get(Paths.user.base(), loadUser, showUser);
app.get(Paths.user.edit(), loadUser, andRestrictToSelf, editUser);
app.delete(Paths.user.base(), loadUser, andRestrictTo(RoleTypes.Admin), deleteUser);

app.get('/delay/:t', loadDo, showDelay);
app.get(Paths.status.code(), showStatus);
app.get(Paths.status.base(), function(req, res){
  res.redirect('/status/200');
});

app.get(Paths.logs.base(), loadStats, showLogs);
app.get(Paths.logs.filtered(), loadStats, showLogs);
app.use(notFound);

app.use(({err, req, res, next}: any) => {
  const appError = err instanceof AppError ? err : new AppError(err.message || "Server error");
  res.status(appError.statusCode).json({
    error: {
      message: appError.message,
      code: appError.code,
      traceId: req.traceId ?? undefined,
    },
  });
});

if (process.env.NODE_ENV !== "test") {
  app.listen(process.env.PORT, () => console.log('Server running at: ' + process.env.PORT));
}