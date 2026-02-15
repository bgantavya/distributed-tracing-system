export const Paths = {
    user: {
        base: () => '/user/:id',
        edit: () => '/user/:id/edit',
    },
    status: () => '/status/:code',
    delay: () => '/delay/:t',
    logs: {
        base: () => '/logs',
        filtered: () => '/logs/:code',
    },
};

export enum RoleTypes {
	Member = "member",
	Admin = "admin",
}

export enum ServeTypes {
    Prod = "production",
    Dev = "development",
}