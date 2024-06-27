# Flint.js

Flint.js is a minimalistic DOM manipulation library designed to make working with the DOM easier and more intuitive. It provides a simple interface for selecting elements, binding events, and creating new elements using a template syntax.

## Features

- **Easy Element Selection**: Select elements using CSS selectors.
- **Event Binding**: Easily bind events to elements.
- **Template Syntax**: Create new elements using a clean and simple template syntax with support for dynamic content.

## Getting Started

### Installation

To use Flint.js, simply include the `flint.js` file in your project:

```html
<script src="path/to/flint.js"></script>
```

### Basic Usage

#### Selecting and Manipulating Elements

Select elements using CSS selectors and manipulate their properties:

```javascript
const title = $('h1');
title.innerText = "New Title";
```

#### Binding Events

Bind events to elements using the `on` method:

```javascript
const button = $('button');
button.on('click', () => {
  alert('Button clicked!');
});
```

#### Creating New Elements with Template Syntax

Create new elements using a clean and readable template syntax:

```javascript
const newElement = $(`
  div
    h2 Title
    p This is a paragraph
    ul
      li Item 1
      li Item 2
`);
document.body.appendChild(newElement);
```

#### Using Arguments in Template

Pass arguments to the template for dynamic content:

```javascript
const listItem = $(`
  li[style=$1] $2
`, ["color: red;", "Red Item"]);
$('ul').appendChild(listItem);
```

## API

### $ (selector_or_flint, flint_args_or_element)

The core function of Flint.js. Depending on the input, it can either select existing elements or create new ones using a template.

- **selector_or_flint**: A CSS selector string to select existing elements or a template string to create new elements.
- **flint_args_or_element**: An optional element to scope the selection to or an array of arguments to use in the template.

### Element Methods

Elements selected or created with Flint.js have the following helper methods:

- **on(event, handler)**: Bind an event handler to the element.
- **forEach(callback)**: Iterate over the elements (even if only one element is selected).
- **$(selector)**: Perform a nested selection within the element.

## Examples

### Example 1: Selecting Elements

```javascript
const paragraphs = $('p');
paragraphs.forEach(p => {
  p.style.color = 'blue';
});
```

### Example 2: Creating Elements

```javascript
const newDiv = $(`
  div
    h1 Hello, World!
    p This is a new paragraph.
`);
document.body.appendChild(newDiv);
```

### Example 3: Using Template Arguments

```javascript
const card = $(`
  div[style=$1]
    h3 $2
    p $3
`, ["background: lightgray;", "Card Title", "This is the card content."]);
document.body.appendChild(card);
```

## Contributing

If you'd like to contribute to Flint.js, please fork the repository and use a feature branch. Pull requests are warmly welcome.

## Author

Derek Bredensteiner
