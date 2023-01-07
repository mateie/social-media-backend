import jwt from "jsonwebtoken";
import Cryptr from "cryptr";
import { GraphQLError } from "graphql";
import { Request } from "express";

const { SECRET, JWT_SECRET } = process.env;
export default class Auth {
    readonly crypt: Cryptr;
    private readonly jwt: typeof jwt;
    private readonly secret: string;

    constructor() {
        this.jwt = jwt;
        this.secret = JWT_SECRET ?? "";
        this.crypt = new Cryptr(SECRET ?? "");
    }

    checkToken(req: Request) {
        const header = req.headers.authorization;
        if (!header) throw new Error("You must be logged in");
        const token = header.split("Bearer ")[1];
        if (!token) throw new Error("Invalid token");
        try {
            const jwtData = jwt.verify(token, this.secret);
            return this.authUser(jwtData);
        } catch (err) {
            console.error(err);
            throw new GraphQLError("Session timed out, please refresh the page and login again");
        }
    }

    async generateToken(userData: any) {
        try {
            return this.jwt.sign(userData, this.secret);
        } catch (err) {
            console.error(err);
            throw new GraphQLError("Failed to generate token");
        }
    }

    authUser(auth: any): any {
        if (!auth) throw new GraphQLError("Authentication data not provided");

        try {
            return this.jwt.verify(auth, this.secret);
        } catch (err) {
            console.error(err);
            throw new GraphQLError("Authentication failed, please try again");
        }
    }
}