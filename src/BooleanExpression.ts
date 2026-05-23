import { parse } from "./parse.js";
import { tokenize } from "./tokenize.js";

export type Item = Record<string, unknown>;

export abstract class BooleanExpression {
    static parse(str: string): BooleanExpression | undefined {
        const tokens = tokenize(str);
        return parse(tokens);
    }

    abstract evaluate(item: Item): boolean;

    abstract toString(): string;
}

export class FalseExpression extends BooleanExpression {
    evaluate(item: Item): boolean {
        return false;
    }

    toString() {
        return "false";
    }
}

export class AndExpression extends BooleanExpression {
    constructor(
        public readonly left: BooleanExpression,
        public readonly right: BooleanExpression,
    ) {
        super();
    }

    evaluate(item: Item): boolean {
        return this.left.evaluate(item) && this.right.evaluate(item);
    }

    toString() {
        return `(${this.left} and ${this.right})`;
    }
}

export class OrExpression extends BooleanExpression {
    constructor(
        public readonly left: BooleanExpression,
        public readonly right: BooleanExpression,
    ) {
        super();
    }

    evaluate(item: Item): boolean {
        return this.left.evaluate(item) || this.right.evaluate(item);
    }

    toString() {
        return `(${this.left} or ${this.right})`;
    }
}

export type Variable = string;
export type Operator = "=" | "!=" | "<" | ">" | ">=" | "<=";
export type Value = string | number;

export abstract class VariableExpression extends BooleanExpression {
    constructor(
        readonly variable: Variable,
        readonly value: Value,
    ) {
        super();
    }
}

export class EqualsExpression extends VariableExpression {
    evaluate(item: Item): boolean {
        return item[this.variable] === this.value;
    }

    toString() {
        return `${this.variable} = ${this.value}`;
    }
}

export class NotEqualsExpression extends VariableExpression {
    evaluate(item: Item): boolean {
        return item[this.variable] !== this.value;
    }

    toString() {
        return `${this.variable} != ${this.value}`;
    }
}

export class SmallerThanExpression extends VariableExpression {
    evaluate(item: Item): boolean {
        const prop = item[this.variable];
        if (typeof prop === "number" || typeof prop === "string")
            return prop < this.value;
        return false;
    }

    toString() {
        return `${this.variable} < ${this.value}`;
    }
}

export class BiggerThanExpression extends VariableExpression {
    evaluate(item: Item): boolean {
        const prop = item[this.variable];
        if (typeof prop === "number" || typeof prop === "string")
            return prop > this.value;
        return false;
    }

    toString() {
        return `${this.variable} > ${this.value}`;
    }
}

export class SmallerThanOrEqualToExpression extends VariableExpression {
    evaluate(item: Item): boolean {
        const prop = item[this.variable];
        if (typeof prop === "number" || typeof prop === "string")
            return prop <= this.value;
        return false;
    }

    toString() {
        return `${this.variable} <= ${this.value}`;
    }
}

export class BiggerThanOrEqualToExpression extends VariableExpression {
    evaluate(item: Item): boolean {
        const prop = item[this.variable];
        if (typeof prop === "number" || typeof prop === "string")
            return prop >= this.value;
        return false;
    }

    toString() {
        return `${this.variable} >= ${this.value}`;
    }
}