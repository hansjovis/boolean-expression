# Boolean Expression

A simple library to programmatically create and evaluate boolean expressions.

## How to use

### Parse API
See also [the expression syntax](./docs/expression-syntax.md).

```ts
const expression = BooleanExpression.parse(
    "(title = 'Post title' and age <= 20) or author.name = 'hansjovis'"
);
const item = {
    title: "Post title",
    age: 19,
    author: {
        name: "hansjovis",
    },
};

console.log(expression.evaluate(item)); // true
```
### When to use this API?
Use this API when you need to enter, save, load and/or transfer expressions. E.g. transferring filter expressions from frontend to backend, loading and saving filter expressions to a database, and/or giving power users the ability to create their own expressions.

### Builder API
See also [the builder documentation](./docs/builder-api.md).

```ts
const expression = property("title")
    .shouldBeEqualTo("Post title")
    .and(
        property("age").shouldBeSmallerThanOrEqualTo(20)
    ).or(
        property("author.name").shouldBeEqualTo("hansjovis")
    );

const item = {
    title: "Post title",
    age: 19,
    author: {
        name: "hansjovis",
    },
};

console.log(expression.toString()); // ((title = 'Post title' and age <= 20) or author.name = 'hansjovis')
console.log(expression.evaluate(item)); // true
```

### When to use this API?
Use this API if you need more fine-grained, procedural control over the expression. E.g. when building an expression based on UI input, or based on data.

## Development

### Development environment setup
Make sure that the right versions of Node and NPM are installed.

#### Install dependencies
```sh
npm install
```

#### Build
```sh
npm run build
```

#### Run tests
```sh
npm test
```