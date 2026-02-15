import { RoleTypes } from "./constant";
import type { UserProps } from "./types";

export const users: UserProps[] = [
    { id: 0, name: "tj", email: "tj@vision-media.ca", role: RoleTypes.Member },
    { id: 1, name: "ciaran", email: "ciaranj@gmail.com", role: RoleTypes.Member },
    { id: 2, name: "aaron", email: "aaron.heckmann+github@gmail.com", role: RoleTypes.Admin },
];