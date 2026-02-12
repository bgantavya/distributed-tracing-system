export const Paths = {
    user: {
        base: () => '/user/:id',
        edit: () => '/user/:id/edit',
    },
    status: {
        base: () => '/status',
        code: () => '/status/:code',
    },
    logs: {
        base: () => '/logs',
        filtered: () => '/logs/:code',
    },
};
