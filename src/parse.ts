import { 
    AndExpression, 
    BiggerThanExpression, 
    BiggerThanOrEqualToExpression, 
    BooleanExpression, 
    EqualsExpression, 
    NotEqualsExpression, 
    Operator, 
    OrExpression, 
    SmallerThanExpression, 
    SmallerThanOrEqualToExpression, 
    PropertyExpression, 
    Property,
    StringValue,
    NumberValue
} from "./BooleanExpression.js";
import { Token } from "./tokenize.js";

class ParseError extends Error {}

class BuildError extends Error {}

class BooleanExpressionBuilder {
    private currentExpression?: BooleanExpression;

    setExpression(expression: BooleanExpression | undefined) {
        this.currentExpression = expression;
    }

    and(expression: BooleanExpression | undefined) {
        if (this.currentExpression === undefined)
            throw new BuildError(`Left side of and-expression (undefined and ${expression}) is undefined`);
        if (expression === undefined)
            throw new BuildError(`Right side of and-expression (${this.currentExpression} and undefined) is undefined`);
        this.currentExpression = new AndExpression(
            this.currentExpression,
            expression,
        );
    }

    or(expression: BooleanExpression | undefined) {
        if (this.currentExpression === undefined)
            throw new BuildError(`Left side of or-expression (? or ${expression}) is undefined`);
        if (expression === undefined)
            throw new BuildError(`Right side of or-exporession (${this.currentExpression} or ?) is undefined`);
        this.currentExpression = new OrExpression(
            this.currentExpression,
            expression,
        );
    }

    build(): BooleanExpression | undefined {
        return this.currentExpression;
    }
}

export function parse(tokens: Token[]): BooleanExpression | undefined {
    const builder = new BooleanExpressionBuilder();
    while (tokens.length > 0) {
        const token = tokens[0];
        switch (token.type) {
            case "PARENTHESIS_OPEN":
                tokens.shift();
                builder.setExpression(parse(tokens));
                break;
            case "PARENTHESIS_CLOSED":
                tokens.shift();
                return builder.build();
            case "AND":
                tokens.shift();
                builder.and(parse(tokens));
                break;
            case "OR":
                tokens.shift();
                builder.or(parse(tokens));
                break;
            case "PROP":
                builder.setExpression(parsePropertyExpression(tokens));
        }
    }
    return builder.build();
}

function parsePropertyExpression(tokens: Token[]): PropertyExpression {
    let variable: Property | undefined = undefined;
    let operator: Operator | undefined = undefined;
    let value: StringValue | NumberValue | undefined = undefined;
    try {
        variable = parseProperty(tokens.shift());
        operator = parseOperator(tokens.shift());
        value = parseValue(tokens.shift());
    } catch (error) {
        throw new ParseError(
            `Could not parse property expression (${variable} ${operator} ${value}): ${error}`
        );
    }

    switch (operator) {
        case "=":
            return new EqualsExpression(variable, value);
        case "!=":
            return new NotEqualsExpression(variable, value);
        case "<":
            return new SmallerThanExpression(variable, value);
        case ">":
            return new BiggerThanExpression(variable, value);
        case "<=":
            return new SmallerThanOrEqualToExpression(variable, value);
        case ">=":
            return new BiggerThanOrEqualToExpression(variable, value);
    }
}

function parseProperty(token: Token | undefined): Property {
    if (token === undefined) {
        throw new ParseError("Expected Property token, but got undefined");
    }
    if (token.class !== "PROPERTY") {
        throw new ParseError(`Expected Property token, but got ${token.value}`);
    }
    return Property.parse(token.value);
}

function parseOperator(token: Token | undefined): Operator {
    if (token === undefined) {
        throw new ParseError("Expected Operator token, but got undefined");
    }
    if (token.class !== "OPERATOR") {
        throw new ParseError(`Expected Operator token, but got ${token.value}`);
    }
    return token.value as Operator;
}

function parseValue(token: Token | undefined): StringValue | NumberValue {
    if (token === undefined) {
        throw new ParseError("Expected Value token, but got undefined");
    }
    if (token.class !== "VALUE") {
        throw new ParseError(`Expected Value token, but got ${token.value}`);
    }
    switch(token.type) {
        case "STRING":
            return new StringValue(token.value);
        case "NUMBER":
            return new NumberValue(parseFloat(token.value));
        default:
            throw new ParseError(
                `Invalid value type for token ${JSON.stringify(token)}, expected one of ["STRING", "NUMBER"]`
            );
    }
}