import { GenerateIdType } from "../@types";
import uniqid from "uniqid";

export default class Util {
    generateId(type: GenerateIdType, user: string) {
        switch (type) {
            case "post":
                return uniqid(`post-`, `-${user}`);
            case "comment":
                return uniqid(`comment-`, `-${user}`);
            case "reply":
                return uniqid(`reply-`, `-${user}`);
            case "userReport":
                return uniqid(`user-report-`, `-${user}`);
            case "postReport":
                return uniqid(`post-report-`, `-${user}`);
            case "commentReport":
                return uniqid(`comment-report-`, `-${user}`);
            case "replyReport":
                return uniqid(`reply-report-`, `-${user}`);
            case "notification":
                return uniqid(`notification-`, `-${user}`);
        }
    }
}