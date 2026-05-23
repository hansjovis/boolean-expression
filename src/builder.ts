import { 
    AndExpression, 
    BiggerThanExpression, 
    BiggerThanOrEqualToExpression, 
    BooleanExpression, 
    EmptyExpression, 
    EqualsExpression, 
    NotEqualsExpression, 
    NumberValue, 
    OrExpression, 
    Property, 
    SmallerThanExpression, 
    SmallerThanOrEqualToExpression, 
    StringValue 
} from "./BooleanExpression.js";

export class BuilderError extends Error {}

function parseValue(value: string|number): StringValue | NumberValue {
    if (typeof value === "string")
        return new StringValue(value);
    if (typeof value === "number")
        return new NumberValue(value);
    throw new Error(`Unsupported value ${value}. Only strings and numbers are currently supported.`);
}

export interface ExpressionBuilder {
    and: (other: BooleanExpression|undefined) => ExpressionBuilder,
    or: (other: BooleanExpression|undefined) => ExpressionBuilder,
    done: () => BooleanExpression,
}

export interface PropertyBuilder {
    shouldBeEqualTo: (value: string|number) => ExpressionBuilder,
    shouldNotBeEqualTo: (value: string|number) => ExpressionBuilder,
    shouldBeBiggerThan: (value: string|number) => ExpressionBuilder,
    shouldBeSmallerThan: (value: string|number) => ExpressionBuilder,
    shouldBeBiggerThanOrEqualTo: (value: string|number) => ExpressionBuilder,
    shouldBeSmallerThanOrEqualTo: (value: string|number) => ExpressionBuilder,
}

export function empty(): ExpressionBuilder {
    return {
        and: (other: BooleanExpression | undefined): ExpressionBuilder => {
            throw new BuilderError(`Left side of and-expression (? and ${other}) is empty`);
        },
        or: (other: BooleanExpression | undefined): ExpressionBuilder => {
            throw new BuilderError(`Left side of or-expression (? or ${other}) is empty`);
        },
        done: (): BooleanExpression => new EmptyExpression(),
    }
}

export function property(path: string): PropertyBuilder {
    const prop = new Property(path.split("."));
    return {
        shouldBeEqualTo: (value: string|number) => shouldBeEqualTo(prop, value),
        shouldNotBeEqualTo: (value: string|number) => shouldNotBeEqualTo(prop, value),
        shouldBeBiggerThan: (value: string|number) => shouldBeBiggerThan(prop, value),
        shouldBeSmallerThan: (value: string|number) => shouldBeSmallerThan(prop, value),
        shouldBeBiggerThanOrEqualTo: (value: string|number) => shouldBeBiggerThanOrEqualTo(prop, value),
        shouldBeSmallerThanOrEqualTo: (value: string|number) => shouldBeSmallerThanOrEqualTo(prop, value),
    };
}

export function expression(expr: BooleanExpression): ExpressionBuilder {
    return {
        and: (other: BooleanExpression | undefined) => and(expr, other),
        or: (other: BooleanExpression | undefined) => or(expr, other),
        done: () => expr,
    };
}

export function shouldBeEqualTo(prop: Property, value: string|number): ExpressionBuilder {
    return expression(
        new EqualsExpression(prop, parseValue(value))
    );
}

export function shouldNotBeEqualTo(prop: Property, value: string|number): ExpressionBuilder {
    return expression(
        new NotEqualsExpression(prop, parseValue(value))
    );
}

export function shouldBeBiggerThan(prop: Property, value: string|number): ExpressionBuilder {
    return expression(
        new BiggerThanExpression(prop, parseValue(value))
    );
}

export function shouldBeBiggerThanOrEqualTo(prop: Property, value: string|number): ExpressionBuilder {
    return expression(
        new BiggerThanOrEqualToExpression(prop, parseValue(value))
    );
}

export function shouldBeSmallerThan(prop: Property, value: string|number) {
    return expression(
        new SmallerThanExpression(prop, parseValue(value))
    );
}

export function shouldBeSmallerThanOrEqualTo(prop: Property, value: string|number) {
    return expression(
        new SmallerThanOrEqualToExpression(prop, parseValue(value))
    );
}

export function and(left: BooleanExpression|undefined, right: BooleanExpression|undefined) {
    if (left === undefined) {
        throw new BuilderError(`Left side of and-expression () is undefined.`);
    }
    if (right === undefined) {
        throw new BuilderError(`Right side of and-expression () is undefined.`);
    }
    return expression(
        new AndExpression(left, right)
    );
}

export function or(left: BooleanExpression|undefined, right: BooleanExpression|undefined) {
    if (left === undefined) {
        throw new BuilderError(`Left side of or-expression (${left} or ${right}) is undefined.`);
    }
    if (right === undefined) {
        throw new BuilderError(`Right side of or-expression (${left} or ${right}) is undefined.`);
    }
    return expression(
        new OrExpression(left, right)
    );
}