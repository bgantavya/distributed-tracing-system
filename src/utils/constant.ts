import { UserProps } from "./types.js";

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

export enum Roles {
	Member = "member",
	Admin = "admin",
}

export enum DeployT {
    Prod = "production",
    Dev = "development",
}
    
export const users: UserProps[] = [
    { id: 0, name: "tj", email: "tj@vision-media.ca", role: Roles.Member },
    { id: 1, name: "ciaran", email: "ciaranj@gmail.com", role: Roles.Member },
    { id: 2, name: "aaron", email: "aaron.heckmann+github@gmail.com", role: Roles.Admin },
];