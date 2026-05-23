import { parse } from "./parse.js";
import { tokenize } from "./tokenize.js";

export type Item = Record<string, unknown>;

export class Property {
    constructor(
        public readonly name: string,
    ) {}

    toString() {
        return this.name;
    }
}

export class StringValue {
    constructor(
        public readonly value: string,
    ) {}

    toString() {
        return `'${this.value}'`;
    }
}

export class NumberValue {
    constructor(
        public readonly value: number,
    ) {}

    toString() {
        return this.value;
    }
}

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

export type Operator = "=" | "!=" | "<" | ">" | ">=" | "<=";

export abstract class PropertyExpression extends BooleanExpression {
    constructor(
        readonly property: Property,
        readonly value: StringValue | NumberValue,
    ) {
        super();
    }

    evaluate(item: Item): boolean {
        const prop = item[this.property.name];
        if (typeof prop === "number" || typeof prop === "string")
            return this.compare(prop, this.value.value);
        return false;
    }

    abstract compare(actual: string|number, expected: string|number): boolean;
}

export class EqualsExpression extends PropertyExpression {
    compare(actual: string | number, expected: string | number): boolean {
        return actual === expected;
    }

    toString() {
        return `${this.property} = ${this.value}`;
    }
}

export class NotEqualsExpression extends PropertyExpression {
    compare(actual: string | number, expected: string | number): boolean {
        return actual !== expected;
    }

    toString() {
        return `${this.property} != ${this.value}`;
    }
}

export class SmallerThanExpression extends PropertyExpression {
    compare(actual: string | number, expected: string | number): boolean {
        return actual < expected;
    }

    toString() {
        return `${this.property} < ${this.value}`;
    }
}

export class BiggerThanExpression extends PropertyExpression {
    compare(actual: string | number, expected: string | number): boolean {
        return actual > expected;
    }

    toString() {
        return `${this.property} > ${this.value}`;
    }
}

export class SmallerThanOrEqualToExpression extends PropertyExpression {
    compare(actual: string | number, expected: string | number): boolean {
        return actual <= expected;
    }

    toString() {
        return `${this.property} <= ${this.value}`;
    }
}

export class BiggerThanOrEqualToExpression extends PropertyExpression {
    compare(actual: string | number, expected: string | number): boolean {
        return actual >= expected;
    }

    toString() {
        return `${this.property} >= ${this.value}`;
    }
}