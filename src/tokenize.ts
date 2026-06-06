enum TokenClass {
    PROPERTY = "PROPERTY",
    VALUE = "VALUE",
    OPERATOR = "OPERATOR",
    PARENTHESIS = "PARENTHESIS",
    KEYWORD = "KEYWORD",
};

export enum TokenType {
    PROP = "PROP",
    STRING = "STRING",
    NUMBER = "NUMBER",
    ARRAY_OPEN = "ARRAY_OPEN",
    ARRAY_SEPARATOR = "ARRAY_SEPARATOR",
    ARRAY_CLOSED = "ARRAY_CLOSED",
    EQUALS = "EQUALS",
    NEQ = "NEQ",
    LT = "LT",
    GT = "GT",
    LTEQ = "LTEQ",
    GTEQ = "GTEQ",
    IN = "IN",
    PARENTHESIS_OPEN = "PARENTHESIS_OPEN",
    PARENTHESIS_CLOSED = "PARENTHESIS_CLOSED",
    AND = "AND",
    OR = "OR",
    NOT = "NOT"
}

export type Token = {
    class: TokenClass,
    type: TokenType,
    value: string,
};

// -- Token types
const PROP = "[\\w.]+";

const STRING = "'.+?'";
const NUMBER = "\\d+";

const ARRAY_OPEN = "\\[";
const ARRAY_SPLIT = ",";
const ARRAY_CLOSED = "\\]";

const EQUALS = "=";
const NEQ = "!=";
const LT = "<";
const GT = ">";
const LTEQ = "<=";
const GTEQ = ">=";
const IN = "in";

const PARENTHESIS_OPEN = "\\(";
const PARENTHESIS_CLOSED = "\\)";

const AND = "and";
const OR = "or";
const NOT = "not";

// -- Token classes
const PROPERTY = [PROP];
const VALUE = [STRING, NUMBER, ARRAY_OPEN, ARRAY_SPLIT, ARRAY_CLOSED];
const OPERATORS = [NEQ, LTEQ, GTEQ, LT, GT, EQUALS, IN];
const PARENTHESIS = [PARENTHESIS_OPEN, PARENTHESIS_CLOSED];
const KEYWORDS = [AND, OR, NOT];

function join(strings: string[]): string {
    return strings.map(it => `(${it})`).join("|");
}

const TOKENIZE_REGEX: RegExp = new RegExp(
    `${join(VALUE)}|${join(PROPERTY)}|${join(OPERATORS)}|${join(PARENTHESIS)}|${join(KEYWORDS)}`,
);

function isClass(tokenClass: string[], str: string): boolean {
    return tokenClass.some(it => new RegExp(`^${it}$`).test(str));
}

function isType(tokenType: string, str: string): boolean {
    return new RegExp(`^${tokenType}$`).test(str);
}

class TokenizeError extends Error {};

export function tokenize(str: string): Token[] {
    const tokenStrings = str.split(TOKENIZE_REGEX)
        .filter(it => it != undefined)
        .filter(it => /\S+/.test(it));
    
    return tokenStrings.map(value => {
        value = value.trim();
        if (isClass(KEYWORDS, value))
            return parseKeywordToken(value);
        if (isClass(OPERATORS, value))
            return parseOperatorToken(value);
        if (isClass(PARENTHESIS, value))
            return parseParenthesisToken(value);
        if (isClass(VALUE, value))
            return parseValueToken(value);
        if (isClass(PROPERTY, value))
            return { class: TokenClass.PROPERTY, type: TokenType.PROP, value };
        throw new TokenizeError(`Could not find token class for token "${value}"`);
    });
}

function parseKeywordToken(value: string): Token {
    if (isType(AND, value))
        return { class: TokenClass.KEYWORD, type: TokenType.AND, value };
    else if (isType(OR, value))
        return { class: TokenClass.KEYWORD, type: TokenType.OR, value };
    else if (isType(NOT, value))
        return { class: TokenClass.KEYWORD, type: TokenType.NOT, value };
    throw new TokenizeError(`Unrecognised keyword token "${value}"`);
}

function parseOperatorToken(value: string): Token {
    if (isType(NEQ, value))
        return { class: TokenClass.OPERATOR, type: TokenType.NEQ, value };
    else if (isType(LTEQ, value))
        return { class: TokenClass.OPERATOR, type: TokenType.LTEQ, value };
    else if (isType(GTEQ, value))
        return { class: TokenClass.OPERATOR, type: TokenType.GTEQ, value };
    else if (isType(LT, value))
        return { class: TokenClass.OPERATOR, type: TokenType.LT, value };
    else if (isType(GT, value))
        return { class: TokenClass.OPERATOR, type: TokenType.GT, value };
    else if (isType(EQUALS, value))
        return { class: TokenClass.OPERATOR, type: TokenType.EQUALS, value };
    else if (isType(IN, value))
        return { class: TokenClass.OPERATOR, type: TokenType.IN, value };
    throw new TokenizeError(`Unrecognized operator token "${value}"`);
}

function parseParenthesisToken(value: string): Token {
    if (isType(PARENTHESIS_OPEN, value))
        return { class: TokenClass.PARENTHESIS, type: TokenType.PARENTHESIS_OPEN, value };
    else if (isType(PARENTHESIS_CLOSED, value))
        return { class: TokenClass.PARENTHESIS, type: TokenType.PARENTHESIS_CLOSED, value };
    throw new TokenizeError(`Unrecognized parenthesis token "${value}"`);
}

function parseValueToken(value: string): Token {
    if (isType(STRING, value))
        return { class: TokenClass.VALUE, type: TokenType.STRING, value: value.replaceAll("'", "") };
    else if (isType(NUMBER, value))
        return { class: TokenClass.VALUE, type: TokenType.NUMBER, value };
    if (isType(ARRAY_OPEN, value))
        return { class: TokenClass.VALUE, type: TokenType.ARRAY_OPEN, value };
    else if (isType(ARRAY_SPLIT, value))
        return { class: TokenClass.VALUE, type: TokenType.ARRAY_SEPARATOR, value };
    else if (isType(ARRAY_CLOSED, value))
        return { class: TokenClass.VALUE, type: TokenType.ARRAY_CLOSED, value };
    throw new TokenizeError(`Unrecognized value token "${value}"`);
}