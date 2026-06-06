import { parse } from "./parse.js";
import { tokenize } from "./tokenize.js";

export type Item = Record<string, unknown>;

export class Property {
    constructor(
        public readonly path: string[],
    ) {}

    static parse(str: string): Property {
        return new Property(str.split("."));
    }

    evaluate(item: Item): unknown {
        let current: any = item;
        for (const prop of this.path) {
            if (current === undefined)
                return undefined;
            if (typeof current !== "object")
                return undefined;
            current = current[prop];
        }
        return current;
    }

    toString() {
        return this.path.join(".");
    }
}

export class StringValue {
    constructor(
        public readonly value: string,
    ) {}

    static parse(str: string): StringValue {
        if (str.match(/^'.*'$/) === null) {
            throw new Error(`Could not parse string ${str} to a StringValue.`);
        }
        return new StringValue(str.slice(1,-1));
    }

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

export class ArrayValue {
    constructor(
        public readonly value: (StringValue|NumberValue)[]
    ) {}

    toString() {
        return `[${this.value.map(it => it.toString()).join(", ")}]`;
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


export class EmptyExpression extends BooleanExpression {
    evaluate(item: Item): boolean {
        throw new Error("Empty expression cannot be evaluated.");
    }

    toString(): string {
        return "";
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

export type Operator = "=" | "!=" | "<" | ">" | ">=" | "<=" | "in";

export abstract class CompareExpression extends BooleanExpression {
    constructor(
        readonly property: Property,
        readonly value: StringValue | NumberValue,
    ) {
        super();
    }

    evaluate(item: Item): boolean {
        const prop = this.property.evaluate(item);
        if (typeof prop === "number" || typeof prop === "string")
            return this.compare(prop, this.value.value);
        return false;
    }

    abstract compare(actual: string|number, expected: string|number): boolean;
}

export class EqualsExpression extends CompareExpression {
    compare(actual: string | number, expected: string | number): boolean {
        return actual === expected;
    }

    toString() {
        return `${this.property} = ${this.value}`;
    }
}

export class NotEqualsExpression extends CompareExpression {
    compare(actual: string | number, expected: string | number): boolean {
        return actual !== expected;
    }

    toString() {
        return `${this.property} != ${this.value}`;
    }
}

export class SmallerThanExpression extends CompareExpression {
    compare(actual: string | number, expected: string | number): boolean {
        return actual < expected;
    }

    toString() {
        return `${this.property} < ${this.value}`;
    }
}

export class BiggerThanExpression extends CompareExpression {
    compare(actual: string | number, expected: string | number): boolean {
        return actual > expected;
    }

    toString() {
        return `${this.property} > ${this.value}`;
    }
}

export class SmallerThanOrEqualToExpression extends CompareExpression {
    compare(actual: string | number, expected: string | number): boolean {
        return actual <= expected;
    }

    toString() {
        return `${this.property} <= ${this.value}`;
    }
}

export class BiggerThanOrEqualToExpression extends CompareExpression {
    compare(actual: string | number, expected: string | number): boolean {
        return actual >= expected;
    }

    toString() {
        return `${this.property} >= ${this.value}`;
    }
}

export class InExpression extends BooleanExpression {
    constructor(
        public readonly property: Property,
        public readonly values: ArrayValue,
    ) {
        super();
    }

    evaluate(item: Item): boolean {
        return this.values.value.some(
            it => this.property.evaluate(item) === it.value
        );
    }

    toString(): string {
        return `${this.property} in [${this.values.value.map(it => it.toString()).join(", ")}]`;
    }
}