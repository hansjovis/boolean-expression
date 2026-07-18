import { parse } from "./parse.js";
import { tokenize } from "./tokenize.js";

export interface Equatable<T> {
    equals(value: T): boolean;
}

export enum ComparisonResult {
    SMALLER_THAN = -1,
    LARGER_THAN = 1,
    EQUAL = 0,
}

export interface Comparable<T> {
    compare(value: T): ComparisonResult;
}

class PrimitiveValueObject implements Equatable<PrimitiveValueObject>, Comparable<PrimitiveValueObject> {
    constructor(
        public readonly value: string | number,
    ) {}

    equals(value: PrimitiveValueObject): boolean {
        return value.value === this.value;
    }

    compare(value: PrimitiveValueObject): ComparisonResult {
        if (value.value < this.value)
            return -1;
        else if (value.value > this.value)
            return 1;
        else
            return 0;
    }
}

export class Property<T extends (Comparable<T> | Equatable<T>)> {
    constructor(
        public readonly path: string[],
    ) {}

    static parse<T extends Comparable<T> | Equatable<T>>(str: string): Property<T> {
        return new Property(str.split("."));
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    evaluate(item: any): ( Comparable<T> | Equatable<T> ) | undefined {
        let current = item;
        for (const key of this.path) {
            if (current === undefined || current === null)
                return undefined;
            if (typeof current === "object" && Object.hasOwn(current, key))
                current = current[key];
            else
                return undefined;
        }

        // Wrap primitive values in a value object to make comparison possible by means of the Equatable and Comparable interfaces.
        if (typeof current === "string" || typeof current === "number")
            current = new PrimitiveValueObject(current);

        return current as T;
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

    abstract evaluate(item: unknown): boolean;

    abstract toString(): string;
}


export class EmptyExpression extends BooleanExpression {
    evaluate(): boolean {
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

    evaluate(item: unknown): boolean {
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

    evaluate(item: unknown): boolean {
        return this.left.evaluate(item) || this.right.evaluate(item);
    }

    toString() {
        return `(${this.left} or ${this.right})`;
    }
}

export type Operator = "=" | "!=" | "<" | ">" | ">=" | "<=" | "in";

export abstract class CompareExpression<T extends Equatable<T> | Comparable<T>> extends BooleanExpression {
    constructor(
        readonly property: Property<Equatable<T> | Comparable<T>>,
        readonly value: StringValue | NumberValue,
    ) {
        super();
    }

    evaluate(item: unknown): boolean {
        const prop = this.property.evaluate(item);

        if (prop === undefined)
            return false;

        const ValueClass = Object.getPrototypeOf(prop).constructor;

        return this.compare(prop, new ValueClass(this.value.value));
    }

    abstract compare(actual: Equatable<T> | Comparable<T>, expected: T): boolean;
}

export class EqualsExpression<T extends Equatable<T>> extends CompareExpression<T> {
    compare(actual: Equatable<T>, expected: T): boolean {
        return actual.equals(expected);
    }

    toString() {
        return `${this.property} = ${this.value}`;
    }
}

export class NotEqualsExpression<T extends Equatable<T>> extends CompareExpression<T> {
    compare(actual: Equatable<T>, expected: T): boolean {
        return actual.equals(expected) === false;
    }

    toString() {
        return `${this.property} != ${this.value}`;
    }
}

export class SmallerThanExpression<T extends Comparable<T>> extends CompareExpression<T> {
    compare(actual: Comparable<T>, expected: T): boolean {
        return actual.compare(expected) < 0;
    }

    toString() {
        return `${this.property} < ${this.value}`;
    }
}

export class BiggerThanExpression<T extends Comparable<T>> extends CompareExpression<T> {
    compare(actual: Comparable<T>, expected: T): boolean {
        return actual.compare(expected) > 0;
    }

    toString() {
        return `${this.property} > ${this.value}`;
    }
}

export class SmallerThanOrEqualToExpression<T extends Comparable<T>> extends CompareExpression<T> {
    compare(actual: Comparable<T>, expected: T): boolean {
        return actual.compare(expected) <= 0;
    }

    toString() {
        return `${this.property} <= ${this.value}`;
    }
}

export class BiggerThanOrEqualToExpression<T extends Comparable<T>> extends CompareExpression<T> {
    compare(actual: Comparable<T>, expected: T): boolean {
        return actual.compare(expected) >= 0;
    }

    toString() {
        return `${this.property} >= ${this.value}`;
    }
}

export class InExpression<T extends Equatable<T>> extends BooleanExpression {
    constructor(
        public readonly property: Property<T>,
        public readonly values: ArrayValue,
    ) {
        super();
    }

    evaluate(item: Equatable<T>): boolean {
        const prop = this.property.evaluate(item);

        if (prop === undefined) {
            return false;
        }

        const ValueClass = Object.getPrototypeOf(prop).constructor;

        return this.values.value.some(it => {
            const result = this.property.evaluate(item);
            if (result) {
                return new ValueClass(it.value).equals(result);
            }
        });
    }

    toString(): string {
        return `${this.property} in [${this.values.value.map(it => it.toString()).join(", ")}]`;
    }
}