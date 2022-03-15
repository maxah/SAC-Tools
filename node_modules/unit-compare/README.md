# unit-compare

[![Build Status](https://travis-ci.org/nspragg/unit-compare.svg)](https://travis-ci.org/nspragg/unit-compare) [![Coverage Status](https://coveralls.io/repos/github/nspragg/unit-compare/badge.svg?branch=master)](https://coveralls.io/github/nspragg/unit-compare?branch=master)

> Compare date/time and byte units

* [Installation](#installation)
* [Features](#features)
* [Demo](#demo)
* [Usage](#usage)
* [API](#api)
* [Instance methods](#instance-methods)
* [Test](#test)
* [Contributing](#contributing)

## Installation

```
npm install --save unit-compare
```

## Features

* Compares bytes sizes
* Compares ISO datetimes

## Usage

The example below asserts if a number if less then 10 megabytes:

```js
const compare = require('unit-compare');

const n = 1024;
const isLessThen10Mb = compare.isNumber(n).assert('<10mb')
if (isLessThen10Mb) {
  console.log(`${n} is less than 10mb`);
}
```

#### Byte unit comparisons

Assert if a given number against a string byte size expression:

```js
const greaterThan10kb = compare.isNumber(n).assert('>10kb')
```

Using comparison methods directly:

```js
const greaterThan10kb = compare.isNumber(n).lessThan(10, 'k');
```

#### Compare dates with a string expression

Assert if a given number against a string datetime  expression:

```js
const date = moment();
const equalTo10Mins = compare.isDate(date).assert('>10 minutes');
```

Using comparison methods directly:

```js
const date = moment().subtract(10, 'minutes');
const greaterThan10kb = compare.isDate(date).lessThan(10, 'days');
```

## API

### `compare.isDate() -> DateAssertion`

##### Parameters
* ISO string date

##### Returns
Returns an DateAssertion instance.

### `compare.isNumber() -> ByteAssertion`

##### Parameters
* Accepts an integer

##### Returns
Returns a ByteAssertion instance.

## ByteAssertion

### `.assert(sizeExpression) -> boolean`

##### Parameters
* sizeExpression - accepts a positive integer representing the file size. File size units are:
  * bytes, specified using __b__.
  * kilobytes, specified using __k__ or __kb__,
  * megabytes, specified using __m__ or __mb__
  * terabytes, specified using __t__ or __tb__
  * gigabytes, specified using __g__ or __gb__

  If no unit is specified, __bytes__ is used by default.

  Optionally, expressions can be prefixed with a comparison operator, including:
   * less than using __<__
   * greater than using __>__
   * equality using __==__ or __=__
   * less than or equal to using __<=__
   * greater than or equal to __\>=__  

  Examples:
  * equal to 10 bytes: __10__
  * equal to 10 bytes: __==10b__
  * less than 10 bytes: __<10__
  * greater than 50 megabytes: __>10mg__  

### `.lessThan(int, unit) -> boolean`

##### Parameters
* integer
* unit - k, m, g, t

### `.greaterThan(int, unit) -> boolean`

##### Parameters
* integer
* unit - k, m, g, t

### `.equalTo(int, unit) -> boolean`

##### Parameters
* integer
* unit - k, m, g, t

### `.greaterThanOrEqual(int, unit) -> boolean`

##### Parameters
* integer
* unit - k, m, g, t

### `.lessThanOrEqual(int, unit) -> boolean`

##### Parameters
* integer
* unit - k, m, g, t

## DateAssertion

##### Parameters
* dateExpression - accepts a time unit. Time units are:
  * minutes, specified using __minutes__, __m__, __mins__, __min__.
  * hours, specified using __hours__, __h__, __hour__.
  * days, specified using __days__, __d__, __day__.

  If no unit is specified, __days__ is used by default.

  Optionally, expressions can be prefixed with a comparison operator, including:
   * less than using __<__
   * greater than using __>__
   * equality using __==__ or __=__

 If no comparison operator is specified, equality is used by default.

  Examples:
  * equal to 10 days: __10__
  * equal to 10 minutes: __== minutes__
  * less than 10 hours: __< 10 hours__
  * greater than 50 minutes: __>50minutes__  
  * less than 50 minutes: __<50m__  

##### Returns
* Returns boolean

### `.lessThan(int, timeUnit) -> boolean`

##### Parameters
* integer
* timeUnit - minutes, hours, days

### `.greaterThan(int, timeUnit) -> boolean`

##### Parameters
* integer
* timeUnit - minutes, hours, days

### `.equalTo(int, timeUnit) -> boolean`

##### Parameters
* integer
* timeUnit - minutes, hours, days

### `.greaterThanOrEqual(int, timeUnit) -> boolean`

##### Parameters
* integer
* timeUnit - minutes, hours, days

### `.lessThanOrEqual(int, timeUnit) -> boolean`

##### Parameters
* integer
* timeUnit - minutes, hours, days

## Test

```
npm test
```

To generate a test coverage report:

```
npm run coverage
```
## Contributing

* If you're unsure if a feature would make a good addition, you can always [create an issue](https://github.com/nspragg/unit-compare/issues/new) first.
* We aim for 100% test coverage. Please write tests for any new functionality or changes.
* Any API changes should be fully documented.
* Make sure your code meets our linting standards. Run `npm run lint` to check your code.
* Maintain the existing coding style. There are some settings in `.jsbeautifyrc` to help.
* Be mindful of others when making suggestions and/or code reviewing.
