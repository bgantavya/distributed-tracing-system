import express, { json } from 'express';
import { config } from 'dotenv';
import { loadDo, loadUser } from './src/loaders.js'
import { andRestrictTo, andRestrictToSelf, authenticate } from './src/restrict.js';
import { traceRequest } from './src/Tracer/tracer.js';
import { deleteUser, editUser, notFound, showDelay, showLogs, showStatus, showTest, showUser } from './src/views.js';
import { Roles, Paths } from './src/utils/constant.js';

config();

export const app = express();
// Example requests:
//     curl http://localhost:3000/user/0
//     curl http://localhost:3000/user/0/edit
//     curl http://localhost:3000/user/1
//     curl http://localhost:3000/user/1/edit (unauthorized since this is not you)
//     curl -X DELETE http://localhost:3000/user/0 (unauthorized since you are not an admin)

// Interceptor middleware
app.use(json({ limit: '1mb' }));
app.use(traceRequest);
app.use(authenticate);

app.get('/', (req, res) => res.redirect('/user/0'));

app.get(Paths.user.base(), loadUser, showUser);
app.post(Paths.user.edit(), loadUser, andRestrictToSelf, editUser);
app.delete(Paths.user.base(), loadUser, andRestrictTo(Roles.Admin), deleteUser);

app.all(Paths.test(), showTest)
app.all(Paths.delay(), loadDo, showDelay);
app.all(Paths.status(), showStatus);

app.get(Paths.logs.base(), showLogs);
app.get(Paths.logs.filtered(), showLogs);

app.use(notFound);

const port = Number(process.env.PORT) || 1234;
app.listen(port, (err) => {
  if (err) {
    console.log("but bhai, I tried!");
    return;
  }
  console.log('Server running at: ' + port);
});