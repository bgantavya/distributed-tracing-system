import { UserProps } from "./types.js";

export const Paths = {
    test: () => '/test',
    delay: () => '/delay/:t',
    status: () => '/status/:code',
    user: {
        base: () => '/user/:id',
        edit: () => '/user/:id/edit',
    },
    logs: {
        base: () => '/logs',
        filtered: () => '/logs/:code',
    },
};

export enum Roles {
	Member = "member",
	Admin = "admin",
}
    
export const users: UserProps[] = [
    { id: 0, name: "tj", email: "tj@vision-media.ca", role: Roles.Member },
    { id: 1, name: "ciaran", email: "ciaranj@gmail.com", role: Roles.Member },
    { id: 2, name: "aaron", email: "aaron.heckmann+github@gmail.com", role: Roles.Admin },
];