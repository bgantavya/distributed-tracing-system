'use strict'
import express from "express";
import dotenv from "dotenv";
import type { NextFunction, Request, Response } from "express";
import { loadDo, loadStats, loadUser } from "./src/loaders";
import { andRestrictTo, andRestrictToSelf, authenticate } from "./src/restrict";
import { traceRequest } from "./src/Tracer/tracer";
import { deleteUser, editUser, notFound, showDelay, showLogs, showStatus, showUser } from "./src/views";
import { RoleTypes } from "./src/utils/constant";
import { Paths, ServeTypes } from "./src/utils/constant";
import { AppError } from "./src/utils/errors";

dotenv.config();

export const app = express();
// Example requests:
//     curl http://localhost:3000/user/0
//     curl http://localhost:3000/user/0/edit
//     curl http://localhost:3000/user/1
//     curl http://localhost:3000/user/1/edit (unauthorized since this is not you)
//     curl -X DELETE http://localhost:3000/user/0 (unauthorized since you are not an admin)



// Interceptor middleware
app.use(express.json({ limit: "1mb" }));
app.use(traceRequest);
app.use(authenticate);

app.get('/', (req, res) => res.redirect('/user/0'));

app.get(Paths.user.base(), loadUser, showUser);
app.get(Paths.user.edit(), loadUser, andRestrictToSelf, editUser);
app.delete(Paths.user.base(), loadUser, andRestrictTo(RoleTypes.Admin), deleteUser);

app.get(Paths.delay(), loadDo, showDelay);
app.get(Paths.status(), showStatus);

app.get(Paths.logs.base(), loadStats, showLogs);
app.get(Paths.logs.filtered(), loadStats, showLogs);
app.use(notFound);


app.use(function(err: Error, req: Request, res: Response, next: NextFunction) {
  const appError = err instanceof AppError ? err : new AppError(err.message || "Server error");
  res.status(appError.statusCode).json({
    error: {
      message: appError.message,
      code: appError.code,
      traceId: req.traceId ?? undefined,
    },
  });
});

const port = Number(process.env.PORT) || 1234;
if (process.env.NODE_ENV !== "test") {
  app.listen(port, () => console.log('Server running at: ' + port));
}