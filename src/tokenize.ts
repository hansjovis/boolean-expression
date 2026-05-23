enum TokenClass {
    VARIABLE = "VARIABLE",
    VALUE = "VALUE",
    OPERATOR = "OPERATOR",
    PARENTHESIS = "PARENTHESIS",
    KEYWORD = "KEYWORD",
};

export type Token = {
    class: TokenClass,
    type: string,
    value: string,
};

// -- Token types
const VAR = "\\w+";

const STRING = "'.+?'";
const NUMBER = "\\d+";

const EQUALS = "=";
const NEQ = "!=";
const LT = "<";
const GT = ">";
const LTEQ = "<=";
const GTEQ = ">=";

const PARENTHESIS_OPEN = "\\(";
const PARENTHESIS_CLOSED = "\\)";

const AND = "and";
const OR = "or";
const NOT = "not"

// -- Token classes
const VARIABLE = [VAR];
const VALUE = [STRING, NUMBER];
const OPERATORS = [NEQ, LTEQ, GTEQ, LT, GT, EQUALS];
const PARENTHESIS = [PARENTHESIS_OPEN, PARENTHESIS_CLOSED];
const KEYWORDS = [AND, OR, NOT];

function join(strings: string[]): string {
    return strings.map(it => `(${it})`).join("|");
}

const TOKENIZE_REGEX: RegExp = new RegExp(
    `${join(VALUE)}|${join(VARIABLE)}|${join(OPERATORS)}|${join(PARENTHESIS)}|${join(KEYWORDS)}`,
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
        if (isClass(KEYWORDS, value))
            return parseKeywordToken(value);
        if (isClass(OPERATORS, value))
            return parseOperatorToken(value);
        if (isClass(PARENTHESIS, value))
            return parseParenthesisToken(value);
        if (isClass(VALUE, value))
            return parseValueToken(value);
        if (isClass(VARIABLE, value))
            return { class: TokenClass.VARIABLE, type: "VARIABLE", value };
        throw new TokenizeError(`Could not find token class for token "${value}"`);
    });
}

function parseKeywordToken(value: string): Token {
    if (isType(AND, value))
        return { class: TokenClass.KEYWORD, type: "AND", value };
    else if (isType(OR, value))
        return { class: TokenClass.KEYWORD, type: "OR", value };
    else if (isType(NOT, value))
        return { class: TokenClass.KEYWORD, type: "NOT", value };
    throw new TokenizeError(`Unrecognised keyword token "${value}"`);
}

function parseOperatorToken(value: string): Token {
    if (isType(NEQ, value))
        return { class: TokenClass.OPERATOR, type: "EQUALS", value };
    else if (isType(LTEQ, value))
        return { class: TokenClass.OPERATOR, type: "LT", value };
    else if (isType(GTEQ, value))
        return { class: TokenClass.OPERATOR, type: "GT", value };
    else if (isType(LT, value))
        return { class: TokenClass.OPERATOR, type: "LTEQ", value };
    else if (isType(GT, value))
        return { class: TokenClass.OPERATOR, type: "GTEQ", value };
    else if (isType(EQUALS, value))
        return { class: TokenClass.OPERATOR, type: "NEQ", value };
    throw new TokenizeError(`Unrecognized operator token "${value}"`);
}

function parseParenthesisToken(value: string): Token {
    if (isType(PARENTHESIS_OPEN, value))
        return { class: TokenClass.PARENTHESIS, type: "PARENTHESIS_OPEN", value };
    else if (isType(PARENTHESIS_CLOSED, value))
        return { class: TokenClass.PARENTHESIS, type: "PARENTHESIS_CLOSED", value };
    throw new TokenizeError(`Unrecognized parenthesis token "${value}"`);
}

function parseValueToken(value: string): Token {
    if (isType(STRING, value))
        return { class: TokenClass.VALUE, type: "STRING", value: value.replaceAll("'", "") };
    else if (isType(NUMBER, value)) 
        return { class: TokenClass.VALUE, type: "NUMBER", value };
    throw new TokenizeError(`Unrecognized value token "${value}"`);
}