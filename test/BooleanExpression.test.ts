import { describe, it } from "node:test";

import expect from "expect";

import { BooleanExpression, type Equatable } from "../dist/BooleanExpression.js";
import { property } from "../dist/builder.js";

class Author implements Equatable<Author> {
    public readonly name: string;
    constructor(name: string) {
        this.name = name;
    }

    equals(author: Author): boolean {
        return this.name === author.name;
    }
}

class Item {
    public readonly author: Author;

    constructor(author: string) {
        this.author = new Author(author);
    }
}

describe("Boolean Expression", () => {
    it("can be parsed from a string", () => {
        const str = "(title in ['Post title', 'Other title'] and age <= 20) or author = 'hansjovis'";
        const expression = BooleanExpression.parse(str);
        console.log("Parsed expression:", expression);
        expect(expression?.evaluate(new Item("hansjovis"))).toBe(true);
        console.log("Expression as string:", expression?.toString());
        expect(expression?.toString()).toEqual("((title in ['Other title', 'Post title'] and age <= 20) or author = 'hansjovis')");
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

    it("can be built using the builder API", () => {
        const expression = property("author").shouldBeEqualToOneOf(["astrid", "bernhard", "chris"]).done();

        expect(expression.toString()).toEqual("author in ['astrid', 'bernhard', 'chris']");

        expect(expression.evaluate(new Item("astrid"))).toEqual(true);
        expect(expression.evaluate(new Item("bernhard"))).toEqual(true);
        expect(expression.evaluate(new Item("chris"))).toEqual(true);
        expect(expression.evaluate(new Item("hansjovis"))).toEqual(false);
    })
});