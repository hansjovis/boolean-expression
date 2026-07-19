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
    StringValue,
    ArrayValue,
    InExpression, 
    Equatable,
    Comparable,
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
    and: (other: BooleanExpression) => ExpressionBuilder,
    or: (other: BooleanExpression) => ExpressionBuilder,
    done: () => BooleanExpression,
}

export interface PropertyBuilder {
    shouldBeEqualTo: (value: string|number) => ExpressionBuilder,
    shouldNotBeEqualTo: (value: string|number) => ExpressionBuilder,
    shouldBeBiggerThan: (value: string|number) => ExpressionBuilder,
    shouldBeSmallerThan: (value: string|number) => ExpressionBuilder,
    shouldBeBiggerThanOrEqualTo: (value: string|number) => ExpressionBuilder,
    shouldBeSmallerThanOrEqualTo: (value: string|number) => ExpressionBuilder,
    shouldBeEqualToOneOf: (values: string[] | number[]) => ExpressionBuilder,
}

export interface ArrayBuilder {
    push: (value: string|number) => ArrayBuilder,
    done: () => ArrayValue,
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

export function property<T extends Comparable<T> & Equatable<T>>(path: string): PropertyBuilder {
    const prop = new Property<T>(path.split("."));
    return {
        shouldBeEqualTo: (value: string|number) => shouldBeEqualTo(prop, value),
        shouldNotBeEqualTo: (value: string|number) => shouldNotBeEqualTo(prop, value),
        shouldBeBiggerThan: (value: string|number) => shouldBeBiggerThan(prop, value),
        shouldBeSmallerThan: (value: string|number) => shouldBeSmallerThan(prop, value),
        shouldBeBiggerThanOrEqualTo: (value: string|number) => shouldBeBiggerThanOrEqualTo(prop, value),
        shouldBeSmallerThanOrEqualTo: (value: string|number) => shouldBeSmallerThanOrEqualTo(prop, value),
        shouldBeEqualToOneOf: (values: string[] | number[]) => shouldBeEqualToOneOf(prop, values),
    };
}

export function array(values: (StringValue|NumberValue)[] = []): ArrayBuilder {
    return {
        push: (value: string|number) => array([parseValue(value), ...values]),
        done: () => new ArrayValue(values),
    };
}

export function expression(expr: BooleanExpression): ExpressionBuilder {
    return {
        and: (other: BooleanExpression) => and(expr, other),
        or: (other: BooleanExpression) => or(expr, other),
        done: () => expr,
    };
}

export function shouldBeEqualTo<T extends Equatable<T>>(prop: Property<T>, value: string|number): ExpressionBuilder {
    return expression(
        new EqualsExpression(prop, parseValue(value))
    );
}

export function shouldNotBeEqualTo<T extends Equatable<T>>(prop: Property<T>, value: string|number): ExpressionBuilder {
    return expression(
        new NotEqualsExpression(prop, parseValue(value))
    );
}

export function shouldBeBiggerThan<T extends Comparable<T>>(prop: Property<T>, value: string|number): ExpressionBuilder {
    return expression(
        new BiggerThanExpression(prop, parseValue(value))
    );
}

export function shouldBeBiggerThanOrEqualTo<T extends Comparable<T>>(prop: Property<T>, value: string|number): ExpressionBuilder {
    return expression(
        new BiggerThanOrEqualToExpression(prop, parseValue(value))
    );
}

export function shouldBeSmallerThan<T extends Comparable<T>>(prop: Property<T>, value: string|number) {
    return expression(
        new SmallerThanExpression(prop, parseValue(value))
    );
}

export function shouldBeSmallerThanOrEqualTo<T extends Comparable<T>>(prop: Property<T>, value: string|number) {
    return expression(
        new SmallerThanOrEqualToExpression(prop, parseValue(value))
    );
}

export function shouldBeEqualToOneOf<T extends Equatable<T>>(prop: Property<T>, values: string[] | number[]) {
    const arrayValue = new ArrayValue(values.map((it: string | number) => {
        if (typeof it === "number")
            return new NumberValue(it);
        else
            return new StringValue(it);
    }));

    return expression(
        new InExpression(prop, arrayValue),
    );
}

export function and(...expressions: BooleanExpression[]) {
    return expression(
        expressions.reduce((left, right) => new AndExpression(left, right)),
    );
}

export function or(...expressions: BooleanExpression[]) {
    return expression(
        expressions.reduce((prev, next) => new OrExpression(prev, next))
    );
}