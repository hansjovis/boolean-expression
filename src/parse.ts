import { 
    BiggerThanExpression, 
    BiggerThanOrEqualToExpression, 
    BooleanExpression, 
    EqualsExpression, 
    NotEqualsExpression, 
    Operator,
    SmallerThanExpression, 
    SmallerThanOrEqualToExpression,
    Property,
    StringValue,
    NumberValue,
    InExpression,
    ArrayValue,
    Equatable,
    Comparable
} from "./BooleanExpression.js";
import { array, empty, expression, ExpressionBuilder } from "./builder.js";
import { Token } from "./tokenize.js";

class ParseError extends Error {}

export function parse(tokens: Token[]): BooleanExpression {
    let builder: ExpressionBuilder = empty();
    while (tokens.length > 0) {
        const token = tokens[0];
        switch (token.type) {
            case "PARENTHESIS_OPEN":
                tokens.shift();
                builder = expression(parse(tokens));
                break;
            case "PARENTHESIS_CLOSED":
                tokens.shift();
                return builder.done();
            case "AND":
                tokens.shift();
                builder = builder.and(parse(tokens));
                break;
            case "OR":
                tokens.shift();
                builder = builder.or(parse(tokens));
                break;
            case "PROP":
                builder = expression(parsePropertyExpression(tokens))
        }
    }
    return builder.done();
}

function parsePropertyExpression<T extends Comparable<T> | Equatable<T>>(tokens: Token[]): BooleanExpression {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Need to fix Equatable/Comparable conundrum.
    let variable: Property<any> | undefined = undefined;
    let operator: Operator | undefined = undefined;
    let value: StringValue | NumberValue | ArrayValue | undefined = undefined;
    try {
        variable = parseProperty(tokens.shift());
        operator = parseOperator(tokens.shift());
        value = parseValue(tokens);
    } catch (error) {
        throw new ParseError(
            `Could not parse property expression (${variable} ${operator} ${value}): ${error}`
        );
    }

    if (value instanceof ArrayValue) {
        if (operator === "in") {
            return new InExpression(variable, value);
        }
        // TODO: Support other (comparison) operators?
        throw new ParseError(
            `Operator ${operator} is not supported for arrays in the expression '${variable} ${operator} ${value}'.`
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
        case "in":
            throw new ParseError(
                `Operator 'in' is not supported for string or number values ('${variable} ${operator} ${value}').`
            );
    }
}

function parseProperty<T extends Comparable<T> | Equatable<T>>(token: Token | undefined): Property<T> {
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

function parseValue(tokens: Token[]): StringValue | NumberValue | ArrayValue {
    const token = tokens.shift();
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
        case "ARRAY_OPEN":
            return parseArray(tokens);
        default:
            throw new ParseError(
                `Invalid value type for token ${JSON.stringify(token)}, expected one of ["STRING", "NUMBER"]`
            );
    }
}

function parseArray(tokens: Token[]): ArrayValue {
    let token: Token|undefined = tokens[0];
    let arrayBuilder = array();
    while (token && token.type !== "ARRAY_CLOSED") {
        const value = tokens.shift();
        if (value === undefined || (value.type !== "STRING" && value.type !== "NUMBER")) {
            throw new ParseError(`Expected a valid value token when parsing an array, but got ${JSON.stringify(value)}.`);
        }
        arrayBuilder = arrayBuilder.push(value.value);

        token = tokens.shift();
    }
    return arrayBuilder.done();
}