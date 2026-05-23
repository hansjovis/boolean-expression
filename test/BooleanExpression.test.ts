import { describe, it } from "node:test";

import expect from "expect";

import { BooleanExpression } from "../dist/BooleanExpression.js";

describe("Boolean Expression", () => {
    it("can be parsed from a string", () => {
        const str = "(title = 'Post title' and age <= 20) or author.name = 'hansjovis'";
        const expression = BooleanExpression.parse(str);
        const item = {
            title: "Post title",
            age: 40,
            author: {
                name: "hansjovis"
            }
        };
        console.log("Parsed expression:", expression);
        expect(expression.evaluate(item)).toBe(true);
        console.log("Expression as string:", expression.toString());
        expect(expression.toString()).toEqual("((title = 'Post title' and age <= 20) or author.name = 'hansjovis')");
    });

    it("throws an error when a string cannot be parsed", () => {
        const str = "(title = 'Post title') or and (author = 'hansjovis')";
        expect(() => BooleanExpression.parse(str)).toThrow(
            "Left side of and-expression (? and author = 'hansjovis') is empty"
        );

        expect(() => BooleanExpression.parse("title =")).toThrow(
            "Could not parse property expression (title = undefined): Error: Expected Value token, but got undefined"
        );

        expect(() => BooleanExpression.parse("none")).toThrow(
            "Could not parse property expression (none undefined undefined): Error: Expected Operator token, but got undefined"
        );

        expect(() => BooleanExpression.parse("this is not an expression")).toThrow(
            "Could not parse property expression (this undefined undefined): Error: Expected Operator token, but got is"
        );

        expect(() => BooleanExpression.parse("'sjfbab")).toThrow(
            "Could not find token class for token \"'\""
        );
    });
});