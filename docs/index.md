# Express API Tracing

### API Endpoints

You can use `curl` or any API client to test the endpoints.

- **Redirect**:
    ```bash
    curl http://localhost:3000/
    ```
    (Redirects to `/user/0`)

- **Get User Details**: [Type: GET]
    ```bash
    curl http://localhost:3000/user/0
    ```

- **Edit User Details (Self-Authorized)**: [Type: POST]
    ```bash
    curl -d '' http://localhost:3000/user/0/edit
    # Example: curl http://localhost:3000/user/1/edit (This would be unauthorized if not user 1)
    ```

- **Delete User (Admin-Authorized)**: [Type: DELETE]
    ```bash
    curl -X DELETE http://localhost:3000/user/0
    ```

- **Simulate Delay**: [Type: ALL]
    ```bash
    curl http://localhost:3000/delay/:time
    ```

- **Simulate Response**: [Type: ALL]
    ```bash
    curl http://localhost:3000/status/:code
    ```

- **Get Logs/Stats**: [Type: GET]
    ```bash
    curl http://localhost:3000/logs
    ```

- **Get Filtered Logs/Stats**: [Type: GET]
    ```bash
    curl http://localhost:3000/logs/:code
    ```
